import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { SolicitudAutenticada } from "../middlewares/auth.middlewares.js"
import { obtenerCodigoPrisma, obtenerMensajeError } from "../helpers/errores.js"

// Tipo tipado para la actualización de perfil (reemplaza `any`)
type ActualizarPerfil = {
  username?: string
  avatar_url?: string
  bio?: string
}

/**
 * Obtiene todos los usuarios con campos seguros (sin contraseña).
 */
export const obtenerUsuarios = async (req: Request, res: Response) => {
  const usuarios = await prisma.users.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatar_url: true,
    },
  })
  return res.json(usuarios)
}

/**
 * Obtiene un usuario por su ID.
 * Devuelve solo _count de relaciones (reviews, diary, watchlist) en vez de los datos completos
 * para evitar devolver miles de registros sin límite.
 */
export const obtenerUsuarioPorId = async (req: Request, res: Response) => {
  const { id } = req.params
  const usuario = await prisma.users.findUnique({
    where: { id: Number(id) },
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
  })

  if (!usuario) {
    return res.status(404).json({ error: "Usuario no encontrado" })
  }

  return res.json(usuario)
}

/**
 * Obtiene los seguidores de un usuario.
 * Resuelto con include anidado en UNA SOLA QUERY (fix N+1).
 */
export const obtenerSeguidores = async (req: Request, res: Response) => {
  const { id } = req.params

  const usuario = await prisma.users.findUnique({
    where: { id: Number(id) },
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

  if (!usuario) {
    return res.status(404).json({ error: "Usuario no encontrado" })
  }

  // Mapear para devolver solo la info del seguidor
  const seguidores = usuario.follows_follows_following_idTousers
    .map((f) => f.users_follows_follower_idTousers)
    .filter(Boolean)

  return res.json(seguidores)
}

/**
 * Obtiene los usuarios que sigue un usuario.
 * Resuelto con include anidado en UNA SOLA QUERY (fix N+1).
 */
export const obtenerSiguiendo = async (req: Request, res: Response) => {
  const { id } = req.params

  const usuario = await prisma.users.findUnique({
    where: { id: Number(id) },
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

  if (!usuario) {
    return res.status(404).json({ error: "Usuario no encontrado" })
  }

  // Mapear para devolver solo la info del usuario seguido
  const siguiendo = usuario.follows_follows_follower_idTousers
    .map((f) => f.users_follows_following_idTousers)
    .filter(Boolean)

  return res.json(siguiendo)
}

/**
 * Deja de seguir a un usuario.
 * Usa req.user!.user_id del middleware de autenticación (fix: antes usaba Number(req.user!)).
 */
export const dejarDeSeguirUsuario = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const idUsuario = req.user!.user_id // usuario logueado (middleware auth)
  const idUsuarioDejar = Number(req.params.id) // usuario a dejar de seguir
  try {
    const eliminado = await prisma.follows.deleteMany({
      where: {
        follower_id: idUsuario,
        following_id: idUsuarioDejar,
      },
    })

    if (eliminado.count === 0) {
      return res
        .status(404)
        .json({ message: "No estabas siguiendo a este usuario" })
    }

    return res.json({
      message: "Has dejado de seguir al usuario correctamente",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Error al dejar de seguir" })
  }
}

/**
 * Sigue a un usuario.
 * Usa req.user!.user_id del middleware de autenticación (fix: antes usaba Number(req.user!)).
 */
export const seguirUsuario = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const idUsuario = req.user!.user_id
  const idUsuarioSeguir = Number(req.params.id)

  if (idUsuario === idUsuarioSeguir) {
    return res.status(400).json({ error: "No puedes seguirte a ti mismo" })
  }

  try {
    await prisma.follows.create({
      data: {
        follower_id: idUsuario,
        following_id: idUsuarioSeguir,
      },
    })

    return res.json({ message: "Usuario seguido correctamente" })
  } catch (error: unknown) {
    if (obtenerCodigoPrisma(error) === "P2002") {
      return res
        .status(400)
        .json({ error: "Ya estás siguiendo a este usuario" })
    }
    res.status(500).json({ error: obtenerMensajeError(error) })
  }
}

/**
 * Actualiza el perfil del usuario autenticado.
 * Usa tipo ActualizarPerfil tipado (fix: antes usaba `any`).
 * Usa req.user!.user_id (fix: antes usaba Number(req.user!)).
 */
export const actualizarPerfil = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const idUsuario = req.user!.user_id
  const { username, avatar_url, bio } = req.body

  try {
    const datosActualizar: ActualizarPerfil = {}

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim().length < 3) {
        return res.status(400).json({ error: "Nombre de usuario inválido" })
      }
      datosActualizar.username = username.trim()
    }

    if (avatar_url !== undefined) {
      if (typeof avatar_url !== "string") {
        return res.status(400).json({ error: "Avatar inválido" })
      }
      datosActualizar.avatar_url = avatar_url
    }

    if (bio !== undefined) {
      if (typeof bio !== "string" || bio.length > 160) {
        return res
          .status(400)
          .json({ error: "La bio es inválida (máximo 160 caracteres)" })
      }
      datosActualizar.bio = bio
    }

    if (Object.keys(datosActualizar).length === 0) {
      return res.status(400).json({ error: "No hay datos para actualizar" })
    }

    await prisma.users.update({
      where: { id: idUsuario },
      data: datosActualizar,
    })

    return res.json({ message: "Perfil actualizado correctamente" })
  } catch (error: unknown) {
    if (obtenerCodigoPrisma(error) === "P2002") {
      return res
        .status(409)
        .json({ error: "El nombre de usuario ya está en uso" })
    }
    return res.status(500).json({ error: "Error interno del servidor" })
  }
}
