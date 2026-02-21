import { Router } from "express"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import {
  iniciarSesion,
  registrar,
  renovarToken,
  cerrarSesion,
  verificarToken,
  verificarEmail,
  reenviarVerificacion,
  controladorCallback,
  activar2FA,
  confirmar2FA,
  verificar2FA,
  olvidarContrasena,
  resetearContrasena,
  desactivar2FA,
  cambiarContrasena,
  revocarSesiones,
} from "../controllers/AuthController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { limitadorAuth, limitadorEmail } from "../middlewares/rateLimit.middleware.js"
import passport from "passport"

const router = Router()

// ---------------------------------------------------------------------------
// RUTAS PÚBLICAS CON RATE LIMIT ESTRICTO (brute force protection)
// ---------------------------------------------------------------------------
// Login → máximo 5 intentos por IP cada 15 minutos
router.post("/login", limitadorAuth, manejadorAsincrono(iniciarSesion))
// Registro → mismo límite para evitar creación masiva de cuentas
router.post("/register", limitadorAuth, manejadorAsincrono(registrar))
// 2FA paso 2 → límite estricto igual que login
router.post("/2fa/verificar", limitadorAuth, manejadorAsincrono(verificar2FA))

// Emails → máximo 3 por hora para evitar spam
router.post("/resend-verification", limitadorEmail, manejadorAsincrono(reenviarVerificacion))
router.post("/forgot-password", limitadorEmail, manejadorAsincrono(olvidarContrasena))

// ---------------------------------------------------------------------------
// RUTAS PÚBLICAS SIN LIMIT ESTRICTO
// ---------------------------------------------------------------------------
router.post("/verify-email/:token", manejadorAsincrono(verificarEmail))
router.post("/reset-password", manejadorAsincrono(resetearContrasena))
router.post("/refresh", manejadorAsincrono(renovarToken))

// ---------------------------------------------------------------------------
// GOOGLE OAuth
// ---------------------------------------------------------------------------
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
)
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/auth/google" }),
  controladorCallback
)

// ---------------------------------------------------------------------------
// RUTAS PROTEGIDAS (requieren token)
// ---------------------------------------------------------------------------
router.post("/logout", middlewareAutenticacion, manejadorAsincrono(cerrarSesion))
router.get("/verify", middlewareAutenticacion, manejadorAsincrono(verificarToken))
router.post("/cambiar-contrasena", middlewareAutenticacion, manejadorAsincrono(cambiarContrasena))
router.post("/revocar-sesiones", middlewareAutenticacion, manejadorAsincrono(revocarSesiones))
router.post("/2fa/activar", middlewareAutenticacion, manejadorAsincrono(activar2FA))
router.post("/2fa/desactivar", middlewareAutenticacion, manejadorAsincrono(desactivar2FA))
router.post("/2fa/confirmar", middlewareAutenticacion, manejadorAsincrono(confirmar2FA))

export default router
