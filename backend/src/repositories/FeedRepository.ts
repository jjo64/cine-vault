import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

type FeedItemType =
  | "review"
  | "vault"
  | "watchlist"
  | "discovery"
  | "tonight"
  | "list"
  | "quote"

export class FeedRepository {
  async listSourceUserIds(viewerId: number) {
    const following = await prisma.follows.findMany({
      where: { follower_id: viewerId },
      select: { following_id: true },
    })

    return [viewerId, ...following.map((entry) => entry.following_id)]
  }

  async listFeedRows(sourceUserIds: number[]) {
    const [reviews, vaultEntries, watchlistEntries] = await Promise.all([
      prisma.reviews.findMany({
        where: { user_id: { in: sourceUserIds } },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
        take: 160,
        orderBy: { created_at: "desc" },
      }),
      prisma.vault.findMany({
        where: { user_id: { in: sourceUserIds } },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
        take: 160,
        orderBy: { added_at: "desc" },
      }),
      prisma.watchlist.findMany({
        where: { user_id: { in: sourceUserIds } },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
        take: 160,
        orderBy: { added_at: "desc" },
      }),
    ])

    return { reviews, vaultEntries, watchlistEntries }
  }

  async listLikedReviewIds(viewerId: number, reviewIds: number[]) {
    if (reviewIds.length === 0) return []

    const likes = await prisma.review_likes.findMany({
      where: {
        user_id: viewerId,
        review_id: { in: reviewIds },
      },
      select: { review_id: true },
    })

    return likes.map((item) => item.review_id)
  }

  async listBookmarkedRefs(
    viewerId: number,
    refs: Array<{ item_type: FeedItemType; item_id: number }>
  ) {
    if (!refs.length) return []

    const byType = refs.reduce<Record<FeedItemType, number[]>>(
      (acc, ref) => {
        if (!acc[ref.item_type]) acc[ref.item_type] = []
        acc[ref.item_type].push(ref.item_id)
        return acc
      },
      {} as Record<FeedItemType, number[]>
    )

    const conditions = Object.entries(byType).map(
      ([itemType, itemIds]) =>
        Prisma.sql`(item_type = ${itemType as FeedItemType} AND item_id IN (${Prisma.join(itemIds)}))`
    )

    return prisma.$queryRaw<
      Array<{ item_type: FeedItemType; item_id: number }>
    >(Prisma.sql`
      SELECT item_type, item_id
      FROM user_feed_bookmarks
      WHERE user_id = ${viewerId}
        AND (${Prisma.join(conditions, " OR ")})
    `)
  }

  async listHiddenRefs(
    viewerId: number,
    refs: Array<{ item_type: FeedItemType; item_id: number }>
  ) {
    if (!refs.length) return []

    const byType = refs.reduce<Record<FeedItemType, number[]>>(
      (acc, ref) => {
        if (!acc[ref.item_type]) acc[ref.item_type] = []
        acc[ref.item_type].push(ref.item_id)
        return acc
      },
      {} as Record<FeedItemType, number[]>
    )

    const conditions = Object.entries(byType).map(
      ([itemType, itemIds]) =>
        Prisma.sql`(item_type = ${itemType as FeedItemType} AND item_id IN (${Prisma.join(itemIds)}))`
    )

    return prisma.$queryRaw<
      Array<{ item_type: FeedItemType; item_id: number }>
    >(Prisma.sql`
      SELECT item_type, item_id
      FROM user_feed_hides
      WHERE user_id = ${viewerId}
        AND (${Prisma.join(conditions, " OR ")})
    `)
  }

  async existsReview(reviewId: number) {
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
      select: { id: true },
    })
    return Boolean(review)
  }

  async setReviewLike(viewerId: number, reviewId: number, active: boolean) {
    return prisma.$transaction(async (tx) => {
      if (active) {
        await tx.$executeRaw(Prisma.sql`
          INSERT IGNORE INTO review_likes (user_id, review_id)
          VALUES (${viewerId}, ${reviewId})
        `)
      } else {
        await tx.$executeRaw(Prisma.sql`
          DELETE FROM review_likes
          WHERE user_id = ${viewerId} AND review_id = ${reviewId}
        `)
      }

      const rows = await tx.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*) AS total
        FROM review_likes
        WHERE review_id = ${reviewId}
      `)

      const likes = Number(rows[0]?.total ?? 0)

      await tx.$executeRaw(Prisma.sql`
        UPDATE reviews
        SET likes = ${likes}
        WHERE id = ${reviewId}
      `)

      return likes
    })
  }

  async setBookmark(
    viewerId: number,
    itemType: FeedItemType,
    itemId: number,
    active: boolean
  ) {
    if (active) {
      await prisma.$executeRaw(Prisma.sql`
        INSERT IGNORE INTO user_feed_bookmarks (user_id, item_type, item_id)
        VALUES (${viewerId}, ${itemType}, ${itemId})
      `)
      return
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM user_feed_bookmarks
      WHERE user_id = ${viewerId} AND item_type = ${itemType} AND item_id = ${itemId}
    `)
  }

  async setHidden(
    viewerId: number,
    itemType: FeedItemType,
    itemId: number,
    active: boolean
  ) {
    if (active) {
      await prisma.$executeRaw(Prisma.sql`
        INSERT IGNORE INTO user_feed_hides (user_id, item_type, item_id)
        VALUES (${viewerId}, ${itemType}, ${itemId})
      `)
      return
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM user_feed_hides
      WHERE user_id = ${viewerId} AND item_type = ${itemType} AND item_id = ${itemId}
    `)
  }

  async createShareEvent(
    viewerId: number,
    itemType: FeedItemType,
    itemId: number,
    channel?: string
  ) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO feed_share_events (user_id, item_type, item_id, channel)
      VALUES (${viewerId}, ${itemType}, ${itemId}, ${channel || null})
    `)
  }
}

export const feedRepository = new FeedRepository()
