import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { prisma } from "../lib/prisma.js"

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      // Buscar o crear usuario en DB
    }
  )
)
