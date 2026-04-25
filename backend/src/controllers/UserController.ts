/**
 * @file UserController.ts
 * @description Controlador para el ecosistema de Usuarios y Relaciones Sociales.
 * Gestiona perfiles públicos, búsquedas de miembros, grafos de seguimiento 
 * e integración de firmas cinematográficas personalizadas.
 */

import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import type { z } from "zod"
import { idParamSchema } from "../schemas/common.js"
import {
  buscarUsuariosQuerySchema,
  usernameParamSchema,
} from "../schemas/user.js"
import type {
  PayloadAcceso,
  SolicitudAutenticada,
} from "../middlewares/auth.middlewares.js"
import * as userService from "../services/user.services.js"
import { getUserBadgesService } from "../services/badges.services.js"

type IdParam = z.infer<typeof idParamSchema>
type BuscarUsuariosQuery = z.infer<typeof buscarUsuariosQuerySchema>
type UsernameParam = z.infer<typeof usernameParamSchema>

/**
 * Obtiene el catálogo completo de usuarios registrados en el sistema.
 */
export const obtenerUsuarios = async (req: Request, res: Response) => {
  const usuarios = await userService.obtenerUsuariosService()
  res.json(usuarios)
}

/**
 * Recupera el perfil de un usuario por su ID, resolviendo opcionalmente el estado 
 * de seguimiento si el espectador está autenticado.
 */
export const obtenerUsuarioPorId = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParam
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]
  let viewerId: number | null = null

  // Resolución de identidad opcional para chequeo de seguimiento
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

  const perfil = await userService.obtenerUsuarioPorIdService(id, viewerId)
  res.json(perfil)
}

/**
 * Localiza a un usuario mediante su nombre de usuario único.
 */
export const obtenerUsuarioPorUsername = async (
  req: Request,
  res: Response
) => {
  const { username } = req.params as unknown as UsernameParam
  const perfil = await userService.obtenerUsuarioPorUsernameService(username)
  res.json(perfil)
}

/**
 * Motor de búsqueda parcial para localizar miembros por coincidencia de texto.
 */
export const buscarUsuarios = async (req: Request, res: Response) => {
  const { q, limit } = req.query as unknown as BuscarUsuariosQuery
  const resultados = await userService.buscarUsuariosService(q, limit)
  res.json(resultados)
}

/**
 * Obtiene el listado de seguidores de un usuario específico.
 */
export const obtenerSeguidores = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParam
  const seguidores = await userService.obtenerSeguidoresService(id)
  res.json(seguidores)
}

/**
 * Obtiene el listado de usuarios a los que sigue un individuo.
 */
export const obtenerSiguiendo = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParam
  const siguiendo = await userService.obtenerSiguiendoService(id)
  res.json(siguiendo)
}

/**
 * Recupera la firma cinematográfica pública asociada al perfil del usuario.
 */
export const obtenerFirmaCinematograficaPublica = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params as unknown as IdParam
  const firma = await userService.obtenerFirmaCinematograficaPublicaService(id)
  res.json(firma)
}

/**
 * Obtiene los elementos destacados de la galería curada de un usuario.
 */
export const obtenerGaleriaCuradaPublica = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params as unknown as IdParam
  const galeria = await userService.obtenerGaleriaCuradaPublicaService(id)
  res.json(galeria)
}

/**
 * Permite al usuario autenticado actualizar sus datos biográficos de perfil.
 */
export const actualizarPerfil = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  await userService.actualizarPerfilService(req.user!.user_id, req.body)
  res.json({ message: "Perfil actualizado con éxito" })
}

/**
 * Establece una relación de seguimiento hacia otro usuario.
 */
export const seguirUsuario = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const { id } = req.params as unknown as IdParam
  await userService.seguirUsuarioService(req.user!.user_id, id)
  res.json({ message: "Usuario seguido con éxito" })
}

/**
 * Elimina la relación de seguimiento con otro usuario.
 */
export const dejarDeSeguirUsuario = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const { id } = req.params as unknown as IdParam
  await userService.dejarDeSeguirUsuarioService(req.user!.user_id, id)
  res.json({ message: "Has dejado de seguir al usuario con éxito" })
}

/**
 * Recupera el listado de logros e insignias desbloqueadas por el usuario.
 */
export const obtenerInsignias = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParam
  const insignias = await getUserBadgesService(id)
  res.json(insignias)
}
