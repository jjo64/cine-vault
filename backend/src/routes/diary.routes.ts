import { Router } from "express"
import {
  createDiary,
  getDiaryUser,
  removeDiary,
  getMyDiary,
} from "../controllers/DiaryController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * Rutas del Diario protegidas con autenticación y centralizadas con manejadorAsincrono.
 */
router.get("/", middlewareAutenticacion, manejadorAsincrono(getMyDiary)) // obtener diario del usuario
router.get("/:id_user", manejadorAsincrono(getDiaryUser)) // obtener diario de otro usuario
router.post("/", middlewareAutenticacion, manejadorAsincrono(createDiary)) // crear diario
router.delete("/:id", middlewareAutenticacion, removeDiary)

export default router
