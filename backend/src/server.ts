import "dotenv/config"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import cron from "node-cron"

// Importación de rutas
import rutasAuth from "./routes/auth.routes.js"
import rutasUsuarios from "./routes/users.routes.js"
import rutasPeliculas from "./routes/movies.routes.js"
import rutasDiario from "./routes/diary.routes.js"
import rutasWatchlist from "./routes/watchlist.routes.js"
import rutasResenas from "./routes/reviews.routes.js"
import rutasBusqueda from "./routes/search.routes.js"
import rutasPagos from "./routes/payments.routes.js"

// Middlewares
import { manejadorErrores } from "./middlewares/error.middlewares.js"

// Importación de helpers
import { limpiarUsuariosNoVerificados } from "./helpers/authOptions.js"

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

// Configuración de CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir solicitudes sin origen (como herramientas locales o scripts) y desde el frontend permitido
      if (!origin || origin === process.env.FRONTEND_URL) {
        callback(null, true)
      } else {
        console.warn("Bloqueo CORS para origen:", origin)
        callback(new Error("No permitido por CORS"))
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true, // Permitir cookies
  })
)

app.use(express.json({ limit: "10mb" })) // Parseo de JSON body con límite
app.use(cookieParser()) // Parseo de cookies
app.disable("x-powered-by") // Ocultar tecnología del servidor por seguridad
cron.schedule("0 * * * *", limpiarUsuariosNoVerificados)

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
