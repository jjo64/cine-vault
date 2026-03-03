import { Router } from "express"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  getSearch,
  getMultiSearch,
  getMovieSearch,
  getPersonSearch,
  getTVSearch,
} from "../controllers/SearchController.js"

const router = Router()

router.get("/", manejadorAsincrono(getSearch)) // busqueda general
router.get("/multi", manejadorAsincrono(getMultiSearch)) // busqueda general
router.get("/movie", manejadorAsincrono(getMovieSearch)) // busqueda películas
router.get("/person", manejadorAsincrono(getPersonSearch)) // busqueda personas
router.get("/tv", manejadorAsincrono(getTVSearch)) // busqueda series

export default router
