import nodemailer from "nodemailer"
import { prisma } from "../lib/prisma.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import * as OTPAuth from "otpauth"
import bcrypt from "bcrypt"
import { PayloadAcceso, PayloadRefresco } from "../middlewares/auth.middlewares.js"

/* ==========================================================================
   AUTH OPTIONS / HELPERS
   --------------------------------------------------------------------------
   Agrupado por responsabilidad:
   1. Configuración de cookies
   2. Tokens JWT (acceso, refresco, verificación)
   3. Contraseñas (hash, comparación)
   4. 2FA (TOTP, encriptación de secreto)
   5. Emails (verificación, reset de contraseña)
   6. Limpieza (cron de usuarios no verificados)
   ========================================================================== */

const EXPIRACION_TOKEN_ACCESO = "15m"
const DIAS_EXPIRACION_TOKEN_REFRESCO = 7
const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY! // 32 chars
const IV_LENGTH = 16

/* ==========================================================================
   1. CONFIGURACIÓN DE COOKIES
   ========================================================================== */

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
}

/* ==========================================================================
   2. TOKENS JWT
   ========================================================================== */

/**
 * Genera un JWT de acceso de corta duración (15 minutos).
 */
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
 * Genera un Refresh Token, lo hashea y persiste la sesión en la DB.
 * Solo el hash se usa para verificaciones — el token original va en la cookie.
 */
export const crearTokenRefresco = async (idUsuario: number) => {
  const idSesion = crypto.randomUUID()
  const token = jwt.sign(
    { id_session: idSesion, user_id: idUsuario } as PayloadRefresco,
    process.env.REFRESH_SECRET!,
    { expiresIn: `${DIAS_EXPIRACION_TOKEN_REFRESCO}d` }
  )

  await prisma.sessions.create({
    data: {
      id: idSesion,
      refresh_token: token,
      token_hash: hashearToken(token),
      user_id: idUsuario,
      expires_at: new Date(
        Date.now() + DIAS_EXPIRACION_TOKEN_REFRESCO * 24 * 60 * 60 * 1000
      ),
    },
  })

  return { token, idSesion }
}

/**
 * Verifica un Refresh Token y comprueba que la sesión exista en DB por hash.
 * Si la sesión fue revocada, lanza error aunque el JWT sea válido.
 */
export const verificarTokenRefresco = async (token: string) => {
  const payload = jwt.verify(token, process.env.REFRESH_SECRET!) as PayloadRefresco

  const sesion = await prisma.sessions.findFirst({
    where: {
      token_hash: hashearToken(token),
      id: payload.id_session,
    },
  })

  if (!sesion) throw new Error("Sesión inválida o revocada")

  return payload
}

/**
 * Genera un hash SHA-256 de un token.
 * Usado para guardar el refresh_token de forma segura en la DB.
 */
export const hashearToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex")
}

/* ==========================================================================
   3. CONTRASEÑAS
   ========================================================================== */

/**
 * Hashea una contraseña con bcrypt (10 rondas).
 */
export const hashearContrasena = (password: string) =>
  bcrypt.hash(password, 10)

/**
 * Compara una contraseña en texto plano con su hash bcrypt.
 */
export const compararContrasena = (password: string, hash: string) =>
  bcrypt.compare(password, hash)

/* ==========================================================================
   4. AUTENTICACIÓN DE DOS FACTORES (2FA)
   ========================================================================== */

/**
 * Crea una instancia TOTP para validar códigos de Google Authenticator.
 */
export const crearTOTP = (secreto: string) =>
  new OTPAuth.TOTP({
    issuer: "CineVault",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secreto),
  })

/**
 * Encripta el secreto TOTP con AES-256-CBC antes de guardarlo en DB.
 */
export const encriptarSecreto = (texto: string) => {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv)
  const encriptado = Buffer.concat([cipher.update(texto), cipher.final()])
  return `${iv.toString("hex")}:${encriptado.toString("hex")}`
}

/**
 * Desencripta el secreto TOTP almacenado en DB.
 */
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

/* ==========================================================================
   5. EMAILS
   ========================================================================== */

/**
 * Crea y reutiliza un transporter de nodemailer.
 * Centralizado para no repetir la configuración en cada función.
 */
const crearTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

/**
 * Envía el email de verificación de cuenta al registrarse.
 */
export const enviarCorreoVerificacion = async (email: string, token: string) => {
  const transporter = crearTransporter()
  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`

  try {
    const info = await transporter.sendMail({
      from: `"CineVault" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verifica tu cuenta",
      text: `Verificá tu cuenta entrando a: ${link}`,
      html: `
        <h1>Verifica tu cuenta</h1>
        <p>Haz clic en el enlace para verificar tu cuenta:</p>
        <a href="${link}">Verificar cuenta</a>
      `,
    })
    console.log("Correo de verificación enviado:", info.response)
  } catch (error) {
    console.error("Error al enviar correo de verificación:", error)
    throw error
  }
}

/**
 * Envía el email para restablecer la contraseña.
 */
export const enviarCorreoResetPassword = async (email: string, token: string) => {
  const transporter = crearTransporter()
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

  try {
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
  } catch (error) {
    console.error("Error al enviar correo de reset:", error)
    throw error
  }
}

/* ==========================================================================
   6. LIMPIEZA (CRON)
   ========================================================================== */

/**
 * Elimina usuarios no verificados con más de 24 horas de antigüedad.
 * Ejecutado por el cron en server.ts cada hora.
 */
export const limpiarUsuariosNoVerificados = async () => {
  try {
    const eliminados = await prisma.users.deleteMany({
      where: {
        is_verified: false,
        created_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    if (eliminados.count > 0) {
      console.log(`Limpieza: ${eliminados.count} usuarios no verificados eliminados`)
    }
  } catch (error) {
    console.error("Error en limpieza de usuarios no verificados:", error)
    // No relanzamos — si falla, el próximo ciclo lo intentará
  }
}