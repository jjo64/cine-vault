import { Request, Router } from "express"
// Middlewares
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  limitadorAuth,
  limitadorEmail,
} from "../middlewares/rateLimit.middleware.js"
import {
  validarBody,
  validarParams,
} from "../middlewares/validation.middleware.js"
// Controladores de autenticación
import {
  iniciarSesion,
  registrar,
  renovarToken,
  cerrarSesion,
  verificarToken,
  verificarEmail,
  verificarEmailDesdeQuery,
  reenviarVerificacion,
  controladorCallback,
  activar2FA,
  confirmar2FA,
  verificar2FA,
  olvidarContrasena,
  resetearContrasena,
  desactivar2FA,
  cambiarContrasena,
  revocarSesiones,
  listarSesiones,
  revocarSesion,
  recoveryCodesStatus,
  regenerarRecoveryCodes,
} from "../controllers/AuthController.js"
import passport from "passport"
// Esquemas de validación
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  twoFAConfirmSchema,
  twoFAVerifySchema,
  revokeSessionParamsSchema,
} from "../schemas/auth.js"


const router = Router()

const DEFAULT_LOCAL_GOOGLE_CALLBACK =
  "http://localhost:4000/api/auth/google/callback"
const GOOGLE_STATE_PREFIX = "cv_google_cb:"

const normalizeUrl = (value: string) => value.trim().replace(/\/+$/, "")

const getDefaultGoogleCallback = () => {
  const explicit = String(process.env.GOOGLE_REDIRECT_URI || "").trim()
  if (explicit) return explicit

  const backendUrl = String(process.env.BACKEND_URL || "").trim()
  if (backendUrl) return `${normalizeUrl(backendUrl)}/api/auth/google/callback`

  return DEFAULT_LOCAL_GOOGLE_CALLBACK
}

const getAllowedGoogleCallbacks = () => {
  const configured = String(process.env.GOOGLE_REDIRECT_URI_ALLOWLIST || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)

  return new Set([getDefaultGoogleCallback(), ...configured].map(normalizeUrl))
}

const buildGoogleState = (callbackUrl: string) => {
  const encoded = Buffer.from(callbackUrl, "utf8").toString("base64url")
  return `${GOOGLE_STATE_PREFIX}${encoded}`
}

const readCallbackFromState = (state: unknown) => {
  if (typeof state !== "string" || !state.startsWith(GOOGLE_STATE_PREFIX)) {
    return null
  }

  const encoded = state.slice(GOOGLE_STATE_PREFIX.length)
  if (!encoded) return null

  try {
    const decoded = Buffer.from(encoded, "base64url").toString("utf8").trim()
    return decoded || null
  } catch {
    return null
  }
}

const resolveGoogleCallback = (req: Request) => {
  const fromState = readCallbackFromState(req.query.state)
  const fromQuery =
    typeof req.query.redirect_uri === "string"
      ? req.query.redirect_uri.trim()
      : ""

  const candidate = normalizeUrl(
    fromState || fromQuery || getDefaultGoogleCallback()
  )
  const allowlist = getAllowedGoogleCallbacks()
  if (allowlist.has(candidate)) return candidate

  return getDefaultGoogleCallback()
}

// ---------------------------------------------------------------------------
// RUTAS PÚBLICAS CON RATE LIMIT ESTRICTO (brute force protection)
// ---------------------------------------------------------------------------
// Login → máximo 5 intentos por IP cada 15 minutos
router.post(
  "/login",
  limitadorAuth,
  validarBody(loginSchema),
  manejadorAsincrono(iniciarSesion)
)
// Registro → mismo límite para evitar creación masiva de cuentas
router.post("/register", limitadorAuth, manejadorAsincrono(registrar))
// 2FA paso 2 → límite estricto igual que login
router.post(
  "/2fa/verificar",
  limitadorAuth,
  validarBody(twoFAVerifySchema),
  manejadorAsincrono(verificar2FA)
)

// Emails → máximo 3 por hora para evitar spam
router.post(
  "/resend-verification",
  limitadorEmail,
  validarBody(forgotPasswordSchema),
  manejadorAsincrono(reenviarVerificacion)
)
router.post(
  "/forgot-password",
  limitadorEmail,
  validarBody(forgotPasswordSchema),
  manejadorAsincrono(olvidarContrasena)
)

// ---------------------------------------------------------------------------
// RUTAS PÚBLICAS SIN LIMIT ESTRICTO
// ---------------------------------------------------------------------------
router.post("/verify-email/:token", manejadorAsincrono(verificarEmail))
router.get("/verify-email", manejadorAsincrono(verificarEmailDesdeQuery))
router.post(
  "/reset-password",
  validarBody(resetPasswordSchema),
  manejadorAsincrono(resetearContrasena)
)
router.post("/refresh", manejadorAsincrono(renovarToken))

// ---------------------------------------------------------------------------
// GOOGLE OAuth
// ---------------------------------------------------------------------------
router.get("/google", (req, res, next) => {
  const callbackURL = resolveGoogleCallback(req)
  const state = buildGoogleState(callbackURL)
  const authOptions = {
    scope: ["profile", "email"],
    callbackURL,
    state,
  } as unknown as Parameters<typeof passport.authenticate>[1]

  passport.authenticate("google", authOptions)(req, res, next)
})
router.get(
  "/google/callback",
  (req, res, next) => {
    const callbackURL = resolveGoogleCallback(req)
    const authOptions = {
      failureRedirect: "/api/auth/google",
      callbackURL,
    } as unknown as Parameters<typeof passport.authenticate>[1]

    passport.authenticate("google", authOptions)(req, res, next)
  },
  controladorCallback
)

// ---------------------------------------------------------------------------
// RUTAS PROTEGIDAS (requieren token)
// ---------------------------------------------------------------------------
router.post("/logout", manejadorAsincrono(cerrarSesion))
router.get(
  "/verify",
  middlewareAutenticacion,
  manejadorAsincrono(verificarToken)
)
router.post(
  "/cambiar-contrasena",
  middlewareAutenticacion,
  validarBody(changePasswordSchema),
  manejadorAsincrono(cambiarContrasena)
)
router.post(
  "/revocar-sesiones",
  middlewareAutenticacion,
  manejadorAsincrono(revocarSesiones)
)
router.get(
  "/sessions",
  middlewareAutenticacion,
  manejadorAsincrono(listarSesiones)
)
router.delete(
  "/sessions/:id",
  middlewareAutenticacion,
  validarParams(revokeSessionParamsSchema),
  manejadorAsincrono(revocarSesion)
)
router.post(
  "/2fa/activar",
  middlewareAutenticacion,
  manejadorAsincrono(activar2FA)
)
router.post(
  "/2fa/desactivar",
  middlewareAutenticacion,
  manejadorAsincrono(desactivar2FA)
)
router.post(
  "/2fa/confirmar",
  middlewareAutenticacion,
  validarBody(twoFAConfirmSchema),
  manejadorAsincrono(confirmar2FA)
)
router.get(
  "/2fa/recovery-codes/status",
  middlewareAutenticacion,
  manejadorAsincrono(recoveryCodesStatus)
)
router.post(
  "/2fa/recovery-codes/regenerar",
  middlewareAutenticacion,
  validarBody(twoFAConfirmSchema),
  manejadorAsincrono(regenerarRecoveryCodes)
)

export default router
