/**
 * @file ListsRepository.ts
 * @description Repositorio para la gestión de listas personalizadas de usuarios.
 * Permite crear, editar, eliminar y consultar listas públicas y privadas, incluyendo 
 * el conteo de ítems y metadatos de TMDB.
 */

import { prisma } from "../lib/prisma.js"

// --- Tipos y Estructuras de Datos ---

type ListEntity = {
  id: number
  user_id: number
  name: string
  description: string | null
  is_public: boolean
  created_at: Date
  updated_at: Date
}

export type ListSummary = {
  id: number
  user_id: number
  name: string
  description: string | null
  is_public: boolean
  created_at: Date
  updated_at: Date
  items_count: number
  owner?: {
    id: number
    username: string
    avatar_url: string | null
  }
}

export type ListItem = {
  movie_id: number
  tmdb_id: number | null
  added_at: Date
}

export type ListDetail = ListSummary & {
  items: ListItem[]
}

/**
 * Clase ListsRepository
 * Encapsula la persistencia para el sistema de listas de CineVault.
 */
export class ListsRepository {
  /**
   * Crea una nueva lista para un usuario.
   */
  async create(
    userId: number,
    data: { name: string; description?: string | null; is_public?: boolean }
  ) {
    return prisma.user_lists.create({
      data: {
        user_id: userId,
        name: data.name,
        description: data.description ?? null,
        is_public: data.is_public ?? false,
      },
    }) as Promise<ListEntity>
  }

  /**
   * Busca una lista específica que pertenezca al usuario indicado.
   */
  async findByIdForUser(listId: number, userId: number) {
    return prisma.user_lists.findFirst({
      where: { id: listId, user_id: userId },
    }) as Promise<ListEntity | null>
  }

  /**
   * Obtiene un resumen de todas las listas creadas por un usuario con conteo de películas.
   */
  async listByUser(userId: number): Promise<ListSummary[]> {
    const lists = await prisma.user_lists.findMany({
      where: { user_id: userId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updated_at: "desc" },
    })

    return lists.map((list) => ({
      id: list.id,
      user_id: list.user_id,
      name: list.name,
      description: list.description,
      is_public: list.is_public,
      created_at: list.created_at,
      updated_at: list.updated_at,
      items_count: list._count.items,
    }))
  }

  /**
   * Obtiene el detalle completo de una lista para su propietario, incluyendo ítems hidratados.
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

    return {
      id: list.id,
      user_id: list.user_id,
      name: list.name,
      description: list.description,
      is_public: list.is_public,
      created_at: list.created_at,
      updated_at: list.updated_at,
      items_count: list._count.items,
      items: list.items.map((item) => ({
        movie_id: item.movie_id,
        tmdb_id: item.movie_ref?.tmdb_id ?? null,
        added_at: item.added_at,
      })),
    }
  }

  /**
   * Pagina todas las listas marcadas como públicas para el descubrimiento global.
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
            },
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

    return {
      page,
      limit,
      total,
      has_more: skip + rows.length < total,
      items: rows.map((list) => ({
        id: list.id,
        user_id: list.user_id,
        name: list.name,
        description: list.description,
        is_public: list.is_public,
        created_at: list.created_at,
        updated_at: list.updated_at,
        items_count: list._count.items,
        owner: {
          id: list.users.id,
          username: list.users.username,
          avatar_url: list.users.avatar_url,
        },
      })),
    }
  }

  /**
   * Obtiene el detalle de una lista pública para cualquier espectador.
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

    return {
      id: list.id,
      user_id: list.user_id,
      name: list.name,
      description: list.description,
      is_public: list.is_public,
      created_at: list.created_at,
      updated_at: list.updated_at,
      items_count: list._count.items,
      owner: {
        id: list.users.id,
        username: list.users.username,
        avatar_url: list.users.avatar_url,
      },
      items: list.items.map((item) => ({
        movie_id: item.movie_id,
        tmdb_id: item.movie_ref?.tmdb_id ?? null,
        added_at: item.added_at,
      })),
    }
  }

  /**
   * Actualiza metadatos de la lista (nombre, privacidad, descripción).
   */
  async update(
    listId: number,
    data: { name?: string; description?: string | null; is_public?: boolean }
  ) {
    return prisma.user_lists.update({
      where: { id: listId },
      data,
    }) as Promise<ListEntity>
  }

  /**
   * Elimina una lista y de forma implícita todos sus ítems asociados.
   */
  async delete(listId: number) {
    await prisma.user_lists.delete({ where: { id: listId } })
  }

  /**
   * Añade una película individual a una lista de usuario.
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
   * Elimina una película de una lista específica.
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

export const listsRepository = new ListsRepository()
