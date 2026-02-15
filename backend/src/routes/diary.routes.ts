import { Router } from "express"
import { createDiary, getDiary } from "../controllers/DiaryController.js"
import { authMiddleware } from "../middlewares/auth.middlewares.js"
import { asyncHandler } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * Rutas del Diario protegidas con autenticación y centralizadas con asyncHandler.
 */
router.get('/:id', asyncHandler(getDiary))
router.post('/add', authMiddleware, asyncHandler(createDiary))
// router.delete('/remove/:id', authMiddleware, removeDiary)

export default router