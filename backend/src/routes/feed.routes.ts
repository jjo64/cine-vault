import { Router } from "express"
import {
  getFeed,
  postFeedBookmark,
  postFeedHide,
  postFeedLike,
  postFeedShare,
} from "../controllers/FeedController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  validarBody,
  validarQuery,
} from "../middlewares/validation.middleware.js"
import {
  feedBookmarkActionSchema,
  feedHideActionSchema,
  feedLikeActionSchema,
  feedQuerySchema,
  feedShareActionSchema,
} from "../schemas/feed.js"

const router = Router()

router.get(
  "/",
  middlewareAutenticacion,
  validarQuery(feedQuerySchema),
  manejadorAsincrono(getFeed)
)

router.post(
  "/actions/like",
  middlewareAutenticacion,
  validarBody(feedLikeActionSchema),
  manejadorAsincrono(postFeedLike)
)

router.post(
  "/actions/bookmark",
  middlewareAutenticacion,
  validarBody(feedBookmarkActionSchema),
  manejadorAsincrono(postFeedBookmark)
)

router.post(
  "/actions/hide",
  middlewareAutenticacion,
  validarBody(feedHideActionSchema),
  manejadorAsincrono(postFeedHide)
)

router.post(
  "/actions/share",
  middlewareAutenticacion,
  validarBody(feedShareActionSchema),
  manejadorAsincrono(postFeedShare)
)

export default router
