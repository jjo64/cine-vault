import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { IAuthRequest, RefreshPayload } from '../middlewares/auth.middlewares.js'
import jwt from 'jsonwebtoken'
import { validateUser } from '../schemas/user.js'
import { createAccessToken, createRefreshToken, hashPassword, verifyRefreshToken, comparePassword } from "../services/auth.services.js"

// Mensajes de error constantes para consistencia
const MESSAGES = {
  CREDENTIALS_ERROR: "Credenciales incorrectas",
  USER_EXISTS: "El usuario ya está registrado",
  VALIDATION_ERROR: "Error de validación",
  TOKEN_REQUIRED: "Token de acceso requerido",
  REFRESH_TOKEN_REQUIRED: "No se proporcionó refresh token",
  INVALID_TOKEN: "Token inválido o expirado",
  USER_NOT_FOUND: "Usuario no encontrado",
  LOGOUT_SUCCESS: "Sesión cerrada exitosamente",
  SERVER_ERROR: "Error interno del servidor"
}

/* ==========================================================================
   CONTROLADOR DE AUTENTICACIÓN
   --------------------------------------------------------------------------
   Maneja el inicio de sesión, registro, renovación de tokens y cierre de sesión.
   ========================================================================== */

/**
 * Inicia sesión de usuario.
 * Valida credenciales, genera tokens de acceso y refresh, y establece la cookie segura.
 */
export const login = async (req: IAuthRequest, res: Response) => {
    try {
        const { username, password } = req.body
        
        // Validación básica de entrada
        if (!username || !password) {
            return res.status(400).json({ message: MESSAGES.CREDENTIALS_ERROR })
        }
    
        // Buscar usuario en DB
        const user = await prisma.users.findUnique({ where: { username } })
        if (!user) return res.status(401).json({ message: MESSAGES.CREDENTIALS_ERROR })
    
        // Verificar contraseña usando bcrypt (seguro)
        const validPassword = await comparePassword(password, user.password)
        if (!validPassword) return res.status(401).json({ message: MESSAGES.CREDENTIALS_ERROR })
    
        // Generar tokens
        const accessToken = createAccessToken(user.id, user.role as string)
        const { token: refresh_token } = await createRefreshToken(user.id)
    
        // Configurar cookie segura httpOnly para el refresh token
        res.cookie("refresh_token", refresh_token, {
            httpOnly: true, // No accesible por JS del cliente
            secure: true,   // Solo HTTPS (o localhost seguro)
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
        })
    
        res.json({ accessToken })
        
    } catch (error) {
        console.error("Login Error:", error)
        res.status(500).json({ message: MESSAGES.SERVER_ERROR })
    }
}

/**
 * Registra un nuevo usuario.
 * Valida datos con Zod, hashea la contraseña y guarda en BD.
 */
export const register = async (req: IAuthRequest, res: Response) => {
    try {
        // Validar esquema de datos
        const validation = validateUser(req.body);
        if (!validation.success || !validation.data) {
            return res.status(400).json({ 
                message: MESSAGES.VALIDATION_ERROR, 
                errors: validation.errorMessages || ["Datos inválidos"]
            });
        }
    
        const { email, username, password } = validation.data;
    
        // Verificar si el usuario ya existe
        const existingUser = await prisma.users.findUnique({ where: { email } })
        if (existingUser) return res.status(400).json({ message: MESSAGES.USER_EXISTS })
    
        // Crear usuario con contraseña hasheada
        const hashedPassword = await hashPassword(password)
        const newUser = await prisma.users.create({
            data: {
                email,
                username,
                password: hashedPassword
            }
        })
    
        res.status(201).json({ message: "Usuario registrado exitosamente", userId: newUser.id })
        
    } catch (error) {
        console.error("Register Error:", error)
        res.status(500).json({ message: MESSAGES.SERVER_ERROR })
    }
}

/**
 * Renueva el token de acceso usando el refresh token (cookie).
 */
export const refreshToken = async (req: IAuthRequest, res: Response) => {
    const token = req.cookies.refresh_token
    if (!token) return res.status(401).json({ message: MESSAGES.REFRESH_TOKEN_REQUIRED })
    
    try {
        // Verificar validez del refresh token y la sesión en DB
        const payload = await verifyRefreshToken(token)
        
        const user = await prisma.users.findUnique({ where: { id: payload.user_id } })
        if (!user) return res.status(404).json({ message: MESSAGES.USER_NOT_FOUND })

        // Generar nuevo access token
        const accessToken = createAccessToken(user.id, user.role as string)
        res.json({ accessToken })
        
    } catch (err) {
        // Si el refresh token no es válido, limpiar cookie y rechazar
        console.error("Refresh Token Error:", err)
        res.clearCookie("refresh_token")
        return res.status(401).json({ message: MESSAGES.INVALID_TOKEN })
    }
}

/**
 * Cierra la sesión del usuario.
 * Elimina la sesión de la BD y borra la cookie.
 */
export const logout = async (req: IAuthRequest, res: Response) => {
    try {
        const token = req.cookies.refresh_token
        if (token) {
            try {
                // Intentar borrar la sesión de la BD
                const payload = jwt.verify(token, process.env.REFRESH_SECRET!) as RefreshPayload
                await prisma.sessions.delete({ where: { id: payload.id_session } }).catch(() => null) // Ignorar error si no existe
            } catch (err) {
                // Token inválido, procedemos a limpiar cookie de todas formas
                console.warn("Logout warning: Token inválido o sesión ya borrada")
            }
        }
        
        // Siempre limpiar la cookie
        res.clearCookie("refresh_token")
        res.json({ message: MESSAGES.LOGOUT_SUCCESS })
        
    } catch (error) {
        res.status(500).json({ message: MESSAGES.SERVER_ERROR })
    }
}

/**
 * Verifica el token de acceso actual y devuelve los datos del usuario.
 * Usado por el frontend para persistir el login.
 */
export const verifyToken = async (req: IAuthRequest, res: Response) => {
    try {
        // req.user ya está poblado por el middleware 'authMiddleware'
        if (!req.user) return res.status(401).json({ message: MESSAGES.TOKEN_REQUIRED })

        const user = await prisma.users.findUnique({
            where: { id: req.user.user_id },
            select: { id: true, username: true, email: true, role: true } // Solo devolver campos seguros
        })

        if (!user) return res.status(404).json({ message: MESSAGES.USER_NOT_FOUND })

        res.json(user)
    } catch (error) {
        console.error("Verify Token Error:", error)
        res.status(500).json({ message: MESSAGES.SERVER_ERROR })
    }
}
