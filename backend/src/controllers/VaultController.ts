import { Request, Response } from "express"
import {
  actualizarVaultSocialEntryService,
  agregarVaultService,
  crearVaultSocialEntryService,
  eliminarVaultSocialEntryService,
  eliminarVaultService,
  obtenerVaultSocialService,
  obtenerVaultService,
} from "../services/vault.services.js"
import { ListVaultSocialQueryDTO } from "../schemas/vault.js"

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

export const getVaultSocialByUser = async (req: Request, res: Response) => {
  const viewerUserId = req.user?.user_id ?? null
  const payload = await obtenerVaultSocialService(
    Number(req.params.id_user),
    viewerUserId,
    req.query as unknown as ListVaultSocialQueryDTO
  )
  res.json(payload)
}

export const getMyVaultSocial = async (req: Request, res: Response) => {
  const payload = await obtenerVaultSocialService(
    req.user!.user_id,
    req.user!.user_id,
    req.query as unknown as ListVaultSocialQueryDTO
  )
  res.json(payload)
}

export const createVaultSocialEntry = async (req: Request, res: Response) => {
  const payload = await crearVaultSocialEntryService(req.user!.user_id, req.body)
  res.status(201).json(payload)
}

export const updateVaultSocialEntry = async (req: Request, res: Response) => {
  const payload = await actualizarVaultSocialEntryService(
    req.user!.user_id,
    Number(req.params.id),
    req.body
  )
  res.json(payload)
}

export const deleteVaultSocialEntry = async (req: Request, res: Response) => {
  await eliminarVaultSocialEntryService(req.user!.user_id, Number(req.params.id))
  res.json({ message: "Entrada social eliminada del vault" })
}
