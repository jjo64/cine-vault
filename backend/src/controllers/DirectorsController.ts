import { Request, Response } from "express"
import { obtenerDirectorAutopsyService } from "../services/directors.services.js"

export const getDirectorAutopsy = async (req: Request, res: Response) => {
  const personId = Number(req.params.id)
  const result = await obtenerDirectorAutopsyService(personId)
  res.json(result)
}
