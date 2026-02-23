import { Request, Response } from "express"
import type { SolicitudAutenticada } from "../middlewares/auth.middlewares.js"
import * as userService from "../services/user.services.js"

export const obtenerUsuarios = async (req: Request, res: Response) => {
  res.json(await userService.obtenerUsuariosService())
}
export const obtenerUsuarioPorId = async (req: Request, res: Response) => {
  res.json(await userService.obtenerUsuarioPorIdService(Number(req.params.id)))
}
export const obtenerSeguidores = async (req: Request, res: Response) => {
  res.json(await userService.obtenerSeguidoresService(Number(req.params.id)))
}
export const obtenerSiguiendo = async (req: Request, res: Response) => {
  res.json(await userService.obtenerSiguiendoService(Number(req.params.id)))
}
export const actualizarPerfil = async (req: SolicitudAutenticada, res: Response) => {
  await userService.actualizarPerfilService(req.user!.user_id, req.body)
  res.json({ message: "Perfil actualizado correctamente" })
}
export const seguirUsuario = async (req: SolicitudAutenticada, res: Response) => {
  await userService.seguirUsuarioService(req.user!.user_id, Number(req.params.id))
  res.json({ message: "Usuario seguido correctamente" })
}
export const dejarDeSeguirUsuario = async (req: SolicitudAutenticada, res: Response) => {
  await userService.dejarDeSeguirUsuarioService(req.user!.user_id, Number(req.params.id))
  res.json({ message: "Has dejado de seguir al usuario correctamente" })
}