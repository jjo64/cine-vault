import { prisma } from "../lib/prisma.js"
import type { SolicitudAutenticada } from "../middlewares/auth.middlewares.js"
import { Response } from "express"
import bcrypt from "bcrypt"

export const actualizarPerfil = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  interface perfilActualizar {
    username?: string
    email?: string
    name?: string
    bio?: string
  }

  const user_id = req.user!.user_id
  const { username, email, name, bio }: perfilActualizar = req.body

  try {
    await prisma.users.update({
      where: { id: user_id },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(bio && { bio }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
      },
    })

    res.status(200).json({ message: "Perfil actualizado correctamente" })
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }
    throw error // que lo capture el manejadorAsincrono
  }
}

export const actualizarAuth = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  interface authActualizar {
    password_actual?: string
    password_nueva?: string
    password_confirmacion?: string
  }

  const user_id = req.user!.user_id
  const {
    password_actual,
    password_nueva,
    password_confirmacion,
  }: authActualizar = req.body

  if (!password_actual || !password_nueva || !password_confirmacion) {
    return res.status(400).json({ message: "Todos los campos son requeridos" })
  }

  if (password_nueva !== password_confirmacion) {
    return res.status(400).json({ message: "Las contraseñas no coinciden" })
  }

  const user = await prisma.users.findUnique({ where: { id: user_id } })
  const passwordValida = await bcrypt.compare(password_actual, user!.password)

  if (!passwordValida) {
    return res.status(401).json({ message: "Contraseña actual incorrecta" })
  }

  const hashedPassword = await bcrypt.hash(password_nueva, 10)

  await prisma.users.update({
    where: { id: user_id },
    data: { password: hashedPassword },
  })

  res.status(200).json({ message: "Contraseña actualizada correctamente" })
}

export const actualizarAvatar = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const user_id = req.user!.user_id
  const { avatar } = req.body
  const user = await prisma.users.update({
    where: { id: user_id },
    data: { avatar_url: avatar },
  })
  res.status(200).json(user)
}

export const eliminarCuenta = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const user_id = req.user!.user_id
  const user = await prisma.users.delete({
    where: { id: user_id },
  })
  res.status(200).json(user)
}
