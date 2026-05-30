/**
 * @file userProfileRepository.ts
 * @description Repositorio central de la capa social y de descubrimiento de perfiles.
 * Administra el "Social Graph" (seguidores/seguidos) y la exposición de la identidad
 * pública de los usuarios. Provee agregaciones de actividad (conteo de reseñas, diario,
 * seguidores) y proyecciones enriquecidas para la visualización de perfiles en la plataforma.
 */

import { Prisma, users_membership } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

// --- Tipado de la Capa de Presentación Social ---

/** Payload para la actualización de metadatos de identidad social */
type ActualizarPerfilData = {
  /** Identificador único visual */
  username?: string
  /** URL del recurso gráfico de avatar */
  avatar_url?: string
  /** Biografía o declaración cinematográfica */
  bio?: string
}

/** Tipo comodín para proyecciones SQL nativas */
type RawRow = Record<string, string | number | null>

/**
 * Estructura de perfil público optimizada para la Web.
 * Incluye contadores denormalizados de actividad para evitar consultas recursivas.
 */
type UserPublicProfile = {
  id: number
  username: string
  avatar_url: string | null
  bio: string | null
  created_at: Date
  membership: users_membership | null
  /** Estadísticas vitales de participación en la comunidad */
  _count: {
    reviews: number
    diary_entries: number
    watchlist: number
    /** Mapeo de seguidores (Followers) */
    follows_follows_follower_idTousers: number
    /** Mapeo de seguidos (Following) */
    follows_follows_following_idTousers: number
  }
}

/** Resumen de identidad para listados de directorio */
type UserSummary = {
  id: number
  username: string
  email: string
  role: string
  avatar_url: string | null
  bio?: string | null
  _count?: {
    reviews: number
    diary_entries: number
    watchlist: number
    user_lists: number
    follows_follows_follower_idTousers: number
    follows_follows_following_idTousers: number
  }
}

/** Resultado de búsqueda de perfiles en el motor social */
type UserSearchResult = {
  id: number
  username: string
  avatar_url: string | null
  bio: string | null
  _count: { reviews: number }
}

// --- Tipos de Relación (Social Graph) ---

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
 * Contrato de persistencia para el motor social de CineVault.
 */
export interface IUserProfileRepository {
  /** Localiza la ficha pública de un usuario por ID */
  findById(id: number): Promise<UserPublicProfile | null>
  /** Resuelve el perfil público mediante el nombre de usuario (slug) */
  findByUsername(username: string): Promise<UserPublicProfile | null>
  /** Obtiene el catálogo global de perfiles */
  findAll(): Promise<UserSummary[]>
  /** Ejecuta la búsqueda de usuarios por texto libre */
  search(query: string, take: number): Promise<UserSearchResult[]>
  /** Actualiza metadatos del perfil */
  update(id: number, data: ActualizarPerfilData): Promise<void>
  /** Establece un nuevo vínculo de seguimiento */
  createFollow(followerId: number, followingId: number): Promise<void>
  /** Revoca un vínculo de seguimiento */
  deleteFollow(
    followerId: number,
    followingId: number
  ): Promise<{ count: number }>
  /** Verifica el estado de relación entre dos usuarios */
  findFollow(
    viewerId: number,
    targetId: number
  ): Promise<{ follower_id: number } | null>
  /** Recupera el listado de seguidores */
  findFollowers(id: number): Promise<FollowsWithFollower | null>
  /** Recupera el listado de usuarios seguidos */
  findFollowing(id: number): Promise<FollowsWithFollowing | null>
  /** Obtiene la identidad cinematográfica mediante SQL Raw */
  findCinematographicSignature(id: number): Promise<RawRow[]>
  /** Obtiene la vitrina curada del usuario */
  findCuratedGallery(id: number): Promise<RawRow[]>
}

/**
 * Repositorio de Perfiles
 * Implementación que unifica la gestión de la identidad y las conexiones sociales.
 */
export class UserProfileRepository implements IUserProfileRepository {
  /**
   * Recupera el perfil enriquecido con métricas de actividad.
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
        membership: true,
        /** Agregaciones automatizadas de Prisma para el Social Cloud */
        _count: {
          select: {
            reviews: true,
            diary_entries: true,
            watchlist: true,
            user_lists: true,
            follows_follows_follower_idTousers: true,
            follows_follows_following_idTousers: true,
          },
        },
      },
    }) as Promise<UserPublicProfile | null>
  }

  /**
   * Resuelve el perfil público utilizando el nombre de usuario.
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
        membership: true,
        _count: {
          select: {
            reviews: true,
            diary_entries: true,
            watchlist: true,
            user_lists: true,
            follows_follows_follower_idTousers: true,
            follows_follows_following_idTousers: true,
          },
        },
      },
    }) as Promise<UserPublicProfile | null>
  }

  /**
   * Lista los perfiles registrados para el centro de miembros.
   */
  async findAll() {
    return prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        bio: true,
        _count: {
          select: {
            reviews: true,
            diary_entries: true,
            watchlist: true,
            user_lists: true,
            follows_follows_follower_idTousers: true,
            follows_follows_following_idTousers: true,
          },
        },
      },
    }) as Promise<UserSummary[]>
  }

  /**
   * Implementa una búsqueda difusa sobre el grafo de usuarios.
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
   * Persiste la actualización de identidad social.
   */
  async update(id: number, data: ActualizarPerfilData) {
    await prisma.users.update({ where: { id }, data })
  }

  /**
   * Crea una suscripción social entre dos entidades de usuario.
   */
  async createFollow(followerId: number, followingId: number) {
    await prisma.follows.create({
      data: { follower_id: followerId, following_id: followingId },
    })
  }

  /**
   * Elimina un vínculo social.
   */
  async deleteFollow(followerId: number, followingId: number) {
    return prisma.follows.deleteMany({
      where: { follower_id: followerId, following_id: followingId },
    })
  }

  /**
   * Verifica la existencia de una relación de seguimiento activa.
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
   * Recupera la comunidad de seguidores hidratada con datos de identidad.
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
   * Recupera la constelación de usuarios seguidos.
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
   * Recupera la identidad cinematográfica profunda (Firma) mediante SQL nativo.
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
   * Recupera la vitrina destacada de obras (Galería Curada) integrando referencias locales.
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

/** Instancia exportada del repositorio de perfiles sociales */
export const userProfileRepository = new UserProfileRepository()
