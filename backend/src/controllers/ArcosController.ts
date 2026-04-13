import { Request, Response } from "express"
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
import type {
  ArcoIdParamsDTO,
  ListArcosModeracionQueryDTO,
} from "../schemas/arcos.js"

export const getArcos = async (_req: Request, res: Response) => {
  const result = await obtenerArcosService()
  res.json(result)
}

export const getArcoById = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ArcoIdParamsDTO
  const userId = req.user?.user_id
  const result = await obtenerArcoByIdService(id, userId)
  res.json(result)
}

export const getMyArcos = async (req: Request, res: Response) => {
  const result = await obtenerMisArcosService(req.user!.user_id)
  res.json(result)
}

export const getMyArcoById = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ArcoIdParamsDTO
  const result = await obtenerMiArcoByIdService(req.user!.user_id, id)
  res.json(result)
}

export const createArcoDraft = async (req: Request, res: Response) => {
  const result = await crearArcoBorradorService(req.user!.user_id, req.body)
  res.status(201).json(result)
}

export const updateArcoDraft = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ArcoIdParamsDTO
  const result = await actualizarArcoBorradorService(
    req.user!.user_id,
    id,
    req.body
  )
  res.json(result)
}

export const submitArcoReview = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ArcoIdParamsDTO
  const result = await enviarArcoRevisionService(req.user!.user_id, id)
  res.json(result)
}

export const getArcosModeration = async (req: Request, res: Response) => {
  const { status } = req.query as unknown as ListArcosModeracionQueryDTO
  const result = await obtenerArcosModeracionService(status)
  res.json(result)
}

export const moderateArco = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ArcoIdParamsDTO
  const result = await moderarArcoService(req.user!.user_id, id, req.body)
  res.json(result)
}

export const marcarProgresoArco = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ArcoIdParamsDTO
  const result = await marcarProgresoArcoService(
    req.user!.user_id,
    id,
    req.body.movie_id
  )
  res.status(201).json(result)
}
