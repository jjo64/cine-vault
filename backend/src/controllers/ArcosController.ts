import { Request, Response } from "express"
import {
  marcarProgresoArcoService,
  obtenerArcoByIdService,
  obtenerArcosService,
} from "../services/arcos.services.js"

export const getArcos = async (_req: Request, res: Response) => {
  const result = await obtenerArcosService()
  res.json(result)
}

export const getArcoById = async (req: Request, res: Response) => {
  const userId = req.user?.user_id
  const result = await obtenerArcoByIdService(Number(req.params.id), userId)
  res.json(result)
}

export const marcarProgresoArco = async (req: Request, res: Response) => {
  const result = await marcarProgresoArcoService(
    req.user!.user_id,
    Number(req.params.id),
    req.body.movie_id
  )
  res.status(201).json(result)
}
