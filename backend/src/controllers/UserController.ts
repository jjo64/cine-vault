import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { IAuthRequest } from '../middlewares/auth.middlewares.js'
import { asyncHandler } from '../middlewares/error.middlewares.js'

export const getAllUsers = async (req: Request, res: Response) => {
    const users = await prisma.users.findMany()
    return res.json(users)
}

export const getUserById = async (req: Request, res: Response) => {
    const { id } = req.params
    const user = await prisma.users.findUnique({
        where: { id: Number(id) },
        select: {
            username: true,
            avatar_url: true,
            bio: true,
            diary_entries: true,
            favorites: true,
            follows_follows_follower_idTousers: true,
            follows_follows_following_idTousers: true,
            reviews: true,
            user_activity: true,
            watchlist: true,
            vault: true,
        }
    })

    if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    return res.json(user)
}
export const getFollowers = async (req: Request, res: Response) => {
    const { id } = req.params

    const user = await prisma.users.findUnique({
        where: { id: Number(id) }
    })

    if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const followers = await prisma.follows.findMany({
        where: { following_id: Number(user.id) }
    })

    const nombre_seguidores = await prisma.users.findMany({
        where: {
            id: {
                in: followers.map((f) => f.follower_id).filter((id): id is number => id !== null)
            }
        },
        select: { id: true, username: true, avatar_url: true }
    })

    return res.json(nombre_seguidores)
}

export const getFollowing = async (req: Request, res: Response) => {
    const { id } = req.params

    const user = await prisma.users.findUnique({
        where: { id: Number(id) }
    })

    if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const following = await prisma.follows.findMany({
        where: { follower_id: Number(user.id) }
    })

    const nombre_following = await prisma.users.findMany({
        where: {
            id: {
                in: following.map((f) => f.following_id).filter((id): id is number => id !== null)
            }
        },
        select: { id: true, username: true, avatar_url: true }
    })

    return res.json(nombre_following)
}

// Arreglar esto, posible conflicto con el middleware auth
export const unfollowUser = async (req: IAuthRequest, res: Response) => {
    const userId = Number(req.user!) // usuario logueado (middleware auth)
    const userToUnfollowId = Number(req.params.id) // usuario a dejar de seguir
    try {
    const deleted = await prisma.follows.deleteMany({
        where: {
            follower_id: userId,
            following_id: userToUnfollowId
        }
    })

    if (deleted.count === 0) {
        return res.status(404).json({ message: 'No estabas siguiendo a este usuario' })
    }

    return res.json({ message: 'Usuario desfolloweado correctamente' })

} catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Error al dejar de seguir' })
}

}

// Arreglar esto, posible conflicto con el middleware auth
export const followUser = async (req: IAuthRequest, res: Response) => {
    const userId = Number(req.user!)
    const userToFollowId = Number(req.params.id)

    if (userId === userToFollowId) {
        return res.status(400).json({ error: 'No puedes seguirte a ti mismo' })
    }

    try {
        await prisma.follows.create({
            data: {
                follower_id: userId,
                following_id: userToFollowId
            }
        })

        return res.json({ message: 'Usuario followeado correctamente' })

    } catch (error: any) {

        // Error de clave única en Prisma
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Ya estás siguiendo a este usuario' })
        }

        console.error(error)
        return res.status(500).json({ error: 'Error al seguir' })
    }
}

export const updateProfile = async (req: IAuthRequest, res: Response) => {
  const userId = Number(req.user!)
  const { username, avatar_url, bio } = req.body

  try {
    //const dataToUpdate: prisma.usersUpdateInput = {}
    const dataToUpdate: any = {}

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim().length < 3) {
        return res.status(400).json({ error: "Username inválido" })
      }
      dataToUpdate.username = username.trim()
    }

    if (avatar_url !== undefined) {
      if (typeof avatar_url !== "string") {
        return res.status(400).json({ error: "Avatar inválido" })
      }
      dataToUpdate.avatar_url = avatar_url
    }

    if (bio !== undefined) {
      if (typeof bio !== "string" || bio.length > 160) {
        return res.status(400).json({ error: "La bio es inválida" })
      }
      dataToUpdate.bio = bio
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: "No hay datos para actualizar" })
    }

    await prisma.users.update({
      where: { id: userId },
      data: dataToUpdate
    })

    return res.json({ message: "Perfil actualizado correctamente" })

  } catch (error: any) {

    if (error.code === "P2002") {
      return res.status(409).json({ error: "El username ya está en uso" })
    }

    console.error(error)
    return res.status(500).json({ error: "Error interno del servidor" })
  }
}


