import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { io, usuariosConectados } from "../config/socketio.config.js"
import { NotFoundError } from "../errors/AppErrors.js"

/* ==========================================================================
   HELPER — Crear y emitir notificación en tiempo real
   ========================================================================== */

export const emitirNotificacion = async ({
  user_id,
  sender_id,
  type,
}: {
  user_id: number
  sender_id: number
  type: "follow" | "like" | "comment" | "report_resolved"
}) => {
  // Guardar en BD
  const notificacion = await prisma.notifications.create({
    data: { user_id, sender_id, type },
    include: {
      sender: {
        select: { id: true, username: true, avatar_url: true },
      },
    },
  })

  // Emitir en tiempo real si el usuario está conectado
  const socketId = usuariosConectados.get(user_id)
  if (socketId) {
    io.to(socketId).emit("nueva_notificacion", notificacion)
  }

  return notificacion
}

/* ==========================================================================
   ENDPOINTS REST
   ========================================================================== */

export const getNotifications = async (req: Request, res: Response) => {
  const user_id = req.user!.user_id

  const notificaciones = await prisma.notifications.findMany({
    where: { user_id },
    include: {
      sender: {
        select: { id: true, username: true, avatar_url: true },
      },
    },
    orderBy: { created_at: "desc" },
    take: 50,
  })

  res.json(notificaciones)
}

export const marcarComoLeida = async (req: Request, res: Response) => {
  const user_id = req.user!.user_id
  const id = Number(req.params.id)

  const notificacion = await prisma.notifications.findUnique({ where: { id } })
  if (!notificacion) throw new NotFoundError("Notificación no encontrada")
  if (notificacion.user_id !== user_id)
    throw new NotFoundError("Notificación no encontrada")

  await prisma.notifications.update({
    where: { id },
    data: { read: true },
  })

  res.json({ message: "Notificación marcada como leída" })
}

export const marcarTodasComoLeidas = async (req: Request, res: Response) => {
  const user_id = req.user!.user_id

  await prisma.notifications.updateMany({
    where: { user_id, read: false },
    data: { read: true },
  })

  res.json({ message: "Todas las notificaciones marcadas como leídas" })
}

export const getUnreadCount = async (req: Request, res: Response) => {
  const user_id = req.user!.user_id

  const count = await prisma.notifications.count({
    where: { user_id, read: false },
  })

  res.json({ count })
}
