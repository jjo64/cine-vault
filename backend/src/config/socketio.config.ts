/**
 * @file socketio.config.ts
 * @description Configuración y orquestación de WebSockets mediante Socket.io.
 * Gestiona la comunicación en tiempo real para notificaciones, actualizaciones
 * de feed y presencia de usuarios en CineVault.
 */

import { Server } from "socket.io"
import { Server as HttpServer } from "http"

/**
 * Mapa de persistencia en memoria para relacionar IDs de usuario con IDs de socket.
 * Permite emitir eventos dirigidos a usuarios específicos (unicast).
 */
export const usuariosConectados = new Map<number, string>()

/** Instancia global de Socket.io accesible desde otros controladores */
export let io: Server

/**
 * Inicializa la instancia de Socket.io vinculada al servidor HTTP principal.
 * Configura las políticas de CORS y los listeners de conexión/desconexión.
 *
 * @param httpServer - Servidor Node.js HTTP ya inicializado.
 * @returns La instancia de Socket.io configurada.
 */
export const initSocketIO = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URLS
        ? process.env.FRONTEND_URLS.split(",").map((url) => url.trim())
        : [],
      credentials: true,
    },
  })

  io.on("connection", (socket) => {
    // Registro inicial del socket en el log del servidor
    console.log(`Socket establecido: ${socket.id}`)

    /**
     * Listener para vincular la identidad del usuario con la conexión activa.
     */
    socket.on("registrar_usuario", (userId: number) => {
      usuariosConectados.set(userId, socket.id)
      console.log(
        `Usuario [ID: ${userId}] vinculado al socket [ID: ${socket.id}]`
      )
    })

    /**
     * Limpieza de la tabla de mapeo al perder la conexión física del cliente.
     */
    socket.on("disconnect", () => {
      for (const [userId, socketId] of usuariosConectados.entries()) {
        if (socketId === socket.id) {
          usuariosConectados.delete(userId)
          console.log(`Usuario [ID: ${userId}] desconectado del socket`)
          break
        }
      }
    })
  })

  return io
}
