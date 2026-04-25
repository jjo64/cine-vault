/**
 * @file AuthController.ts
 * @description Controlador central para la gestión de Identidad y Seguridad.
 * Implementa los flujos de autenticación local (Email/Password), OAuth2 (Google),
 * Seguridad en dos pasos (2FA) y gestión de sesiones activas.
 * Sigue el principio de Responsabilidad Única (SRP) delegando la lógica de negocio
 * íntegramente a los servicios de autenticación.
 */

import { NextFunction, Request, Response } from "express"
import passport from "passport"
import { UnauthorizedError, ValidationError } from "../errors/AppErrors.js"
import {
  buildGoogleState,
  resolveGoogleCallback,
} from "../helpers/googleAuth.js"
import {
  ACCESS_COOKIE_CLEAR_OPTIONS,
  ACCESS_COOKIE_OPTIONS,
  COOKIE_CLEAR_OPTIONS,
  COOKIE_OPTIONS,
  TRUSTED_DEVICE_COOKIE_CLEAR_OPTIONS,
  TRUSTED_DEVICE_COOKIE_OPTIONS,
} from "../lib/tokens.js"
import * as authService from "../services/auth.services.js"

// --- Handlers de Autenticación de Cuenta ---

/**
 * Procesa el inicio de sesión del usuario.
 * Maneja el flujo híbrido de autenticación estándar y retos 2FA si están activos.
 */
export const iniciarSesion = async (req: Request, res: Response) => {
  const { username, password } = req.body
  const resultado = await authService.iniciarSesionService(username, password, {
    trustedDeviceToken: req.cookies?.trusted_device,
    userAgent: req.get("user-agent") || "",
  })

  if (resultado.type === "2FA_REQUIRED") {
    return res.json({
      two_factor_required: true,
      tokenTemporal: resultado.tokenTemporal,
    })
  }

  res.cookie("refresh_token", resultado.tokenRefresco, COOKIE_OPTIONS)
  res.cookie("access_token", resultado.tokenAcceso, ACCESS_COOKIE_OPTIONS)
  res.json({ accessToken: resultado.tokenAcceso })
}

/**
 * Gestiona el registro de nuevos miembros en la plataforma.
 */
export const registrar = async (req: Request, res: Response) => {
  const resultado = await authService.registrarService(req.body)

  if (resultado.verificationResent) {
    return res.status(200).json({
      message:
        "Su cuenta ya existía pero no estaba verificada. Se ha reenviado el correo de confirmación.",
      userId: resultado.userId,
      verificationResent: true,
    })
  }

  res.status(201).json({
    message: "Usuario registrado con éxito",
    userId: resultado.userId,
  })
}

/**
 * Valida el correo electrónico del usuario mediante un token único.
 */
export const verificarEmail = async (req: Request, res: Response) => {
  const token = String(req.params.token)
  await authService.verificarEmailService(token)
  res.json({ message: "Correo electrónico verificado con éxito" })
}

/**
 * Handler para la verificación de email vía GET (enlaces directos desde el correo).
 */
export const verificarEmailDesdeQuery = async (req: Request, res: Response) => {
  const token = String(req.query.token || "").trim()
  if (!token) throw new ValidationError("Se requiere un token de verificación")

  await authService.verificarEmailService(token)

  const frontendBase =
    process.env.EMAIL_PUBLIC_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
  res.redirect(`${frontendBase}/verify-email?status=verified`)
}

/**
 * Permite al usuario solicitar un nuevo enlace de verificación.
 */
export const reenviarVerificacion = async (req: Request, res: Response) => {
  const { email } = req.body
  await authService.reenviarVerificacionService(email)
  res.json({
    message:
      "Si la dirección está registrada y pendiente de verificación, recibirá un correo en breve.",
  })
}

/**
 * Renueva los tokens de acceso del usuario utilizando un Refresh Token válido.
 */
export const renovarToken = async (req: Request, res: Response) => {
  const token = req.cookies.refresh_token
  if (!token)
    throw new UnauthorizedError(
      "Identidad no proporcionada (Refresh Token faltante)"
    )

  const { accessToken, refreshToken } =
    await authService.renovarTokenService(token)

  res.cookie("refresh_token", refreshToken, COOKIE_OPTIONS)
  res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS)
  res.json({ accessToken })
}

/**
 * Revoca la sesión actual y limpia todas las cookies de identidad del cliente.
 */
export const cerrarSesion = async (req: Request, res: Response) => {
  try {
    if (req.cookies.refresh_token) {
      await authService.cerrarSesionService(req.cookies.refresh_token)
    }
  } catch {
    // Silenciamos errores de token ya expirado para garantizar que la limpieza de cookies prosiga.
  }

  res.clearCookie("refresh_token", COOKIE_CLEAR_OPTIONS)
  res.clearCookie("access_token", ACCESS_COOKIE_CLEAR_OPTIONS)
  res.clearCookie("trusted_device", TRUSTED_DEVICE_COOKIE_CLEAR_OPTIONS)
  res.json({ message: "Cierre de sesión finalizado correctamente" })
}

/**
 * Verifica el estado del token de acceso actual (Who Am I).
 */
export const verificarToken = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("Sesión de usuario no detectada")
  const usuario = await authService.verificarTokenService(req.user.user_id)
  res.json(usuario)
}

// --- Handlers de Autenticación OAuth2 (Google) ---

/**
 * Inicia el flujo de autenticación delegada con Google.
 */
export const iniciarOAuthGoogle = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const callbackURL = resolveGoogleCallback(req)
  const state = buildGoogleState(callbackURL)
  const authOptions = {
    scope: ["profile", "email"],
    callbackURL,
    state,
  } as unknown as Parameters<typeof passport.authenticate>[1]

  passport.authenticate("google", authOptions)(req, res, next)
}

/**
 * Valida dinámicamente el callback de Google antes de la resolución final.
 */
export const verificarCallbackGoogle = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const callbackURL = resolveGoogleCallback(req)
  const authOptions = {
    failureRedirect: "/api/auth/google",
    callbackURL,
  } as unknown as Parameters<typeof passport.authenticate>[1]

  passport.authenticate("google", authOptions)(req, res, next)
}

/**
 * Procesa la respuesta final de Google y genera la sesión en CineVault.
 */
export const controladorCallback = async (req: Request, res: Response) => {
  const usuarioPassport = req.user as any
  const { tokenAcceso, tokenRefresco } =
    await authService.googleCallbackService(usuarioPassport)

  res.cookie("refresh_token", tokenRefresco, COOKIE_OPTIONS)
  res.cookie("access_token", tokenAcceso, ACCESS_COOKIE_OPTIONS)

  const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173"
  res.redirect(`${frontendBase}/profile`)
}

// --- Handlers de Seguridad Avanzada (2FA y Recuperación) ---

/**
 * Genera el secreto para la activación de la autenticación en dos pasos.
 */
export const activar2FA = async (req: Request, res: Response) => {
  const resultado = await authService.activar2FAService(req.user!.user_id)
  res.json(resultado)
}

/**
 * Confirma la vinculación del dispositivo 2FA y genera códigos de recuperación.
 */
export const confirmar2FA = async (req: Request, res: Response) => {
  const { codigo } = req.body
  const { recoveryCodes } = await authService.confirmar2FAService(
    req.user!.user_id,
    codigo
  )
  res.json({ message: "2FA configurado y validado con éxito", recoveryCodes })
}

/**
 * Verifica el reto 2FA (TOTP o Código de Recuperación) durante un inicio de sesión.
 */
export const verificar2FA = async (req: Request, res: Response) => {
  const { codigo, tokenTemporal, rememberDevice } = req.body
  const {
    tokenAcceso,
    tokenRefresco,
    trustedDeviceToken,
    usedRecoveryCode,
    remainingRecoveryCodes,
  } = await authService.verificar2FAService(
    codigo,
    tokenTemporal,
    Boolean(rememberDevice),
    req.get("user-agent") || ""
  )

  res.cookie("refresh_token", tokenRefresco, COOKIE_OPTIONS)
  res.cookie("access_token", tokenAcceso, ACCESS_COOKIE_OPTIONS)
  if (trustedDeviceToken) {
    res.cookie(
      "trusted_device",
      trustedDeviceToken,
      TRUSTED_DEVICE_COOKIE_OPTIONS
    )
  }

  res.json({
    accessToken: tokenAcceso,
    usedRecoveryCode,
    remainingRecoveryCodes,
  })
}

/**
 * Inicia el proceso de recuperación de contraseña olvidada.
 */
export const olvidarContrasena = async (req: Request, res: Response) => {
  const { email } = req.body
  await authService.olvidarContrasenaService(email)
  res.json({
    message:
      "Si la cuenta existe, recibirá instrucciones en su bandeja de entrada.",
  })
}

/**
 * Establece una nueva contraseña utilizando la credencial de reset válida.
 */
export const resetearContrasena = async (req: Request, res: Response) => {
  const { token, password } = req.body
  await authService.resetearContrasenaService(token, password)
  res.json({ message: "Su contraseña ha sido actualizada correctamente" })
}

/**
 * Desactiva la autenticación en dos pasos de la cuenta.
 */
export const desactivar2FA = async (req: Request, res: Response) => {
  const { codigo } = req.body
  await authService.desactivar2FAService(req.user!.user_id, codigo)
  res.clearCookie("trusted_device", TRUSTED_DEVICE_COOKIE_CLEAR_OPTIONS)
  res.json({ message: "Seguridad 2FA desactivada correctamente" })
}

/**
 * Permite el cambio de contraseña para usuarios autenticados.
 */
export const cambiarContrasena = async (req: Request, res: Response) => {
  const { contrasenaActual, contrasenaNueva } = req.body
  await authService.cambiarContrasenaService(
    req.user!.user_id,
    contrasenaActual,
    contrasenaNueva,
    req.cookies.refresh_token
  )
  res.json({ message: "Contraseña modificada con éxito" })
}

// --- Handlers de Gestión de Sesiones ---

/**
 * Invalida todas las sesiones activas del usuario (Cierre de emergencia).
 */
export const revocarSesiones = async (req: Request, res: Response) => {
  await authService.revocarSesionesService(req.user!.user_id)
  res.clearCookie("refresh_token", COOKIE_CLEAR_OPTIONS)
  res.clearCookie("access_token", ACCESS_COOKIE_CLEAR_OPTIONS)
  res.clearCookie("trusted_device", TRUSTED_DEVICE_COOKIE_CLEAR_OPTIONS)
  res.json({ message: "Todas las sesiones han sido revocadas con éxito" })
}

/**
 * Consulta el estado y disponibilidad de los códigos de recuperación 2FA.
 */
export const recoveryCodesStatus = async (req: Request, res: Response) => {
  const status = await authService.recoveryCodesStatusService(req.user!.user_id)
  res.json(status)
}

/**
 * Genera un nuevo conjunto de códigos de recuperación 2FA.
 */
export const regenerarRecoveryCodes = async (req: Request, res: Response) => {
  const { codigo } = req.body
  const result = await authService.regenerarRecoveryCodesService(
    req.user!.user_id,
    codigo
  )
  res.json(result)
}

/**
 * Lista la información detallada de todos los dispositivos conectados.
 */
export const listarSesiones = async (req: Request, res: Response) => {
  const sesiones = await authService.listarSesionesService(req.user!.user_id)
  res.json({ sessions: sesiones })
}

/**
 * Revoca una sesión específica identificada por su ID de sesión.
 */
export const revocarSesion = async (req: Request, res: Response) => {
  const { id } = req.params
  const sessionId = Array.isArray(id) ? id[0] : id
  await authService.revocarSesionService(req.user!.user_id, sessionId)
  res.json({ message: "La sesión ha sido revocada de forma remota" })
}
