/**
 * @file server.ts
 * @description Punto de entrada principal para el backend de CineVault.
 * Configura el servidor Express, orquestra los middlewares de seguridad y 
 * optimización, establece la conexión de WebSockets (Socket.io), 
 * define la arquitectura de rutas de la API y arranca las tareas programadas.
 */

import "dotenv/config"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import compression from "compression"
import path from "path"
import { fileURLToPath } from "url"
import cron from "node-cron"
import { createServer } from "http"
import "./config/passport.config.js"
import passport from "passport"

// --- Importación de Rutas de la API ---
import rutasAuth from "./routes/auth.routes.js"
import rutasUsuarios from "./routes/users.routes.js"
import rutasPeliculas from "./routes/movies.routes.js"
import rutasDiario from "./routes/diary.routes.js"
import rutasWatchlist from "./routes/watchlist.routes.js"
import rutasVault from "./routes/vault.routes.js"
import rutasListas from "./routes/lists.routes.js"
import rutasResenas from "./routes/reviews.routes.js"
import rutasBusqueda from "./routes/search.routes.js"
import rutasPagos from "./routes/payments.routes.js"
import rutasRbac from "./routes/rbac.routes.js"
import rutasInformacion from "./routes/information.routes.js"
import rutasFavorities from "./routes/favorities.routes.js"
import rutasSettings from "./routes/settings.routes.js"
import rutasNotificaciones from "./routes/notifications.routes.js"
import rutasSeo from "./routes/seo.routes.js"
import rutasDirectors from "./routes/directors.routes.js"
import rutasMentiras from "./routes/mentiras.routes.js"
import rutasArcos from "./routes/arcos.routes.js"
import rutasActivity from "./routes/activity.routes.js"
import rutasFeed from "./routes/feed.routes.js"
import rutasRecommendations from "./routes/recommendations.routes.js"
import rutasReports from "./routes/reports.routes.js"

// --- Middlewares de Soporte ---
import { manejadorErrores } from "./middlewares/error.middlewares.js"
import { limitadorGlobal } from "./middlewares/rateLimit.middleware.js"
import { seoHeaders } from "./middlewares/seoHeaders.js"

// --- Librerías y Utilidades ---
import { limpiarUsuariosNoVerificados } from "./lib/jobs.js"
import { initSocketIO } from "./config/socketio.config.js"

// --- Documentación Swagger ---
import swaggerUi from "swagger-ui-express"
import { swaggerSpec } from "../docs/swagger.js"

// Configuración de rutas para ES Modules (sustituto de __dirname)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicPath = path.resolve(__dirname, "../../frontend/dist")

// Inicialización de la aplicación y el servidor HTTP
const app = express()
const httpServer = createServer(app)
initSocketIO(httpServer)

// Configuración de proxy para despliegues tras balanceadores de carga
app.set("trust proxy", 1)

const PUERTO = process.env.PORT || 3000

// Validaciones críticas de entorno antes del arranque
if (!process.env.JWT_SECRET)
  throw new Error("CRÍTICO: JWT_SECRET no definido en el entorno.")
if (!process.env.API_KEY_TMDB) 
  throw new Error("CRÍTICO: API_KEY_TMDB no definido en el entorno.")

/**
 * 1. Middlewares de Optimización y Seguridad Base
 */
app.use(compression()) // Comprime las respuestas HTTP para mejorar el rendimiento
app.use(
  express.static(publicPath, {
    maxAge: "1y", // Cache agresiva para archivos estáticos del frontend
    etag: true,
    index: false,
  })
)
app.use(
  helmet({
    contentSecurityPolicy: false, // Se configura manualmente abajo para mayor granularidad
  })
)

/**
 * 2. Políticas de Seguridad (CSP y Frame Options)
 */
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "SAMEORIGIN")
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://*.stripe.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "img-src 'self' https://image.tmdb.org https://avatars.githubusercontent.com data: blob:; " +
      "connect-src 'self' " +
      (process.env.FRONTEND_URLS || "") +
      " ws: wss: https://*.stripe.com; " +
      "frame-src 'self' https://*.stripe.com;"
  )
  next()
})

/**
 * 3. Configuración Robusta de CORS
 */
const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, "")
const configuredOrigins = String(process.env.FRONTEND_URLS || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean)

const frontendUrl = String(process.env.FRONTEND_URL || "").trim()
const localDevOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",
  "http://localhost:3000",
]

const allowedOrigins = new Set(
  [
    ...configuredOrigins,
    ...(frontendUrl ? [frontendUrl] : []),
    ...(process.env.NODE_ENV === "production" ? [] : localDevOrigins),
  ].map(normalizeOrigin)
)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true) // Permite herramientas de test como Postman

      if (allowedOrigins.has(normalizeOrigin(origin))) {
        return callback(null, true)
      }

      console.warn("Seguridad: Intento de acceso bloqueado por CORS desde:", origin)
      return callback(new Error("Acceso no permitido por la política CORS"))
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true, // Permite el intercambio de cookies de sesión
  })
)

/**
 * 4. Middlewares de Utilidad y Parsing
 */
app.use(seoHeaders) // Inyecta headers optimizados para rastreadores
app.use(limitadorGlobal) // Prevención de ataques de fuerza bruta (Rate-limit)

// Stripe Webhook requiere el cuerpo en formato raw para validar firmas criptográficas
app.use("/api/payments/webhook", express.raw({ type: "application/json" }))

app.use(express.json({ limit: "10mb" })) // Soporte para JSON con límite de carga
app.use(cookieParser()) // Habilita la lectura de cookies firmadas
app.disable("x-powered-by") // Oculta la cabecera Express por seguridad

/**
 * 5. Tareas Programadas y Autenticación
 */
cron.schedule("0 * * * *", limpiarUsuariosNoVerificados) // Mantenimiento cada hora
app.use(passport.initialize())

/**
 * 6. Definición de Rutas de la API
 */

// Healthcheck básico
app.get("/api/health", (req, res) => {
  res.json({ message: "API CineVault operacional", status: "OK" })
})

// Documentación interactiva (Swagger)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Mapeo de routers por módulo funcional
app.use("/", rutasSeo)
app.use("/api/auth", rutasAuth)
app.use("/api/users", rutasUsuarios)
app.use("/api/movies", rutasPeliculas)
app.use("/api/search", rutasBusqueda)
app.use("/api/diary", rutasDiario)
app.use("/api/watchlist", rutasWatchlist)
app.use("/api/vault", rutasVault)
app.use("/api/lists", rutasListas)
app.use("/api/reviews", rutasResenas)
app.use("/api/payments", rutasPagos)
app.use("/api/rbac", rutasRbac)
app.use("/api/information", rutasInformacion)
app.use("/api/favorites", rutasFavorities)
app.use("/api/settings", rutasSettings)
app.use("/api/notifications", rutasNotificaciones)
app.use("/api/directors", rutasDirectors)
app.use("/api/mentiras", rutasMentiras)
app.use("/api/arcos", rutasArcos)
app.use("/api/activity", rutasActivity)
app.use("/api/feed", rutasFeed)
app.use("/api/recommendations", rutasRecommendations)
app.use("/api/reports", rutasReports)

/**
 * 7. Middleware Centralizado de Manejo de Errores (SIEMPRE AL FINAL)
 */
app.use(manejadorErrores)

/**
 * Arranque del Servidor
 */
httpServer.listen(PUERTO, () => {
  console.log(`\n-----------------------------------------------------------`)
  console.log(`Bóveda Cinematográfica Abierta: http://localhost:${PUERTO}`)
  console.log(`Entorno: ${process.env.NODE_ENV || "development"}`)
  console.log(`-----------------------------------------------------------\n`)
})
