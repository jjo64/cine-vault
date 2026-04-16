/**
 * @file auth.routes.ts
 * @description Definición de rutas para el sistema de Autenticación y Seguridad (IAM).
 * Incluye gestión de sesiones, registro, verificación de email, OAuth con Google,
 * autenticación multifactor (2FA) y recuperación de cuentas.
 */

import { Router } from "express"
// Middlewares de seguridad y validación
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  limitadorAuth,
  limitadorEmail,
} from "../middlewares/rateLimit.middleware.js"
import {
  validarBody,
  validarParams,
} from "../middlewares/validation.middleware.js"
// Controladores de identidad
import {
  activar2FA,
  cambiarContrasena,
  cerrarSesion,
  confirmar2FA,
  controladorCallback,
  desactivar2FA,
  iniciarOAuthGoogle,
  iniciarSesion,
  listarSesiones,
  olvidarContrasena,
  recoveryCodesStatus,
  reenviarVerificacion,
  regenerarRecoveryCodes,
  registrar,
  renovarToken,
  resetearContrasena,
  revocarSesion,
  revocarSesiones,
  verificar2FA,
  verificarCallbackGoogle,
  verificarEmail,
  verificarEmailDesdeQuery,
  verificarToken,
} from "../controllers/AuthController.js"
// Esquemas de integridad de datos
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  revokeSessionParamsSchema,
  twoFAConfirmSchema,
  twoFAVerifySchema,
} from "../schemas/auth.js"

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: RUTAS PÚBLICAS CON PROTECCIÓN ANTI-BRUTEFORCE
 * ---------------------------------------------------------------------------
 * Implementan limitadores de tasa estritos para mitigar ataques de fuerza bruta.
 */

// Autenticación estándar: Login y Registro
router.post(
  "/login",
  limitadorAuth,
  validarBody(loginSchema),
  manejadorAsincrono(iniciarSesion)
)
router.post("/register", limitadorAuth, manejadorAsincrono(registrar))

// Segundo paso de verificación MFA
router.post(
  "/2fa/verificar",
  limitadorAuth,
  validarBody(twoFAVerifySchema),
  manejadorAsincrono(verificar2FA)
)

// Gestión de correos sensibles (Reenvío y Recuperación)
router.post(
  "/resend-verification",
  limitadorEmail,
  validarBody(forgotPasswordSchema),
  manejadorAsincrono(reenviarVerificacion)
)
router.post(
  "/forgot-password",
  limitadorEmail,
  validarBody(forgotPasswordSchema),
  manejadorAsincrono(olvidarContrasena)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: RUTAS PÚBLICAS RECURSIVAS Y OAuth
 * ---------------------------------------------------------------------------
 */

// Verificación de email mediante tokens
router.post("/verify-email/:token", manejadorAsincrono(verificarEmail))
router.get("/verify-email", manejadorAsincrono(verificarEmailDesdeQuery))

// Ciclo de vida de tokens y contraseñas
router.post(
  "/reset-password",
  validarBody(resetPasswordSchema),
  manejadorAsincrono(resetearContrasena)
)
router.post("/refresh", manejadorAsincrono(renovarToken))

// Pasarelas de autenticación externa (Google)
router.get("/google", iniciarOAuthGoogle)
router.get(
  "/google/callback",
  verificarCallbackGoogle,
  manejadorAsincrono(controladorCallback)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: RUTAS PROTEGIDAS (Requieren Token de Sesión Activo)
 * ---------------------------------------------------------------------------
 */

// Gestión de Sesión
router.post("/logout", manejadorAsincrono(cerrarSesion))
router.get(
  "/verify",
  middlewareAutenticacion,
  manejadorAsincrono(verificarToken)
)

// Seguridad de Cuenta
router.post(
  "/cambiar-contrasena",
  middlewareAutenticacion,
  validarBody(changePasswordSchema),
  manejadorAsincrono(cambiarContrasena)
)

// Auditoría y Revocación de Sesiones
router.get(
  "/sessions",
  middlewareAutenticacion,
  manejadorAsincrono(listarSesiones)
)
router.post(
  "/revocar-sesiones",
  middlewareAutenticacion,
  manejadorAsincrono(revocarSesiones)
)
router.delete(
  "/sessions/:id",
  middlewareAutenticacion,
  validarParams(revokeSessionParamsSchema),
  manejadorAsincrono(revocarSesion)
)

// Gestión de Segundo Factor (2FA/MFA)
router.post(
  "/2fa/activar",
  middlewareAutenticacion,
  manejadorAsincrono(activar2FA)
)
router.post(
  "/2fa/desactivar",
  middlewareAutenticacion,
  manejadorAsincrono(desactivar2FA)
)
router.post(
  "/2fa/confirmar",
  middlewareAutenticacion,
  validarBody(twoFAConfirmSchema),
  manejadorAsincrono(confirmar2FA)
)

// Códigos de Recuperación de Emergencia
router.get(
  "/2fa/recovery-codes/status",
  middlewareAutenticacion,
  manejadorAsincrono(recoveryCodesStatus)
)
router.post(
  "/2fa/recovery-codes/regenerar",
  middlewareAutenticacion,
  validarBody(twoFAConfirmSchema),
  manejadorAsincrono(regenerarRecoveryCodes)
)

export default router
