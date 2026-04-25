/**
 * @file DiaryController.ts
 * @description Controlador para la gestión del Diario de Visionado.
 * Maneja las peticiones HTTP relacionadas con el registro cronológico de películas
 * consumidas por el usuario, permitiendo crear, consultar y eliminar entradas.
 */

import { Request, Response } from "express"
import type { DiaryIdParamsDTO, DiaryUserParamsDTO } from "../schemas/diary.js"
import * as diaryService from "../services/diary.services.js"

/**
 * Registra una nueva entrada en el diario de visionado del usuario autenticado.
 */
export const createDiary = async (req: Request, res: Response) => {
  const entry = await diaryService.crearEntradaDiarioService(
    req.user!.user_id,
    req.body
  )
  res.status(201).json(entry)
}

/**
 * Recupera el diario completo del usuario autenticado.
 */
export const getMyDiary = async (req: Request, res: Response) => {
  const diario = await diaryService.obtenerDiarioService(req.user!.user_id)
  res.json({ diary: diario })
}

/**
 * Consulta el diario público de un usuario específico identificado por su ID.
 */
export const getDiaryUser = async (req: Request, res: Response) => {
  const { id_user } = req.params as unknown as DiaryUserParamsDTO
  const diario = await diaryService.obtenerDiarioService(id_user)
  res.json({ diary: diario })
}

export const removeDiary = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as DiaryIdParamsDTO
  await diaryService.eliminarEntradaDiarioService(req.user!.user_id, id)
  res.json({ message: "La entrada del diario ha sido eliminada con éxito" })
}

/**
 * Recupera las sesiones del usuario autenticado.
 */
export const getMyDiarySessions = async (req: Request, res: Response) => {
  const sessions = await diaryService.obtenerSesionesDiarioService(
    req.user!.user_id
  )
  res.json({ sessions })
}

/**
 * Crea una sesión de visionado
 */
export const createDiarySession = async (req: Request, res: Response) => {
  const session = await diaryService.crearSesionDiarioService(
    req.user!.user_id,
    req.body
  )
  res.status(201).json(session)
}
