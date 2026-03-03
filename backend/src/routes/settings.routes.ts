import { Router } from "express"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  actualizarPerfil,
  actualizarAuth,
  actualizarAvatar,
  eliminarCuenta,
} from "../controllers/SettingsController.js"

const router = Router()

//Rutas privadas
router.patch("/", middlewareAutenticacion, manejadorAsincrono(actualizarPerfil)) // Panel principal del settings donde se podra actualizar todos los campos del user
router.patch(
  "/auth",
  middlewareAutenticacion,
  manejadorAsincrono(actualizarAuth)
)
router.patch(
  "/avatar",
  middlewareAutenticacion,
  manejadorAsincrono(actualizarAvatar)
)
router.delete("/", middlewareAutenticacion, manejadorAsincrono(eliminarCuenta))

export default router
