import "dotenv/config"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import cron from "node-cron"
import "./config/passport.config.js"
import passport from "passport"

// Importación de rutas
import rutasAuth from "./routes/auth.routes.js"
import rutasUsuarios from "./routes/users.routes.js"
import rutasPeliculas from "./routes/movies.routes.js"
import rutasDiario from "./routes/diary.routes.js"
import rutasWatchlist from "./routes/watchlist.routes.js"
import rutasResenas from "./routes/reviews.routes.js"
import rutasBusqueda from "./routes/search.routes.js"
import rutasPagos from "./routes/payments.routes.js"
import rutasRbac from "./routes/rbac.routes.js"
import rutasInformacion from "./routes/information.routes.js"

// Middlewares
import { manejadorErrores } from "./middlewares/error.middlewares.js"
import { limitadorGlobal } from "./middlewares/rateLimit.middleware.js"

// Importación de helpers
import { limpiarUsuariosNoVerificados } from "./lib/jobs.js"

// Configuración inicial
const app = express()
const PUERTO = process.env.PORT || 3000
if (!process.env.JWT_SECRET)
  throw new Error("JWT_SECRET no definido. Detén la app.")
if (!process.env.API_KEY_TMDB) throw new Error("API_KEY_TMDB no definido")

/* ==========================================================================
   CONFIGURACIÓN DE MIDDLEWARES GLOBALES
   ========================================================================== */

app.use(helmet()) // Seguridad HTTP headers

// Configuración de CORS robusta
const allowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",").map(url => url.trim())
  : []

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir solicitudes sin origen (ej: Postman, scripts) o desde URLs permitidas
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      console.warn("Bloqueo CORS para origen:", origin)
      return callback(new Error("No permitido por CORS"))
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
)

app.use(limitadorGlobal)
app.use(express.json({ limit: "10mb" })) // Parseo de JSON body con límite
app.use(cookieParser()) // Parseo de cookies
app.disable("x-powered-by") // Ocultar tecnología del servidor por seguridad
cron.schedule("0 * * * *", limpiarUsuariosNoVerificados)
app.use(passport.initialize())

/* ==========================================================================
   RUTA RAÍZ DE PRUEBA (ANTES del manejador de errores)
   ========================================================================== */

app.get("/", (req, res) => {
  res.json({
    message: "API CineVault funcionando correctamente",
    status: "OK",
  })
})

/* ==========================================================================
   RUTAS DE LA API
   ========================================================================== */

app.use("/api/auth", rutasAuth)
app.use("/api/users", rutasUsuarios)
app.use("/api/movies", rutasPeliculas)
app.use("/api/search", rutasBusqueda)
app.use("/api/diary", rutasDiario)
app.use("/api/watchlist", rutasWatchlist)
app.use("/api/reviews", rutasResenas)
app.use("/api/payments", rutasPagos)
app.use("/api/rbac", rutasRbac)
app.use("/api/information", rutasInformacion)

/* ==========================================================================
   MIDDLEWARE DE MANEJO DE ERRORES (SIEMPRE AL FINAL)
   ========================================================================== */

app.use(manejadorErrores)

/* ==========================================================================
   INICIO DEL SERVIDOR
   ========================================================================== */

app.listen(PUERTO, () => {
  console.log(`\nServidor corriendo en: http://localhost:${PUERTO}`)
  console.log(
    `Frontend permitido: ${process.env.FRONTEND_URL || "No definido"}\n`
  )
})
