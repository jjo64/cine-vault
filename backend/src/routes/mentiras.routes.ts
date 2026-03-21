import { Router } from "express"
import { getMentirasRanking } from "../controllers/MentirasController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

router.get("/ranking", manejadorAsincrono(getMentirasRanking))

export default router
