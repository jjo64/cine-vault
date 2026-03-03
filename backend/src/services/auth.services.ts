import jwt from "jsonwebtoken"
import * as OTPAuth from "otpauth"
import QRCode from "qrcode"
import crypto from "crypto"
import {
  crearTokenAcceso,
  crearTokenRefresco,
  verificarTokenRefresco,
} from "../lib/tokens.js"
import {
  hashearContrasena,
  compararContrasena,
  encriptarSecreto,
  desencriptarSecreto,
  crearTOTP,
} from "../lib/crypto.js"
import {
  enviarCorreoVerificacion,
  enviarCorreoResetPassword,
} from "../lib/email.js"
import { validarUsuario } from "../schemas/user.js"
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  GoneError,
} from "../errors/AppErrors.js"
import { PayloadRefresco } from "../middlewares/auth.middlewares.js"
import { userRepository } from "../repositories/UserRepository.js"
import { authTokenRepository } from "../repositories/AuthTokenRepository.js"
import { sessionRepository } from "../repositories/SessionRepository.js"
import { LoginResult } from "../types/auth.js"

/* ==========================================================================
   AUTH SERVICE
   --------------------------------------------------------------------------
   Contiene TODA la lógica de negocio de autenticación.
   Los controladores solo llaman a estas funciones y devuelven el resultado.
   Si algo falla, se lanza un error personalizado que el manejadorErrores
   global captura automáticamente.
   ========================================================================== */

// ---------------------------------------------------------------------------
// INICIAR SESIÓN
// ---------------------------------------------------------------------------
export const iniciarSesionService = async (
  username: string,
  password: string
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

  // Flujo 2FA: devolver token temporal en vez de tokens reales
  if (usuario.two_factor_enabled) {
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

// ---------------------------------------------------------------------------
// REGISTRAR USUARIO
// ---------------------------------------------------------------------------
export const registrarService = async (body: unknown) => {
  const validacion = validarUsuario(body)
  if (!validacion.success || !validacion.data) {
    throw new ValidationError(
      (validacion.errorMessages ?? ["Datos inválidos"]).join(", ")
    )
  }

  const { email, username, password } = validacion.data

  const usuarioExistente = await userRepository.findByEmail(email)
  if (usuarioExistente) throw new ConflictError("El usuario ya está registrado")

  const contrasenaHasheada = await hashearContrasena(password)
  const nuevoUsuario = await userRepository.create({
    email,
    username,
    password: contrasenaHasheada,
  })

  const tokenVerificacion = jwt.sign(
    { user_id: nuevoUsuario.id },
    process.env.VERIFY_EMAIL_SECRET!,
    { expiresIn: "1h" }
  )

  await authTokenRepository.create({
    id: crypto.randomUUID(),
    users: { connect: { id: nuevoUsuario.id } },
    token: tokenVerificacion,
    type: "VERIFY_EMAIL",
    expires_at: new Date(Date.now() + 60 * 60 * 1000),
  })

  await enviarCorreoVerificacion(nuevoUsuario.email, tokenVerificacion)

  return { userId: nuevoUsuario.id }
}

// ---------------------------------------------------------------------------
// VERIFICAR EMAIL
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// REENVIAR VERIFICACIÓN
// ---------------------------------------------------------------------------
export const reenviarVerificacionService = async (email: string) => {
  if (!email) throw new ValidationError("Email requerido")

  const usuario = await userRepository.findByEmail(email)

  // Respuesta genérica para no revelar si el email existe
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

// ---------------------------------------------------------------------------
// RENOVAR TOKEN
// ---------------------------------------------------------------------------
export const renovarTokenService = async (refreshToken: string) => {
  const payload = await verificarTokenRefresco(refreshToken)

  const usuario = await userRepository.findById(payload.user_id)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")

  return crearTokenAcceso(
    usuario.id,
    usuario.role as string,
    usuario.is_verified
  )
}

// ---------------------------------------------------------------------------
// CERRAR SESIÓN
// ---------------------------------------------------------------------------
export const cerrarSesionService = async (refreshToken: string | undefined) => {
  if (!refreshToken) return

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET!
    ) as PayloadRefresco

    await sessionRepository.deleteById(payload.id_session)
  } catch {
    // Token inválido: igual limpiamos la cookie desde el controller
  }
}

// ---------------------------------------------------------------------------
// VERIFICAR TOKEN (persistir login en el frontend)
// ---------------------------------------------------------------------------
export const verificarTokenService = async (userId: number) => {
  const usuario = await userRepository.getSafeProfile(userId)

  if (!usuario) throw new NotFoundError("Usuario no encontrado")
  return usuario
}

// ---------------------------------------------------------------------------
// GOOGLE CALLBACK
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// ACTIVAR 2FA (generar QR)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// CONFIRMAR 2FA (activar definitivamente)
// ---------------------------------------------------------------------------
export const confirmar2FAService = async (userId: number, codigo: string) => {
  if (!codigo) throw new ValidationError("Código requerido")

  const usuario = await userRepository.findById(userId)
  if (!usuario?.two_factor_secret) {
    throw new ValidationError("Primero debes generar el QR")
  }

  const secretoReal = desencriptarSecreto(usuario.two_factor_secret)
  const totp = crearTOTP(secretoReal)
  const delta = totp.validate({ token: codigo, window: 1 })

  if (delta === null) throw new UnauthorizedError("Código incorrecto")

  await userRepository.update(userId, { two_factor_enabled: true })
}

// ---------------------------------------------------------------------------
// VERIFICAR 2FA (login paso 2)
// ---------------------------------------------------------------------------
export const verificar2FAService = async (
  codigo: string,
  tokenTemporal: string
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

  const secretoReal = desencriptarSecreto(usuario.two_factor_secret)
  const totp = crearTOTP(secretoReal)
  const delta = totp.validate({ token: codigo, window: 1 })

  if (delta === null) throw new UnauthorizedError("Código incorrecto")

  const tokenAcceso = crearTokenAcceso(
    usuario.id,
    usuario.role as string,
    usuario.is_verified
  )
  const { token: tokenRefresco } = await crearTokenRefresco(usuario.id)

  return { tokenAcceso, tokenRefresco }
}

// ---------------------------------------------------------------------------
// OLVIDAR CONTRASEÑA
// ---------------------------------------------------------------------------
export const olvidarContrasenaService = async (email: string) => {
  if (!email) throw new ValidationError("Email requerido")

  const usuario = await userRepository.findByEmail(email)

  // Respuesta genérica para no revelar si el email existe
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

// ---------------------------------------------------------------------------
// RESETEAR CONTRASEÑA
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// DESACTIVAR 2FA
// ---------------------------------------------------------------------------
export const desactivar2FAService = async (userId: number, codigo: string) => {
  if (!codigo) throw new ValidationError("Código requerido")

  const usuario = await userRepository.findById(userId)

  if (!usuario?.two_factor_enabled) {
    throw new ValidationError("No tenés 2FA activado")
  }

  const secretoReal = desencriptarSecreto(usuario.two_factor_secret!)
  const totp = crearTOTP(secretoReal)
  const delta = totp.validate({ token: codigo, window: 1 })

  if (delta === null) throw new UnauthorizedError("Código incorrecto")

  await userRepository.update(userId, {
    two_factor_enabled: false,
    two_factor_secret: null,
  })
}

// ---------------------------------------------------------------------------
// CAMBIAR CONTRASEÑA
// ---------------------------------------------------------------------------
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

  // Cerrar todas las sesiones menos la actual
  if (refreshToken) {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET!
    ) as PayloadRefresco
    await sessionRepository.deleteManyByUserExcept(userId, payload.id_session)
  }
}

// ---------------------------------------------------------------------------
// REVOCAR TODAS LAS SESIONES
// ---------------------------------------------------------------------------
export const revocarSesionesService = async (userId: number) => {
  await sessionRepository.deleteManyByUser(userId)
}
