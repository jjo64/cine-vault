import { Router } from "express"
import { authMiddleware } from "../middlewares/auth.middlewares.js"
import { login, register, refreshToken, logout, verifyToken } from "../controllers/AuthController.js"
import { asyncHandler } from "../middlewares/error.middlewares.js"

const router = Router()

// Rutas de autenticación
router.post("/register", asyncHandler(register))
router.post('/login', asyncHandler(login))
router.post("/refresh", authMiddleware, asyncHandler(refreshToken))
router.post("/logout", authMiddleware, asyncHandler(logout))
//router.post('verify-email', asyncHandler(verifyEmail))
//router.post('forgot-password', asyncHandler(forgotPassword))
//router.post('reset-password', asyncHandler(resetPassword))
router.get("/verify", authMiddleware, asyncHandler(verifyToken)) // Endpoint para verificar sesión y obtener datos del usuario
export default router
