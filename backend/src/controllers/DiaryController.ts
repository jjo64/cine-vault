import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"

/**
 * Crea una entrada en el diario.
 */
export const createDiary = async (req: Request, res: Response) => {
  const { movie_id } = req.body
  const user_id = Number(req.params.id)

  const diary = await prisma.diary_entries.create({
    data: {
      movie_id,
      user_id,
    },
  })
  res.json(diary)
}

/**
 * Obtiene una entrada específica del diario.
 */
export const getDiary = async (req: Request, res: Response) => {
  const { id } = req.params

  const diary = await prisma.diary_entries.findUnique({
    where: { id: Number(id) },
  })

  if (!diary) {
    return res.status(404).json({ error: "Entrada de diario no encontrada" })
  }

  res.json(diary)
}
