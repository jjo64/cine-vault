import { Request, Response } from "express"
import {
  agregarVaultService,
  eliminarVaultService,
  obtenerVaultService,
} from "../services/vault.services.js"

export const getMyVault = async (req: Request, res: Response) => {
  const result = await obtenerVaultService(req.user!.user_id)
  res.json(result)
}

export const getVaultByUser = async (req: Request, res: Response) => {
  const result = await obtenerVaultService(Number(req.params.id_user))
  res.json(result)
}

export const addMovieToVault = async (req: Request, res: Response) => {
  await agregarVaultService(req.user!.user_id, req.body)
  res.status(201).json({
    message: `Pelicula ${req.body.movie_id} agregada al vault`,
  })
}

export const removeMovieFromVault = async (req: Request, res: Response) => {
  await eliminarVaultService(req.user!.user_id, Number(req.params.movie_id))
  res.json({ message: "Pelicula eliminada del vault" })
}
