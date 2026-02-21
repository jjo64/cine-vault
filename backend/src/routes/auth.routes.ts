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
import passport from "passport"

const router = Router()

// Rutas de autenticación
router.post("/register", manejadorAsincrono(registrar))
router.post("/login", manejadorAsincrono(iniciarSesion))
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
)
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/auth/google" }),
  controladorCallback
)
router.post(
  "/refresh",
  middlewareAutenticacion,
  manejadorAsincrono(renovarToken)
)
router.post(
  "/logout",
  middlewareAutenticacion,
  manejadorAsincrono(cerrarSesion)
)
router.post("/verify-email/:token", manejadorAsincrono(verificarEmail))
router.post("/resend-verification", manejadorAsincrono(reenviarVerificacion))
router.post("/forgot-password", olvidarContrasena)
router.post("/reset-password", resetearContrasena)
router.post("/cambiar-contrasena", middlewareAutenticacion, cambiarContrasena)
router.post("/revocar-sesiones", middlewareAutenticacion, revocarSesiones)
router.get(
  "/verify",
  middlewareAutenticacion,
  manejadorAsincrono(verificarToken)
) // Endpoint para verificar sesión y obtener datos del usuario
// Requieren autenticación
router.post("/2fa/activar", middlewareAutenticacion, activar2FA)
router.post("/2fa/desactivar", middlewareAutenticacion, desactivar2FA)
router.post("/2fa/confirmar", middlewareAutenticacion, confirmar2FA)
// No requiere autenticación, usa el tokenTemporal del body
router.post("/2fa/verificar", verificar2FA)
export default router
