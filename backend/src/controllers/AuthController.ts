import { Response } from "express"
import { prisma } from "../lib/prisma.js"
import {
  SolicitudAutenticada,
  PayloadRefresco,
} from "../middlewares/auth.middlewares.js"
import jwt from "jsonwebtoken"
import { validarUsuario } from "../schemas/user.js"
import {
  crearTokenAcceso,
  crearTokenRefresco,
  hashearContrasena,
  verificarTokenRefresco,
  compararContrasena,
} from "../services/auth.services.js"
import {
  COOKIE_OPTIONS,
  enviarCorreoVerificacion,
} from "../helpers/authOptions.js"

// Mensajes de respuesta constantes para consistencia
const MENSAJES = {
  ERROR_CREDENCIALES: "Credenciales incorrectas",
  USUARIO_EXISTE: "El usuario ya está registrado",
  ERROR_VALIDACION: "Error de validación",
  TOKEN_REQUERIDO: "Token de acceso requerido",
  REFRESH_REQUERIDO: "No se proporcionó refresh token",
  TOKEN_INVALIDO: "Token inválido o expirado",
  USUARIO_NO_ENCONTRADO: "Usuario no encontrado",
  SESION_CERRADA: "Sesión cerrada exitosamente",
  ERROR_SERVIDOR: "Error interno del servidor",
}

/* ==========================================================================
   CONTROLADOR DE AUTENTICACIÓN
   --------------------------------------------------------------------------
   Maneja el inicio de sesión, registro, renovación de tokens y cierre de sesión.
   ========================================================================== */

/**
 * Inicia sesión de usuario.
 * Valida credenciales, genera tokens de acceso y refresco, y establece la cookie segura.
 */
export const iniciarSesion = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  try {
    const { username, password } = req.body

    // Validación básica de entrada
    if (!username || !password) {
      return res.status(400).json({ message: MENSAJES.ERROR_CREDENCIALES })
    }

    // Buscar usuario en DB
    const usuario = await prisma.users.findUnique({ where: { username } })
    if (!usuario)
      return res.status(401).json({ message: MENSAJES.ERROR_CREDENCIALES })

    // Verificar contraseña usando bcrypt (seguro)
    const contrasenaValida = await compararContrasena(
      password,
      usuario.password
    )
    if (!contrasenaValida)
      return res.status(401).json({ message: MENSAJES.ERROR_CREDENCIALES })

    // Aquí ya tienes el usuario de la DB → puedes leer is_verified
    if (!usuario.is_verified)
      return res
        .status(403)
        .json({ message: "Debes verificar tu email antes de iniciar sesión" })

    // Generar tokens
    const tokenAcceso = crearTokenAcceso(
      usuario.id,
      usuario.role as string,
      usuario.is_verified
    )
    const { token: tokenRefresco } = await crearTokenRefresco(usuario.id)

    // Configurar cookie segura httpOnly para el refresh token
    res.cookie("refresh_token", tokenRefresco, COOKIE_OPTIONS)
    res.json({ accessToken: tokenAcceso })
  } catch (error) {
    console.error("Error en inicio de sesión:", error)
    res.status(500).json({ message: MENSAJES.ERROR_SERVIDOR })
  }
}

/**
 * Registra un nuevo usuario.
 * Valida datos con Zod, hashea la contraseña y guarda en BD.
 */
export const registrar = async (req: SolicitudAutenticada, res: Response) => {
  try {
    // Validar esquema de datos
    const validacion = validarUsuario(req.body)
    if (!validacion.success || !validacion.data) {
      return res.status(400).json({
        message: MENSAJES.ERROR_VALIDACION,
        errors: validacion.errorMessages || ["Datos inválidos"],
      })
    }

    const { email, username, password } = validacion.data

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.users.findUnique({ where: { email } })
    if (usuarioExistente)
      return res.status(400).json({ message: MENSAJES.USUARIO_EXISTE })

    // Crear usuario con contraseña hasheada
    const contrasenaHasheada = await hashearContrasena(password)

    // Aca registramos el usuario en la base de datos pero con el is_verified en false
    // y se tiene que generar un token para verificar el email

    const nuevoUsuario = await prisma.users.create({
      data: {
        email,
        username,
        password: contrasenaHasheada,
      },
    })

    // Aca se tiene que enviar un correo para verificar la cuenta
    const tokenVerificacion = jwt.sign(
      { user_id: nuevoUsuario.id },
      process.env.VERIFY_EMAIL_SECRET!,
      { expiresIn: "1h" }
    )

    await prisma.auth_tokens.create({
      data: {
        id: crypto.randomUUID(),
        user_id: nuevoUsuario.id,
        token: tokenVerificacion,
        type: "VERIFY_EMAIL",
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    })

    // Aca se tiene que enviar un correo para verificar la cuenta
    await enviarCorreoVerificacion(nuevoUsuario.email, tokenVerificacion)

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      userId: nuevoUsuario.id,
    })
  } catch (error) {
    console.error("Error en registro:", error)
    res.status(500).json({ message: MENSAJES.ERROR_SERVIDOR })
  }
}

export const verificarEmail = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  try {
    const token = String(req.params.token)
    if (!token) return res.status(400).json({ message: "Token requerido" })

    type PayloadVerificacion = { user_id: number }
    const payload = jwt.verify(
      token,
      process.env.VERIFY_EMAIL_SECRET!
    ) as PayloadVerificacion
    const tokenEnDb = await prisma.auth_tokens.findFirst({
      where: { token, user_id: payload.user_id, type: "VERIFY_EMAIL" },
      include: { users: true },
    })

    if (!tokenEnDb || tokenEnDb.expires_at < new Date())
      return res
        .status(410)
        .json({ message: "El enlace ha expirado. Solicita uno nuevo." })

    if (!tokenEnDb.users)
      return res.status(404).json({ message: "Usuario no encontrado" })

    await prisma.users.update({
      where: { id: tokenEnDb.users.id },
      data: { is_verified: true },
    })
    await prisma.auth_tokens.deleteMany({
      where: { user_id: tokenEnDb.users.id, type: "VERIFY_EMAIL" },
    })
    res.json({ message: "Email verificado exitosamente" })
  } catch (error) {
    console.error("Error al verificar email:", error)
    res.status(500).json({ message: MENSAJES.ERROR_SERVIDOR })
  }
}

export const reenviarVerificacion = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: "Email requerido" })

    const usuario = await prisma.users.findUnique({ where: { email } })

    // Siempre responder igual para no revelar si el email existe
    if (!usuario || usuario.is_verified)
      return res.json({
        message:
          "Si el correo existe y no está verificado, recibirás un email.",
      })

    // Invalidar tokens anteriores
    await prisma.auth_tokens.deleteMany({
      where: { user_id: usuario.id, type: "VERIFY_EMAIL" },
    })

    // Generar nuevo token de verificación
    const tokenVerificacion = jwt.sign(
      { user_id: usuario.id },
      process.env.VERIFY_EMAIL_SECRET!,
      { expiresIn: "1h" }
    )

    await prisma.auth_tokens.create({
      data: {
        id: crypto.randomUUID(),
        user_id: usuario.id,
        token: tokenVerificacion,
        type: "VERIFY_EMAIL",
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    })

    await enviarCorreoVerificacion(usuario.email, tokenVerificacion)
    res.json({
      message: "Si el correo existe y no está verificado, recibirás un email.",
    })
  } catch (error) {
    console.error("Error al reenviar verificación:", error)
    res.status(500).json({ message: MENSAJES.ERROR_SERVIDOR })
  }
}

/**
 * Renueva el token de acceso usando el refresh token (cookie).
 */
export const renovarToken = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const token = req.cookies.refresh_token
  if (!token)
    return res.status(401).json({ message: MENSAJES.REFRESH_REQUERIDO })

  try {
    // Verificar validez del refresh token y la sesión en DB
    const payload = await verificarTokenRefresco(token)

    const usuario = await prisma.users.findUnique({
      where: { id: payload.user_id },
    })
    if (!usuario)
      return res.status(404).json({ message: MENSAJES.USUARIO_NO_ENCONTRADO })

    // Generar nuevo access token
    const tokenAcceso = crearTokenAcceso(
      usuario.id,
      usuario.role as string,
      usuario.is_verified
    )
    res.json({ accessToken: tokenAcceso })
  } catch (err) {
    // Si el refresh token no es válido, limpiar cookie y rechazar
    console.error("Error al renovar token:", err)
    res.clearCookie("refresh_token")
    return res.status(401).json({ message: MENSAJES.TOKEN_INVALIDO })
  }
}

/**
 * Cierra la sesión del usuario.
 * Elimina la sesión de la BD y borra la cookie.
 */
export const cerrarSesion = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  try {
    const token = req.cookies.refresh_token
    if (token) {
      try {
        // Intentar borrar la sesión de la BD
        const payload = jwt.verify(
          token,
          process.env.REFRESH_SECRET!
        ) as PayloadRefresco
        await prisma.sessions
          .delete({ where: { id: payload.id_session } })
          .catch(() => null) // Ignorar error si no existe
      } catch (err) {
        // Token inválido, procedemos a limpiar cookie de todas formas
        console.warn("Advertencia: Token inválido o sesión ya borrada")
      }
    }

    // Siempre limpiar la cookie
    res.clearCookie("refresh_token")
    res.json({ message: MENSAJES.SESION_CERRADA })
  } catch (error) {
    res.status(500).json({ message: MENSAJES.ERROR_SERVIDOR })
  }
}

/**
 * Verifica el token de acceso actual y devuelve los datos del usuario.
 * Usado por el frontend para persistir el login.
 */
export const verificarToken = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  try {
    // req.user ya está poblado por el middleware 'middlewareAutenticacion'
    if (!req.user)
      return res.status(401).json({ message: MENSAJES.TOKEN_REQUERIDO })

    const usuario = await prisma.users.findUnique({
      where: { id: req.user.user_id },
      select: { id: true, username: true, email: true, role: true }, // Solo devolver campos seguros
    })

    if (!usuario)
      return res.status(404).json({ message: MENSAJES.USUARIO_NO_ENCONTRADO })

    res.json(usuario)
  } catch (error) {
    console.error("Error al verificar token:", error)
    res.status(500).json({ message: MENSAJES.ERROR_SERVIDOR })
  }
}

export const controladorCallback = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usuario = req.user as any // passport inyecta el usuario aquí

    const tokenAcceso = crearTokenAcceso(
      usuario.id,
      usuario.role as string,
      usuario.is_verified
    )
    const { token: tokenRefresco } = await crearTokenRefresco(usuario.id)

    res.cookie("refresh_token", tokenRefresco, COOKIE_OPTIONS)
    res.cookie("access_token", tokenAcceso, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 1000, // 1 minuto, solo para el handshake
      sameSite: "lax",
    })

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback`)
  } catch (error) {
    console.error("Error en callback de Google:", error)
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`)
  }
}
