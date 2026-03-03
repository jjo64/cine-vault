import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { buildDiaryResponse } from "../helpers/DiaryHelper.js"

/**
 * Crea una entrada en el diario.
 */
export const createDiary = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.user_id
    const { movie_id } = req.body
    const diary = await prisma.diary_entries.create({
      data: { movie_id, user_id: userId },
    })
    res.json(diary)
  } catch (error) {
    console.error("Error createDiary:", error)
    res.status(500).json({ error: "Error al crear la entrada" })
  }
}

/**
 * Obtiene una entrada específica del diario.
 */
export const getMyDiary = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  try {
    const diary = await buildDiaryResponse(userId)
    if (!diary)
      return res
        .status(404)
        .json({ error: "No se encontraron entradas de diario" })
    res.json({ diary })
  } catch (error) {
    console.error("Error getMyDiary:", error)
    res.status(500).json({ error: "Error al obtener el diario" })
  }
}

export const getDiaryUser = async (req: Request, res: Response) => {
  const { id_user } = req.params
  try {
    const diary = await buildDiaryResponse(Number(id_user))
    if (!diary)
      return res
        .status(404)
        .json({ error: "No se encontraron entradas de diario" })
    res.json({ diary })
  } catch (error) {
    console.error("Error getMyDiary:", error)
    res.status(500).json({ error: "Error al obtener el diario" })
  }
}

export const removeDiary = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.user_id
    const { id } = req.params
    const entry = await prisma.diary_entries.findUnique({
      where: { id: Number(id) },
    })
    if (!entry) return res.status(404).json({ error: "No encontrada" })
    if (entry.user_id !== userId)
      return res.status(403).json({ error: "Prohibido" })
    await prisma.diary_entries.delete({ where: { id: Number(id) } })
    res.json({ message: "Eliminada exitosamente" })
  } catch (error) {
    console.error("Error removeDiary:", error)
    res.status(500).json({ error: "Error al eliminar la entrada" })
  }
}
