/**
 * @file passport.config.ts
 * @description Configuración de estrategias de autenticación mediante Passport.js.
 * Implementa la integración con Google OAuth 2.0 para permitir el inicio 
 * de sesión social en CineVault.
 */

import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { prisma } from "../lib/prisma.js"
import { randomBytes } from "crypto"

/**
 * Estrategia de Google OAuth.
 * Se encarga de validar el perfil del usuario devuelto por Google y 
 * sincronizarlo con nuestra base de datos local (Prisma).
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value
        if (!email) throw new Error("El perfil de Google no contiene un correo electrónico")

        // 1. Intentamos localizar al usuario por su email
        let usuario = await prisma.users.findUnique({ where: { email } })

        // 2. Si el usuario no existe, creamos una nueva cuenta verificada automáticamente
        if (!usuario) {
          usuario = await prisma.users.create({
            data: {
              email,
              username: profile.displayName,
              // Asignamos un password aleatorio inalcanzable para cuentas OAuth
              password: randomBytes(32).toString("hex"),
              google_id: profile.id,
              is_verified: true, // Google ya garantiza la veracidad del correo
            },
          })
        } 
        // 3. Si existe pero no tiene Google ID, vinculamos la cuenta actual
        else if (!usuario.google_id) {
          usuario = await prisma.users.update({
            where: { email },
            data: { google_id: profile.id },
          })
        }

        return done(null, usuario)
      } catch (error) {
        console.error("Error en flujo Passport-Google:", error)
        return done(error)
      }
    }
  )
)
