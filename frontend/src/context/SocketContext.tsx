import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { io } from "socket.io-client"

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

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    const payload = JSON.parse(atob(token.split(".")[1]))
    const userId = payload.user_id

    const socketInstance = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    })

    socketInstance.on("connect", () => {
      socketInstance.emit("registrar_usuario", userId)
    })

    socketInstance.on("nueva_notificacion", (notificacion: Notificacion) => {
      setNotificaciones((prev) => [notificacion, ...prev])
    })

    fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setNotificaciones(data))
      .catch(console.error)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const noLeidas = notificaciones.filter((n) => !n.read).length

  const marcarLeida = async (id: number) => {
    const token = localStorage.getItem("token")
    await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const marcarTodasLeidas = async () => {
    const token = localStorage.getItem("token")
    await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
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