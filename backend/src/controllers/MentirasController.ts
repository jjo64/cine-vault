import { Request, Response } from "express"
import { obtenerRankingMentirasService } from "../services/mentiras.services.js"

export const getMentirasRanking = async (_req: Request, res: Response) => {
  const result = await obtenerRankingMentirasService()
  res.json(result)
}
