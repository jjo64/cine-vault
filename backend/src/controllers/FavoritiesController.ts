import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const favorites = await prisma.favorites.findUnique({
      where: { id: Number(id) },
    })

    if (!favorites) {
      return res.status(404).json({ error: "Favorites no encontrados" })
    }

    return res.json(favorites)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Error al obtener los favoritos" })
  }
}

export const addMovieToFavorites = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const favorites = await prisma.favorites.create({
      data: { id: Number(id) },
    })

    if (!favorites) {
      return res.status(404).json({ error: "Favorites no encontrados" })
    }

    return res.json(favorites)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Error al obtener los favoritos" })
  }
}

export const removeMovieFromFavorites = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const favorites = await prisma.favorites.delete({
      where: { id: Number(id) },
    })

    if (!favorites) {
      return res.status(404).json({ error: "Favorites no encontrados" })
    }

    return res.json(favorites)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Error al obtener los favoritos" })
  }
}
