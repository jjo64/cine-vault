/**
 * @file auth.ts
 * @description Esquemas de validación Zod para los flujos de autenticación y seguridad.
 * Define las reglas de integridad para el inicio de sesión, gestión de credenciales,
 * recuperación de cuentas y validación de factores múltiples (2FA).
 */

import { z } from "zod"

const RATING_PASSWORD_MSG = "La contraseña debe tener al menos 8 caracteres"

/** Esquema para la validación de credenciales en el inicio de sesión estándar */
export const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario o email es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

/** Esquema para la solicitud inicial de recuperación de contraseña */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Debe proporcionar un correo electrónico válido"),
})

/** Esquema para el establecimiento de una nueva contraseña mediante token de recuperación */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "El token de recuperación es requerido"),
  password: z.string().min(8, RATING_PASSWORD_MSG),
})

/** Esquema para el cambio voluntario de contraseña desde el perfil de usuario */
export const changePasswordSchema = z.object({
  contrasenaActual: z.string().min(1, "Debe introducir su contraseña actual"),
  contrasenaNueva: z.string().min(8, RATING_PASSWORD_MSG),
})

/** Esquema para la activación inicial del segundo factor (2FA) */
export const twoFAConfirmSchema = z.object({
  codigo: z.string().length(6, "El código TOTP debe tener exactamente 6 dígitos"),
})

/** 
 * Esquema para la verificación del 2FA durante el flujo de Login.
 * Incluye soporte para el reconocimiento de dispositivos de confianza.
 */
export const twoFAVerifySchema = z.object({
  codigo: z.string().length(6, "El código TOTP debe tener exactamente 6 dígitos"),
  tokenTemporal: z.string().min(1, "El token de sesión temporal es requerido"),
  rememberDevice: z.boolean().optional(),
})

/** Esquema para la invalidación/revocación de sesiones activas */
export const revokeSessionParamsSchema = z.object({
  id: z.string().min(1, "El identificador de sesión es requerido"),
})

// Tipado exportado deducido
export type LoginDTO = z.infer<typeof loginSchema>
export type TwoFAVerifyDTO = z.infer<typeof twoFAVerifySchema>
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>
