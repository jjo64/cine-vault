import { Router } from "express"
import { createCheckoutSession } from "../controllers/PaymentsController.js"
//import { protect } from "../middlewares/auth.middlewares.js"

const router = Router()

router.get("/create-checkout-session", createCheckoutSession)
//router.get("/success", protect, success)
//router.get("/cancel", protect, cancel)

export default router