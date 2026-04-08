import { Request, Response } from "express"
import {
  getFriendsFeedService,
  setFeedBookmarkService,
  setFeedHideService,
  setFeedLikeService,
  trackFeedShareService,
} from "../services/feed.services.js"
import { FeedQueryDTO } from "../schemas/feed.js"

export const getFeed = async (req: Request, res: Response) => {
  const payload = await getFriendsFeedService(req.user!.user_id, req.query as unknown as FeedQueryDTO)
  res.json(payload)
}

export const postFeedLike = async (req: Request, res: Response) => {
  const payload = await setFeedLikeService(req.user!.user_id, req.body)
  res.json(payload)
}

export const postFeedBookmark = async (req: Request, res: Response) => {
  const payload = await setFeedBookmarkService(req.user!.user_id, req.body)
  res.json(payload)
}

export const postFeedHide = async (req: Request, res: Response) => {
  const payload = await setFeedHideService(req.user!.user_id, req.body)
  res.json(payload)
}

export const postFeedShare = async (req: Request, res: Response) => {
  const payload = await trackFeedShareService(req.user!.user_id, req.body)
  res.status(201).json(payload)
}
