/**
 * @file VaultController.ts
 * @description Controlador para la gestión del "Vault" (Bóveda) personal de los usuarios.
 * Permite organizar colecciones de películas y gestionar entradas sociales
 * detalladas sobre la experiencia cinematográfica del usuario.
 */

import { Request, Response } from "express"
import type { z } from "zod"
import {
  actualizarVaultSocialEntryService,
  agregarVaultService,
  crearVaultSocialEntryService,
  eliminarVaultSocialEntryService,
  eliminarVaultService,
  obtenerVaultSocialService,
  obtenerVaultService,
  obtenerVaultSocialEntryPorIdService,
} from "../services/vault.services.js"
import type {
  EliminarVaultParamsDTO,
  ListVaultSocialQueryDTO,
  vaultSocialEntryIdParamsSchema,
  vaultSocialUserParamsSchema,
} from "../schemas/vault.js"

type VaultSocialUserParams = z.infer<typeof vaultSocialUserParamsSchema>
type VaultSocialEntryIdParams = z.infer<typeof vaultSocialEntryIdParamsSchema>

/**
 * Recupera el Vault del usuario actualmente autenticado.
 */
export const getMyVault = async (req: Request, res: Response) => {
  const result = await obtenerVaultService(req.user!.user_id)
  res.json(result)
}

/**
 * Obtiene el Vault público de un usuario específico identificado por su ID.
 */
export const getVaultByUser = async (req: Request, res: Response) => {
  const { id_user } = req.params as unknown as VaultSocialUserParams
  const result = await obtenerVaultService(id_user)
  res.json(result)
}

/**
 * Añade una película a la colección personal del Vault.
 */
export const addMovieToVault = async (req: Request, res: Response) => {
  await agregarVaultService(req.user!.user_id, req.body)
  res.status(201).json({
    message: `Película ${req.body.movie_id} añadida correctamente al Vault`,
  })
}

/**
 * Elimina una película específica de la colección del Vault.
 */
export const removeMovieFromVault = async (req: Request, res: Response) => {
  const { movie_id } = req.params as unknown as EliminarVaultParamsDTO
  await eliminarVaultService(req.user!.user_id, movie_id)
  res.json({ message: "La película ha sido eliminada del Vault" })
}

/**
 * Recupera el feed social del Vault de un usuario por su ID.
 */
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

/**
 * Obtiene el feed social del Vault propio del usuario autenticado.
 */
export const getMyVaultSocial = async (req: Request, res: Response) => {
  const payload = await obtenerVaultSocialService(
    req.user!.user_id,
    req.user!.user_id,
    req.query as unknown as ListVaultSocialQueryDTO
  )
  res.json(payload)
}

/**
 * Crea una nueva entrada social (comentario/estado) en el Vault.
 */
export const createVaultSocialEntry = async (req: Request, res: Response) => {
  const payload = await crearVaultSocialEntryService(
    req.user!.user_id,
    req.body
  )
  res.status(201).json(payload)
}

/**
 * Actualiza el contenido de una entrada social existente en el Vault.
 */
export const updateVaultSocialEntry = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as VaultSocialEntryIdParams
  const payload = await actualizarVaultSocialEntryService(
    req.user!.user_id,
    id,
    req.body
  )
  res.json(payload)
}

/**
 * Elimina una entrada social específica del sistema.
 */
export const deleteVaultSocialEntry = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as VaultSocialEntryIdParams
  await eliminarVaultSocialEntryService(req.user!.user_id, id)
  res.json({ message: "La entrada social ha sido eliminada con éxito" })
}

/**
 * Recupera una publicación específica del Vault.
 */
export const getVaultSocialEntryById = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as VaultSocialEntryIdParams
  const viewerUserId = req.user?.user_id ?? null
  const entry = await obtenerVaultSocialEntryPorIdService(id, viewerUserId)
  res.json(entry)
}
