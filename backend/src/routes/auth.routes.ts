import { Router, Response } from "express"
import { authMiddleware, IAuthRequest } from "../middlewares/auth.middlewares.js"
import { login, register } from "../controllers/AuthController.js"
import { asyncHandler } from "../middlewares/error.middlewares.js"

const router = Router()

// Solo para probar
router.get("/me", authMiddleware, asyncHandler((req: IAuthRequest, res: Response) => {
  res.json({
    id: req.user?.id,
    username: req.user?.username
  })
}))

// Refresh token
router.post("/refresh", authMiddleware, asyncHandler((req: IAuthRequest, res: Response) => {
  res.json({
    id: req.user?.id,
    username: req.user?.username
  })
}))

// Logout
router.post("/logout", authMiddleware, asyncHandler(async (req: IAuthRequest, res: Response) => {
  res.json({
    id: req.user?.id,
    username: req.user?.username
  })
}))

// Register
router.post("/register", asyncHandler(register))
// Login
router.post('/login', asyncHandler(login))

export default router
