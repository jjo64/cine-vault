import { Router } from "express"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { obtenerInformacion, obtenerInformacionCombinada } from "../controllers/InformationController.js"

const router = Router()

router.get("/:id", middlewareAutenticacion, manejadorAsincrono(obtenerInformacion)) // Información de una persona
router.get("/:id/credits", middlewareAutenticacion, manejadorAsincrono(obtenerInformacionCombinada)) // Información de una persona pero con sus trabajos

export default router