/**
 * @file auth.services.ts
 * @description Servicio central de autenticación y seguridad de CineVault. 
 * Gestiona el ciclo de vida de los usuarios (registro, verificación), la emisión y rotación 
 * de tokens JWT, seguridad multi-factor (2FA/TOTP) y gestión de sesiones persistentes.
 */

import crypto from "crypto"
import jwt from "jsonwebtoken"
import * as OTPAuth from "otpauth"
import QRCode from "qrcode"

import {
  compararContrasena,
  crearTOTP,
  desencriptarSecreto,
  encriptarSecreto,
  hashearContrasena,
} from "../lib/crypto.js"
import {
  enviarCorreoResetPassword,
  enviarCorreoVerificacion,
} from "../lib/email.js"
import { redis } from "../lib/redis.js"
import {
  crearTokenAcceso,
  crearTokenRefresco,
  hashearToken,
  verificarTokenRefresco,
} from "../lib/tokens.js"
import {
  ConflictError,
  ForbiddenError,
  GoneError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors/AppErrors.js"
import { PayloadRefresco } from "../middlewares/auth.middlewares.js"
import { authTokenRepository } from "../repositories/AuthTokenRepository.js"
import { sessionRepository } from "../repositories/SessionRepository.js"
import { userRepository } from "../repositories/UserRepository.js"
import { validarUsuario } from "../schemas/user.js"
import { LoginResult } from "../types/auth.js"

// --- Constantes de Configuración de Seguridad ---

const TRUSTED_DEVICE_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 días
const RECOVERY_CODES_TTL_SECONDS = 180 * 24 * 60 * 60 // 180 días
const RECOVERY_CODES_COUNT = 8

// --- Funciones de Utilidad Interna (Seguridad) ---

/**
 * Genera una huella digital única para el dispositivo basada en el User Agent.
 */
const trustedDeviceFingerprint = (userAgent: string) =>
  crypto
    .createHash("sha256")
    .update(userAgent || "unknown")
    .digest("hex")

/**
 * Genera la clave de Redis para almacenar dispositivos de confianza.
 */
const trustedDeviceKey = (
  userId: number,
  fingerprint: string,
  tokenHash: string
) => `auth:trusted-device:${userId}:${fingerprint}:${tokenHash}`

/**
 * Genera la clave de Redis para los códigos de recuperación 2FA.
 */
const recoveryCodesKey = (userId: number) => `auth:2fa:recovery:${userId}`

/**
 * Normaliza un código de recuperación para comparaciones consistentes.
 */
const normalizeRecoveryCode = (code: string) =>
  code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

/**
 * Genera un código de recuperación aleatorio con formato XXXX-XXXX.
 */
const generateRecoveryCode = () => {
  const bytes = crypto.randomBytes(4).toString("hex").toUpperCase()
  return `${bytes.slice(0, 4)}-${bytes.slice(4, 8)}`
}

/**
 * Almacena los códigos de recuperación (hasheados) en Redis.
 */
const saveRecoveryCodes = async (userId: number, plainCodes: string[]) => {
  const hashedCodes = plainCodes.map((code) =>
    hashearToken(normalizeRecoveryCode(code))
  )

  await redis.set(
    recoveryCodesKey(userId),
    JSON.stringify(hashedCodes),
    "EX",
    RECOVERY_CODES_TTL_SECONDS
  )
}

/**
 * Crea un set de códigos de recuperación nuevos para el usuario.
 */
const createAndStoreRecoveryCodes = async (userId: number) => {
  const codes = Array.from({ length: RECOVERY_CODES_COUNT }, () =>
    generateRecoveryCode()
  )
  await saveRecoveryCodes(userId, codes)
  return codes
}

/**
 * Recupera los hashes de los códigos de recuperación desde Redis.
 */
const getRecoveryCodeHashes = async (userId: number): Promise<string[]> => {
  const raw = await redis.get(recoveryCodesKey(userId))
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Obtiene el número de códigos de recuperación restantes.
 */
const getRecoveryCodesRemaining = async (userId: number) => {
  const hashes = await getRecoveryCodeHashes(userId)
  return hashes.length
}

/**
 * Valida y consume un código de recuperación si es correcto.
 */
const consumeRecoveryCodeIfValid = async (userId: number, code: string) => {
  const normalized = normalizeRecoveryCode(code)
  if (!normalized) return { consumed: false, remaining: 0 }

  const codeHash = hashearToken(normalized)
  const hashes = await getRecoveryCodeHashes(userId)
  const matchIndex = hashes.findIndex((hash) => hash === codeHash)

  if (matchIndex === -1) {
    return { consumed: false, remaining: hashes.length }
  }

  hashes.splice(matchIndex, 1)

  if (hashes.length === 0) {
    await redis.del(recoveryCodesKey(userId))
  } else {
    await redis.set(
      recoveryCodesKey(userId),
      JSON.stringify(hashes),
      "EX",
      RECOVERY_CODES_TTL_SECONDS
    )
  }

  return { consumed: true, remaining: hashes.length }
}

/**
 * Verifica si el dispositivo actual es de "confianza" para saltar el 2FA.
 */
const isTrustedDevice = async (
  userId: number,
  trustedDeviceToken: string | undefined,
  userAgent: string
) => {
  if (!trustedDeviceToken) return false

  const fingerprint = trustedDeviceFingerprint(userAgent)
  const tokenHash = hashearToken(trustedDeviceToken)
  const key = trustedDeviceKey(userId, fingerprint, tokenHash)
  const raw = await redis.get(key)
  return Boolean(raw)
}

/**
 * Registra el dispositivo actual como de confianza en Redis.
 */
const registerTrustedDevice = async (userId: number, userAgent: string) => {
  const token = crypto.randomBytes(32).toString("hex")
  const fingerprint = trustedDeviceFingerprint(userAgent)
  const tokenHash = hashearToken(token)
  const key = trustedDeviceKey(userId, fingerprint, tokenHash)

  await redis.set(
    key,
    JSON.stringify({ createdAt: new Date().toISOString() }),
    "EX",
    TRUSTED_DEVICE_TTL_SECONDS
  )

  return token
}

/**
 * Revoca todos los dispositivos de confianza de un usuario.
 */
const clearTrustedDevices = async (userId: number) => {
  const keys = await redis.keys(`auth:trusted-device:${userId}:*`)
  if (keys.length) {
    await redis.del(...keys)
  }
}

// --- Servicios de Autenticación ---

/**
 * Procesa el inicio de sesión convencional con credenciales.
 * Implementa el flujo de 2FA si el usuario lo tiene activo.
 */
export const iniciarSesionService = async (
  username: string,
  password: string,
  context?: {
    trustedDeviceToken?: string
    userAgent?: string
  }
): Promise<LoginResult> => {
  if (!username || !password) {
    throw new UnauthorizedError("Credenciales incorrectas")
  }

  const usuario = await userRepository.findByUsername(username)
  if (!usuario) throw new UnauthorizedError("Credenciales incorrectas")

  if (usuario.google_id) {
    throw new UnauthorizedError("Esta cuenta usa Google para iniciar sesión")
  }

  if (!usuario.is_verified) {
    throw new ForbiddenError("Debes verificar tu email antes de iniciar sesión")
  }

  const contrasenaValida = await compararContrasena(password, usuario.password)
  if (!contrasenaValida) throw new UnauthorizedError("Credenciales incorrectas")

  // Control de Segundo Factor (2FA)
  if (usuario.two_factor_enabled) {
    const trusted = await isTrustedDevice(
      usuario.id,
      context?.trustedDeviceToken,
      context?.userAgent || ""
    )

    if (trusted) {
      const tokenAcceso = crearTokenAcceso(
        usuario.id,
        usuario.role as string,
        usuario.is_verified
      )
      const { token: tokenRefresco } = await crearTokenRefresco(usuario.id)
      return { type: "OK", tokenAcceso, tokenRefresco }
    }

    const tokenTemporal = jwt.sign(
      { user_id: usuario.id, two_factor_pending: true },
      process.env.JWT_SECRET!,
      { expiresIn: "5m" }
    )
    return { type: "2FA_REQUIRED", tokenTemporal }
  }

  const tokenAcceso = crearTokenAcceso(
    usuario.id,
    usuario.role as string,
    usuario.is_verified
  )
  const { token: tokenRefresco } = await crearTokenRefresco(usuario.id)

  return { type: "OK", tokenAcceso, tokenRefresco }
}

/**
 * Gestiona el registro de nuevos usuarios, incluyendo la validación de datos 
 * y la emisión del correo de verificación.
 */
export const registrarService = async (body: unknown) => {
  const validacion = validarUsuario(body)
  if (!validacion.success || !validacion.data) {
    throw new ValidationError(
      (validacion.errorMessages ?? ["Datos inválidos"]).join(", ")
    )
  }

  const { email, username, password } = validacion.data

  /**
   * Genera y envía un token de verificación de correo.
   */
  const emitirVerificacion = async (userId: number, userEmail: string) => {
    await authTokenRepository.deleteMany({
      user_id: userId,
      type: "VERIFY_EMAIL",
    })

    const tokenVerificacion = jwt.sign(
      { user_id: userId },
      process.env.VERIFY_EMAIL_SECRET!,
      { expiresIn: "1h" }
    )

    await authTokenRepository.create({
      id: crypto.randomUUID(),
      users: { connect: { id: userId } },
      token: tokenVerificacion,
      type: "VERIFY_EMAIL",
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
    })

    await enviarCorreoVerificacion(userEmail, tokenVerificacion)
  }

  const usuarioExistente = await userRepository.findByEmail(email)
  if (usuarioExistente) {
    if (usuarioExistente.is_verified) {
      throw new ConflictError("Ese email ya está registrado. Inicia sesión.")
    }

    await emitirVerificacion(usuarioExistente.id, usuarioExistente.email)
    return { userId: usuarioExistente.id, verificationResent: true }
  }

  const usernameExistente = await userRepository.findByUsername(username)
  if (usernameExistente) {
    throw new ConflictError("Ese nombre de usuario ya está en uso")
  }

  const contrasenaHasheada = await hashearContrasena(password)
  const nuevoUsuario = await userRepository.create({
    email,
    username,
    password: contrasenaHasheada,
  })

  await emitirVerificacion(nuevoUsuario.id, nuevoUsuario.email)

  return { userId: nuevoUsuario.id }
}

/**
 * Valida el token de verificación de email y activa la cuenta del usuario.
 */
export const verificarEmailService = async (token: string) => {
  type PayloadVerificacion = { user_id: number }

  const payload = jwt.verify(
    token,
    process.env.VERIFY_EMAIL_SECRET!
  ) as PayloadVerificacion

  const tokenEnDb = await authTokenRepository.findFirst({
    token,
    user_id: payload.user_id,
    type: "VERIFY_EMAIL",
  })

  if (!tokenEnDb || tokenEnDb.expires_at < new Date()) {
    throw new GoneError("El enlace ha expirado. Solicita uno nuevo.")
  }

  const usuario = await userRepository.findById(payload.user_id)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")

  await userRepository.update(usuario.id, { is_verified: true })

  await authTokenRepository.deleteMany({
    user_id: usuario.id,
    type: "VERIFY_EMAIL",
  })
}

/**
 * Reenvía el correo de verificación si el usuario no lo ha recibido o el anterior expiró.
 */
export const reenviarVerificacionService = async (email: string) => {
  if (!email) throw new ValidationError("Email requerido")

  const usuario = await userRepository.findByEmail(email)

  if (!usuario || usuario.is_verified) return

  await authTokenRepository.deleteMany({
    user_id: usuario.id,
    type: "VERIFY_EMAIL",
  })

  const tokenVerificacion = jwt.sign(
    { user_id: usuario.id },
    process.env.VERIFY_EMAIL_SECRET!,
    { expiresIn: "1h" }
  )

  await authTokenRepository.create({
    id: crypto.randomUUID(),
    users: { connect: { id: usuario.id } },
    token: tokenVerificacion,
    type: "VERIFY_EMAIL",
    expires_at: new Date(Date.now() + 60 * 60 * 1000),
  })

  await enviarCorreoVerificacion(usuario.email, tokenVerificacion)
}

/**
 * Realiza la renovación de tokens (Token Rotation).
 * Invalida la sesión anterior y emite un nuevo par de tokens.
 */
export const renovarTokenService = async (refreshToken: string) => {
  const payload = await verificarTokenRefresco(refreshToken)

  const usuario = await userRepository.findById(payload.user_id)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")

  await sessionRepository.deleteById(payload.id_session)

  const accessToken = crearTokenAcceso(
    usuario.id,
    usuario.role as string,
    usuario.is_verified
  )

  const { token: nuevoRefresh, idSesion } = await crearTokenRefresco(usuario.id)

  return { accessToken, refreshToken: nuevoRefresh, sessionId: idSesion }
}

/**
 * Cierra la sesión activa invalidando el token de refresco en la persistencia.
 */
export const cerrarSesionService = async (refreshToken: string | undefined) => {
  if (!refreshToken) return

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET!
    ) as PayloadRefresco

    await sessionRepository.deleteById(payload.id_session)
  } catch {
    // Error silencioso en el servicio: el controlador gestionará la limpieza de cookies.
  }
}

/**
 * Verifica la validez de una sesión y retorna el perfil seguro del usuario.
 */
export const verificarTokenService = async (userId: number) => {
  const usuario = await userRepository.getSafeProfile(userId)

  if (!usuario) throw new NotFoundError("Usuario no encontrado")
  return usuario
}

/**
 * Procesa la redirección exitosa de Google OAuth para emitir tokens locales de CineVault.
 */
export const googleCallbackService = async (usuarioPassport: {
  id: number
  role: string
  is_verified: boolean
}) => {
  const tokenAcceso = crearTokenAcceso(
    usuarioPassport.id,
    usuarioPassport.role,
    usuarioPassport.is_verified
  )
  const { token: tokenRefresco } = await crearTokenRefresco(usuarioPassport.id)
  return { tokenAcceso, tokenRefresco }
}

/**
 * Inicia el proceso de activación de 2FA generando un secreto y un código QR.
 */
export const activar2FAService = async (userId: number) => {
  const totp = new OTPAuth.TOTP({
    issuer: "CineVault",
    label: userId.toString(),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret(),
  })

  const secreto = totp.secret.base32
  const uri = totp.toString()

  await userRepository.update(userId, {
    two_factor_secret: encriptarSecreto(secreto),
  })

  const qr = await QRCode.toDataURL(uri)
  return { qr, secreto }
}

/**
 * Confirma la activación definitiva de 2FA verificando el primer código generado por el usuario.
 * Emite los códigos de recuperación iniciales.
 */
export const confirmar2FAService = async (userId: number, codigo: string) => {
  if (!codigo) throw new ValidationError("Código requerido")

  const usuario = await userRepository.findById(userId)
  if (!usuario?.two_factor_secret) {
    throw new ValidationError("Primero debes generar el QR")
  }

  let secretoReal: string
  try {
    secretoReal = desencriptarSecreto(usuario.two_factor_secret)
  } catch {
    throw new ValidationError(
      "No se pudo leer tu configuración 2FA. Reactívala desde ajustes."
    )
  }
  const totp = crearTOTP(secretoReal)
  const delta = totp.validate({ token: codigo, window: 1 })

  if (delta === null) throw new UnauthorizedError("Código incorrecto")

  await userRepository.update(userId, { two_factor_enabled: true })

  const recoveryCodes = await createAndStoreRecoveryCodes(userId)
  return { recoveryCodes }
}

/**
 * Segundo paso del login cuando el 2FA está activo.
 * Soporta autenticación mediante TOTP o códigos de recuperación.
 */
export const verificar2FAService = async (
  codigo: string,
  tokenTemporal: string,
  rememberDevice?: boolean,
  userAgent?: string
) => {
  if (!codigo || !tokenTemporal) throw new ValidationError("Datos requeridos")

  const payload = jwt.verify(tokenTemporal, process.env.JWT_SECRET!) as {
    user_id: number
    two_factor_pending: boolean
  }

  if (!payload.two_factor_pending) throw new UnauthorizedError("Token inválido")

  const usuario = await userRepository.findById(payload.user_id)
  if (!usuario?.two_factor_secret) {
    throw new ValidationError("No se ha configurado 2FA")
  }

  let secretoReal: string
  try {
    secretoReal = desencriptarSecreto(usuario.two_factor_secret)
  } catch {
    throw new ValidationError(
      "No se pudo leer tu configuración 2FA. Reactívala desde ajustes."
    )
  }
  const totp = crearTOTP(secretoReal)
  const delta = totp.validate({ token: codigo, window: 2 })
  let usedRecoveryCode = false
  let remainingRecoveryCodes: number | null = null

  if (delta === null) {
    const recoveryResult = await consumeRecoveryCodeIfValid(usuario.id, codigo)
    if (!recoveryResult.consumed) {
      console.warn(`[2FA] Fallo de verificación para usuario ${usuario.id}. Código: ${codigo}`)
      throw new UnauthorizedError("Código incorrecto")
    }
    usedRecoveryCode = true
    remainingRecoveryCodes = recoveryResult.remaining
  }

  const tokenAcceso = crearTokenAcceso(
    usuario.id,
    usuario.role as string,
    usuario.is_verified
  )
  const { token: tokenRefresco } = await crearTokenRefresco(usuario.id)

  let trustedDeviceToken: string | undefined
  if (rememberDevice) {
    trustedDeviceToken = await registerTrustedDevice(
      usuario.id,
      userAgent || ""
    )
  }

  return {
    tokenAcceso,
    tokenRefresco,
    trustedDeviceToken,
    usedRecoveryCode,
    remainingRecoveryCodes,
  }
}

/**
 * Inicia el flujo de recuperación de contraseña enviando un enlace al email.
 */
export const olvidarContrasenaService = async (email: string) => {
  if (!email) throw new ValidationError("Email requerido")

  const usuario = await userRepository.findByEmail(email)

  if (!usuario || usuario.google_id) return

  await authTokenRepository.deleteMany({
    user_id: usuario.id,
    type: "RESET_PASSWORD",
  })

  const token = jwt.sign(
    { user_id: usuario.id },
    process.env.VERIFY_EMAIL_SECRET!,
    { expiresIn: "15m" }
  )

  await authTokenRepository.create({
    id: crypto.randomUUID(),
    users: { connect: { id: usuario.id } },
    token,
    type: "RESET_PASSWORD",
    expires_at: new Date(Date.now() + 15 * 60 * 1000),
  })

  await enviarCorreoResetPassword(usuario.email, token)
}

/**
 * Procesa la nueva contraseña tras validar el token de recuperación.
 * Invalida todas las sesiones activas por seguridad.
 */
export const resetearContrasenaService = async (
  token: string,
  password: string
) => {
  if (!token || !password) throw new ValidationError("Datos requeridos")

  type PayloadReset = { user_id: number }
  const payload = jwt.verify(
    token,
    process.env.VERIFY_EMAIL_SECRET!
  ) as PayloadReset

  const tokenEnDb = await authTokenRepository.findFirst({
    token,
    user_id: payload.user_id,
    type: "RESET_PASSWORD",
  })

  if (!tokenEnDb || tokenEnDb.expires_at < new Date()) {
    throw new GoneError("El enlace ha expirado. Solicita uno nuevo.")
  }

  const contrasenaHasheada = await hashearContrasena(password)

  await userRepository.update(payload.user_id, { password: contrasenaHasheada })

  await authTokenRepository.deleteMany({
    user_id: payload.user_id,
    type: "RESET_PASSWORD",
  })
  await sessionRepository.deleteManyByUser(payload.user_id)
}

/**
 * Desactiva el 2FA del usuario previa verificación de código.
 */
export const desactivar2FAService = async (userId: number, codigo: string) => {
  if (!codigo) throw new ValidationError("Código requerido")

  const usuario = await userRepository.findById(userId)

  if (!usuario?.two_factor_enabled) {
    throw new ValidationError("No tenés 2FA activado")
  }

  let secretoReal: string
  try {
    secretoReal = desencriptarSecreto(usuario.two_factor_secret!)
  } catch {
    throw new ValidationError(
      "No se pudo leer tu configuración 2FA. Reactívala desde ajustes."
    )
  }
  const totp = crearTOTP(secretoReal)
  const delta = totp.validate({ token: codigo, window: 1 })

  if (delta === null) throw new UnauthorizedError("Código incorrecto")

  await userRepository.update(userId, {
    two_factor_enabled: false,
    two_factor_secret: null,
  })

  await redis.del(recoveryCodesKey(userId))
  await clearTrustedDevices(userId)
}

/**
 * Obtiene el estado actual de los códigos de recuperación de un usuario.
 */
export const recoveryCodesStatusService = async (userId: number) => {
  const remaining = await getRecoveryCodesRemaining(userId)
  return { remaining }
}

/**
 * Regenera un set nuevo de códigos de recuperación tras validar el acceso 2FA.
 */
export const regenerarRecoveryCodesService = async (
  userId: number,
  codigo: string
) => {
  if (!codigo) throw new ValidationError("Código requerido")

  const usuario = await userRepository.findById(userId)
  if (!usuario?.two_factor_enabled || !usuario.two_factor_secret) {
    throw new ValidationError("2FA no está activado")
  }

  let secretoReal: string
  try {
    secretoReal = desencriptarSecreto(usuario.two_factor_secret)
  } catch {
    throw new ValidationError(
      "No se pudo leer tu configuración 2FA. Reactívala desde ajustes."
    )
  }

  const totp = crearTOTP(secretoReal)
  const delta = totp.validate({ token: codigo, window: 1 })
  if (delta === null) throw new UnauthorizedError("Código incorrecto")

  const recoveryCodes = await createAndStoreRecoveryCodes(userId)
  return { recoveryCodes }
}

/**
 * Gestiona el cambio de contraseña desde el perfil de usuario.
 * Cierra todas las sesiones en otros dispositivos por seguridad.
 */
export const cambiarContrasenaService = async (
  userId: number,
  contrasenaActual: string,
  contrasenaNueva: string,
  refreshToken: string | undefined
) => {
  if (!contrasenaActual || !contrasenaNueva) {
    throw new ValidationError("Datos requeridos")
  }

  const usuario = await userRepository.findById(userId)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")

  if (usuario.google_id) {
    throw new ValidationError("Las cuentas de Google no tienen contraseña")
  }

  const contrasenaValida = await compararContrasena(
    contrasenaActual,
    usuario.password
  )
  if (!contrasenaValida)
    throw new UnauthorizedError("La contraseña actual es incorrecta")

  const mismaContrasena = await compararContrasena(
    contrasenaNueva,
    usuario.password
  )
  if (mismaContrasena) {
    throw new ValidationError(
      "La nueva contraseña debe ser diferente a la actual"
    )
  }

  const contrasenaHasheada = await hashearContrasena(contrasenaNueva)

  await userRepository.update(userId, { password: contrasenaHasheada })

  if (refreshToken) {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET!
    ) as PayloadRefresco
    await sessionRepository.deleteManyByUserExcept(userId, payload.id_session)
  }
}

/**
 * Revoca de forma inmediata todas las sesiones activas de un usuario.
 */
export const revocarSesionesService = async (userId: number) => {
  await sessionRepository.deleteManyByUser(userId)
}

/**
 * Lista la información básica de las sesiones activas de un usuario.
 */
export const listarSesionesService = async (userId: number) => {
  return sessionRepository.findByUser(userId)
}

/**
 * Revoca una sesión específica identificada por su ID único.
 */
export const revocarSesionService = async (
  userId: number,
  sessionId: string
) => {
  if (!sessionId) throw new ValidationError("ID de sesión requerido")

  const sesion = await sessionRepository.findById(sessionId)

  if (!sesion || sesion.user_id !== userId) {
    throw new NotFoundError("Sesión no encontrada")
  }

  await sessionRepository.deleteById(sessionId)
}
