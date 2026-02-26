import { Router } from "express"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerSeguidores,
  obtenerSiguiendo,
  dejarDeSeguirUsuario,
  seguirUsuario,
  actualizarPerfil,
} from "../controllers/UserController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * Rutas de Usuarios:
 * Todas envueltas en manejadorAsincrono para centralizar errores.
 */

//Rutas publicas
router.get("/", middlewareAutenticacion, manejadorAsincrono(obtenerUsuarios))
router.get("/:id", manejadorAsincrono(obtenerUsuarioPorId))

//Rutas privadas
router.post(
  "/follow/:id",
  middlewareAutenticacion,
  manejadorAsincrono(seguirUsuario)
)
router.delete(
  "/unfollow/:id",
  middlewareAutenticacion,
  manejadorAsincrono(dejarDeSeguirUsuario)
)
router.get("/:id/followers", manejadorAsincrono(obtenerSeguidores))
router.get("/:id/following", manejadorAsincrono(obtenerSiguiendo))

//router.post('/block/:id', middlewareAutenticacion, manejadorAsincrono(blockUser))
//router.delete('/unblock/:id', middlewareAutenticacion, manejadorAsincrono(unblockUser))

export default router
