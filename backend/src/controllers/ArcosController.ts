/**
 * @file ArcosController.ts
 * @description Controlador para la gestión de Arcos Cinematográficos (retos y colecciones curadas).
 * Maneja las peticiones HTTP para la visualización, creación, moderación y seguimiento 
 * del progreso de los arcos por parte de los usuarios.
 */

import { Request, Response } from "express"
import type {
  ArcoIdParamsDTO,
  ListArcosModeracionQueryDTO,
} from "../schemas/arcos.js"
import {
  actualizarArcoBorradorService,
  crearArcoBorradorService,
  enviarArcoRevisionService,
  marcarProgresoArcoService,
  moderarArcoService,
  obtenerArcosModeracionService,
  obtenerArcoByIdService,
  obtenerArcosService,
  obtenerMiArcoByIdService,
  obtenerMisArcosService,
} from "../services/arcos.services.js"

/**
 * Obtiene el catálogo público de arcos cinematográficos activos.
 */
export const getArcos = async (_req: Request, res: Response) => {
  const result = await obtenerArcosService()
  res.json(result)
}

/**
 * Recupera el detalle completo de un arco específico por su identificador.
 */
export const getArcoById = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ArcoIdParamsDTO
  const userId = req.user?.user_id
  const result = await obtenerArcoByIdService(id, userId)
  res.json(result)
}

/**
 * Lista los arcos creados por el usuario autenticado.
 */
export const getMyArcos = async (req: Request, res: Response) => {
  const result = await obtenerMisArcosService(req.user!.user_id)
  res.json(result)
}

/**
 * Obtiene el detalle de un arco propio, incluyendo estados de borrador o revisión.
 */
export const getMyArcoById = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ArcoIdParamsDTO
  const result = await obtenerMiArcoByIdService(req.user!.user_id, id)
  res.json(result)
}

/**
 * Crea un nuevo arco en estado de borrador.
 */
export const createArcoDraft = async (req: Request, res: Response) => {
  const result = await crearArcoBorradorService(req.user!.user_id, req.body)
  res.status(201).json(result)
}

/**
 * Actualiza el contenido de un arco en estado de borrador.
 */
export const updateArcoDraft = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ArcoIdParamsDTO
  const result = await actualizarArcoBorradorService(
    req.user!.user_id,
    id,
    req.body
  )
  res.json(result)
}

/**
 * Solicita el paso a revisión pública de un arco en borrador.
 */
export const submitArcoReview = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ArcoIdParamsDTO
  const result = await enviarArcoRevisionService(req.user!.user_id, id)
  res.json(result)
}

/**
 * Obtiene el listado de arcos pendientes de moderación (Uso Administrativo).
 */
export const getArcosModeration = async (req: Request, res: Response) => {
  const { status } = req.query as unknown as ListArcosModeracionQueryDTO
  const result = await obtenerArcosModeracionService(status)
  res.json(result)
}

/**
 * Resuelve la moderación de un arco (Aprobar/Rechazar).
 */
export const moderateArco = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ArcoIdParamsDTO
  const result = await moderarArcoService(req.user!.user_id, id, req.body)
  res.json(result)
}

/**
 * Registra el progreso de un usuario en un hito específico del arco.
 */
export const marcarProgresoArco = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ArcoIdParamsDTO
  const result = await marcarProgresoArcoService(
    req.user!.user_id,
    id,
    req.body.movie_id
  )
  res.status(201).json(result)
}
