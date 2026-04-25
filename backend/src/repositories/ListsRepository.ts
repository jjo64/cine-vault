/**
 * @file ListsRepository.ts
 * @description Capa de persistencia para el sistema de Listas Personalizadas.
 * Gestiona la creación, edición y descubrimiento de colecciones de películas creadas
 * por los usuarios. Implementa lógica de visibilidad granular (pública/privada) y
 * proporciona vistas resumidas y detalladas con hidratación de metadatos técnicos.
 */

import { prisma } from "../lib/prisma.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"

// --- Tipado de la Capa de Datos ---

/** Representación de la entidad de lista en base de datos */
type ListEntity = {
  id: number
  user_id: number
  name: string
  description: string | null
  /** Indica si la lista es visible para la comunidad en las secciones de descubrimiento */
  is_public: boolean
  is_official: boolean
  is_premium: boolean
  tags: any | null
  glow_color: string | null
  custom_cover: string | null
  created_at: Date
  updated_at: Date
}

/** Resumen de lista para visualización en cuadrículas o perfiles */
export type ListSummary = {
  id: number
  user_id: number
  name: string
  description: string | null
  is_public: boolean
  is_official: boolean
  is_premium: boolean
  tags: string[] | null
  glow_color: string | null
  custom_cover: string | null
  created_at: Date
  updated_at: Date
  /** Cantidad de obras contenidas en la lista */
  items_count: number
  /** URLs o paths de los posters de las primeras películas para el collage */
  posters: (string | null)[]
  owner?: {
    id: number
    username: string
    avatar_url: string | null
    is_verified?: boolean
  }
}

/** Representación de una película dentro de una lista */
export type ListItem = {
  movie_id: number
  /** Identificador externo para fetching de arte y sinopsis */
  tmdb_id: number | null
  added_at: Date
}

/** Vista detallada de una lista con todos sus componentes hidratados */
export type ListDetail = ListSummary & {
  items: ListItem[]
}

/**
 * Repositorio de Listas
 * Orquestador de la persistencia para el sistema de curaduría de usuarios.
 */
export class ListsRepository {
  /**
   * Inicializa una nueva colección personal para el usuario.
   */
  async create(
    userId: number,
    data: {
      name: string
      description?: string | null
      is_public?: boolean
      is_official?: boolean
      is_premium?: boolean
      tags?: string[]
      glow_color?: string
      custom_cover?: string
    }
  ) {
    return prisma.user_lists.create({
      data: {
        user_id: userId,
        name: data.name,
        description: data.description ?? null,
        is_public: data.is_public ?? false,
        is_official: data.is_official ?? false,
        is_premium: data.is_premium ?? false,
        tags: data.tags ?? [],
        glow_color: data.glow_color ?? null,
        custom_cover: data.custom_cover ?? null,
      },
    }) as Promise<ListEntity>
  }

  /**
   * Localiza una lista verificando la propiedad del recurso.
   * Utilizado para operaciones de edición y eliminación.
   */
  async findByIdForUser(listId: number, userId: number) {
    return prisma.user_lists.findFirst({
      where: { id: listId, user_id: userId },
    }) as Promise<ListEntity | null>
  }

  /**
   * Recupera el catálogo de listas creadas por un usuario específico.
   * Incluye el conteo de elementos para previsualización.
   *
   * @param userId - ID del propietario de las listas.
   */
  async listByUser(userId: number): Promise<ListSummary[]> {
    const lists = await prisma.user_lists.findMany({
      where: { user_id: userId },
      include: {
        items: {
          take: 4,
          include: { movie_ref: { select: { tmdb_id: true } } },
          orderBy: { added_at: "desc" },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updated_at: "desc" },
    })

    const mappedLists: ListSummary[] = lists.map((list) => ({
      id: list.id,
      user_id: list.user_id,
      name: list.name,
      description: list.description,
      is_public: list.is_public,
      is_official: list.is_official,
      is_premium: list.is_premium,
      tags: list.tags as string[] | null,
      glow_color: list.glow_color,
      custom_cover: list.custom_cover,
      created_at: list.created_at,
      updated_at: list.updated_at,
      items_count: list._count.items,
      posters: [],
    }))

    // Hydrate posters
    const allTmdbIds = new Set<number>()
    lists.forEach((l) =>
      l.items.forEach((i) => {
        if (i.movie_ref?.tmdb_id) allTmdbIds.add(i.movie_ref.tmdb_id)
      })
    )

    const posterMap = new Map<number, string | null>()
    await Promise.allSettled(
      Array.from(allTmdbIds).map(async (id) => {
        try {
          const data = await consultarTMDB<{ poster_path: string | null }>(
            `movie/${id}`
          )
          posterMap.set(id, data.poster_path)
        } catch (e) {
          posterMap.set(id, null)
        }
      })
    )

    return mappedLists.map((l, idx) => ({
      ...l,
      posters: lists[idx].items.map((i) =>
        i.movie_ref?.tmdb_id ? posterMap.get(i.movie_ref.tmdb_id) || null : null
      ),
    }))
  }

  /**
   * Obtiene la ficha completa de una lista privada de usuario.
   * Hidrata los elementos con IDs de TMDB para su renderizado en el cliente.
   */
  async getDetailForUser(
    listId: number,
    userId: number
  ): Promise<ListDetail | null> {
    const list = await prisma.user_lists.findFirst({
      where: { id: listId, user_id: userId },
      include: {
        items: {
          include: {
            movie_ref: {
              select: { tmdb_id: true },
            },
          },
          orderBy: { added_at: "desc" },
        },
        _count: {
          select: { items: true },
        },
      },
    })

    if (!list) return null

    // Hydrate posters
    const posters = await Promise.all(
      list.items.slice(0, 4).map(async (item) => {
        if (!item.movie_ref?.tmdb_id) return null
        try {
          const data = await consultarTMDB<{ poster_path: string | null }>(
            `movie/${item.movie_ref.tmdb_id}`
          )
          return data.poster_path
        } catch {
          return null
        }
      })
    )

    return {
      id: list.id,
      user_id: list.user_id,
      name: list.name,
      description: list.description,
      is_public: list.is_public,
      is_official: list.is_official,
      is_premium: list.is_premium,
      tags: list.tags as string[] | null,
      glow_color: list.glow_color,
      custom_cover: list.custom_cover,
      created_at: list.created_at,
      updated_at: list.updated_at,
      items_count: list._count.items,
      posters,
      items: list.items.map((item) => ({
        movie_id: item.movie_id,
        tmdb_id: item.movie_ref?.tmdb_id ?? null,
        added_at: item.added_at,
      })),
    }
  }

  /**
   * Recupera el flujo global de listas marcadas como públicas.
   * Implementa paginación para el soporte de la vista "Descubrir Listas".
   */
  async listPublic(page: number, limit: number) {
    const skip = (page - 1) * limit

    const [rows, total] = await Promise.all([
      prisma.user_lists.findMany({
        where: { is_public: true },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              is_verified: true,
            },
          },
          items: {
            take: 4,
            include: { movie_ref: { select: { tmdb_id: true } } },
            orderBy: { added_at: "desc" },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { updated_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.user_lists.count({ where: { is_public: true } }),
    ])

    const mappedItems: ListSummary[] = rows.map((list) => ({
      id: list.id,
      user_id: list.user_id,
      name: list.name,
      description: list.description,
      is_public: list.is_public,
      is_official: list.is_official,
      is_premium: list.is_premium,
      tags: list.tags as string[] | null,
      glow_color: list.glow_color,
      custom_cover: list.custom_cover,
      created_at: list.created_at,
      updated_at: list.updated_at,
      items_count: list._count.items,
      posters: [], // Hydrated below
      owner: {
        id: list.users.id,
        username: list.users.username,
        avatar_url: list.users.avatar_url,
        is_verified: list.users.is_verified,
      },
    }))

    // Hydrate posters for public lists
    const allTmdbIds = new Set<number>()
    rows.forEach((l) =>
      l.items.forEach((i) => {
        if (i.movie_ref?.tmdb_id) allTmdbIds.add(i.movie_ref.tmdb_id)
      })
    )

    const posterMap = new Map<number, string | null>()
    await Promise.allSettled(
      Array.from(allTmdbIds).map(async (id) => {
        try {
          const data = await consultarTMDB<{ poster_path: string | null }>(
            `movie/${id}`
          )
          posterMap.set(id, data.poster_path)
        } catch (e) {
          posterMap.set(id, null)
        }
      })
    )

    return {
      page,
      limit,
      total,
      has_more: skip + rows.length < total,
      items: mappedItems.map((l, idx) => ({
        ...l,
        posters: rows[idx].items.map((i) =>
          i.movie_ref?.tmdb_id
            ? posterMap.get(i.movie_ref.tmdb_id) || null
            : null
        ),
      })),
    }
  }

  /**
   * Obtiene la vista pública de una lista para cualquier visitante.
   * Filtra estrictamente por el flag 'is_public'.
   */
  async getPublicDetail(listId: number): Promise<ListDetail | null> {
    const list = await prisma.user_lists.findFirst({
      where: { id: listId, is_public: true },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            is_verified: true,
          },
        },
        items: {
          include: {
            movie_ref: {
              select: { tmdb_id: true },
            },
          },
          orderBy: { added_at: "desc" },
        },
        _count: {
          select: { items: true },
        },
      },
    })

    if (!list) return null

    // Hydrate posters
    const posters = await Promise.all(
      list.items.slice(0, 4).map(async (item) => {
        if (!item.movie_ref?.tmdb_id) return null
        try {
          const data = await consultarTMDB<{ poster_path: string | null }>(
            `movie/${item.movie_ref.tmdb_id}`
          )
          return data.poster_path
        } catch {
          return null
        }
      })
    )

    return {
      id: list.id,
      user_id: list.user_id,
      name: list.name,
      description: list.description,
      is_public: list.is_public,
      is_official: list.is_official,
      is_premium: list.is_premium,
      tags: list.tags as string[] | null,
      glow_color: list.glow_color,
      custom_cover: list.custom_cover,
      created_at: list.created_at,
      updated_at: list.updated_at,
      items_count: list._count.items,
      posters,
      owner: {
        id: list.users.id,
        username: list.users.username,
        avatar_url: list.users.avatar_url,
        is_verified: list.users.is_verified,
      },
      items: list.items.map((item) => ({
        movie_id: item.movie_id,
        tmdb_id: item.movie_ref?.tmdb_id ?? null,
        added_at: item.added_at,
      })),
    }
  }

  /**
   * Actualiza el perfil de una lista.
   */
  async update(
    listId: number,
    data: {
      name?: string
      description?: string | null
      is_public?: boolean
      is_official?: boolean
      is_premium?: boolean
      tags?: string[]
      glow_color?: string
      custom_cover?: string
    }
  ) {
    return prisma.user_lists.update({
      where: { id: listId },
      data,
    }) as Promise<ListEntity>
  }

  /**
   * Elimina una lista y propaga la eliminación de sus vínculos internos.
   */
  async delete(listId: number) {
    await prisma.user_lists.delete({ where: { id: listId } })
  }

  /**
   * Vincula una película a una lista de usuario.
   */
  async addMovie(listId: number, movieRefId: number) {
    return prisma.user_list_items.create({
      data: {
        list_id: listId,
        movie_id: movieRefId,
      },
    })
  }

  /**
   * Disocia una película de la colección seleccionada.
   */
  async removeMovie(listId: number, movieRefId: number) {
    await prisma.user_list_items.deleteMany({
      where: {
        list_id: listId,
        movie_id: movieRefId,
      },
    })
  }
}

/** Instancia exportada del repositorio de listas */
export const listsRepository = new ListsRepository()
