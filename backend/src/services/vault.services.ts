import { ConflictError } from "../errors/AppErrors.js"
import { vaultRepository } from "../repositories/VaultRepository.js"
import { ensureMovieRefId, findMovieRefIdByCandidate } from "./movieRef.services.js"
import type { AgregarVaultDTO } from "../schemas/vault.js"

export const obtenerVaultService = (userId: number) =>
  vaultRepository.buildRichResponse(userId)

export const agregarVaultService = async (userId: number, data: AgregarVaultDTO) => {
  const movieId = await ensureMovieRefId(data.movie_id)
  const yaExiste = await vaultRepository.exists(userId, movieId)

  if (yaExiste) {
    throw new ConflictError(`La pelicula ${data.movie_id} ya esta en tu vault`)
  }

  await vaultRepository.create(userId, movieId)
}

export const eliminarVaultService = async (userId: number, movieIdCandidate: number) => {
  const resolvedMovieId = await findMovieRefIdByCandidate(movieIdCandidate)
  if (!resolvedMovieId) return
  await vaultRepository.deleteByMovieId(userId, resolvedMovieId)
}
