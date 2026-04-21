/**
 * @file crypto.ts
 * @description Módulo centralizado de utilidades criptográficas para CineVault.
 * Implementa la seguridad de contraseñas (bcrypt), la generación y validación
 * de tokens 2FA (TOTP) y la encriptación simétrica para secretos sensibles (AES-256).
 */

import crypto from "crypto"
import * as OTPAuth from "otpauth"
import bcrypt from "bcrypt"

/** Clave en bruto obtenida del entorno para la encriptación de secretos 2FA */
const RAW_ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || ""

if (!RAW_ENCRYPTION_KEY) {
  throw new Error("CRÍTICO: La variable TWO_FACTOR_ENCRYPTION_KEY no está configurada")
}

/**
 * Derivación de una clave de 32 bytes mediante SHA-256 para asegurar compatibilidad 
 * con AES-256 independientemente de la longitud de la variable de entorno.
 */
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(RAW_ENCRYPTION_KEY)
  .digest()

const IV_LENGTH = 16 // Longitud estándar para el vector de inicialización AES

/**
 * ---------------------------------------------------------------------------
 * GESTIÓN DE CONTRASEÑAS
 * ---------------------------------------------------------------------------
 */

/**
 * Hashea una contraseña utilizando bcrypt con un factor de coste de 10 rondas.
 * 
 * @param password - Contraseña en texto plano a encriptar.
 * @returns Promesa que resuelve en el hash generado.
 */
export const hashearContrasena = (password: string) => bcrypt.hash(password, 10)

/**
 * Valida una contraseña contra un hash almacenado.
 * 
 * @param password - Contraseña proporcionada por el usuario.
 * @param hash - Hash almacenado en la base de datos.
 * @returns Promesa que resuelve en un booleano indicando el resultado.
 */
export const compararContrasena = (password: string, hash: string) =>
  bcrypt.compare(password, hash)

/**
 * ---------------------------------------------------------------------------
 * AUTENTICACIÓN DE DOBLE FACTOR (2FA)
 * ---------------------------------------------------------------------------
 */

/**
 * Inicializa una instancia de TOTP configurada para CineVault.
 * 
 * @param secreto - Clave secreta del usuario en formato Base32.
 * @returns Instancia configurada para validación y generación de URIs.
 */
export const crearTOTP = (secreto: string) =>
  new OTPAuth.TOTP({
    issuer: "CineVault",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secreto.trim()),
  })

/**
 * Encripta un texto plano (habitualmente el secreto 2FA) mediante AES-256-CBC.
 * Añade una capa de seguridad extra de modo que si la base de datos se ve comprometida,
 * los secretos 2FA sigan protegidos.
 * 
 * @param texto - Información sensible a proteger.
 * @returns Cadena formateada como "iv:encriptado" en hexadecimal.
 */
export const encriptarSecreto = (texto: string) => {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv)
  const encriptado = Buffer.concat([cipher.update(texto), cipher.final()])
  return `${iv.toString("hex")}:${encriptado.toString("hex")}`
}

/**
 * Desencripta una cadena generada por encriptarSecreto.
 * Soporta retrocompatibilidad con secretos antiguos almacenados en texto plano.
 * 
 * @param texto - Cadena encriptada ("iv:encriptado").
 * @returns El texto original desencriptado.
 * @throws Error si el formato de la cadena es inválido.
 */
export const desencriptarSecreto = (texto: string) => {
  if (!texto || typeof texto !== "string") {
    throw new Error("Formato de secreto 2FA inválido o inexistente")
  }

  // Soporte para registros antiguos que no estaban encriptados.
  if (!texto.includes(":")) {
    return texto
  }

  const [iv, encriptado] = texto.split(":")
  if (!iv || !encriptado || iv.length !== IV_LENGTH * 2) {
    throw new Error("Cadenas de inicialización (IV) o datos malformados")
  }

  const ivBuffer = Buffer.from(iv, "hex")
  if (ivBuffer.length !== IV_LENGTH) {
    throw new Error("Longitud de IV inválida para AES-256")
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    ENCRYPTION_KEY,
    ivBuffer
  )
  return Buffer.concat([
    decipher.update(Buffer.from(encriptado, "hex")),
    decipher.final(),
  ]).toString()
}
