import { useState, useEffect } from 'react'
import {
  addToDiary, addToFavorites, addToWatchlist, createReview,
  fetchMovieReviews, fetchMyDiary, fetchMyFavorites, fetchMyReviews,
  fetchMyWatchlist, fetchUserById, removeFromDiary, removeFromFavorites,
  removeFromWatchlist, updateReview, type ReviewApi,
} from '../../../services/movieDetailServices'
import { getCurrentUser, getStoredAccessToken } from '../../../services/authServices'

export type AppReview = ReviewApi & { username: string }

export function useUserActions(detailId: number | undefined) {
  const [userRating, setUserRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [savingAction, setSavingAction] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [inDiary, setInDiary] = useState(false)
  const [diaryEntryId, setDiaryEntryId] = useState<number | null>(null)
  const [reviews, setReviews] = useState<AppReview[]>([])
  const [myReviewId, setMyReviewId] = useState<number | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (!detailId) return
    let alive = true
    const token = getStoredAccessToken()

    const load = async () => {
      try {
        if (!token) return
        await getCurrentUser()
        if (!alive) return
        setIsAuthenticated(true)

        const [favs, wl, diary, myRev, rawRev] = await Promise.all([
          fetchMyFavorites(token),
          fetchMyWatchlist(token),
          fetchMyDiary(token),
          fetchMyReviews(token),
          fetchMovieReviews(detailId),
        ])
        if (!alive) return

        setIsFavorite(favs.some(e => e.tmdb_id === detailId || e.movie_id === detailId))
        setInWatchlist(wl.some(e => e.tmdb_id === detailId || e.movie_id === detailId))

        const diaryHit = (diary.diary || []).find(
          e => e.tmdb_id === detailId || e.movie_id === detailId
        )
        setInDiary(Boolean(diaryHit))
        setDiaryEntryId(diaryHit?.id ?? null)

        const myRev_ = myRev.find(
          e => e.tmdb_id === detailId || e.movie_id === detailId
        )
        setMyReviewId(myRev_?.id ?? null)
        setUserRating(Number(myRev_?.rating || 0))
        setReviewText(String(myRev_?.content || ''))

        const withUsers = await Promise.all(
          rawRev.slice(0, 12).map(async r => {
            try {
              const u = await fetchUserById(r.user_id)
              return { ...r, username: u.username || `user-${r.user_id}` }
            } catch {
              return { ...r, username: `user-${r.user_id}` }
            }
          })
        )
        if (alive) setReviews(withUsers)
      } catch {
        if (alive) setIsAuthenticated(false)
      }
    }

    load()
    return () => { alive = false }
  }, [detailId])

  const runProtected = async (action: () => Promise<void>) => {
    const token = getStoredAccessToken()
    if (!token) {
      setActionMessage('Inicia sesión para usar esta acción.')
      return
    }
    try {
      setSavingAction(true)
      setActionMessage(null)
      await action()
    } catch (e) {
      setActionMessage((e as Error).message || 'Error')
    } finally {
      setSavingAction(false)
    }
  }

  const handleVault = (detailId: number, inDiary: boolean, diaryEntryId: number | null) => {
    runProtected(async () => {
      const token = getStoredAccessToken()!
      if (inDiary && diaryEntryId) {
        await removeFromDiary(token, diaryEntryId)
        await removeFromFavorites(token, detailId)
        setInDiary(false)
        setDiaryEntryId(null)
        setIsFavorite(false)
        setActionMessage('Quitada del Vault')
      } else {
        await addToDiary(token, detailId)
        await addToFavorites(token, detailId)
        setInDiary(true)
        setIsFavorite(true)
        setActionMessage('Añadida al Vault')
      }
    })
  }

  const handleWatchlist = (detailId: number, inWatchlist: boolean) => {
    runProtected(async () => {
      const token = getStoredAccessToken()!
      if (inWatchlist) {
        await removeFromWatchlist(token, detailId)
        setInWatchlist(false)
        setActionMessage('Quitada de watchlist')
      } else {
        await addToWatchlist(token, detailId)
        setInWatchlist(true)
        setActionMessage('Añadida a watchlist')
      }
    })
  }

  const handleSaveReview = (detailId: number, myReviewId: number | null, userRating: number, reviewText: string) => {
    runProtected(async () => {
      const token = getStoredAccessToken()!
      if (!userRating || userRating < 1) {
        setActionMessage('Selecciona una puntuación.')
        return
      }
      if (myReviewId) {
        const u = await updateReview(token, myReviewId, userRating)
        setMyReviewId(u.id)
        setActionMessage('Reseña actualizada')
      } else {
        const c = await createReview(token, {
          movie_id: detailId,
          mode: 'RAPIDO',
          rating: userRating,
          content: reviewText.trim() || 'Reseña desde TVDetail',
        })
        setMyReviewId(c.id)
        setActionMessage('Reseña publicada')
      }
    })
  }

  return {
    userRating, setUserRating,
    reviewText, setReviewText,
    savingAction,
    actionMessage,
    isFavorite,
    inWatchlist,
    inDiary,
    diaryEntryId,
    reviews,
    myReviewId,
    isAuthenticated,
    handleVault,
    handleWatchlist,
    handleSaveReview,
  }
}