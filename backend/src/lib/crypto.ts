import crypto from "crypto"
import * as OTPAuth from "otpauth"
import bcrypt from "bcrypt"

const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY! // 32 chars
const IV_LENGTH = 16

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