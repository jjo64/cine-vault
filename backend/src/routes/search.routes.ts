import { Router } from "express"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { getSearch, getMultiSearch, getMovieSearch, getPersonSearch, getTVSearch, personInformation, personInformationCombined } from "../controllers/SearchController.js"

const router = Router()

router.get("/", manejadorAsincrono(getSearch))
router.get("/multi", manejadorAsincrono(getMultiSearch))
router.get("/movie", manejadorAsincrono(getMovieSearch))
router.get("/person", manejadorAsincrono(getPersonSearch))
router.get("/tv", manejadorAsincrono(getTVSearch))
router.get("/person/:id", manejadorAsincrono(personInformation))
router.get("/person/:id/combined_credits", manejadorAsincrono(personInformationCombined))

export default router
