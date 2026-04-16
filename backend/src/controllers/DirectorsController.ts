/**
 * @file DirectorsController.ts
 * @description Controlador para la gestión de información de directores y personalidades del cine.
 */

import { Request, Response } from "express"
import { obtenerDirectorAutopsyService } from "../services/directors.services.js"

/**
 * Obtiene un análisis detallado (autopsia) de la carrera de un director.
 */
export const getDirectorAutopsy = async (req: Request, res: Response) => {
  const personId = Number(req.params.id)
  const result = await obtenerDirectorAutopsyService(personId)
  res.json(result)
}
