import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { socket } from "../context/SocketContext"
import { notify } from "../lib/notify"
import { authorizedFetch } from "../services/authServices"

type NotificationType = "follow" | "like" | "comment" | "report_resolved" | "review" | "system"

type Notificacion = {
  id: number
  user_id: number
  sender_id: number
  type: NotificationType
  read: boolean
  created_at: string
  message?: string | null
  sender?: {
    id: number
    username: string
    avatar_url: string | null
  } | null
}

const mensajeNotificacion = (type: NotificationType, username: string) => {
  switch (type) {
    case "like": return `${username} dio like a tu reseña`
    case "follow": return `${username} empezó a seguirte`
    case "comment": return `${username} comentó tu reseña`
    case "report_resolved": return "Tu reporte ha sido resuelto"
    default: return "Nueva notificación"
  }
}

const mergeUniqueById = (base: Notificacion[], incoming: Notificacion[]) => {
  const map = new Map<number, Notificacion>()
  for (const item of base) map.set(item.id, item)
  for (const item of incoming) map.set(item.id, item)
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

const formatRelativeDate = (isoDate: string) => {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" })

  if (Math.abs(diffMs) < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute")
  }

  if (Math.abs(diffMs) < day) {
    return rtf.format(Math.round(diffMs / hour), "hour")
  }

  return rtf.format(Math.round(diffMs / day), "day")
}

type NotificacionesProps = {
  open?: boolean
  showTrigger?: boolean
}

export const Notificaciones = ({ open, showTrigger = true }: NotificacionesProps) => {
  const [abiertoInterno, setAbiertoInterno] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [noLeidas, setNoLeidas] = useState(0)

  useEffect(() => {
    let isMounted = true

    const parseList = async (res: Response) => {
      if (!res.ok) return [] as Notificacion[]
      const data = await res.json()
      return Array.isArray(data) ? (data as Notificacion[]) : []
    }

    const cargar = async () => {
      try {
        const listRes = await authorizedFetch("/api/notifications")
        const baseList = await parseList(listRes)

        const pendingRes = await authorizedFetch("/api/notifications/pending")
        let pendingList: Notificacion[] = []

        if (pendingRes.ok) {
          const pendingData = (await pendingRes.json()) as { pending?: unknown }
          pendingList = Array.isArray(pendingData.pending)
            ? (pendingData.pending as Notificacion[])
            : []
        }

        const pendingNuevas = pendingList.filter(
          (pending) => !baseList.some((existing) => existing.id === pending.id)
        )

        for (const pending of pendingNuevas) {
          notify.fromSocket({
            type: pending.type,
            sender: pending.sender ? { username: pending.sender.username } : undefined,
            message: pending.message ?? undefined,
          })
        }

        const merged = mergeUniqueById(baseList, pendingList)

        const unreadRes = await authorizedFetch("/api/notifications/unread")
        const unreadData = unreadRes.ok
          ? ((await unreadRes.json()) as { count?: unknown })
          : { count: merged.filter((n) => !n.read).length }
        const unreadCount =
          typeof unreadData.count === "number"
            ? unreadData.count
            : merged.filter((n) => !n.read).length

        if (!isMounted) return
        setNotificaciones(merged)
        setNoLeidas(unreadCount)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    const onNuevaNotificacion = (notificacion: Notificacion) => {
      setNotificaciones((prev) => {
        if (prev.some((n) => n.id === notificacion.id)) return prev
        return [notificacion, ...prev]
      })

      notify.fromSocket({
        type: notificacion.type,
        sender: notificacion.sender
          ? { username: notificacion.sender.username }
          : undefined,
        message: notificacion.message ?? undefined,
      })

      if (!notificacion.read) {
        setNoLeidas((prev) => prev + 1)
      }
    }

    cargar()
    socket.on("nueva_notificacion", onNuevaNotificacion)

    return () => {
      isMounted = false
      socket.off("nueva_notificacion", onNuevaNotificacion)
    }
  }, [])

  const marcarLeida = async (id: number) => {
    const target = notificaciones.find((n) => n.id === id)
    if (!target || target.read) return

    const res = await authorizedFetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
    })

    if (!res.ok) return

    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setNoLeidas((prev) => Math.max(0, prev - 1))
  }

  const marcarTodasLeidas = async () => {
    const res = await authorizedFetch("/api/notifications/read-all", {
      method: "PATCH",
    })

    if (!res.ok) return

    setNotificaciones((prev) => prev.map((n) => ({ ...n, read: true })))
    setNoLeidas(0)
  }

  const items = useMemo(() => notificaciones, [notificaciones])

  const abierto = open ?? abiertoInterno

  return (
    <div style={{ position: "relative" }}>
      {showTrigger && (
        <button onClick={() => setAbiertoInterno((prev) => !prev)}>
          🔔
          {noLeidas > 0 && (
            <span style={{
              position: "absolute",
              top: -5,
              right: -5,
              background: "red",
              color: "white",
              borderRadius: "50%",
              width: 18,
              height: 18,
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {noLeidas}
            </span>
          )}
        </button>
      )}

      {/* Panel de notificaciones */}
      {abierto && (
        <div style={{
          position: "absolute",
          right: 0,
          top: 35,
          width: 320,
          background: "#111111",
          border: "1px solid #252525",
          borderRadius: 0,
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
          zIndex: 1000,
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #252525", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#E2E2E2" }}>Notificaciones</span>
            <button
              onClick={marcarTodasLeidas}
              disabled={noLeidas <= 0}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#7a7a7a",
                background: "transparent",
                border: "none",
                cursor: noLeidas > 0 ? "pointer" : "default",
                opacity: noLeidas > 0 ? 1 : 0.6,
              }}
            >
                Marcar todas
              </button>
          </div>

          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: "#7a7a7a", fontFamily: "'Syne', sans-serif", fontSize: 12 }}>
              Cargando...
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#7a7a7a", fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: "italic" }}>
              Sin notificaciones nuevas.
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {items.map((n, index) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.34, delay: index * 0.04 }}
                  onClick={() => marcarLeida(n.id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #252525",
                    cursor: n.read ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: n.read ? "#7a7a7a" : "#E2E2E2",
                  }}
                  whileHover={!n.read ? { backgroundColor: "#1a1a1a" } : undefined}
                >
                  {n.sender?.avatar_url ? (
                    <img
                      src={n.sender.avatar_url}
                      alt={n.sender.username}
                      style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#252525",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontFamily: "'Syne', sans-serif",
                      }}
                    >
                      {n.sender?.username?.slice(0, 1).toUpperCase() ?? "?"}
                    </div>
                  )}

                  <div style={{ display: "grid", gap: 2 }}>
                    <p style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 12 }}>
                      {mensajeNotificacion(n.type, n.sender?.username ?? "Alguien")}
                    </p>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, color: "#7a7a7a" }}>
                      {formatRelativeDate(n.created_at)}
                    </span>
                  </div>

                  {!n.read && (
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#D4AF7A", marginLeft: "auto" }} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  )
}