import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/AppErrors.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { vaultRepository } from "../repositories/VaultRepository.js"
import {
  ensureMovieRefId,
  findMovieRefIdByCandidate,
} from "./movieRef.services.js"
import type {
  AgregarVaultDTO,
  CreateVaultSocialEntryDTO,
  ListVaultSocialQueryDTO,
  UpdateVaultSocialEntryDTO,
} from "../schemas/vault.js"

export const obtenerVaultService = (userId: number) =>
  vaultRepository.buildRichResponse(userId)

export const agregarVaultService = async (
  userId: number,
  data: AgregarVaultDTO
) => {
  const movieId = await ensureMovieRefId(data.movie_id)
  const yaExiste = await vaultRepository.exists(userId, movieId)

  if (yaExiste) {
    throw new ConflictError(`La pelicula ${data.movie_id} ya esta en tu vault`)
  }

  await vaultRepository.create(userId, movieId)
}

export const eliminarVaultService = async (
  userId: number,
  movieIdCandidate: number
) => {
  const resolvedMovieId = await findMovieRefIdByCandidate(movieIdCandidate)
  if (!resolvedMovieId) return
  await vaultRepository.deleteByMovieId(userId, resolvedMovieId)
}

const parsePage = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

const mapSocialCardType = (
  entryType: "reflexion" | "edit" | "critica" | "recomendacion"
) => {
  if (entryType === "edit") return "video"
  if (entryType === "recomendacion") return "list"
  return "review"
}

export const obtenerVaultSocialService = async (
  targetUserId: number,
  viewerUserId: number | null,
  query: ListVaultSocialQueryDTO
) => {
  const page = parsePage(query.page, 1)
  const limit = Math.min(30, Math.max(1, parsePage(query.limit, 12)))
  const includePrivate = viewerUserId === targetUserId

  const { items, total } = await vaultRepository.listSocialEntries({
    userId: targetUserId,
    page,
    limit,
    includePrivate,
  })

  const tmdbPayloads = await Promise.allSettled(
    items.map((item) => {
      if (!item.tmdb_id) return Promise.resolve(null)
      return consultarTMDB(`movie/${item.tmdb_id}`).then((data) => {
        const payload = data as { title?: string; poster_path?: string }
        return {
          title: payload.title || null,
          poster_path: payload.poster_path || null,
        }
      })
    })
  )

  const mapped = items.map((item, index) => {
    const tmdbData = tmdbPayloads[index]
    const movieInfo = tmdbData.status === "fulfilled" ? tmdbData.value : null

    return {
      id: item.id,
      user_id: item.user_id,
      movie_id: item.movie_id,
      tmdb_id: item.tmdb_id,
      entry_type: item.entry_type,
      card_type: mapSocialCardType(item.entry_type),
      title: item.title,
      content: item.content,
      cover_url: item.cover_url,
      duration_label: item.duration_label,
      likes_count: item.likes_count,
      comments_count: item.comments_count,
      is_public: Boolean(item.is_public),
      created_at: item.created_at.toISOString(),
      updated_at: item.updated_at.toISOString(),
      movie_info: movieInfo,
    }
  })

  return {
    page,
    limit,
    total,
    has_more: (page - 1) * limit + mapped.length < total,
    items: mapped,
  }
}

export const crearVaultSocialEntryService = async (
  userId: number,
  data: CreateVaultSocialEntryDTO
) => {
  const movieId = data.movie_id ? await ensureMovieRefId(data.movie_id) : null
  const id = await vaultRepository.createSocialEntry({
    userId,
    movieId,
    entryType: data.entry_type,
    title: data.title.trim(),
    content: data.content.trim(),
    coverUrl: data.cover_url?.trim() || null,
    durationLabel: data.duration_label?.trim() || null,
    isPublic: Boolean(data.is_public),
  })

  if (!id) throw new ValidationError("No se pudo crear la entrada del vault")

  const created = await vaultRepository.getSocialEntryByIdForOwner(id, userId)
  if (!created) throw new NotFoundError("Entrada de vault no encontrada")

  return {
    id: created.id,
    entry_type: created.entry_type,
    title: created.title,
    content: created.content,
    movie_id: created.movie_id,
    tmdb_id: created.tmdb_id,
    card_type: mapSocialCardType(created.entry_type),
    is_public: Boolean(created.is_public),
    created_at: created.created_at.toISOString(),
  }
}

export const actualizarVaultSocialEntryService = async (
  userId: number,
  entryId: number,
  data: UpdateVaultSocialEntryDTO
) => {
  const current = await vaultRepository.getSocialEntryByIdForOwner(
    entryId,
    userId
  )
  if (!current) throw new NotFoundError("Entrada de vault no encontrada")

  const movieId = data.movie_id ? await ensureMovieRefId(data.movie_id) : null

  await vaultRepository.updateSocialEntry({
    id: entryId,
    userId,
    movieId,
    entryType: data.entry_type ?? null,
    title: data.title?.trim() ?? null,
    content: data.content?.trim() ?? null,
    coverUrl: data.cover_url?.trim() ?? null,
    durationLabel: data.duration_label?.trim() ?? null,
    isPublic: data.is_public ?? null,
  })

  const updated = await vaultRepository.getSocialEntryByIdForOwner(
    entryId,
    userId
  )
  if (!updated) throw new NotFoundError("Entrada de vault no encontrada")

  return {
    id: updated.id,
    entry_type: updated.entry_type,
    title: updated.title,
    content: updated.content,
    movie_id: updated.movie_id,
    tmdb_id: updated.tmdb_id,
    card_type: mapSocialCardType(updated.entry_type),
    is_public: Boolean(updated.is_public),
    updated_at: updated.updated_at.toISOString(),
  }
}

export const eliminarVaultSocialEntryService = async (
  userId: number,
  entryId: number
) => {
  const current = await vaultRepository.getSocialEntryByIdForOwner(
    entryId,
    userId
  )
  if (!current) throw new NotFoundError("Entrada de vault no encontrada")
  await vaultRepository.deleteSocialEntry(entryId, userId)
}
