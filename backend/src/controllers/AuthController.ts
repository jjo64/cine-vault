import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { IAuthRequest } from '../middlewares/auth.middlewares.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { validateUser } from '../schemas/user.js'

export const login = async (req: IAuthRequest, res: Response) => {
    const { username, password } = req.body
    
    // Validación de presencia básica
    if (!username || !password) return res.status(400).json({ message: "Username and password required" })

    const user = await prisma.users.findUnique({ where: { username } })
    if (!user) return res.status(404).json({ message: "User not found" })

    //const validPassword = await bcrypt.compare(password, user.password)
    const validPassword = user.password === password
    if (!validPassword) return res.status(401).json({ message: "Invalid password" })

    const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET as string,
        { expiresIn: "10m" }
    )

    res.json({ token })
}

export const register = async (req: IAuthRequest, res: Response) => {
    const validation = validateUser(req.body);
    if (!validation.success || !validation.data) {
        return res.status(400).json({ 
            message: "Error de validación", 
            errors: validation.errorMessages || ["Error desconocido"]
        });
    }

    const { email, username, password } = validation.data;

    const user = await prisma.users.findUnique({ where: { email } })
    if (user) return res.status(400).json({ message: "User already exists" })

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await prisma.users.create({
        data: {
            email,
            username,
            password: hashedPassword
        }
    })

    res.json({ message: "User created successfully" })
}
