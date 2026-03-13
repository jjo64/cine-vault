import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, Check, Heart, ListPlus, Star } from 'lucide-react'
import { fetchTVDetail, type TVDetailApi } from '../services/tvDetailServices'
import {
  addToDiary,
  addToFavorites,
  addToWatchlist,
  createReview,
  fetchMovieReviews,
  fetchMyDiary,
  fetchMyFavorites,
  fetchMyReviews,
  fetchMyWatchlist,
  fetchUserById,
  removeFromDiary,
  removeFromFavorites,
  removeFromWatchlist,
  updateReview,
  type ReviewApi,
} from '../services/movieDetailServices'
import { getCurrentUser, getStoredAccessToken } from '../services/authServices'
import './TVDetail.css'

const C = {
  bg: '#080808',
  surface: '#111111',
  elevated: '#1A1A1A',
  border: '#252525',
  accent: '#D4AF7A',
  text: '#E2E2E2',
  textSoft: '#7A7A7A',
} as const

const TMDB_ORIGINAL = 'https://image.tmdb.org/t/p/original'
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500'
const TMDB_THUMB = 'https://image.tmdb.org/t/p/w300'

function image(path?: string | null, base = TMDB_ORIGINAL) {
  return path ? `${base}${path}` : ''
}

type AppReview = ReviewApi & {
  username: string
}

type EpisodeUI = {
  id: number
  name: string
  air_date?: string | null
  episode_number?: number
  runtime?: number | null
  still_path?: string | null
}

type SeasonUI = {
  id: number
  name: string
  season_number: number
  episode_count?: number
  air_date?: string | null
  episodes?: EpisodeUI[]
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <div className="tv-star-input" role="radiogroup" aria-label="Tu rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Puntuar ${star}`}
          aria-checked={value === star}
          className={`tv-star-btn ${value >= star ? 'active' : ''}`}
          onClick={() => onChange(star)}
        >
          <Star size={15} />
        </button>
      ))}
    </div>
  )
}

function uniqueProviders(entry?: { flatrate?: Array<{ provider_name: string }>; rent?: Array<{ provider_name: string }>; buy?: Array<{ provider_name: string }> }) {
  const all = [...(entry?.flatrate || []), ...(entry?.rent || []), ...(entry?.buy || [])]
  return Array.from(new Set(all.map((provider) => provider.provider_name).filter(Boolean))).slice(0, 10)
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin dato'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TVDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<TVDetailApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null)
  const [castTab, setCastTab] = useState<'cast' | 'crew'>('cast')
  const [rating, setRating] = useState(0)
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

  const providers = useMemo(() => {
    if (!detail?.watch_providers) return []
    const preferred = ['ES', 'US']
    const entries = Object.entries(detail.watch_providers)
    const selected = preferred
      .map((code) => [code, detail.watch_providers?.[code]] as const)
      .filter(([, value]) => !!value)

    if (selected.length > 0) return selected
    return entries.slice(0, 2)
  }, [detail?.watch_providers])

  const castItems = (detail?.credits?.cast || []).slice(0, 16)
  const crewByDepartment = useMemo(() => {
    const source = detail?.credits?.crew || []
    const map = new Map<string, Array<{ id: number; name: string; job?: string; profile_path?: string | null }>>()
    source.forEach((person) => {
      const key = person.department || person.job || 'Crew'
      if (!map.has(key)) map.set(key, [])
      map.get(key)?.push(person)
    })
    return Array.from(map.entries())
      .map(([department, members]) => ({ department, members: members.slice(0, 10) }))
      .slice(0, 4)
  }, [detail?.credits?.crew])

  const seasons = useMemo<SeasonUI[]>(() => {
    if (!detail?.season_details || detail.season_details.length === 0) {
      return (detail?.seasons || []).map((season) => ({
        id: season.id,
        name: season.name,
        season_number: season.season_number,
        episode_count: season.episode_count,
        air_date: season.air_date,
        episodes: [],
      }))
    }

    return detail.season_details.map((season) => ({
      id: season.id,
      name: season.name,
      season_number: season.season_number,
      episode_count: season.episode_count,
      air_date: season.air_date,
      episodes: season.episodes || [],
    }))
  }, [detail?.season_details, detail?.seasons])

  useEffect(() => {
    if (!id) return

    let alive = true

    fetchTVDetail(id)
      .then((data) => {
        if (!alive) return
        setDetail(data)
        if (Array.isArray(data?.season_details) && data.season_details.length > 0) {
          const first = data.season_details.find((season) => season.season_number >= 1) || data.season_details[0]
          setExpandedSeason(first?.season_number ?? null)
        }
      })
      .catch((err) => {
        if (!alive) return
        setError((err as Error).message || 'No se pudo cargar la serie')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    if (!detail?.id) return

    let alive = true
    const token = getStoredAccessToken()

    const loadSessionState = async () => {
      try {
        if (!token) {
          setIsAuthenticated(false)
          return
        }

        await getCurrentUser()
        if (!alive) return
        setIsAuthenticated(true)

        const [favorites, watchlist, diary, myReviews, rawReviews] = await Promise.all([
          fetchMyFavorites(token),
          fetchMyWatchlist(token),
          fetchMyDiary(token),
          fetchMyReviews(token),
          fetchMovieReviews(detail.id),
        ])

        if (!alive) return

        const favoriteHit = favorites.some((entry) => entry.tmdb_id === detail.id || entry.movie_id === detail.id)
        const watchlistHit = watchlist.some((entry) => entry.tmdb_id === detail.id || entry.movie_id === detail.id)
        const diaryHit = (diary.diary || []).find((entry) => entry.tmdb_id === detail.id || entry.movie_id === detail.id)
        const myReview = myReviews.find((entry) => entry.tmdb_id === detail.id || entry.movie_id === detail.id)

        setIsFavorite(favoriteHit)
        setInWatchlist(watchlistHit)
        setInDiary(Boolean(diaryHit))
        setDiaryEntryId(diaryHit?.id ?? null)
        setMyReviewId(myReview?.id ?? null)
        setRating(Number(myReview?.rating || 0))
        setReviewText(String(myReview?.content || ''))

        const withUsers = await Promise.all(
          rawReviews.slice(0, 12).map(async (review) => {
            try {
              const user = await fetchUserById(review.user_id)
              return { ...review, username: user.username || `user-${review.user_id}` }
            } catch {
              return { ...review, username: `user-${review.user_id}` }
            }
          })
        )

        if (alive) setReviews(withUsers)
      } catch {
        if (alive) setIsAuthenticated(false)
      }
    }

    loadSessionState()

    return () => {
      alive = false
    }
  }, [detail?.id])

  const runProtectedAction = async (action: () => Promise<void>) => {
    const token = getStoredAccessToken()
    if (!token) {
      setActionMessage('Inicia sesión para usar acciones de tu vault.')
      return
    }

    try {
      setSavingAction(true)
      setActionMessage(null)
      await action()
    } catch (actionError) {
      setActionMessage((actionError as Error).message || 'No se pudo completar la acción')
    } finally {
      setSavingAction(false)
    }
  }

  const handleToggleFavorite = () => {
    if (!detail) return
    runProtectedAction(async () => {
      const token = getStoredAccessToken()
      if (!token) return
      if (isFavorite) {
        await removeFromFavorites(token, detail.id)
        setIsFavorite(false)
        setActionMessage('Quitada de favoritos')
      } else {
        await addToFavorites(token, detail.id)
        setIsFavorite(true)
        setActionMessage('Añadida a favoritos')
      }
    })
  }

  const handleToggleWatchlist = () => {
    if (!detail) return
    runProtectedAction(async () => {
      const token = getStoredAccessToken()
      if (!token) return
      if (inWatchlist) {
        await removeFromWatchlist(token, detail.id)
        setInWatchlist(false)
        setActionMessage('Quitada de watchlist')
      } else {
        await addToWatchlist(token, detail.id)
        setInWatchlist(true)
        setActionMessage('Añadida a watchlist')
      }
    })
  }

  const handleToggleDiary = () => {
    if (!detail) return
    runProtectedAction(async () => {
      const token = getStoredAccessToken()
      if (!token) return
      if (inDiary && diaryEntryId) {
        await removeFromDiary(token, diaryEntryId)
        setInDiary(false)
        setDiaryEntryId(null)
        setActionMessage('Quitada del diario')
      } else {
        await addToDiary(token, detail.id)
        setInDiary(true)
        setActionMessage('Añadida al diario')
      }
    })
  }

  const handleSaveReview = () => {
    if (!detail) return
    runProtectedAction(async () => {
      const token = getStoredAccessToken()
      if (!token) return

      if (!rating || rating < 1) {
        setActionMessage('Selecciona una puntuación de 1 a 5.')
        return
      }

      if (myReviewId) {
        const updated = await updateReview(token, myReviewId, rating)
        setActionMessage('Reseña actualizada')
        setMyReviewId(updated.id)
      } else {
        const created = await createReview(token, detail.id, rating, reviewText.trim())
        setActionMessage('Reseña publicada')
        setMyReviewId(created.id)
      }
    })
  }

  if (!id) {
    return (
      <div className="tv-detail-empty">
        <button onClick={() => navigate(-1)} className="tv-back-button">
          Volver
        </button>
        <p style={{ marginTop: 16, color: '#ff9b9b' }}>ID de serie inválido.</p>
      </div>
    )
  }

  const creators =
    detail?.created_by && detail.created_by.length > 0
      ? detail.created_by.map((item) => item.name).slice(0, 3).join(', ')
      : null

  if (loading) {
    return (
      <div className="tv-detail-loading">
        Cargando serie...
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="tv-detail-empty">
        <button onClick={() => navigate(-1)} className="tv-back-button">
          Volver
        </button>
        <p style={{ marginTop: 16, color: '#ff9b9b' }}>{error || 'No encontramos la serie.'}</p>
      </div>
    )
  }

  return (
    <div className="tv-detail-page">
      <header
        className="tv-hero"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(8,8,8,0.25), rgba(8,8,8,0.96)), url(${image(detail.backdrop_path)})`,
        }}
      >
        <div className="tv-hero-content">
          <div style={{ marginBottom: 18 }}>
            <Link to="/" className="tv-brand-link">
              CineVault
            </Link>
          </div>
          <button onClick={() => navigate(-1)} className="tv-back-button">
            <ArrowLeft size={14} /> Volver
          </button>
          <h1 className="tv-title">{detail.name}</h1>
          <div className="tv-meta-line">
            {(detail.first_air_date || '').slice(0, 4) || 'Sin año'}
            {detail.number_of_seasons ? ` · ${detail.number_of_seasons} temporadas` : ''}
            {detail.vote_average ? ` · ${detail.vote_average.toFixed(1)} / 10` : ''}
            {detail.status ? ` · ${detail.status}` : ''}
          </div>
        </div>
      </header>

      <main className="tv-main">
        <section className="tv-top-grid">
          <aside className="tv-poster-wrap">
            {detail.poster_path ? (
              <img src={image(detail.poster_path, TMDB_POSTER)} alt={detail.name} className="tv-poster" />
            ) : (
              <div className="tv-poster tv-poster-fallback" />
            )}
          </aside>

          <section>
            {!!detail.tagline && (
              <p className="tv-tagline">{detail.tagline}</p>
            )}
            <p className="tv-overview">
              {detail.overview || 'Sin descripcion disponible.'}
            </p>

            <div className="tv-meta-grid">
              {!!creators && (
                <div className="tv-meta-item">
                  Creadores: <span style={{ color: C.text }}>{creators}</span>
                </div>
              )}
              {Array.isArray(detail.genres) && detail.genres.length > 0 && (
                <div className="tv-meta-item">
                  Géneros: <span style={{ color: C.text }}>{detail.genres.map((g) => g.name).join(', ')}</span>
                </div>
              )}
              {!!detail.last_air_date && (
                <div className="tv-meta-item">
                  Última emisión: <span style={{ color: C.text }}>{formatDate(detail.last_air_date)}</span>
                </div>
              )}
              {!!detail.number_of_episodes && (
                <div className="tv-meta-item">
                  Episodios: <span style={{ color: C.text }}>{detail.number_of_episodes}</span>
                </div>
              )}
            </div>

            <div className="tv-action-panel">
              <div className="tv-action-title">Acciones</div>
              <div className="tv-action-row">
                <button type="button" className={`tv-action-btn ${isFavorite ? 'active' : ''}`} onClick={handleToggleFavorite} disabled={savingAction}>
                  <Heart size={14} /> {isFavorite ? 'Favorito' : 'Favoritos'}
                </button>
                <button type="button" className={`tv-action-btn ${inWatchlist ? 'active' : ''}`} onClick={handleToggleWatchlist} disabled={savingAction}>
                  <ListPlus size={14} /> {inWatchlist ? 'En watchlist' : 'Watchlist'}
                </button>
                <button type="button" className={`tv-action-btn ${inDiary ? 'active' : ''}`} onClick={handleToggleDiary} disabled={savingAction}>
                  <Bookmark size={14} /> {inDiary ? 'En diario' : 'Log'}
                </button>
              </div>

              <div className="tv-review-panel">
                <div className="tv-review-title">Tu review</div>
                <StarRatingInput value={rating} onChange={setRating} />
                <textarea
                  className="tv-review-textarea"
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder="¿Qué te pareció la serie?"
                  rows={4}
                />
                <button type="button" className="tv-save-review" onClick={handleSaveReview} disabled={savingAction || !isAuthenticated}>
                  <Check size={14} /> Guardar review
                </button>
              </div>

              {actionMessage && <p className="tv-action-message">{actionMessage}</p>}
            </div>
          </section>
        </section>

        <section className="tv-section">
          <h2 className="tv-section-title">Temporadas</h2>
          <div className="tv-seasons-list">
            {seasons.map((season) => {
              const isOpen = expandedSeason === season.season_number
              return (
                <article key={season.id || season.season_number} className="tv-season-card">
                  <button
                    type="button"
                    className="tv-season-head"
                    onClick={() => setExpandedSeason(isOpen ? null : season.season_number)}
                  >
                    <div>
                      <div className="tv-season-title">{season.name || `Temporada ${season.season_number}`}</div>
                      <div className="tv-season-meta">
                        {season.episode_count || 0} episodios · estreno {formatDate(season.air_date)}
                      </div>
                    </div>
                    <span className="tv-season-toggle">{isOpen ? 'Ocultar' : 'Ver episodios'}</span>
                  </button>

                  {isOpen && Array.isArray(season.episodes) && season.episodes.length > 0 && (
                    <div className="tv-episodes-grid">
                      {season.episodes.slice(0, 18).map((episode: EpisodeUI) => (
                        <div key={episode.id} className="tv-episode-item">
                          <div className="tv-episode-thumb-wrap">
                            {episode.still_path ? (
                              <img className="tv-episode-thumb" src={image(episode.still_path, TMDB_THUMB)} alt={episode.name} />
                            ) : (
                              <div className="tv-episode-thumb tv-episode-thumb-fallback" />
                            )}
                          </div>
                          <div>
                            <div className="tv-episode-title">E{episode.episode_number}: {episode.name}</div>
                            <div className="tv-episode-meta">
                              {formatDate(episode.air_date)} {episode.runtime ? `· ${episode.runtime} min` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <section className="tv-section">
          <div className="tv-section-head-row">
            <h2 className="tv-section-title">Cast y Crew</h2>
            <div className="tv-cast-tabs">
              <button type="button" className={`tv-cast-tab ${castTab === 'cast' ? 'active' : ''}`} onClick={() => setCastTab('cast')}>Cast</button>
              <button type="button" className={`tv-cast-tab ${castTab === 'crew' ? 'active' : ''}`} onClick={() => setCastTab('crew')}>Crew</button>
            </div>
          </div>

          {castTab === 'cast' && (
            <div className="tv-cast-grid">
              {castItems.map((person) => (
                <div key={`cast-${person.id}`} className="tv-credit-card">
                  {person.profile_path ? (
                    <img src={image(person.profile_path, TMDB_THUMB)} alt={person.name} className="tv-credit-avatar" />
                  ) : (
                    <div className="tv-credit-avatar tv-credit-avatar-fallback" />
                  )}
                  <div className="tv-credit-name">{person.name}</div>
                  <div className="tv-credit-role">{person.character || 'Sin rol'}</div>
                </div>
              ))}
            </div>
          )}

          {castTab === 'crew' && (
            <div className="tv-crew-groups">
              {crewByDepartment.map((group) => (
                <article key={group.department} className="tv-crew-group">
                  <h3 className="tv-crew-title">{group.department}</h3>
                  <div className="tv-crew-list">
                    {group.members.map((member) => (
                      <div key={`crew-${group.department}-${member.id}`} className="tv-crew-item">
                        <span>{member.name}</span>
                        <span className="tv-crew-job">{member.job || 'Crew'}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="tv-section">
          <h2 className="tv-section-title">Dónde ver</h2>
          <div className="tv-providers-grid">
            {providers.length === 0 && <div className="tv-empty-block">No hay providers disponibles por ahora.</div>}
            {providers.map(([region, entry]) => (
              <article key={region} className="tv-provider-card">
                <div className="tv-provider-region">{region}</div>
                <div className="tv-provider-list">
                  {uniqueProviders(entry).length === 0 ? 'Sin plataformas' : uniqueProviders(entry).join(' · ')}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="tv-section">
          <h2 className="tv-section-title">Series similares</h2>
          <div className="tv-similar-grid">
            {(detail.similar?.results || []).slice(0, 10).map((item) => {
              const title = item.name || 'Serie'
              return (
                <Link key={`sim-${item.id}`} to={`/tv/${item.id}`} className="tv-similar-card">
                  {item.poster_path ? (
                    <img src={image(item.poster_path, TMDB_THUMB)} alt={title} className="tv-similar-poster" />
                  ) : (
                    <div className="tv-similar-poster tv-similar-fallback" />
                  )}
                  <div className="tv-similar-title">{title}</div>
                  <div className="tv-similar-meta">{(item.first_air_date || '').slice(0, 4) || '---'} · {(item.vote_average || 0).toFixed(1)}</div>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="tv-section">
          <h2 className="tv-section-title">Galería</h2>
          <div className="tv-gallery-grid">
            {(detail.images?.backdrops || []).slice(0, 8).map((backdrop, index) => (
              <img
                key={`back-${index}-${backdrop.file_path || 'empty'}`}
                src={image(backdrop.file_path, TMDB_THUMB)}
                alt={`${detail.name} backdrop ${index + 1}`}
                className="tv-gallery-item"
              />
            ))}
          </div>
        </section>

        <section className="tv-section">
          <h2 className="tv-section-title">Reviews</h2>
          <div className="tv-reviews-list">
            {reviews.length === 0 && <div className="tv-empty-block">Todavía no hay reviews para esta serie.</div>}
            {reviews.map((review) => (
              <article key={review.id} className="tv-review-card">
                <div className="tv-review-head">
                  <span className="tv-review-user">@{review.username}</span>
                  <span className="tv-review-rating">{Number(review.rating || 0).toFixed(1)} / 5</span>
                </div>
                <p className="tv-review-content">{review.content || 'Sin texto.'}</p>
                <span className="tv-review-date">{formatDate(review.created_at)}</span>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
