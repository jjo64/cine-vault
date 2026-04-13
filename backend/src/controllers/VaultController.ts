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
import type {
  EliminarVaultParamsDTO,
  ListVaultSocialQueryDTO,
} from "../schemas/vault.js"
import type { z } from "zod"
import type {
  vaultSocialUserParamsSchema,
  vaultSocialEntryIdParamsSchema,
} from "../schemas/vault.js"

type VaultSocialUserParams = z.infer<typeof vaultSocialUserParamsSchema>
type VaultSocialEntryIdParams = z.infer<typeof vaultSocialEntryIdParamsSchema>

export const getMyVault = async (req: Request, res: Response) => {
  const result = await obtenerVaultService(req.user!.user_id)
  res.json(result)
}

export const getVaultByUser = async (req: Request, res: Response) => {
  const { id_user } = req.params as unknown as VaultSocialUserParams
  const result = await obtenerVaultService(id_user)
  res.json(result)
}

export const addMovieToVault = async (req: Request, res: Response) => {
  await agregarVaultService(req.user!.user_id, req.body)
  res.status(201).json({
    message: `Pelicula ${req.body.movie_id} agregada al vault`,
  })
}

export const removeMovieFromVault = async (req: Request, res: Response) => {
  const { movie_id } = req.params as unknown as EliminarVaultParamsDTO
  await eliminarVaultService(req.user!.user_id, movie_id)
  res.json({ message: "Pelicula eliminada del vault" })
}

export const getVaultSocialByUser = async (req: Request, res: Response) => {
  const { id_user } = req.params as unknown as VaultSocialUserParams
  const viewerUserId = req.user?.user_id ?? null
  const payload = await obtenerVaultSocialService(
    id_user,
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
  const payload = await crearVaultSocialEntryService(
    req.user!.user_id,
    req.body
  )
  res.status(201).json(payload)
}

export const updateVaultSocialEntry = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as VaultSocialEntryIdParams
  const payload = await actualizarVaultSocialEntryService(
    req.user!.user_id,
    id,
    req.body
  )
  res.json(payload)
}

export const deleteVaultSocialEntry = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as VaultSocialEntryIdParams
  await eliminarVaultSocialEntryService(req.user!.user_id, id)
  res.json({ message: "Entrada social eliminada del vault" })
}
