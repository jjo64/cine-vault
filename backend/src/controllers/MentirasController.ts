/**
 * @file MentirasController.ts
 * @description Controlador para la sección lúdica de rankings estáticos (CineVault Mentiras).
 */

import { Request, Response } from "express"
import { obtenerRankingMentirasService } from "../services/mentiras.services.js"

/**
 * Obtiene el ranking de películas para la sección "Mentiras".
 */
export const getMentirasRanking = async (_req: Request, res: Response) => {
  const result = await obtenerRankingMentirasService()
  res.json(result)
}
