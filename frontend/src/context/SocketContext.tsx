import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { io } from "socket.io-client"
import { authorizedFetch, clearStoredAccessToken, getStoredAccessToken } from "../services/authServices"

interface Notificacion {
  id: number
  user_id: number
  sender_id: number
  type: "follow" | "like" | "comment" | "report_resolved"
  read: boolean
  created_at: string
  sender: {
    id: number
    username: string
    avatar_url: string | null
  }
}

interface SocketContextType {
  notificaciones: Notificacion[]
  noLeidas: number
  marcarLeida: (id: number) => void
  marcarTodasLeidas: () => void
}

const SocketContext = createContext<SocketContextType | null>(null)

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

  const getUserIdFromToken = (token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || '')) as { user_id?: unknown }
      return typeof payload.user_id === 'number' ? payload.user_id : null
    } catch {
      return null
    }
  }

  useEffect(() => {
    let socketInstance: ReturnType<typeof io> | null = null
    let active = true

    const start = async () => {
      const token = getStoredAccessToken()
      if (!token) {
        setNotificaciones([])
        return
      }

      const userId = getUserIdFromToken(token)
      if (!userId) {
        clearStoredAccessToken()
        setNotificaciones([])
        return
      }

      try {
        socketInstance = io(import.meta.env.VITE_API_URL, {
          withCredentials: true,
        })

        socketInstance.on("connect", () => {
          socketInstance?.emit("registrar_usuario", userId)
        })

        socketInstance.on("nueva_notificacion", (notificacion: Notificacion) => {
          setNotificaciones((prev) => [notificacion, ...prev])
        })

        const res = await authorizedFetch('/api/notifications')
        if (!res.ok) {
          setNotificaciones([])
          return
        }

        const data = await res.json()
        if (active) setNotificaciones(Array.isArray(data) ? data : [])
      } catch {
        if (active) setNotificaciones([])
      }
    }

    start()

    return () => {
      active = false
      socketInstance?.disconnect()
    }
  }, [])

  const noLeidas = notificaciones.filter((n) => !n.read).length

  const marcarLeida = async (id: number) => {
    const res = await authorizedFetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
    })
    if (!res.ok) return
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const marcarTodasLeidas = async () => {
    const res = await authorizedFetch('/api/notifications/read-all', {
      method: "PATCH",
    })
    if (!res.ok) return
    setNotificaciones((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <SocketContext.Provider value={{ notificaciones, noLeidas, marcarLeida, marcarTodasLeidas }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) throw new Error("useSocket debe usarse dentro de SocketProvider")
  return context
}