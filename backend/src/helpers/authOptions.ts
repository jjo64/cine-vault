import "dotenv/config"
import nodemailer from "nodemailer"
import { prisma } from "../lib/prisma.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import * as OTPAuth from "otpauth"
import bcrypt from "bcrypt"
import {
  PayloadAcceso,
  PayloadRefresco,
} from "../middlewares/auth.middlewares.js"

const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY! // 32 chars
const IV_LENGTH = 16

// Configuración de expiración de tokens
const EXPIRACION_TOKEN_ACCESO = "15m"
const DIAS_EXPIRACION_TOKEN_REFRESCO = 7

/**
 * Genera un JWT de acceso de corta duración.
 * @param idUsuario ID del usuario
 * @param rol Rol del usuario
 */

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export async function enviarCorreoVerificacion(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const mailOptions = {
    from: `"Cine Vault" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verifica tu cuenta",
    text: `Haz clic en el enlace para verificar tu cuenta: ${process.env.FRONTEND_URL}/verify-email?token=${token}`,
    html: `
      <h1>Verifica tu cuenta</h1>
      <p>Haz clic en el enlace para verificar tu cuenta:</p>
      <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}">Verificar cuenta</a>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Correo enviado:", info.response)
  } catch (error) {
    console.error("Error al enviar correo:", error)
    throw error
  }
}

export async function limpiarUsuariosNoVerificados() {
  try {
    const eliminados = await prisma.users.deleteMany({
      where: {
        is_verified: false,
        created_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    if (eliminados.count > 0)
      console.log(
        `Limpieza: ${eliminados.count} usuarios no verificados eliminados`
      )
  } catch (error) {
    console.error("Error en limpieza de usuarios no verificados:", error)
    // No relanzamos el error — si falla, el próximo ciclo lo intentará
  }
}

export const enviarCorreoResetPassword = async (
  email: string,
  token: string
) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: `"CineVault" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Restablecer contraseña",
    html: `
      <h2>Restablecer contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>El enlace expira en <strong>15 minutos</strong>.</p>
      <a href="${link}">Restablecer contraseña</a>
      <p>Si no solicitaste esto, ignorá este correo.</p>
    `,
  })
}

export const crearTokenAcceso = (
  idUsuario: number,
  rol: string,
  isVerified: boolean
) => {
  const payload: PayloadAcceso = {
    user_id: idUsuario,
    role: rol as PayloadAcceso["role"],
    is_verified: isVerified,
  }
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: EXPIRACION_TOKEN_ACCESO,
  })
}

/**
 * Genera un Refresh Token y crea una sesión en la base de datos.
 * @param idUsuario ID del usuario
 */
export const crearTokenRefresco = async (idUsuario: number) => {
  const idSesion = crypto.randomUUID()
  const token = jwt.sign(
    { id_session: idSesion, user_id: idUsuario } as PayloadRefresco,
    process.env.REFRESH_SECRET!,
    { expiresIn: `${DIAS_EXPIRACION_TOKEN_REFRESCO}d` }
  )

  // Persistir sesión en DB
  await prisma.sessions.create({
    data: {
      id: idSesion,
      refresh_token: token,
      user_id: idUsuario,
      expires_at: new Date(
        Date.now() + DIAS_EXPIRACION_TOKEN_REFRESCO * 24 * 60 * 60 * 1000
      ),
    },
  })

  return { token, idSesion }
}

/**
 * Verifica la validez de un Refresh Token y comprueba si la sesión existe en DB.
 * @param token Token a verificar
 */
export const verificarTokenRefresco = async (token: string) => {
  const payload = jwt.verify(
    token,
    process.env.REFRESH_SECRET!
  ) as PayloadRefresco

  // Verificar que la sesión no haya sido revocada
  const sesion = await prisma.sessions.findUnique({
    where: { id: payload.id_session },
  })
  if (!sesion) throw new Error("Sesión inválida o revocada")

  return payload
}

/**
 * Encripta una contraseña usando bcrypt.
 */
export const hashearContrasena = (password: string) => bcrypt.hash(password, 10)

/**
 * Compara una contraseña plana con su hash.
 */
export const compararContrasena = (password: string, hash: string) =>
  bcrypt.compare(password, hash)

export const crearTOTP = (secreto: string) =>
  new OTPAuth.TOTP({
    issuer: "CineVault",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secreto),
  })

export const encriptarSecreto = (texto: string) => {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv)
  const encriptado = Buffer.concat([cipher.update(texto), cipher.final()])
  return `${iv.toString("hex")}:${encriptado.toString("hex")}`
}

export const desencriptarSecreto = (texto: string) => {
  const [iv, encriptado] = texto.split(":")
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    ENCRYPTION_KEY,
    Buffer.from(iv, "hex")
  )
  return Buffer.concat([
    decipher.update(Buffer.from(encriptado, "hex")),
    decipher.final(),
  ]).toString()
}
