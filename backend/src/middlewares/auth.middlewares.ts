import { Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma.js"
import jwt from "jsonwebtoken"

interface JwtPayload {
  id: string
  username: string
}

// Extiende Request para usar user
export interface IAuthRequest extends Request {
  user?: JwtPayload
}

export const authMiddleware = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) return res.status(401).json({ message: "No token provided" })

  try {
    const secret = process.env.JWT_SECRET || "secret123"
    const payload = jwt.verify(token, secret) as JwtPayload
    req.user = payload
    next()
  } catch (err) {
    res.status(401).json({ message: "Invalid token" })
  }
}
