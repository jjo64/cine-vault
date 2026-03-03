import { Router } from "express"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  personInformation,
  personInformationCombined,
} from "../controllers/InformationController.js"

const router = Router()

router.get("/person/:id", manejadorAsincrono(personInformation)) // informacion de una persona
router.get(
  "/person/:id/combined_credits",
  manejadorAsincrono(personInformationCombined)
)

export default router