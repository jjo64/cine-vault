import { Router } from "express"
import { authMiddleware } from "../middlewares/auth.middlewares.js"
import { getAllUsers, getUserById, getFollowers, getFollowing, unfollowUser, followUser, updateProfile } from "../controllers/UserController.js"
import { asyncHandler } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * Rutas de Usuarios:
 * Todas envueltas en asyncHandler para centralizar errores.
 */

router.get('/', authMiddleware, asyncHandler(getAllUsers))
router.get('/:id', asyncHandler(getUserById))
router.patch('/profile', authMiddleware, asyncHandler(updateProfile))

router.post('/follow/:id', authMiddleware, asyncHandler(followUser))
router.delete('/unfollow/:id', authMiddleware, asyncHandler(unfollowUser))
router.get('/:id/followers', asyncHandler(getFollowers))
router.get('/:id/following', asyncHandler(getFollowing))

export default router
