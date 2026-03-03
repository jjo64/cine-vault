import { Router } from "express"
import { createDiary, getDiary } from "../controllers/DiaryController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * Rutas del Diario protegidas con autenticación y centralizadas con manejadorAsincrono.
 */
router.get("/", middlewareAutenticacion, manejadorAsincrono(getDiary)) // obtener diario del usuario
router.get("/:id", manejadorAsincrono(getDiary)) // obtener diario de otro usuario
router.post("/add", middlewareAutenticacion, manejadorAsincrono(createDiary)) // crear diario
// router.delete('/remove/:id', middlewareAutenticacion, removeDiary)

export default router
