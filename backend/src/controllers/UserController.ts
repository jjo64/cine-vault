import { Request, Response } from "express"
import type { SolicitudAutenticada } from "../middlewares/auth.middlewares.js"
import * as userService from "../services/user.services.js"
import { emitirNotificacionService } from "../services/notifications.services.js"
import jwt from "jsonwebtoken"
import type { PayloadAcceso } from "../middlewares/auth.middlewares.js"
import type { z } from "zod"
import { idParamSchema } from "../schemas/common.js"
import {
  buscarUsuariosQuerySchema,
  usernameParamSchema,
} from "../schemas/user.js"

type IdParam = z.infer<typeof idParamSchema>
type BuscarUsuariosQuery = z.infer<typeof buscarUsuariosQuerySchema>
type UsernameParam = z.infer<typeof usernameParamSchema>

export const obtenerUsuarios = async (req: Request, res: Response) => {
  res.json(await userService.obtenerUsuariosService())
}

export const obtenerUsuarioPorId = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParam
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]
  let viewerId: number | null = null

  if (token) {
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as PayloadAcceso
      viewerId = payload.user_id
    } catch {
      viewerId = null
    }
  }

  res.json(await userService.obtenerUsuarioPorIdService(id, viewerId))
}

export const obtenerUsuarioPorUsername = async (
  req: Request,
  res: Response
) => {
  const { username } = req.params as unknown as UsernameParam
  res.json(await userService.obtenerUsuarioPorUsernameService(username))
}

export const buscarUsuarios = async (req: Request, res: Response) => {
  const { q, limit } = req.query as unknown as BuscarUsuariosQuery
  res.json(await userService.buscarUsuariosService(q, limit))
}

export const obtenerSeguidores = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParam
  res.json(await userService.obtenerSeguidoresService(id))
}

export const obtenerSiguiendo = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParam
  res.json(await userService.obtenerSiguiendoService(id))
}

export const obtenerFirmaCinematograficaPublica = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params as unknown as IdParam
  res.json(await userService.obtenerFirmaCinematograficaPublicaService(id))
}

export const obtenerGaleriaCuradaPublica = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params as unknown as IdParam
  res.json(await userService.obtenerGaleriaCuradaPublicaService(id))
}

export const actualizarPerfil = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  await userService.actualizarPerfilService(req.user!.user_id, req.body)
  res.json({ message: "Perfil actualizado correctamente" })
}

export const seguirUsuario = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const { id } = req.params as unknown as IdParam
  await userService.seguirUsuarioService(req.user!.user_id, id)

  if (req.user!.user_id !== id) {
    await emitirNotificacionService({
      user_id: id,
      sender_id: req.user!.user_id,
      type: "follow",
    })
  }

  res.json({ message: "Usuario seguido correctamente" })
}

export const dejarDeSeguirUsuario = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const { id } = req.params as unknown as IdParam
  await userService.dejarDeSeguirUsuarioService(req.user!.user_id, id)
  res.json({ message: "Has dejado de seguir al usuario correctamente" })
}
