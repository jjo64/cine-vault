import { Response } from "express"
import { SolicitudAutenticada } from "../middlewares/auth.middlewares.js"
import { COOKIE_OPTIONS } from "../helpers/authOptions.js"
import * as authService from "../services/auth.services.js"
import { UnauthorizedError } from "../errors/AppErrors.js"

/* ==========================================================================
   CONTROLADOR DE AUTENTICACIÓN
   --------------------------------------------------------------------------
   Responsabilidad ÚNICA: desempacar req, llamar al servicio, devolver res.
   Sin lógica de negocio. Sin importaciones de Prisma. Sin bcrypt. Sin JWT.
   Los errores se lanzan desde el servicio y el manejadorErrores global
   los intercepta automáticamente gracias al manejadorAsincrono.
   ========================================================================== */

export const iniciarSesion = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const { username, password } = req.body
  const resultado = await authService.iniciarSesionService(username, password)

  if ("two_factor_required" in resultado) {
    return res.json(resultado)
  }

  res.cookie("refresh_token", resultado.tokenRefresco, COOKIE_OPTIONS)
  res.json({ accessToken: resultado.tokenAcceso })
}

export const registrar = async (req: SolicitudAutenticada, res: Response) => {
  const { userId } = await authService.registrarService(req.body)
  res.status(201).json({ message: "Usuario registrado exitosamente", userId })
}

export const verificarEmail = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const token = String(req.params.token)
  await authService.verificarEmailService(token)
  res.json({ message: "Email verificado exitosamente" })
}

export const reenviarVerificacion = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const { email } = req.body
  await authService.reenviarVerificacionService(email)
  // Respuesta genérica siempre (el servicio maneja internamente si el usuario existe)
  res.json({
    message: "Si el correo existe y no está verificado, recibirás un email.",
  })
}

export const renovarToken = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const token = req.cookies.refresh_token
  if (!token) throw new UnauthorizedError("No se proporcionó refresh token") // ← línea nueva
  const tokenAcceso = await authService.renovarTokenService(token)
  res.json({ accessToken: tokenAcceso })
}

export const cerrarSesion = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  await authService.cerrarSesionService(req.cookies.refresh_token)
  res.clearCookie("refresh_token")
  res.json({ message: "Sesión cerrada exitosamente" })
}

export const verificarToken = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  if (!req.user) throw new UnauthorizedError("Token de acceso requerido") // ← línea nueva
  const usuario = await authService.verificarTokenService(req.user.user_id)
  res.json(usuario)
}

export const controladorCallback = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usuarioPassport = req.user as any
  const { tokenAcceso, tokenRefresco } =
    await authService.googleCallbackService(usuarioPassport)

  res.cookie("refresh_token", tokenRefresco, COOKIE_OPTIONS)
  res.cookie("access_token", tokenAcceso, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 1000,
    sameSite: "lax",
  })

  res.redirect(`${process.env.FRONTEND_URL}/auth/callback`)
}

export const activar2FA = async (req: SolicitudAutenticada, res: Response) => {
  const resultado = await authService.activar2FAService(req.user!.user_id)
  res.json(resultado)
}

export const confirmar2FA = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const { codigo } = req.body
  await authService.confirmar2FAService(req.user!.user_id, codigo)
  res.json({ message: "2FA activado correctamente" })
}

export const verificar2FA = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const { codigo, tokenTemporal } = req.body
  const { tokenAcceso, tokenRefresco } = await authService.verificar2FAService(
    codigo,
    tokenTemporal
  )

  res.cookie("refresh_token", tokenRefresco, COOKIE_OPTIONS)
  res.json({ accessToken: tokenAcceso })
}

export const olvidarContrasena = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const { email } = req.body
  await authService.olvidarContrasenaService(email)
  res.json({ message: "Si el correo existe, recibirás un email." })
}

export const resetearContrasena = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const { token, password } = req.body
  await authService.resetearContrasenaService(token, password)
  res.json({ message: "Contraseña actualizada correctamente" })
}

export const desactivar2FA = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const { codigo } = req.body
  await authService.desactivar2FAService(req.user!.user_id, codigo)
  res.json({ message: "2FA desactivado correctamente" })
}

export const cambiarContrasena = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const { contrasenaActual, contrasenaNueva } = req.body
  await authService.cambiarContrasenaService(
    req.user!.user_id,
    contrasenaActual,
    contrasenaNueva,
    req.cookies.refresh_token
  )
  res.json({ message: "Contraseña actualizada correctamente" })
}

export const revocarSesiones = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  await authService.revocarSesionesService(req.user!.user_id)
  res.clearCookie("refresh_token")
  res.json({ message: "Todas las sesiones han sido cerradas" })
}

