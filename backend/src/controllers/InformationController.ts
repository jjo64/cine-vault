/**
 * @file InformationController.ts
 * @description Controlador para la obtención de metadatos biográficos y
 * filmografías directas desde servicios externos.
 */

import { Request, Response } from "express"
import {
  obtenerCreditosCombinadosPersonaService,
  obtenerPersonaService,
} from "../services/directors.services.js"

/**
 * Obtiene la información biográfica detallada de una persona.
 */
export const personInformation = async (req: Request, res: Response) => {
  const personId = Number(req.params.id)
  const datos = await obtenerPersonaService(personId)
  res.status(200).json(datos)
}

/**
 * Recupera la filmografía completa (créditos combinados) de una persona.
 */
export const personInformationCombined = async (
  req: Request,
  res: Response
) => {
  const personId = Number(req.params.id)
  const datos = await obtenerCreditosCombinadosPersonaService(personId)
  res.status(200).json(datos)
}
