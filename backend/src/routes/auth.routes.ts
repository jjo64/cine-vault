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
} from "../controllers/AuthController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

// Rutas de autenticación
router.post("/register", manejadorAsincrono(registrar))
router.post("/login", manejadorAsincrono(iniciarSesion))
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
//router.post('forgot-password', manejadorAsincrono(olvidarContrasena))
//router.post('reset-password', manejadorAsincrono(resetearContrasena))
router.get(
  "/verify",
  middlewareAutenticacion,
  manejadorAsincrono(verificarToken)
) // Endpoint para verificar sesión y obtener datos del usuario
export default router
