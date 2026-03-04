import { useState } from "react"
import { useSocket } from "../context/SocketContext"

const mensajeNotificacion = (type: string, username: string) => {
  switch (type) {
    case "like": return `${username} dio like a tu reseña`
    case "follow": return `${username} empezó a seguirte`
    case "comment": return `${username} comentó tu reseña`
    case "report_resolved": return "Tu reporte ha sido resuelto"
    default: return "Nueva notificación"
  }
}

export const Notificaciones = () => {
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useSocket()
  const [abierto, setAbierto] = useState(false)

  return (
    <div style={{ position: "relative" }}>
      {/* Botón campana */}
      <button onClick={() => setAbierto(!abierto)}>
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

      {/* Panel de notificaciones */}
      {abierto && (
        <div style={{
          position: "absolute",
          right: 0,
          top: 35,
          width: 320,
          background: "white",
          border: "1px solid #eee",
          borderRadius: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>Notificaciones</span>
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas} style={{ fontSize: 12, color: "#666", background: "none", border: "none", cursor: "pointer" }}>
                Marcar todas como leídas
              </button>
            )}
          </div>

          {notificaciones.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#999" }}>
              No tienes notificaciones
            </div>
          ) : (
            notificaciones.map((n) => (
              <div
                key={n.id}
                onClick={() => marcarLeida(n.id)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f5f5f5",
                  background: n.read ? "white" : "#f0f7ff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {n.sender?.avatar_url ? (
                  <img src={n.sender.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ddd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    👤
                  </div>
                )}
                <div>
                  <p style={{ margin: 0, fontSize: 14 }}>
                    {mensajeNotificacion(n.type, n.sender?.username ?? "Alguien")}
                  </p>
                  <span style={{ fontSize: 11, color: "#999" }}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", marginLeft: "auto" }} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}