import { Router } from "express"
import { createCheckoutSession } from "../controllers/PaymentsController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

// Rutas de pagos (protegidas con autenticación)
router.get(
  "/create-checkout-session",
  middlewareAutenticacion,
  manejadorAsincrono(createCheckoutSession)
)
//router.get("/success", middlewareAutenticacion, success)
//router.get("/cancel", middlewareAutenticacion, cancel)

export default router
