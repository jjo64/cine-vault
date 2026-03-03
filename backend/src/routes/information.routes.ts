import { Router } from "express"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { obtenerInformacion, obtenerInformacionCombinada, buscarPersona, buscarTodo, buscarPelicula, buscarSerie } from "../controllers/InformationController.js"

const router = Router()

router.get("/:id/person", manejadorAsincrono(obtenerInformacion)) // Información de una persona
router.get("/:id/person_credit", manejadorAsincrono(obtenerInformacionCombinada)) // Información de una persona pero con sus trabajos
router.get('/person', manejadorAsincrono(buscarPersona))
router.get('/todo', manejadorAsincrono(buscarTodo))
router.get('/movie', manejadorAsincrono(buscarPelicula))
router.get('/tv', manejadorAsincrono(buscarSerie))
export default router