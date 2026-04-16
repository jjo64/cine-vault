/**
 * @file userProfileRepository.ts
 * @description Repositorio central para la gestión de perfiles públicos, relaciones 
 * de seguimiento (social graph) y colecciones destacadas de los usuarios. 
 * Implementa consultas optimizadas para la exposición de perfiles en la red social.
 */

import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

// --- Tipos de Datos Locales ---

/**
 * Datos necesarios para actualizar campos básicos del perfil.
 */
type ActualizarPerfilData = {
  username?: string
  avatar_url?: string
  bio?: string
}

/**
 * Registro genérico para resultados de consultas SQL Raw.
 */
type RawRow = Record<string, string | number | null>

/**
 * Perfil público completo con agregaciones de actividad social.
 */
type UserPublicProfile = {
  id: number
  username: string
  avatar_url: string | null
  bio: string | null
  created_at: Date
  _count: {
    reviews: number
    diary_entries: number
    watchlist: number
    follows_follows_follower_idTousers: number // Seguidores
    follows_follows_following_idTousers: number // Seguidos
  }
}

/**
 * Resumen de usuario para listados de administración o Directorio.
 */
type UserSummary = {
  id: number
  username: string
  email: string
  role: string
  avatar_url: string | null
}

/**
 * Resultado individual de búsqueda de usuarios.
 */
type UserSearchResult = {
  id: number
  username: string
  avatar_url: string | null
  bio: string | null
  _count: { reviews: number }
}

/**
 * Tipos auxiliares para la resolución de relaciones de seguimiento con Prisma.
 */
type FollowsWithFollower = Awaited<
  ReturnType<typeof prisma.users.findUnique>
> & {
  follows_follows_following_idTousers: Array<{
    users_follows_follower_idTousers: {
      id: number
      username: string
      avatar_url: string | null
    } | null
  }>
}

type FollowsWithFollowing = Awaited<
  ReturnType<typeof prisma.users.findUnique>
> & {
  follows_follows_follower_idTousers: Array<{
    users_follows_following_idTousers: {
      id: number
      username: string
      avatar_url: string | null
    } | null
  }>
}

/**
 * Interfaz IUserProfileRepository
 * Define las capacidades de consulta y mutación social de perfiles.
 */
export interface IUserProfileRepository {
  findById(id: number): Promise<UserPublicProfile | null>
  findByUsername(username: string): Promise<UserPublicProfile | null>
  findAll(): Promise<UserSummary[]>
  search(query: string, take: number): Promise<UserSearchResult[]>
  update(id: number, data: ActualizarPerfilData): Promise<void>
  createFollow(followerId: number, followingId: number): Promise<void>
  deleteFollow(
    followerId: number,
    followingId: number
  ): Promise<{ count: number }>
  findFollow(
    viewerId: number,
    targetId: number
  ): Promise<{ follower_id: number } | null>
  findFollowers(id: number): Promise<FollowsWithFollower | null>
  findFollowing(id: number): Promise<FollowsWithFollowing | null>
  findCinematographicSignature(id: number): Promise<RawRow[]>
  findCuratedGallery(id: number): Promise<RawRow[]>
}

/**
 * Clase UserProfileRepository
 * Implementa la lógica de acceso a datos para la capa social de CineVault.
 */
export class UserProfileRepository implements IUserProfileRepository {
  /**
   * Recupera el perfil público de un usuario por ID, incluyendo conteos de actividad.
   */
  async findById(id: number) {
    return prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatar_url: true,
        bio: true,
        created_at: true,
        _count: {
          select: {
            reviews: true,
            diary_entries: true,
            watchlist: true,
            follows_follows_follower_idTousers: true,
            follows_follows_following_idTousers: true,
          },
        },
      },
    }) as Promise<UserPublicProfile | null>
  }

  /**
   * Recupera el perfil público por nombre de usuario (slug).
   */
  async findByUsername(username: string) {
    return prisma.users.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatar_url: true,
        bio: true,
        created_at: true,
        _count: {
          select: {
            reviews: true,
            diary_entries: true,
            watchlist: true,
            follows_follows_follower_idTousers: true,
            follows_follows_following_idTousers: true,
          },
        },
      },
    }) as Promise<UserPublicProfile | null>
  }

  /**
   * Lista todos los usuarios con información básica de contacto.
   */
  async findAll() {
    return prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
      },
    }) as Promise<UserSummary[]>
  }

  /**
   * Ejecuta una búsqueda de usuarios por nombre o biografía.
   */
  async search(query: string, take: number) {
    return prisma.users.findMany({
      where: {
        OR: [{ username: { contains: query } }, { bio: { contains: query } }],
      },
      select: {
        id: true,
        username: true,
        avatar_url: true,
        bio: true,
        _count: { select: { reviews: true } },
      },
      orderBy: [{ username: "asc" }],
      take,
    }) as Promise<UserSearchResult[]>
  }

  /**
   * Actualiza el contenido del perfil (username, avatar, etc).
   */
  async update(id: number, data: ActualizarPerfilData) {
    await prisma.users.update({ where: { id }, data })
  }

  /**
   * Registra una nueva relación de seguimiento entre dos usuarios.
   */
  async createFollow(followerId: number, followingId: number) {
    await prisma.follows.create({
      data: { follower_id: followerId, following_id: followingId },
    })
  }

  /**
   * Elimina una relación de seguimiento (unfollow).
   */
  async deleteFollow(followerId: number, followingId: number) {
    return prisma.follows.deleteMany({
      where: { follower_id: followerId, following_id: followingId },
    })
  }

  /**
   * Verifica si existe una relación de seguimiento activa para el visor actual.
   */
  async findFollow(viewerId: number, targetId: number) {
    return prisma.follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: viewerId,
          following_id: targetId,
        },
      },
      select: { follower_id: true },
    })
  }

  /**
   * Obtiene la lista de seguidores de un usuario.
   */
  async findFollowers(id: number) {
    return prisma.users.findUnique({
      where: { id },
      include: {
        follows_follows_following_idTousers: {
          include: {
            users_follows_follower_idTousers: {
              select: { id: true, username: true, avatar_url: true },
            },
          },
        },
      },
    })
  }

  /**
   * Obtiene la lista de usuarios seguidos por el usuario indicado.
   */
  async findFollowing(id: number) {
    return prisma.users.findUnique({
      where: { id },
      include: {
        follows_follows_follower_idTousers: {
          include: {
            users_follows_following_idTousers: {
              select: { id: true, username: true, avatar_url: true },
            },
          },
        },
      },
    })
  }

  /**
   * Consulta SQL Raw para obtener la firma cinematográfica del usuario.
   */
  async findCinematographicSignature(id: number): Promise<RawRow[]> {
    return prisma.$queryRaw<RawRow[]>(Prisma.sql`
      SELECT
        user_id, pivotal_film, pivotal_film_detail,
        formative_director, formative_director_detail,
        unforgettable_scene, unforgettable_scene_detail,
        cinema_turning_year, cinema_turning_year_detail
      FROM cinematographic_signature
      WHERE user_id = ${id}
      LIMIT 1
    `)
  }

  /**
   * Consulta SQL Raw para obtener los ítems de la galería curada del usuario.
   */
  async findCuratedGallery(id: number): Promise<RawRow[]> {
    return prisma.$queryRaw<RawRow[]>(Prisma.sql`
      SELECT cgi.movie_id, cgi.order_index, cgi.note, mr.tmdb_id
      FROM curated_gallery_items cgi
      INNER JOIN movies_ref mr ON mr.id = cgi.movie_id
      WHERE cgi.user_id = ${id}
      ORDER BY cgi.order_index ASC
    `)
  }
}

export const userProfileRepository = new UserProfileRepository()
