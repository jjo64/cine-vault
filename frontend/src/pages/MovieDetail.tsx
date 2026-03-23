import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Bookmark, ChevronLeft, ChevronRight, ExternalLink, Heart, List, Menu, MessageSquare, Pencil, Share2, Trash2, X } from 'lucide-react'
import './MovieDetail.css'
import { createSlug } from '../utils/stringUtils'
import { resolveNavPathWithFallback } from '../lib/navigation'
import { SeoHead } from '../components/SeoHead'
import { buildMovieSchema } from '../utils/seo/buildMovieSchema'
import {
  addToDiary,
  removeFromDiary,
  deleteReview,
  addToFavorites,
  addToWatchlist,
  commentOnReview,
  createReview,
  updateReviewContent,
  fetchMovieDetail,
  fetchMovieReviews,
  fetchReviewComments,
  fetchMyDiary,
  fetchMyFavorites,
  fetchMyReviews,
  fetchSearchMovies,
  fetchMyWatchlist,
  fetchTopRatedMovies,
  fetchUserById,
  likeReview,
  removeFromFavorites,
  removeFromWatchlist,
  type MovieDetailApi,
  type ReviewCommentApi,
  type ReviewApi,
  type ReviewMode,
  unlikeReview,
  updateReview,
} from '../services/movieDetailServices'
import {
  addMovieToList,
  createList,
  getMyLists,
  type UserListSummary,
} from '../services/listsServices'
import { getCurrentUser, getStoredAccessToken } from '../services/authServices'

const C = {
  bg: '#080808',
  surface: '#111111',
  elevated: '#1A1A1A',
  border: '#252525',
  accent: '#D4AF7A',
  accentDim: '#9A7A48',
  accentGlow: 'rgba(212,175,122,0.10)',
  accentGlowStrong: 'rgba(212,175,122,0.18)',
  text: '#E2E2E2',
  textSoft: '#7A7A7A',
  textMuted: '#3A3A3A',
  gold: '#C8A96E',
} as const

const SERIF = "'Cormorant Garamond', serif"
const SANS = "'Syne', sans-serif"
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/original'
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500'

type AppReview = {
  id: number
  userId: number
  movieId: number
  tmdbId: number | null
  mode: ReviewMode
  username: string
  avatarUrl?: string | null
  content: string
  rating: number
  veredicto?: string | null
  dimensions: {
    direccion: number | null
    guion: number | null
    fotografia: number | null
    actuaciones: number | null
    bandaSonora: number | null
  }
  quote?: {
    dialogo: string
    personaje?: string | null
  } | null
  timestamps: Array<{ minuto: string; descripcion: string }>
  contieneSpoilers: boolean
  esCriticaLarga: boolean
  tiempoLecturaMin: number | null
  likes: number
  createdAt: string
  comments: Array<{
    id: number
    userId: number
    username: string
    avatarUrl: string | null
    content: string
    createdAt: string
  }>
}

type SimilarFilm = {
  id: number
  title: string
  year: number
  img: string
}

type PlatformEntry = {
  name: string
  type: string
  url: string
}

type Viewer = {
  id: number
  username: string
  avatar_url?: string | null
  membership?: string | null
  role?: string | null
}

type SearchSuggestion = {
  id: number
  title?: string
  name?: string
  media_type?: 'movie' | 'tv' | 'person'
  poster_path?: string | null
  profile_path?: string | null
}

function Img({ src, alt, style, className, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = useState(false)
  if (err) return <div style={{ ...style, background: C.elevated }} className={className} />
  return <img src={src} alt={alt} style={style} className={className} onError={() => setErr(true)} {...rest} />
}

function Grain() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 900,
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.045\'/%3E%3C/svg%3E")',
        opacity: 0.4,
      }}
    />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color: C.accent,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: SANS,
      }}
    >
      {children}
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.border}, transparent)` }} />
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState<number | null>(null)
  const labels: Record<string, string> = {
    '0.5': 'Muy mala, pero viste algo rescatable',
    '1': 'Muy floja',
    '1.5': 'Floja, apenas se deja ver',
    '2': 'Regular tirando a floja',
    '2.5': 'Pasable',
    '3': 'Buena',
    '3.5': 'Muy buena',
    '4': 'Gran película',
    '4.5': 'Excelente, casi obra maestra',
    '5': 'Obra maestra',
  }
  const activeRaw = hover ?? value
  const active =
    typeof activeRaw === 'number'
      ? (Number.isFinite(activeRaw) ? activeRaw : 0)
      : Number(activeRaw) || 0

  const getFill = (starIndex: number) => {
    const raw = active - starIndex
    return Math.max(0, Math.min(1, raw))
  }

  const handleHalf = (starIndex: number, half: 0.5 | 1) => {
    const next = starIndex + half
    setHover(next)
  }

  const labelKey = Number.isInteger(active) ? String(active) : active.toFixed(1)
  const activeLabel = active > 0 ? labels[labelKey] || 'Tu rating' : 'Tu rating'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }} onMouseLeave={() => setHover(null)}>
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const fill = getFill(starIndex)
          return (
            <div key={starIndex} style={{ position: 'relative', width: 22, height: 26 }}>
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  fontSize: 26,
                  lineHeight: '26px',
                  color: C.textMuted,
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 400,
                  userSelect: 'none',
                }}
              >
                ★
              </span>

              <div style={{ position: 'absolute', inset: 0, width: `${fill * 100}%`, overflow: 'hidden', pointerEvents: 'none' }}>
                <span
                  aria-hidden
                  style={{
                    display: 'block',
                    width: 22,
                    fontSize: 26,
                    lineHeight: '26px',
                    color: C.gold,
                    fontFamily: 'system-ui, sans-serif',
                    fontWeight: 400,
                    userSelect: 'none',
                  }}
                >
                  ★
                </span>
              </div>

              <button
                aria-label={`Rate ${starIndex + 0.5}`}
                onMouseEnter={() => handleHalf(starIndex, 0.5)}
                onFocus={() => handleHalf(starIndex, 0.5)}
                onClick={() => onChange(starIndex + 0.5)}
                style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
              />
              <button
                aria-label={`Rate ${starIndex + 1}`}
                onMouseEnter={() => handleHalf(starIndex, 1)}
                onFocus={() => handleHalf(starIndex, 1)}
                onClick={() => onChange(starIndex + 1)}
                style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
              />
            </div>
          )
        })}
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.textSoft, minWidth: 220 }}>
        {activeLabel}
      </div>
    </div>
  )
}

function InlineComposer({
  mode,
  text,
  onTextChange,
  onSubmit,
  onCancel,
}: {
  mode: 'review' | 'reply' | null
  text: string
  onTextChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  if (!mode) return null

  const title = mode === 'review' ? 'Escribe tu reseña' : 'Responder reseña'
  const cta = mode === 'review' ? 'Publicar reseña' : 'Enviar respuesta'

  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 16, marginBottom: 18 }}>
      <div style={{ fontFamily: SANS, fontSize: 11, color: C.accent, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
      <textarea
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        rows={5}
        placeholder="Escribe aquí..."
        style={{ width: '100%', resize: 'vertical', background: C.elevated, border: `1px solid ${C.border}`, color: C.text, fontFamily: SERIF, fontSize: 16, lineHeight: 1.5, padding: 12, outline: 'none' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
        <button onClick={onCancel} style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Cancelar
        </button>
        <button onClick={onSubmit} style={{ border: `1px solid ${C.accentDim}`, background: C.accentGlow, color: C.accent, padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {cta}
        </button>
      </div>
    </div>
  )
}

const REVIEW_DIMENSIONS = [
  { key: 'direccion', label: 'Direccion' },
  { key: 'guion', label: 'Guion' },
  { key: 'fotografia', label: 'Foto' },
  { key: 'actuaciones', label: 'Actuacion' },
  { key: 'bandaSonora', label: 'Banda' },
] as const

function ReviewRadar({ values }: { values: AppReview['dimensions'] }) {
  const ordered = [
    values.direccion,
    values.guion,
    values.fotografia,
    values.actuaciones,
    values.bandaSonora,
  ]
  const hasData = ordered.some((value) => typeof value === 'number' && value > 0)
  if (!hasData) return null

  const center = 44
  const radius = 32
  const points = ordered.map((raw, index) => {
    const value = Math.max(0, Math.min(5, Number(raw || 0)))
    const ratio = value / 5
    const angle = (Math.PI * 2 * index) / ordered.length - Math.PI / 2
    const r = radius * ratio
    const x = center + Math.cos(angle) * r
    const y = center + Math.sin(angle) * r
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" aria-label="Radar de dimensiones" style={{ flexShrink: 0 }}>
      <circle cx="44" cy="44" r="32" fill="none" stroke={C.border} strokeWidth="1" />
      <circle cx="44" cy="44" r="20" fill="none" stroke={C.border} strokeWidth="1" />
      <polygon points={points.join(' ')} fill="rgba(212,175,122,0.22)" stroke={C.accent} strokeWidth="1.2" />
    </svg>
  )
}

function ReviewLogModal({
  open,
  movie,
  membership,
  role,
  text,
  rating,
  mode,
  veredicto,
  contieneSpoilers,
  citaDialogo,
  citaPersonaje,
  timestamps,
  dimensions,
  liked,
  seenDate,
  seenBefore,
  saving,
  onClose,
  onTextChange,
  onRatingChange,
  onModeChange,
  onVeredictoChange,
  onContieneSpoilersChange,
  onCitaDialogoChange,
  onCitaPersonajeChange,
  onDimensionsChange,
  onAddTimestamp,
  onTimestampChange,
  onRemoveTimestamp,
  onToggleLike,
  onSeenDateChange,
  onSeenBeforeChange,
  onSave,
}: {
  open: boolean
  movie: MovieDetailApi | null
  membership?: string | null
  role?: string | null
  text: string
  rating: number
  mode: ReviewMode
  veredicto: string
  contieneSpoilers: boolean
  citaDialogo: string
  citaPersonaje: string
  timestamps: Array<{ minuto: string; descripcion: string }>
  dimensions: AppReview['dimensions']
  liked: boolean
  seenDate: string
  seenBefore: boolean
  saving: boolean
  onClose: () => void
  onTextChange: (value: string) => void
  onRatingChange: (value: number) => void
  onModeChange: (value: ReviewMode) => void
  onVeredictoChange: (value: string) => void
  onContieneSpoilersChange: (value: boolean) => void
  onCitaDialogoChange: (value: string) => void
  onCitaPersonajeChange: (value: string) => void
  onDimensionsChange: (key: keyof AppReview['dimensions'], value: number) => void
  onAddTimestamp: () => void
  onTimestampChange: (index: number, field: 'minuto' | 'descripcion', value: string) => void
  onRemoveTimestamp: (index: number) => void
  onToggleLike: () => void
  onSeenDateChange: (value: string) => void
  onSeenBeforeChange: (value: boolean) => void
  onSave: () => void
}) {
  if (!open || !movie) return null

  const posterUrl = movie.poster_path ? `${TMDB_POSTER}${movie.poster_path}` : '/no-poster.svg'
  const canUseCriticalMode = (String(membership || '').toLowerCase() === 'pro') || (String(role || '').toLowerCase() === 'admin')
  const criticalLocked = mode === 'CRITICO' && !canUseCriticalMode

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 450,
        background: 'radial-gradient(circle at 12% 8%, rgba(212,175,122,0.16), rgba(4,6,10,0.82) 42%, rgba(2,3,5,0.9) 100%)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '16px',
      }}
    >
      <motion.div
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: '92vh',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          background: 'linear-gradient(165deg, rgba(11,14,21,0.98) 0%, rgba(7,9,13,0.99) 62%, rgba(6,7,11,0.99) 100%)',
          boxShadow: '0 28px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: 'linear-gradient(to right, rgba(212,175,122,0.12), rgba(12,15,22,0.04))', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent }}>
            <Heart size={12} strokeWidth={1.6} fill={C.accentGlowStrong} />
            Review / Log · {mode}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '130px minmax(0, 1fr)', gap: 16, padding: 16, overflowY: 'auto' }}>
          <div>
            <div style={{ aspectRatio: '2/3', overflow: 'hidden', border: `1px solid ${C.border}`, background: C.elevated }}>
              <Img
                src={posterUrl}
                alt={movie.title}
                loading="lazy"
                width={260}
                height={390}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ marginTop: 8, fontFamily: SERIF, color: C.text, fontSize: 15, ...textClampOneLine }}>{movie.title}</div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {(['RAPIDO', 'ESTANDAR', 'CRITICO'] as const).map((candidate) => {
                const blocked = candidate === 'CRITICO' && !canUseCriticalMode
                const active = mode === candidate
                return (
                  <button
                    key={candidate}
                    onClick={() => !blocked && onModeChange(candidate)}
                    style={{
                      border: `1px solid ${active ? C.accentDim : C.border}`,
                      background: active ? C.accentGlow : 'transparent',
                      color: blocked ? C.textMuted : active ? C.accent : C.textSoft,
                      cursor: blocked ? 'not-allowed' : 'pointer',
                      padding: '7px 10px',
                      fontFamily: SANS,
                      fontSize: 11,
                      letterSpacing: '0.08em',
                    }}
                    title={blocked ? 'Modo CRITICO disponible para plan Pro (o Admin)' : ''}
                  >
                    {candidate}
                  </button>
                )
              })}
            </div>

            {!canUseCriticalMode && (
              <div style={{ marginBottom: 12, color: C.textSoft, fontFamily: SANS, fontSize: 11 }}>
                El modo CRITICO esta bloqueado en tu plan. Si te interesa desbloquearlo, actualiza a Pro desde Settings suscripcion.
              </div>
            )}

            <textarea
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
              rows={mode === 'CRITICO' ? 10 : 5}
              placeholder="Escribe tu review o log..."
              style={{ width: '100%', resize: 'vertical', background: C.elevated, border: `1px solid ${C.border}`, color: C.text, fontFamily: SERIF, fontSize: 16, lineHeight: 1.5, padding: 12, outline: 'none', marginBottom: 12 }}
            />

            {mode !== 'RAPIDO' && (
              <input
                value={veredicto}
                onChange={(event) => onVeredictoChange(event.target.value)}
                placeholder="Veredicto final (obligatorio en ESTANDAR)"
                style={{ width: '100%', background: C.elevated, border: `1px solid ${C.border}`, color: C.text, padding: '10px 12px', marginBottom: 12, fontFamily: SERIF, fontSize: 15 }}
              />
            )}

            {(mode === 'ESTANDAR' || mode === 'CRITICO') && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textSoft, fontFamily: SANS, marginBottom: 8 }}>Dimensiones</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 8 }}>
                  {REVIEW_DIMENSIONS.map((entry) => (
                    <div key={entry.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ minWidth: 78, color: C.textSoft, fontFamily: SANS, fontSize: 11 }}>{entry.label}</span>
                      <div style={{ flex: 1 }}>
                        <StarRating
                          value={dimensions[entry.key] || 0}
                          onChange={(next) => onDimensionsChange(entry.key, next)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mode === 'CRITICO' && (
              <>
                <textarea
                  value={citaDialogo}
                  onChange={(event) => onCitaDialogoChange(event.target.value)}
                  rows={2}
                  placeholder="Cita destacada"
                  style={{ width: '100%', resize: 'vertical', background: C.elevated, border: `1px solid ${C.border}`, color: C.text, fontFamily: SERIF, fontSize: 15, lineHeight: 1.5, padding: 12, outline: 'none', marginBottom: 8 }}
                />
                <input
                  value={citaPersonaje}
                  onChange={(event) => onCitaPersonajeChange(event.target.value)}
                  placeholder="Personaje de la cita"
                  style={{ width: '100%', background: C.elevated, border: `1px solid ${C.border}`, color: C.text, padding: '10px 12px', marginBottom: 8, fontFamily: SERIF, fontSize: 15 }}
                />
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textSoft, fontFamily: SANS, marginBottom: 6 }}>Timestamps</div>
                  {timestamps.map((stamp, index) => (
                    <div key={`${stamp.minuto}-${index}`} style={{ display: 'grid', gridTemplateColumns: '86px 1fr auto', gap: 6, marginBottom: 6 }}>
                      <input
                        value={stamp.minuto}
                        onChange={(event) => onTimestampChange(index, 'minuto', event.target.value)}
                        placeholder="00:00"
                        style={{ background: C.elevated, border: `1px solid ${C.border}`, color: C.text, padding: '8px 10px', fontFamily: SANS, fontSize: 12 }}
                      />
                      <input
                        value={stamp.descripcion}
                        onChange={(event) => onTimestampChange(index, 'descripcion', event.target.value)}
                        placeholder="Momento y por que importa"
                        style={{ background: C.elevated, border: `1px solid ${C.border}`, color: C.text, padding: '8px 10px', fontFamily: SERIF, fontSize: 14 }}
                      />
                      <button onClick={() => onRemoveTimestamp(index)} style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, cursor: 'pointer', padding: '0 8px' }}>x</button>
                    </div>
                  ))}
                  <button onClick={onAddTimestamp} style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, cursor: 'pointer', padding: '8px 10px', fontFamily: SANS, fontSize: 11 }}>
                    Agregar timestamp
                  </button>
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textSoft, fontFamily: SANS }}>Rating</div>
              <StarRating value={rating} onChange={onRatingChange} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <button
                onClick={onToggleLike}
                style={{
                  width: 38,
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  color: liked ? C.accent : C.textSoft,
                  border: `1px solid ${liked ? C.accentDim : C.border}`,
                  cursor: 'pointer',
                }}
                title="Me gusta"
              >
                <Heart size={14} strokeWidth={1.6} fill={liked ? C.gold : 'none'} />
              </button>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textSoft, fontFamily: SANS, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={seenBefore}
                  onChange={(event) => onSeenBeforeChange(event.target.checked)}
                  style={{ accentColor: C.accent }}
                />
                Ya la había visto antes
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textSoft, fontFamily: SANS, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={contieneSpoilers}
                  onChange={(event) => onContieneSpoilersChange(event.target.checked)}
                  style={{ accentColor: C.accent }}
                />
                Contiene spoilers
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textSoft }}>Vista</span>
                <input
                  type="date"
                  value={seenDate}
                  onChange={(event) => onSeenDateChange(event.target.value)}
                  style={{ background: C.elevated, border: `1px solid ${C.border}`, color: C.text, padding: '8px 10px', fontFamily: SANS, fontSize: 12 }}
                />
              </div>
            </div>

            {criticalLocked && (
              <div style={{ marginTop: 8, color: '#ffb5b5', fontFamily: SANS, fontSize: 11 }}>
                El modo CRITICO requiere plan Pro o permisos Admin.
              </div>
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, padding: '12px 16px', background: 'linear-gradient(to top, rgba(8,10,14,0.98), rgba(8,10,14,0.88))', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, padding: '10px 12px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Cancelar
          </button>
          <button onClick={onSave} disabled={saving} style={{ border: `1px solid ${C.accentDim}`, background: 'linear-gradient(135deg, rgba(212,175,122,0.2), rgba(212,175,122,0.08))', color: C.accent, padding: '10px 14px', cursor: saving ? 'default' : 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: saving ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Heart size={12} strokeWidth={1.5} fill={saving ? 'none' : C.accentGlowStrong} />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function AddToListModal({
  open,
  movieTitle,
  loading,
  saving,
  lists,
  selectedListId,
  createName,
  createDescription,
  creating,
  onClose,
  onSelectList,
  onCreateNameChange,
  onCreateDescriptionChange,
  onCreateList,
  onConfirm,
}: {
  open: boolean
  movieTitle: string
  loading: boolean
  saving: boolean
  lists: UserListSummary[]
  selectedListId: number | null
  createName: string
  createDescription: string
  creating: boolean
  onClose: () => void
  onSelectList: (listId: number) => void
  onCreateNameChange: (value: string) => void
  onCreateDescriptionChange: (value: string) => void
  onCreateList: () => void
  onConfirm: () => void
}) {
  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 460,
        background: 'rgba(5,6,9,0.68)',
        backdropFilter: 'blur(2px)',
        display: 'grid',
        placeItems: 'center',
        padding: 18,
      }}
    >
      <motion.div
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 640,
          border: `1px solid ${C.border}`,
          background: 'linear-gradient(160deg, rgba(12,15,22,0.98) 0%, rgba(9,10,14,0.98) 100%)',
          boxShadow: '0 28px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent }}>
            Anadir a lista
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ fontFamily: SERIF, fontSize: 18, color: C.text, marginBottom: 14 }}>
            {movieTitle}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textSoft, marginBottom: 8 }}>
              Tus listas
            </div>

            {loading ? (
              <div style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>Cargando listas...</div>
            ) : lists.length === 0 ? (
              <div style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>No tienes listas todavia. Crea una debajo.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 2 }}>
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => onSelectList(list.id)}
                    style={{
                      border: `1px solid ${selectedListId === list.id ? C.accentDim : C.border}`,
                      background: selectedListId === list.id ? C.accentGlow : C.elevated,
                      color: selectedListId === list.id ? C.accent : C.text,
                      textAlign: 'left',
                      padding: '10px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontFamily: SERIF, fontSize: 17 }}>{list.name}</div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: C.textSoft }}>
                      {list.items_count} films {list.is_public ? '· Publica' : '· Privada'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textSoft, marginBottom: 8 }}>
              Crear nueva lista
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <input
                value={createName}
                onChange={(event) => onCreateNameChange(event.target.value)}
                placeholder="Nombre de la lista"
                style={{ background: C.elevated, border: `1px solid ${C.border}`, color: C.text, padding: '10px 12px', fontFamily: SERIF, fontSize: 16 }}
              />
              <textarea
                value={createDescription}
                onChange={(event) => onCreateDescriptionChange(event.target.value)}
                placeholder="Descripcion (opcional)"
                rows={2}
                style={{ resize: 'vertical', background: C.elevated, border: `1px solid ${C.border}`, color: C.text, padding: '10px 12px', fontFamily: SERIF, fontSize: 15 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={onCreateList}
                  disabled={creating}
                  style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, padding: '9px 12px', cursor: creating ? 'default' : 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: creating ? 0.7 : 1 }}
                >
                  {creating ? 'Creando...' : 'Crear lista'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={onClose} style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, padding: '10px 12px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={saving || selectedListId === null}
              style={{ border: `1px solid ${C.accentDim}`, background: C.accentGlow, color: C.accent, padding: '10px 14px', cursor: saving || selectedListId === null ? 'default' : 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: saving || selectedListId === null ? 0.7 : 1 }}
            >
              {saving ? 'Guardando...' : 'Anadir pelicula'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function formatDateLabel(dateIso?: string) {
  if (!dateIso) return 'Fecha desconocida'
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida'
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

function initials(name: string) {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return 'CV'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'CV'
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

const textClampOneLine = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const

function parseMovieId(slugOrId?: string): number | null {
  if (!slugOrId) return null
  const match = slugOrId.match(/^\d+/)
  if (!match) return null
  const value = Number(match[0])
  return Number.isFinite(value) ? value : null
}

function buildMovieCanonicalPath(movieId: number, title: string) {
  return `/movie/${movieId}-${createSlug(title)}`
}

function isCurrentMovieMatch(
  candidate: { movie_id?: number | null; tmdb_id?: number | null },
  detailId: number,
  routeMovieId: number | null
) {
  if (candidate.tmdb_id && candidate.tmdb_id === detailId) return true
  if (routeMovieId && candidate.tmdb_id && candidate.tmdb_id === routeMovieId) return true
  if (candidate.movie_id && candidate.movie_id === detailId) return true
  if (routeMovieId && candidate.movie_id && candidate.movie_id === routeMovieId) return true
  return false
}

function getDirectorObj(movie: MovieDetailApi | null) {
  return (movie?.credits?.crew || []).find((person) => person.job === 'Director') || null
}

function getCrewByJob(movie: MovieDetailApi | null, jobs: string[]) {
  return (movie?.credits?.crew || []).find((person) => person.job && jobs.includes(person.job))?.name || 'Desconocido'
}

function mapPlatforms(movie: MovieDetailApi | null): PlatformEntry[] {
  if (!movie?.watch_providers) return []

  const region = movie.watch_providers.ES || movie.watch_providers.US || Object.values(movie.watch_providers)[0]
  if (!region) return []

  const entries: PlatformEntry[] = []
  const addEntries = (items: Array<{ provider_name: string }> | undefined, type: string) => {
    ; (items || []).forEach((provider) => {
      if (entries.some((entry) => entry.name === provider.provider_name && entry.type === type)) return
      entries.push({
        name: provider.provider_name,
        type,
        url: `https://www.themoviedb.org/movie/${movie.id}/watch`,
      })
    })
  }

  addEntries(region.flatrate, 'Streaming incluido')
  addEntries(region.rent, 'Alquiler')
  addEntries(region.buy, 'Compra')

  return entries
}

function mapMovieReviews(
  reviews: ReviewApi[],
  userMeta: Record<number, { username: string; avatarUrl: string | null }>,
  commentsByReviewId: Record<number, ReviewCommentApi[]>
): AppReview[] {
  return reviews.map((review) => ({
    id: review.id,
    userId: review.user_id,
    movieId: review.movie_id,
    tmdbId: review.tmdb_id ?? null,
    mode: review.mode || 'RAPIDO',
    username: userMeta[review.user_id]?.username || `Usuario ${review.user_id}`,
    avatarUrl: userMeta[review.user_id]?.avatarUrl || null,
    content: review.content || 'Sin comentario',
    rating: review.rating || 0,
    veredicto: review.veredicto ?? null,
    dimensions: {
      direccion: review.rating_direccion ?? null,
      guion: review.rating_guion ?? null,
      fotografia: review.rating_fotografia ?? null,
      actuaciones: review.rating_actuaciones ?? null,
      bandaSonora: review.rating_banda_sonora ?? null,
    },
    quote: review.cita_dialogo
      ? {
        dialogo: review.cita_dialogo,
        personaje: review.cita_personaje ?? null,
      }
      : null,
    timestamps: Array.isArray(review.timestamps) ? review.timestamps : [],
    contieneSpoilers: Boolean(review.contiene_spoilers),
    esCriticaLarga: Boolean(review.es_critica_larga),
    tiempoLecturaMin: review.tiempo_lectura_min ?? null,
    likes: review.likes || 0,
    createdAt: review.created_at,
    comments: (commentsByReviewId[review.id] || []).map((comment) => ({
      id: comment.id,
      userId: comment.user_id,
      username: comment.users?.username || `Usuario ${comment.user_id}`,
      avatarUrl: comment.users?.avatar_url || null,
      content: comment.content,
      createdAt: comment.created_at,
    })),
  }))
}

function NoticeBar({ message, type }: { message: string | null; type: 'success' | 'error' | 'info' }) {
  if (!message) return null
  const color = type === 'error' ? '#ff7676' : type === 'success' ? C.accent : C.textSoft
  return (
    <div
      style={{
        position: 'fixed',
        top: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 400,
        padding: '10px 16px',
        border: `1px solid ${C.border}`,
        background: 'rgba(10,10,10,0.95)',
        color,
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      {message}
    </div>
  )
}

function Navbar({
  viewer,
  onLogout,
}: {
  viewer: Viewer | null
  onLogout: () => void
}) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchSuggestion[]>([])
  const [openDropdown, setOpenDropdown] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useMemo(() => query.trim(), [query])
  const visibleResults = debouncedQuery ? results : []

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    if (!debouncedQuery) {
      return
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const data = await fetchSearchMovies(debouncedQuery)
        setResults(Array.isArray(data.results) ? data.results.slice(0, 6) : [])
      } catch {
        setResults([])
      }
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [debouncedQuery])

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpenDropdown(false)
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
        setMobileNavOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const navLinks = viewer ? ['Films', 'Lists', 'Members', 'Journal'] : ['Sign in', 'Create account', 'Films', 'Lists', 'Members', 'Journal']
  const openAuthModal = (mode: 'login' | 'register') => {
    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode } }))
  }

  const navigateByType = (item: SearchSuggestion) => {
    const label = item.title || item.name || 'sin-titulo'
    if (item.media_type === 'person') {
      navigate(`/person/${item.id}`)
      return
    }
    if (item.media_type === 'tv') {
      navigate(`/tv/${item.id}`)
      return
    }
    navigate(`/movie/${item.id}-${createSlug(label)}`)
  }

  return (
    <nav
      className="md-navbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(8,8,8,0.97)' : 'linear-gradient(to bottom, rgba(8,8,8,0.97) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'background 0.4s, border-color 0.4s',
      }}
    >
      <div className="md-nav-logo" style={{ display: 'flex', alignItems: 'center' }}>
        <Link className="md-logo-link" to="/" style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 500, letterSpacing: '0.13em', textTransform: 'uppercase', color: C.text, textDecoration: 'none' }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </Link>
        <ul className="md-desktop-links md-nav-links" style={{ display: 'flex', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
          {navLinks.map((item) => {
            const isAuthLink = item === 'Sign in' || item === 'Create account'
            return (
              <li key={item}>
                {isAuthLink ? (
                  <button
                    onClick={() => openAuthModal(item === 'Create account' ? 'register' : 'login')}
                    style={{ border: 'none', padding: 0, background: 'none', fontFamily: SANS, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textSoft, cursor: 'pointer' }}
                  >
                    {item}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(resolveNavPathWithFallback(item))}
                    style={{ border: 'none', padding: 0, background: 'none', fontFamily: SANS, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textSoft, cursor: 'pointer' }}
                  >
                    {item}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="md-nav-right" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="md-search-wrapper" ref={wrapperRef} style={{ position: 'relative' }}>
          <div style={{ height: 38, borderRadius: 999, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
            <input
              value={query}
              onFocus={() => setOpenDropdown(true)}
              onChange={(event) => {
                setQuery(event.target.value)
                setOpenDropdown(true)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && query.trim()) {
                  navigate(`/search?q=${encodeURIComponent(query.trim())}`)
                  setOpenDropdown(false)
                }
              }}
              placeholder="Buscar"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: C.text, fontFamily: SANS, fontSize: 12 }}
            />
          </div>
          {openDropdown && query.trim() && (
            <div className="md-search-dropdown" style={{ position: 'absolute', top: 44, right: 0, width: 'min(92vw, 420px)', border: `1px solid ${C.border}`, background: 'rgba(8,8,8,0.98)', borderRadius: 6, overflow: 'hidden', maxHeight: '65vh', overflowY: 'auto' }}>
              {visibleResults.length > 0 ? (
                visibleResults.map((movie) => (
                  <button
                    key={`${movie.media_type || 'movie'}-${movie.id}`}
                    onClick={() => {
                      navigateByType(movie)
                      setOpenDropdown(false)
                      setQuery('')
                    }}
                    className="md-search-item"
                    style={{ width: '100%', border: 'none', borderBottom: `1px solid ${C.border}`, background: 'transparent', color: C.text, display: 'flex', alignItems: 'flex-start', gap: 10, padding: 8, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Img src={movie.media_type === 'person' ? (movie.profile_path ? `${TMDB_POSTER}${movie.profile_path}` : '') : (movie.poster_path ? `${TMDB_POSTER}${movie.poster_path}` : '')} alt={movie.title || movie.name || 'Sin titulo'} style={{ width: 30, height: 45, objectFit: 'cover' }} />
                    <span className="md-search-title" style={{ fontFamily: SANS, fontSize: 12 }}>{movie.title || movie.name || 'Sin titulo'}</span>
                  </button>
                ))
              ) : (
                <div style={{ padding: 10, color: C.textSoft, fontFamily: SANS, fontSize: 11 }}>Sin resultados</div>
              )}
            </div>
          )}
        </div>

        <div className="md-mobile-menu-btn" style={{ position: 'relative' }}>
          <button
            onClick={() => setMobileNavOpen((value) => !value)}
            style={{ width: 36, height: 36, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          >
            {mobileNavOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
          {mobileNavOpen && (
            <div style={{ position: 'absolute', right: 0, top: 42, minWidth: 170, border: `1px solid ${C.border}`, background: 'rgba(8,8,8,0.98)', padding: 8, display: 'grid', gap: 6 }}>
              <div style={{ height: 36, borderRadius: 999, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                <input
                  value={query}
                  onFocus={() => setOpenDropdown(true)}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setOpenDropdown(true)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && query.trim()) {
                      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
                      setOpenDropdown(false)
                      setMobileNavOpen(false)
                    }
                  }}
                  placeholder="Buscar"
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: C.text, fontFamily: SANS, fontSize: 12 }}
                />
              </div>
              {navLinks.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    if (item === 'Sign in' || item === 'Create account') {
                      openAuthModal(item === 'Create account' ? 'register' : 'login')
                    } else {
                      navigate(resolveNavPathWithFallback(item))
                    }
                    setMobileNavOpen(false)
                  }}
                  style={{ border: 'none', background: 'transparent', color: C.text, textAlign: 'left', padding: '8px 10px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  {item}
                </button>
              ))}
              {!viewer && (
                <button
                  onClick={() => {
                    navigate(-1)
                    setMobileNavOpen(false)
                  }}
                  style={{ border: 'none', background: 'transparent', color: C.textSoft, textAlign: 'left', padding: '8px 10px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Volver
                </button>
              )}
              {viewer && (
                <>
                  <button
                    onClick={() => {
                      navigate('/profile')
                      setMobileNavOpen(false)
                    }}
                    style={{ border: 'none', background: 'transparent', color: C.text, textAlign: 'left', padding: '8px 10px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Mi perfil
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings')
                      setMobileNavOpen(false)
                    }}
                    style={{ border: 'none', background: 'transparent', color: C.text, textAlign: 'left', padding: '8px 10px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Configuración
                  </button>
                  <button
                    onClick={() => {
                      onLogout()
                      setMobileNavOpen(false)
                    }}
                    style={{ border: 'none', background: 'transparent', color: '#ff8d8d', textAlign: 'left', padding: '8px 10px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Cerrar sesión
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {!viewer ? (
          <button
            className="md-user-actions"
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textSoft, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS }}
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
            Volver
          </button>
        ) : (
          <div ref={menuRef} className="md-user-actions" style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen((v) => !v)} style={{ border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', borderRadius: 999, width: 38, height: 38, overflow: 'hidden', padding: 0 }}>
              {viewer.avatar_url ? <Img src={viewer.avatar_url} alt={viewer.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: C.textSoft, fontFamily: SANS, fontSize: 11 }}>{initials(viewer.username)}</div>}
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 44, minWidth: 180, border: `1px solid ${C.border}`, background: 'rgba(8,8,8,0.98)', padding: 6 }}>
                <button onClick={() => navigate('/profile')} style={{ width: '100%', border: 'none', background: 'transparent', color: C.text, textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mi perfil</button>
                <button onClick={() => navigate('/settings')} style={{ width: '100%', border: 'none', background: 'transparent', color: C.text, textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Configuración</button>
                <button onClick={onLogout} style={{ width: '100%', border: 'none', background: 'transparent', color: '#ff8d8d', textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cerrar sesión</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

function Hero({
  movie,
  userRating,
  inVault,
  inWatchlist,
  liked,
  onRate,
  onToggleVault,
  onToggleWatchlist,
  onToggleFavorite,
  onAddToList,
  onWriteReview,
  onShare,
}: {
  movie: MovieDetailApi
  userRating: number
  inVault: boolean
  inWatchlist: boolean
  liked: boolean
  onRate: (value: number) => void
  onToggleVault: () => void
  onToggleWatchlist: () => void
  onToggleFavorite: () => void
  onAddToList: () => void
  onWriteReview: () => void
  onShare: () => void
}) {
  const heroRef = useRef<HTMLDivElement>(null)
  const actionMenuRef = useRef<HTMLDivElement | null>(null)
  const actionMenuButtonRef = useRef<HTMLButtonElement | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [actionMenuTop, setActionMenuTop] = useState(0)
  const [actionMenuLeft, setActionMenuLeft] = useState(0)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const posterY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])

  useEffect(() => {
    if (!actionMenuOpen) return

    const updateMenuPosition = () => {
      const rect = actionMenuButtonRef.current?.getBoundingClientRect()
      if (!rect) return
      setActionMenuTop(rect.bottom + 8)
      setActionMenuLeft(Math.max(10, rect.right - 190))
    }

    updateMenuPosition()

    const onOutsideClick = (event: MouseEvent) => {
      if (!actionMenuRef.current) return
      if (!actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(false)
      }
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActionMenuOpen(false)
    }

    document.addEventListener('mousedown', onOutsideClick)
    window.addEventListener('keydown', onEscape)
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      document.removeEventListener('mousedown', onOutsideClick)
      window.removeEventListener('keydown', onEscape)
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [actionMenuOpen])

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : '----'
  const runtime = movie.runtime ? `${movie.runtime} min` : 'Duración desconocida'
  const country = movie.production_countries?.[0]?.name || 'País no disponible'
  const genresText = (movie.genres || []).slice(0, 2).map((genre) => genre.name).join(' · ') || 'Sin género'
  const directorObj = getDirectorObj(movie)
  const score = ((movie.vote_average || 0) / 2).toFixed(1)
  const votes = (movie.vote_count || 0).toLocaleString('es-ES')
  const posterUrl = movie.poster_path ? `${TMDB_POSTER}${movie.poster_path}` : ''
  const backdropUrl = movie.backdrop_path ? `${TMDB_IMAGE}${movie.backdrop_path}` : ''

  return (
    <div ref={heroRef} className="md-hero" style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0d1118 0%, #08090d 40%, #0a0c08 100%)' }} />

      {backdropUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.24) saturate(0.65)',
          }}
        />
      )}

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.8) 40%, rgba(8,8,8,0.45) 70%, rgba(8,8,8,0.78) 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 500, height: 400, background: `radial-gradient(ellipse at bottom left, ${C.accentGlow}, transparent 70%)`, pointerEvents: 'none' }} />

      {posterUrl && (
        <motion.div
          className="md-hero-poster"
          initial={{ opacity: 0, y: -24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ position: 'absolute', top: '50%', y: posterY, zIndex: 10, transform: 'translateY(-50%)' }}
        >
          <div style={{ aspectRatio: '2/3', borderRadius: 2, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)', position: 'relative' }}>
            <Img
              src={posterUrl}
              alt={`${movie.title} poster`}
              loading="eager"
              fetchPriority="high"
              width={500}
              height={750}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.6) brightness(0.85)' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.25) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, border: `1px solid rgba(212,175,122,0.15)`, borderRadius: 2 }} />
          </div>
        </motion.div>
      )}

      <motion.div className="md-hero-content" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }} style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, padding: '4px 10px', border: `1px solid ${C.accentDim}`, fontFamily: SANS }}>
            {genresText}
          </span>
          <span style={{ color: C.textMuted, fontSize: 12 }}>·</span>
          <span style={{ fontSize: 11, color: C.textSoft, letterSpacing: '0.08em', fontFamily: SANS }}>
            {releaseYear} · {country} · {runtime}
          </span>
        </div>

        <div style={{ marginBottom: 4 }}>
          <h1 className="md-hero-title" style={{ fontFamily: SERIF, fontWeight: 300, lineHeight: 0.92, letterSpacing: '-0.02em', color: C.text, margin: 0 }}>
            {movie.title}
          </h1>
          <div className="md-hero-subtitle" style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, lineHeight: 1, color: 'rgba(226,226,226,0.35)', letterSpacing: '-0.01em', marginTop: 2 }}>
            {movie.original_title || movie.title}
          </div>
        </div>

        <div className="md-hero-director" style={{ fontFamily: SERIF, fontStyle: 'italic', color: C.textSoft, marginBottom: 20, letterSpacing: '0.02em', marginTop: 14 }}>
          Una película de{' '}
          {directorObj ? (
            <Link
              to={`/person/${directorObj.id}`}
              style={{ color: C.accent, textDecoration: 'none', paddingBottom: 1, transition: 'color 0.2s' }}
            >
              {directorObj.name}
            </Link>
          ) : (
            'Desconocido'
          )}
        </div>

        <div className="md-hero-ratings" style={{ display: 'flex', marginBottom: 24 }}>
          <StarRating value={userRating} onChange={onRate} />

          <div className="md-hero-score" style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 300, color: C.gold, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 14, color: C.textMuted, fontFamily: SANS }}>/5</span>
            <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, marginLeft: 4 }}>en CineVault</span>
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: SANS, display: 'flex', alignItems: 'center' }}>{votes} ratings</div>
        </div>

        <div className="md-actions-row" style={{ gap: 10 }}>
          <button
            onClick={onToggleVault}
            className="md-hero-action-btn md-action-btn"
            style={{
              padding: '12px 20px',
              background: inVault ? C.accentDim : C.accent,
              color: C.bg,
              border: 'none',
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {inVault ? '✓ En mi Vault' : '+ Vault'}
          </button>

          <button
            onClick={onWriteReview}
            className="md-hero-action-btn md-action-btn"
            style={{
              padding: '12px 20px',
              background: 'transparent',
              color: C.textSoft,
              border: `1px solid ${C.border}`,
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <MessageSquare size={13} strokeWidth={1.5} /> Review o log
          </button>

          <div className="md-action-icons-row">
            <button
              title="Watchlist"
              onClick={onToggleWatchlist}
              className="md-action-icon-btn md-action-btn"
              style={{
                width: 46,
                height: 46,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                color: inWatchlist ? C.accent : C.textSoft,
                border: `1px solid ${inWatchlist ? C.accentDim : C.border}`,
                cursor: 'pointer',
              }}
            >
              <Bookmark size={15} strokeWidth={1.5} fill={inWatchlist ? C.accent : 'none'} />
            </button>
            <button
              title="Me gusta"
              onClick={onToggleFavorite}
              className="md-action-icon-btn md-action-btn"
              style={{
                width: 46,
                height: 46,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                color: liked ? C.accent : C.textSoft,
                border: `1px solid ${liked ? C.accentDim : C.border}`,
                cursor: 'pointer',
              }}
            >
              <Heart size={15} strokeWidth={1.5} fill={liked ? C.gold : 'none'} />
            </button>
          </div>
          <div ref={actionMenuRef} style={{ position: 'relative' }}>
            <button
              ref={actionMenuButtonRef}
              title="Más opciones"
              onClick={() => setActionMenuOpen((prev) => !prev)}
              style={{
                width: 46,
                height: 46,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                color: actionMenuOpen ? C.accent : C.textSoft,
                border: `1px solid ${actionMenuOpen ? C.accentDim : C.border}`,
                cursor: 'pointer',
              }}
            >
              <Menu size={15} strokeWidth={1.8} />
            </button>

            {actionMenuOpen && (
              <div
                style={{
                  position: 'fixed',
                  left: actionMenuLeft,
                  top: actionMenuTop,
                  minWidth: 180,
                  border: `1px solid ${C.border}`,
                  background: 'rgba(8,8,8,0.98)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
                  padding: 6,
                  display: 'grid',
                  gap: 4,
                  zIndex: 30,
                }}
              >
                <button
                  onClick={() => {
                    setActionMenuOpen(false)
                    onAddToList()
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    color: C.text,
                    textAlign: 'left',
                    padding: '9px 10px',
                    cursor: 'pointer',
                    fontFamily: SANS,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <List size={13} strokeWidth={1.5} /> Añadir a lista
                </button>
                <button
                  onClick={() => {
                    setActionMenuOpen(false)
                    onShare()
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    color: C.text,
                    textAlign: 'left',
                    padding: '9px 10px',
                    cursor: 'pointer',
                    fontFamily: SANS,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <Share2 size={13} strokeWidth={1.5} /> Compartir
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div className="md-hero-scroll-prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} style={{ position: 'absolute', bottom: 28, left: 52, alignItems: 'center', gap: 12, zIndex: 10 }}>
        <div style={{ width: 32, height: 1, background: C.textMuted, position: 'relative', overflow: 'hidden' }}>
          <motion.div animate={{ x: ['-100%', '0%', '100%'] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} style={{ position: 'absolute', inset: 0, background: C.accent }} />
        </div>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS }}>Seguir leyendo</span>
      </motion.div>
    </div>
  )
}

function DirectorQuote({ director }: { director: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.9 }} className="md-quote" style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.surface, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 200, background: `radial-gradient(ellipse, ${C.accentGlow}, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 2.5vw, 28px)', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.65, color: C.textSoft, maxWidth: 760, margin: '0 auto 16px', position: 'relative' }}>
        <span style={{ color: C.accent, fontSize: '1.3em' }}>&quot;</span>
        El tiempo es la más importante de todas las categorías del cine. Para mí, el cine es ante todo esculpir el tiempo.
        <span style={{ color: C.accent, fontSize: '1.3em' }}>&quot;</span>
      </div>
      <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS }}>{director} — Esculpir en el tiempo</div>
    </motion.div>
  )
}

function Synopsis({ overview, tagline }: { overview: string; tagline: string | null | undefined }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Sinopsis</SectionLabel>
      <p style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 300, lineHeight: 1.75, color: C.textSoft, maxWidth: 680, margin: '0 0 16px' }}>{overview || 'Sinopsis no disponible.'}</p>
      {expanded && tagline && <p style={{ fontFamily: SERIF, fontSize: 20, fontStyle: 'italic', lineHeight: 1.75, color: C.textSoft, maxWidth: 680, margin: '0 0 16px' }}>{tagline}</p>}
      {tagline && (
        <button onClick={() => setExpanded((v) => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          {expanded ? 'Leer menos' : 'Leer más'}
          <ChevronRight size={12} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      )}
    </motion.section>
  )
}

function Themes({ themes }: { themes: string[] }) {
  const navigate = useNavigate()

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Temas y atmósferas</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {themes.map((theme) => (
          <motion.button
            key={theme}
            onClick={() => navigate(`/search?q=${encodeURIComponent(theme)}&genre=`)}
            whileHover={{ borderColor: C.accentDim, color: C.accent }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.textSoft,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              padding: '6px 14px',
              cursor: 'pointer',
              fontFamily: SANS,
            }}
          >
            {theme}
          </motion.button>
        ))}
      </div>
    </motion.section>
  )
}

function Stills({ stills }: { stills: string[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Imágenes de la película</SectionLabel>
      <div className="md-stills-grid" style={{ gap: 4 }}>
        {stills.map((still, i) => (
          <div key={still + i} className={i === 0 ? 'md-stills-item-1' : ''} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', background: C.elevated }}>
            <Img src={still} alt={`Still ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: hoveredIdx === i ? 'saturate(0.85) brightness(0.85)' : 'saturate(0.35) brightness(0.65)', transform: hoveredIdx === i ? 'scale(1.03)' : 'scale(1)', transition: 'filter 0.4s, transform 0.4s' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.35)', opacity: hoveredIdx === i ? 1 : 0, transition: 'opacity 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', fontFamily: SANS }}>Still {i + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  )
}

function CastCrew({
  cast,
  crew,
}: {
  cast: Array<{ id: number; name: string; character?: string; profile_path?: string | null }>
  crew: Array<{ id: number; name: string; job?: string; profile_path?: string | null }>
}) {
  const [tab, setTab] = useState<'cast' | 'crew'>('cast')
  const [castPage, setCastPage] = useState(0)
  const people = tab === 'cast' ? cast : crew
  const pageSize = 8
  const start = castPage * pageSize
  const visiblePeople = people.slice(start, start + pageSize)
  const hasPrev = castPage > 0
  const hasNext = start + pageSize < people.length

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <button onClick={() => {
          setTab('cast')
          setCastPage(0)
        }} style={{ border: `1px solid ${tab === 'cast' ? C.accentDim : C.border}`, background: tab === 'cast' ? C.accentGlow : 'transparent', color: tab === 'cast' ? C.accent : C.textSoft, padding: '6px 12px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Reparto</button>
        <button onClick={() => {
          setTab('crew')
          setCastPage(0)
        }} style={{ border: `1px solid ${tab === 'crew' ? C.accentDim : C.border}`, background: tab === 'crew' ? C.accentGlow : 'transparent', color: tab === 'crew' ? C.accent : C.textSoft, padding: '6px 12px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Crew</button>
      </div>
      <SectionLabel>{tab === 'cast' ? 'Reparto' : 'Crew técnico'}</SectionLabel>
      <div className="md-cast-list">
        {visiblePeople.map((person, index) => (
          <motion.div key={`${tab}-${person.id}-${index}`} className="md-cast-item" style={{ cursor: 'pointer', textAlign: 'center' }} whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
            <Link to={`/person/${person.id}`} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ opacity: 0.8 }}
                transition={{ duration: 0.2 }}
                style={{ width: 96, height: 96, borderRadius: '50%', background: C.elevated, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 10, fontFamily: SERIF, fontSize: 28, color: C.textMuted, cursor: 'pointer', transition: 'opacity 0.2s' }}
              >
                {person.profile_path ? (
                  <Img src={`${TMDB_POSTER}${person.profile_path}`} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  initials(person.name)
                )}
              </motion.div>
            </Link>
            <Link to={`/person/${person.id}`} style={{ fontSize: 12, fontFamily: SANS, color: C.text, lineHeight: 1.3, marginBottom: 2, ...textClampOneLine, textDecoration: 'none', display: 'block' }}>{person.name}</Link>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, color: C.textSoft }}>
              <span style={textClampOneLine}>
                {tab === 'cast' ? ('character' in person ? person.character || 'Sin rol' : 'Sin rol') : 'job' in person ? person.job || 'Sin rol' : 'Sin rol'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
        {hasPrev && (
          <motion.button
            onClick={() => setCastPage((prev) => Math.max(0, prev - 1))}
            whileHover={{ borderColor: C.accentDim, color: C.accent }}
            transition={{ duration: 0.2 }}
            style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, padding: '8px 14px', cursor: 'pointer' }}
          >
            <ChevronLeft size={14} />
          </motion.button>
        )}
        {hasNext && (
          <motion.button
            onClick={() => setCastPage((prev) => prev + 1)}
            whileHover={{ borderColor: C.accentDim, color: C.accent }}
            transition={{ duration: 0.2 }}
            style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, padding: '8px 14px', cursor: 'pointer' }}
          >
            <ChevronRight size={14} />
          </motion.button>
        )}
      </div>
    </motion.section>
  )
}

function Reviews({
  reviews,
  likedReviewIds,
  viewerId,
  onToggleLike,
  onReply,
  onEditReview,
  onDeleteReview,
  onWriteReview,
}: {
  reviews: AppReview[]
  likedReviewIds: Set<number>
  viewerId: number | null
  onToggleLike: (reviewId: number, liked: boolean) => void
  onReply: (reviewId: number) => void
  onEditReview: (review: AppReview) => void
  onDeleteReview: (review: AppReview) => void
  onWriteReview: () => void
}) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Reseñas de la comunidad</SectionLabel>

      {reviews.length === 0 && <div style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>Aún no hay reseñas para esta película.</div>}

      {reviews.map((review, index) => {
        const liked = likedReviewIds.has(review.id)
        const likesCount = review.likes + (liked ? 1 : 0)
        return (
          <motion.div key={review.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} style={{ borderBottom: `1px solid ${C.border}`, padding: '28px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <Link to={`/${encodeURIComponent(review.username)}`} style={{ textDecoration: 'none' }}>
                {review.avatarUrl ? (
                  <Img
                    src={review.avatarUrl}
                    alt={review.username}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0, cursor: 'pointer' }}
                  />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.elevated, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 16, color: C.textSoft, flexShrink: 0, cursor: 'pointer' }}>
                    {initials(review.username)}
                  </div>
                )}
              </Link>
              <div>
                <Link to={`/${encodeURIComponent(review.username)}`} style={{ textDecoration: 'none' }}>
                  <div style={{ fontSize: 13, fontFamily: SANS, color: C.text, cursor: 'pointer' }}>{review.username}</div>
                </Link>
                <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, marginTop: 1, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>{formatDateLabel(review.createdAt)}</span>
                  <span style={{ border: `1px solid ${C.border}`, padding: '2px 6px', letterSpacing: '0.08em' }}>{review.mode}</span>
                  {review.tiempoLecturaMin ? <span>{review.tiempoLecturaMin} min lectura</span> : null}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <span key={value} style={{ fontSize: 13, color: value <= review.rating ? C.gold : C.textMuted }}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            {review.veredicto ? (
              <div style={{ marginBottom: 10, fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent }}>
                Veredicto: {review.veredicto}
              </div>
            ) : null}

            <Link
              to={`/${encodeURIComponent(review.username)}/movie/${review.id}`}
              style={{ textDecoration: 'none' }}
            >
              <p style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontSize: 18,
                lineHeight: 1.75,
                color: C.textSoft,
                margin: '0 0 14px',
                cursor: 'pointer',
                transition: 'color 0.18s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.textSoft)}
              >
                {review.content}
              </p>
            </Link>

            {review.quote?.dialogo ? (
              <blockquote style={{ margin: '0 0 12px', padding: '10px 12px', borderLeft: `2px solid ${C.accentDim}`, background: C.elevated, fontFamily: SERIF, fontSize: 15, color: C.text }}>
                "{review.quote.dialogo}"
                {review.quote.personaje ? <span style={{ display: 'block', marginTop: 4, color: C.textSoft }}>- {review.quote.personaje}</span> : null}
              </blockquote>
            ) : null}

            {(review.timestamps.length > 0 || review.contieneSpoilers) && (
              <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {review.contieneSpoilers ? (
                  <span style={{ border: '1px solid #7f3f3f', color: '#ffb6b6', fontFamily: SANS, fontSize: 10, padding: '3px 8px', letterSpacing: '0.08em' }}>
                    SPOILERS
                  </span>
                ) : null}
                {review.timestamps.map((stamp, stampIndex) => (
                  <span key={`${review.id}-stamp-${stampIndex}`} style={{ border: `1px solid ${C.border}`, color: C.textSoft, fontFamily: SANS, fontSize: 10, padding: '3px 8px' }}>
                    {stamp.minuto} {stamp.descripcion}
                  </span>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <ReviewRadar values={review.dimensions} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 4, flex: 1 }}>
                {REVIEW_DIMENSIONS.map((entry) => {
                  const value = review.dimensions[entry.key]
                  return (
                    <div key={`${review.id}-${entry.key}`} style={{ fontFamily: SANS, fontSize: 11, color: C.textSoft }}>
                      {entry.label}: {value ? value.toFixed(1) : '-'}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <button onClick={() => onToggleLike(review.id, liked)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: liked ? C.accent : C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: SANS, letterSpacing: '0.1em' }}>
                <Heart size={13} strokeWidth={1.5} fill={liked ? C.accent : 'none'} />
                {likesCount}
              </button>
              <button onClick={() => onReply(review.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: SANS, letterSpacing: '0.1em' }}>
                <MessageSquare size={13} strokeWidth={1.5} /> Responder
              </button>
              {viewerId === review.userId && (
                <>
                  <button onClick={() => onEditReview(review)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: SANS, letterSpacing: '0.1em' }}>
                    <Pencil size={13} strokeWidth={1.5} /> Editar
                  </button>
                  <button onClick={() => onDeleteReview(review)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#ff9b9b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: SANS, letterSpacing: '0.1em' }}>
                    <Trash2 size={13} strokeWidth={1.5} /> Eliminar
                  </button>
                </>
              )}
            </div>

            {review.comments.length > 0 ? (
              <div style={{ marginTop: 14, paddingLeft: 12, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {review.comments.map((comment) => (
                  <div key={comment.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: SANS, fontSize: 11, color: C.accent }}>@{comment.username}</span>
                    <span style={{ fontFamily: SERIF, fontSize: 15, color: C.textSoft, fontStyle: 'italic' }}>{comment.content}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </motion.div>
        )
      })}

      <button onClick={onWriteReview} style={{ marginTop: 28, padding: '12px 28px', background: 'transparent', color: C.accent, border: `1px solid ${C.accentDim}`, fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        Escribir o editar mi reseña
      </button>
    </motion.section>
  )
}

function Sidebar({
  movie,
  similar,
  directorObj,
}: {
  movie: MovieDetailApi
  similar: SimilarFilm[]
  directorObj: { id: number; name: string } | null
}) {
  const photography = getCrewByJob(movie, ['Director of Photography', 'Cinematography'])
  const music = getCrewByJob(movie, ['Original Music Composer', 'Music', 'Composer'])
  const production = movie.production_companies?.[0]?.name || 'Desconocido'
  const platforms = mapPlatforms(movie)

  const metaRows = [
    { key: 'País', val: movie.production_countries?.[0]?.name || 'Desconocido' },
    { key: 'Año', val: movie.release_date ? String(new Date(movie.release_date).getFullYear()) : '----' },
    { key: 'Duración', val: movie.runtime ? `${movie.runtime} min` : 'No disponible' },
    { key: 'Idioma', val: movie.spoken_languages?.[0]?.english_name || movie.spoken_languages?.[0]?.name || 'Desconocido' },
    { key: 'Fotografía', val: photography },
    { key: 'Música', val: music },
    { key: 'Producción', val: production },
  ]

  return (
    <aside>
      <div className="md-sidebar-sticky">
        <div className="md-sidebar-panel" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>Ficha técnica</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="md-sidebar-row">
              <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: SANS }}>Director</span>
              {directorObj ? (
                <Link
                  to={`/person/${directorObj.id}`}
                  className="md-sidebar-value"
                  style={{ fontFamily: SERIF, fontSize: 16, color: C.accent, maxWidth: '100%', ...textClampOneLine, textDecoration: 'none', borderBottom: `1px solid ${C.accentDim}`, paddingBottom: 1 }}
                >
                  {directorObj.name}
                </Link>
              ) : (
                <span className="md-sidebar-value" style={{ fontFamily: SERIF, fontSize: 16, color: C.textSoft, maxWidth: '100%', ...textClampOneLine }}>Desconocido</span>
              )}
            </div>
            {metaRows.map((row) => (
              <div key={row.key} className="md-sidebar-row">
                <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: SANS }}>{row.key}</span>
                <span className="md-sidebar-value" style={{ fontFamily: SERIF, fontSize: 16, color: C.textSoft, maxWidth: '100%', ...textClampOneLine }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md-sidebar-panel" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>Géneros</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(movie.genres || []).map((genre) => (
              <span key={genre.id} style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textSoft, border: `1px solid ${C.border}`, padding: '4px 10px', fontFamily: SANS }}>
                {genre.name}
              </span>
            ))}
          </div>
        </div>

        <div className="md-sidebar-panel" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>Dónde ver</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {platforms.length === 0 && <div style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>No hay plataformas disponibles.</div>}
            {platforms.map((platform) => (
              <a key={`${platform.name}-${platform.type}`} href={platform.url} target="_blank" rel="noreferrer" className="md-sidebar-platforms" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 12px', background: C.elevated, border: '1px solid transparent', textDecoration: 'none', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 13, fontFamily: SANS, color: C.text, ...textClampOneLine }}>{platform.name}</div>
                  <div style={{ fontSize: 11, fontFamily: SANS, color: C.textMuted }}>{platform.type}</div>
                </div>
                <ExternalLink className="md-platform-icon" size={12} color={C.textMuted} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        <div className="md-sidebar-panel" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>También te puede interesar</div>
          <div className="md-sidebar-grid">
            {similar.map((film) => (
              <Link key={film.id} to={`/movie/${film.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ aspectRatio: '2/3', borderRadius: 1, overflow: 'hidden', background: C.elevated, marginBottom: 7, position: 'relative' }}>
                  <Img src={film.img} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.4)' }} />
                </div>
                <div style={{ fontSize: 11, color: C.text, fontFamily: SANS, lineHeight: 1.3 }}>{film.title}</div>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: SANS }}>{film.year || '----'}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

function Footer() {
  return (
    <footer className="md-footer" style={{ borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/" style={{ fontFamily: SERIF, fontSize: 16, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, textDecoration: 'none' }}>
        Cine<span style={{ color: C.accent }}>Vault</span>
      </Link>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.textMuted }}>&quot;Toda gran colección empieza con una.&quot;</div>
    </footer>
  )
}

export default function MovieDetailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { slugOrId } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [noticeType, setNoticeType] = useState<'success' | 'error' | 'info'>('info')

  const [movie, setMovie] = useState<MovieDetailApi | null>(null)
  const [reviews, setReviews] = useState<AppReview[]>([])
  const [likedReviewIds, setLikedReviewIds] = useState<Set<number>>(new Set())
  const [similar, setSimilar] = useState<SimilarFilm[]>([])
  const [composerMode, setComposerMode] = useState<'review' | 'reply' | null>(null)
  const [composerText, setComposerText] = useState('')
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null)
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null)
  const composerRef = useRef<HTMLDivElement | null>(null)
  const [reviewLogOpen, setReviewLogOpen] = useState(false)
  const [reviewLogText, setReviewLogText] = useState('')
  const [reviewLogRating, setReviewLogRating] = useState(0)
  const [reviewLogMode, setReviewLogMode] = useState<ReviewMode>('RAPIDO')
  const [reviewLogVeredicto, setReviewLogVeredicto] = useState('')
  const [reviewLogContieneSpoilers, setReviewLogContieneSpoilers] = useState(false)
  const [reviewLogCitaDialogo, setReviewLogCitaDialogo] = useState('')
  const [reviewLogCitaPersonaje, setReviewLogCitaPersonaje] = useState('')
  const [reviewLogTimestamps, setReviewLogTimestamps] = useState<Array<{ minuto: string; descripcion: string }>>([])
  const [reviewLogDimensions, setReviewLogDimensions] = useState<AppReview['dimensions']>({
    direccion: null,
    guion: null,
    fotografia: null,
    actuaciones: null,
    bandaSonora: null,
  })
  const [reviewLogLiked, setReviewLogLiked] = useState(false)
  const [reviewLogSeenDate, setReviewLogSeenDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [reviewLogSeenBefore, setReviewLogSeenBefore] = useState(false)
  const [reviewLogSaving, setReviewLogSaving] = useState(false)
  const [addToListOpen, setAddToListOpen] = useState(false)
  const [addToListLoading, setAddToListLoading] = useState(false)
  const [addToListSaving, setAddToListSaving] = useState(false)
  const [addToListCreating, setAddToListCreating] = useState(false)
  const [userLists, setUserLists] = useState<UserListSummary[]>([])
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')

  const [userRating, setUserRating] = useState(0)
  const [myReviewId, setMyReviewId] = useState<number | null>(null)
  const [inVault, setInVault] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [liked, setLiked] = useState(false)
  const [viewer, setViewer] = useState<Viewer | null>(null)

  const [token, setToken] = useState<string | null>(() => getStoredAccessToken())
  const movieId = useMemo(() => parseMovieId(slugOrId), [slugOrId])
  const shouldAutoOpenEntry = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('entry') === '1'
  }, [location.search])

  useEffect(() => {
    const syncToken = () => setToken(getStoredAccessToken())
    window.addEventListener('auth-state-changed', syncToken)
    return () => window.removeEventListener('auth-state-changed', syncToken)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slugOrId])

  useEffect(() => {
    if (!token) {
      setViewer(null)
      return
    }
    getCurrentUser()
      .then((user) => {
        setViewer({ id: user.id, username: user.username, avatar_url: user.avatar_url, membership: user.membership || null, role: user.role || null })
      })
      .catch(() => {
        setViewer(null)
      })
  }, [token])

  useEffect(() => {
    if (!slugOrId) {
      setError('Película no encontrada')
      setLoading(false)
      return
    }

    let alive = true

    const loadPage = async () => {
      setLoading(true)
      setError(null)

      try {
        const detail = await fetchMovieDetail(slugOrId)
        if (!alive) return

        setMovie(detail)

        const [movieReviews, topRated] = await Promise.all([
          fetchMovieReviews(detail.id),
          fetchTopRatedMovies(),
        ])

        if (!alive) return

        const uniqueUserIds = [...new Set(movieReviews.map((review) => review.user_id))]
        const userPairs = await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
              const user = await fetchUserById(userId)
              return [
                userId,
                {
                  username: user.username || `Usuario ${userId}`,
                  avatarUrl: user.avatar_url || null,
                },
              ] as const
            } catch {
              return [
                userId,
                {
                  username: `Usuario ${userId}`,
                  avatarUrl: null,
                },
              ] as const
            }
          })
        )
        const userMeta = Object.fromEntries(userPairs)
        const commentsPairs = await Promise.all(
          movieReviews.map(async (review) => {
            try {
              const comments = await fetchReviewComments(review.id)
              return [review.id, Array.isArray(comments) ? comments : []] as const
            } catch {
              return [review.id, [] as ReviewCommentApi[]] as const
            }
          })
        )
        const commentsByReviewId = Object.fromEntries(commentsPairs)

        setReviews(mapMovieReviews(movieReviews, userMeta, commentsByReviewId))

        const topRatedList = Array.isArray(topRated.results) ? topRated.results.slice(0, 6) : []
        setSimilar(
          topRatedList
            .filter((item) => item.id !== detail.id)
            .map((item) => ({
              id: item.id,
              title: item.title,
              year: item.release_date ? new Date(item.release_date).getFullYear() : 0,
              img: item.poster_path ? `${TMDB_POSTER}${item.poster_path}` : '',
            }))
        )

        if (token) {
          const [myReviews, myWatchlist, myFavorites, myDiary] = await Promise.all([
            fetchMyReviews(token).catch(() => []),
            fetchMyWatchlist(token).catch(() => []),
            fetchMyFavorites(token).catch(() => []),
            fetchMyDiary(token).catch(() => ({ diary: [] })),
          ])

          if (!alive) return

          const myReview = myReviews.find((review) =>
            isCurrentMovieMatch(review, detail.id, movieId)
          )
          setMyReviewId(myReview?.id ?? null)
          setUserRating(Number(myReview?.rating ?? 0))
          setInWatchlist(myWatchlist.some((entry) => isCurrentMovieMatch(entry, detail.id, movieId)))
          setLiked(myFavorites.some((entry) => isCurrentMovieMatch(entry, detail.id, movieId)))
          setInVault(
            (myDiary.diary || []).some((entry) =>
              isCurrentMovieMatch(
                { movie_id: entry.movie_id, tmdb_id: entry.tmdb_id },
                detail.id,
                movieId
              )
            )
          )
        } else {
          setMyReviewId(null)
          setUserRating(0)
          setInWatchlist(false)
          setLiked(false)
          setInVault(false)
        }
      } catch (err) {
        if (!alive) return
        setError((err as Error).message || 'Error al cargar la película')
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadPage()

    return () => {
      alive = false
    }
  }, [slugOrId, token, movieId])

  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 3000)
    return () => window.clearTimeout(id)
  }, [notice])

  useEffect(() => {
    if (!composerMode) return
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [composerMode])

  const requireAuth = () => {
    if (token) return true
    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }))
    setNoticeType('info')
    setNotice('Tienes que loguearte para usar esta opción')
    return false
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setViewer(null)
    setNoticeType('success')
    setNotice('Sesión cerrada')
    navigate('/')
  }

  const showSuccess = (message: string) => {
    setNoticeType('success')
    setNotice(message)
  }

  const showError = (message: string) => {
    setNoticeType('error')
    setNotice(message)
  }

  const handleRate = async (value: number) => {
    if (!movie || !token) {
      requireAuth()
      return
    }

    try {
      if (myReviewId) {
        await updateReview(token, myReviewId, value)
      } else {
        const created = await createReview(token, {
          movie_id: movie.id,
          mode: 'RAPIDO',
          rating: value,
          content: 'Rating rapido desde Movie Detail',
        })
        setMyReviewId(created.id)
      }
      setUserRating(value)
      showSuccess('Rating guardado')
    } catch (err) {
      showError((err as Error).message || 'No se pudo guardar el rating')
    }
  }

  const handleToggleVault = async () => {
    if (!movie || !token) {
      requireAuth()
      return
    }

    try {
      if (inVault) {
        const myDiary = await fetchMyDiary(token)
        const currentEntry = (myDiary.diary || []).find((entry) =>
          isCurrentMovieMatch(
            { movie_id: entry.movie_id, tmdb_id: entry.tmdb_id },
            movie.id,
            movieId
          )
        )

        if (!currentEntry?.id) {
          setInVault(false)
          showSuccess('Se actualizó tu Vault')
          return
        }

        await removeFromDiary(token, currentEntry.id)
        setInVault(false)
        showSuccess('Eliminada de tu Vault')
        return
      }

      await addToDiary(token, movie.id)
      setInVault(true)
      showSuccess('Añadida a tu Vault')
    } catch (err) {
      const message = (err as Error).message || 'No se pudo actualizar tu Vault'
      if (/ya registraste|ya está|conflict|duplicate/i.test(message)) {
        setInVault(true)
        showSuccess('Esta película ya estaba en tu Vault')
        return
      }
      showError(message)
    }
  }

  const handleToggleWatchlist = async () => {
    if (!movie || !token) {
      requireAuth()
      return
    }

    try {
      if (inWatchlist) {
        await removeFromWatchlist(token, movie.id)
        setInWatchlist(false)
        showSuccess('Eliminada de Watchlist')
      } else {
        await addToWatchlist(token, movie.id)
        setInWatchlist(true)
        showSuccess('Añadida a Watchlist')
      }
    } catch (err) {
      const message = (err as Error).message || 'No se pudo actualizar la Watchlist'
      if (/ya está|conflict|duplicate/i.test(message)) {
        setInWatchlist(true)
        showSuccess('Esta película ya estaba en Watchlist')
        return
      }
      showError(message)
    }
  }

  const handleToggleFavorite = async () => {
    if (!movie || !token) {
      requireAuth()
      return
    }

    try {
      if (liked) {
        await removeFromFavorites(token, movie.id)
        setLiked(false)
        showSuccess('Quitada de favoritos')
      } else {
        await addToFavorites(token, movie.id)
        setLiked(true)
        showSuccess('Añadida a favoritos')
      }
    } catch (err) {
      const message = (err as Error).message || 'No se pudo actualizar favoritos'
      if (/ya|conflict|duplicate/i.test(message)) {
        setLiked(true)
        showSuccess('Esta película ya estaba en favoritos')
        return
      }
      showError(message)
    }
  }

  const handleAddToList = async () => {
    if (!movie || !token) {
      requireAuth()
      return
    }

    setAddToListOpen(true)
    setAddToListLoading(true)
    setNewListName('')
    setNewListDescription('')

    try {
      const lists = await getMyLists()
      setUserLists(lists)
      setSelectedListId(lists[0]?.id ?? null)
    } catch (err) {
      const message = (err as Error).message || 'No se pudo añadir a lista'
      setAddToListOpen(false)
      showError(message)
    } finally {
      setAddToListLoading(false)
    }
  }

  const handleCreateListFromModal = async () => {
    const name = newListName.trim()
    if (!name) {
      showError('Escribe un nombre para crear la lista')
      return
    }

    setAddToListCreating(true)
    try {
      const created = await createList({
        name,
        description: newListDescription.trim() || null,
      })
      setUserLists((prev) => [created, ...prev])
      setSelectedListId(created.id)
      setNewListName('')
      setNewListDescription('')
      showSuccess(`Lista "${created.name}" creada`)
    } catch (err) {
      showError((err as Error).message || 'No se pudo crear la lista')
    } finally {
      setAddToListCreating(false)
    }
  }

  const handleConfirmAddToList = async () => {
    if (!movie || selectedListId === null) return

    const target = userLists.find((list) => list.id === selectedListId)
    setAddToListSaving(true)
    try {
      await addMovieToList(selectedListId, movie.id)
      setAddToListOpen(false)
      showSuccess(`Anadida a "${target?.name || 'tu lista'}"`)
    } catch (err) {
      const message = (err as Error).message || 'No se pudo anadir a lista'
      if (/ya|conflict|duplicate/i.test(message)) {
        setAddToListOpen(false)
        showSuccess('Esta pelicula ya estaba en esa lista')
        return
      }
      showError(message)
    } finally {
      setAddToListSaving(false)
    }
  }

  const handleShare = async () => {
    if (!movie) return

    const url = window.location.href
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const tempInput = document.createElement('textarea')
        tempInput.value = url
        tempInput.style.position = 'fixed'
        tempInput.style.opacity = '0'
        document.body.appendChild(tempInput)
        tempInput.select()
        document.execCommand('copy')
        document.body.removeChild(tempInput)
      }
      showSuccess('Enlace copiado para compartir')
    } catch {
      showError('No se pudo compartir el enlace')
    }
  }

  const handleToggleReviewLike = async (reviewId: number, alreadyLiked: boolean) => {
    if (!token) {
      requireAuth()
      return
    }

    try {
      if (alreadyLiked) {
        await unlikeReview(token, reviewId)
        setLikedReviewIds((prev) => {
          const next = new Set(prev)
          next.delete(reviewId)
          return next
        })
      } else {
        await likeReview(token, reviewId)
        setLikedReviewIds((prev) => {
          const next = new Set(prev)
          next.add(reviewId)
          return next
        })
      }
    } catch (err) {
      const message = (err as Error).message || 'No se pudo actualizar el like'
      if (!alreadyLiked && /ya has dado like|conflict/i.test(message)) {
        setLikedReviewIds((prev) => new Set(prev).add(reviewId))
        showSuccess('Ya tenías like en esta reseña')
        return
      }
      if (alreadyLiked && /no has dado like|not found/i.test(message)) {
        setLikedReviewIds((prev) => {
          const next = new Set(prev)
          next.delete(reviewId)
          return next
        })
        showSuccess('Like quitado')
        return
      }
      showError(message)
    }
  }

  const handleReplyReview = async (reviewId: number) => {
    if (!token) {
      requireAuth()
      return
    }

    setReplyTargetId(reviewId)
    setComposerText('')
    setComposerMode('reply')
  }

  const handleWriteReview = async () => {
    if (!movie || !token) {
      requireAuth()
      return
    }

    const existingOwnReview = viewer
      ? reviews.find((review) => review.userId === viewer.id)
      : null

    setReplyTargetId(null)
    setEditingReviewId(existingOwnReview?.id ?? null)
    setReviewLogText(existingOwnReview?.content || '')
    setReviewLogRating(existingOwnReview?.rating || userRating || 0)
    setReviewLogMode(existingOwnReview?.mode || 'RAPIDO')
    setReviewLogVeredicto(existingOwnReview?.veredicto || '')
    setReviewLogContieneSpoilers(Boolean(existingOwnReview?.contieneSpoilers))
    setReviewLogCitaDialogo(existingOwnReview?.quote?.dialogo || '')
    setReviewLogCitaPersonaje(existingOwnReview?.quote?.personaje || '')
    setReviewLogTimestamps(existingOwnReview?.timestamps || [])
    setReviewLogDimensions(
      existingOwnReview?.dimensions || {
        direccion: null,
        guion: null,
        fotografia: null,
        actuaciones: null,
        bandaSonora: null,
      }
    )
    setReviewLogLiked(liked)
    setReviewLogSeenDate(new Date().toISOString().slice(0, 10))
    setReviewLogSeenBefore(false)
    setReviewLogOpen(true)
  }

  useEffect(() => {
    if (!shouldAutoOpenEntry || !movie || reviewLogOpen) return

    if (!token) {
      requireAuth()
      return
    }

    handleWriteReview()
    navigate({ pathname: location.pathname, search: '' }, { replace: true })
  }, [location.pathname, movie, navigate, reviewLogOpen, shouldAutoOpenEntry, token])

  const handleSaveReviewLog = async () => {
    if (!token || !movie) {
      requireAuth()
      return
    }

    setReviewLogSaving(true)

    try {
      const text = reviewLogText.trim()
      const ratingToUse = reviewLogRating > 0 ? reviewLogRating : 0
      const payload = {
        mode: reviewLogMode,
        content: text || undefined,
        rating: ratingToUse > 0 ? ratingToUse : undefined,
        veredicto: reviewLogVeredicto.trim() || undefined,
        rating_direccion: reviewLogDimensions.direccion || undefined,
        rating_guion: reviewLogDimensions.guion || undefined,
        rating_fotografia: reviewLogDimensions.fotografia || undefined,
        rating_actuaciones: reviewLogDimensions.actuaciones || undefined,
        rating_banda_sonora: reviewLogDimensions.bandaSonora || undefined,
        cita_dialogo: reviewLogCitaDialogo.trim() || undefined,
        cita_personaje: reviewLogCitaPersonaje.trim() || undefined,
        timestamps: reviewLogTimestamps
          .map((item) => ({ minuto: item.minuto.trim(), descripcion: item.descripcion.trim() }))
          .filter((item) => item.minuto && item.descripcion),
        contiene_spoilers: reviewLogContieneSpoilers,
      }

      if (reviewLogMode === 'ESTANDAR' && !payload.veredicto) {
        throw new Error('En modo ESTANDAR debes escribir un veredicto')
      }

      if (reviewLogMode === 'CRITICO') {
        const canUseCriticalMode = (String(viewer?.membership || '').toLowerCase() === 'pro') || (String(viewer?.role || '').toLowerCase() === 'admin')
        if (!canUseCriticalMode) {
          throw new Error('El modo CRITICO requiere plan Pro (o rol Admin)')
        }
        if ((payload.content || '').length < 500) {
          throw new Error('El modo CRITICO requiere al menos 500 caracteres')
        }
      }

      if (myReviewId || editingReviewId) {
        const reviewId = editingReviewId || myReviewId
        if (reviewId && (text || ratingToUse > 0 || reviewLogMode !== 'RAPIDO')) {
          await updateReviewContent(token, reviewId, payload)
        }
      } else if (text || ratingToUse > 0 || reviewLogMode !== 'RAPIDO') {
        const created = await createReview(token, {
          movie_id: movie.id,
          ...payload,
          rating: payload.rating || 4,
          content: payload.content || 'Log rapido desde Movie Detail',
        })
        setMyReviewId(created.id)
      }

      try {
        await addToDiary(token, movie.id, reviewLogSeenDate)
        setInVault(true)
      } catch (err) {
        const message = (err as Error).message || ''
        if (!/ya registraste|ya está|conflict|duplicate/i.test(message)) {
          throw err
        }
        setInVault(true)
      }

      if (reviewLogLiked !== liked) {
        if (reviewLogLiked) {
          await addToFavorites(token, movie.id)
          setLiked(true)
        } else {
          await removeFromFavorites(token, movie.id)
          setLiked(false)
        }
      }

      const freshReviews = await fetchMovieReviews(movie.id)
      const uniqueUserIds = [...new Set(freshReviews.map((review) => review.user_id))]
      const userPairs = await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const user = await fetchUserById(userId)
            return [
              userId,
              {
                username: user.username || `Usuario ${userId}`,
                avatarUrl: user.avatar_url || null,
              },
            ] as const
          } catch {
            return [
              userId,
              {
                username: `Usuario ${userId}`,
                avatarUrl: null,
              },
            ] as const
          }
        })
      )
      const userMeta = Object.fromEntries(userPairs)
      const commentsPairs = await Promise.all(
        freshReviews.map(async (review) => {
          try {
            const comments = await fetchReviewComments(review.id)
            return [review.id, Array.isArray(comments) ? comments : []] as const
          } catch {
            return [review.id, [] as ReviewCommentApi[]] as const
          }
        })
      )
      const commentsByReviewId = Object.fromEntries(commentsPairs)
      setReviews(mapMovieReviews(freshReviews, userMeta, commentsByReviewId))

      const ownReview = freshReviews.find((review) => isCurrentMovieMatch(review, movie.id, movieId))
      setMyReviewId(ownReview?.id ?? null)
      setUserRating(Number(ownReview?.rating ?? reviewLogRating))
      setReviewLogOpen(false)
      setEditingReviewId(null)
      showSuccess(reviewLogSeenBefore ? 'Log y reseña guardados (vista previa)' : 'Log y reseña guardados')
    } catch (err) {
      showError((err as Error).message || 'No se pudo guardar el log')
    } finally {
      setReviewLogSaving(false)
    }
  }

  const handleEditReview = (review: AppReview) => {
    setEditingReviewId(review.id)
    setReplyTargetId(null)
    setComposerText(review.content || '')
    setUserRating(review.rating || userRating)
    setComposerMode('review')
  }

  const handleDeleteReview = async (review: AppReview) => {
    if (!token) {
      requireAuth()
      return
    }

    try {
      await deleteReview(token, review.id)
      setReviews((prev) => prev.filter((item) => item.id !== review.id))
      if (myReviewId === review.id) {
        setMyReviewId(null)
        setUserRating(0)
      }
      if (editingReviewId === review.id) {
        setEditingReviewId(null)
        setComposerMode(null)
        setComposerText('')
      }
      showSuccess('Reseña eliminada')
    } catch (err) {
      showError((err as Error).message || 'No se pudo eliminar la reseña')
    }
  }

  const handleSubmitComposer = async () => {
    if (!token) {
      requireAuth()
      return
    }

    const text = composerText.trim()
    if (!text) {
      showError('Escribe contenido antes de enviar')
      return
    }

    if (composerMode === 'reply') {
      if (!replyTargetId) return

      const previousReviews = reviews
      const optimisticCommentId = -Date.now()
      const optimisticComment = {
        id: optimisticCommentId,
        userId: viewer?.id || 0,
        username: viewer?.username || 'Tú',
        avatarUrl: viewer?.avatar_url || null,
        content: text,
        createdAt: new Date().toISOString(),
      }

      setReviews((prev) =>
        prev.map((review) => {
          if (review.id !== replyTargetId) return review
          return {
            ...review,
            comments: [...review.comments, optimisticComment],
          }
        })
      )
      setComposerMode(null)
      setComposerText('')

      try {
        await commentOnReview(token, replyTargetId, text)
        const latestComments = await fetchReviewComments(replyTargetId)
        const mappedComments = (Array.isArray(latestComments) ? latestComments : []).map((comment) => ({
          id: comment.id,
          userId: comment.user_id,
          username: comment.users?.username || `Usuario ${comment.user_id}`,
          avatarUrl: comment.users?.avatar_url || null,
          content: comment.content,
          createdAt: comment.created_at,
        }))

        setReviews((prev) =>
          prev.map((review) => {
            if (review.id !== replyTargetId) return review
            return {
              ...review,
              comments: mappedComments,
            }
          })
        )

        showSuccess('Comentario enviado')
      } catch (err) {
        setReviews(previousReviews)
        setComposerMode('reply')
        setReplyTargetId(replyTargetId)
        setComposerText(text)
        showError((err as Error).message || 'No se pudo enviar el comentario')
      }
      return
    }

    if (!movie) return

    const ratingToUse = userRating > 0 ? userRating : 4

    try {
      if (myReviewId || editingReviewId) {
        const reviewId = editingReviewId || myReviewId
        if (!reviewId) return
        await updateReviewContent(token, reviewId, {
          mode: 'ESTANDAR',
          rating: ratingToUse,
          content: text,
        })
        showSuccess('Reseña actualizada')
      } else {
        const created = await createReview(token, {
          movie_id: movie.id,
          mode: 'ESTANDAR',
          rating: ratingToUse,
          content: text,
          veredicto: text.slice(0, 120),
        })
        setMyReviewId(created.id)
        showSuccess('Reseña publicada')
      }
      const freshReviews = await fetchMovieReviews(movie.id)
      const uniqueUserIds = [...new Set(freshReviews.map((review) => review.user_id))]
      const userPairs = await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const user = await fetchUserById(userId)
            return [
              userId,
              {
                username: user.username || `Usuario ${userId}`,
                avatarUrl: user.avatar_url || null,
              },
            ] as const
          } catch {
            return [
              userId,
              {
                username: `Usuario ${userId}`,
                avatarUrl: null,
              },
            ] as const
          }
        })
      )
      const userMeta = Object.fromEntries(userPairs)
      const commentsPairs = await Promise.all(
        freshReviews.map(async (review) => {
          try {
            const comments = await fetchReviewComments(review.id)
            return [review.id, Array.isArray(comments) ? comments : []] as const
          } catch {
            return [review.id, [] as ReviewCommentApi[]] as const
          }
        })
      )
      const commentsByReviewId = Object.fromEntries(commentsPairs)
      setReviews(mapMovieReviews(freshReviews, userMeta, commentsByReviewId))
      const ownReview = freshReviews.find((review) => isCurrentMovieMatch(review, movie.id, movieId))
      setMyReviewId(ownReview?.id ?? null)
      setUserRating(Number(ownReview?.rating ?? userRating))
      setComposerMode(null)
      setEditingReviewId(null)
      setComposerText('')
    } catch (err) {
      showError((err as Error).message || 'No se pudo publicar la reseña')
    }
  }

  const stills = useMemo(() => {
    if (!movie?.images?.backdrops?.length) return [] as string[]
    return movie.images.backdrops
      .slice(0, 5)
      .map((item) => item.file_path)
      .filter((path): path is string => typeof path === 'string' && path.length > 0)
      .map((path) => `${TMDB_IMAGE}${path}`)
  }, [movie])

  const themes = useMemo(() => {
    const fromGenres = (movie?.genres || []).map((genre) => genre.name)
    const base = ['Slow cinema', 'Cine de autor', 'Filosofía del deseo']
    return [...new Set([...fromGenres, ...base])]
  }, [movie])
  const directorObj = useMemo(() => getDirectorObj(movie), [movie])

  const seo = useMemo(() => {
    if (!movie) {
      return {
        title: 'Ficha de pelicula | CineVault',
        description: 'Consulta ficha, reparto, plataformas y reseñas en CineVault.',
        canonical: 'https://cinevault.art/movie',
        image: 'https://cinevault.art/whiplash2.jpg',
        structuredData: undefined as string | undefined,
      }
    }

    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
    const title = year ? `${movie.title} (${year}) | CineVault` : `${movie.title} | CineVault`
    const description = (movie.overview || movie.tagline || `Descubre ${movie.title} en CineVault.`).slice(0, 155)
    const image = movie.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
      : movie.poster_path
        ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
        : 'https://cinevault.art/whiplash2.jpg'
    const canonicalPath = buildMovieCanonicalPath(movie.id, movie.title)

    return {
      title,
      description,
      canonical: `https://cinevault.art${canonicalPath}`,
      image,
      structuredData: buildMovieSchema({
        name: movie.title,
        description,
        image,
        datePublished: movie.release_date,
        directorName: directorObj?.name,
        genres: (movie.genres || []).map((genre) => genre.name),
        ratingValue: movie.vote_average,
        ratingCount: movie.vote_count,
      }),
    }
  }, [movie, directorObj])

  useEffect(() => {
    if (!movie || !slugOrId) return

    const canonicalPath = buildMovieCanonicalPath(movie.id, movie.title)
    const currentPath = `/movie/${slugOrId}`
    if (currentPath !== canonicalPath) {
      navigate(canonicalPath, { replace: true })
    }
  }, [movie, slugOrId, navigate])

  if (loading) {
    return (
      <>
        <SeoHead.Page
          title="Cargando pelicula | CineVault"
          description="Cargando ficha de pelicula y reseñas en CineVault."
          canonical="https://cinevault.art/movie"
        />
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>
          Cargando película...
        </div>
      </>
    )
  }

  if (error || !movie || !movieId) {
    return (
      <>
        <SeoHead.NoIndex
          title="Error de pelicula | CineVault"
          description="No se pudo cargar esta ficha de pelicula en este momento."
          canonical="https://cinevault.art/movie"
        />
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, color: '#ff8a8a', fontFamily: SANS }}>
          <div style={{ textAlign: 'center' }}>
            <p>{error || 'No se pudo cargar la película'}</p>
            <button onClick={() => navigate('/')} style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.text, padding: '8px 14px', cursor: 'pointer' }}>
              Volver al inicio
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS, overflowX: 'hidden' }}>
      <SeoHead.Movie
        title={seo.title}
        description={seo.description}
        canonical={seo.canonical}
        image={seo.image}
        structuredData={seo.structuredData || ''}
      />
      <Grain />
      <NoticeBar message={notice} type={noticeType} />
      <ReviewLogModal
        open={reviewLogOpen}
        movie={movie}
        membership={viewer?.membership}
        role={viewer?.role}
        text={reviewLogText}
        rating={reviewLogRating}
        mode={reviewLogMode}
        veredicto={reviewLogVeredicto}
        contieneSpoilers={reviewLogContieneSpoilers}
        citaDialogo={reviewLogCitaDialogo}
        citaPersonaje={reviewLogCitaPersonaje}
        timestamps={reviewLogTimestamps}
        dimensions={reviewLogDimensions}
        liked={reviewLogLiked}
        seenDate={reviewLogSeenDate}
        seenBefore={reviewLogSeenBefore}
        saving={reviewLogSaving}
        onClose={() => setReviewLogOpen(false)}
        onTextChange={setReviewLogText}
        onRatingChange={setReviewLogRating}
        onModeChange={setReviewLogMode}
        onVeredictoChange={setReviewLogVeredicto}
        onContieneSpoilersChange={setReviewLogContieneSpoilers}
        onCitaDialogoChange={setReviewLogCitaDialogo}
        onCitaPersonajeChange={setReviewLogCitaPersonaje}
        onDimensionsChange={(key, value) => {
          setReviewLogDimensions((prev) => ({ ...prev, [key]: value }))
        }}
        onAddTimestamp={() => {
          setReviewLogTimestamps((prev) => [...prev, { minuto: '', descripcion: '' }])
        }}
        onTimestampChange={(index, field, value) => {
          setReviewLogTimestamps((prev) =>
            prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
          )
        }}
        onRemoveTimestamp={(index) => {
          setReviewLogTimestamps((prev) => prev.filter((_, idx) => idx !== index))
        }}
        onToggleLike={() => setReviewLogLiked((prev) => !prev)}
        onSeenDateChange={setReviewLogSeenDate}
        onSeenBeforeChange={setReviewLogSeenBefore}
        onSave={handleSaveReviewLog}
      />
      <AddToListModal
        open={addToListOpen}
        movieTitle={movie.title}
        loading={addToListLoading}
        saving={addToListSaving}
        lists={userLists}
        selectedListId={selectedListId}
        createName={newListName}
        createDescription={newListDescription}
        creating={addToListCreating}
        onClose={() => setAddToListOpen(false)}
        onSelectList={setSelectedListId}
        onCreateNameChange={setNewListName}
        onCreateDescriptionChange={setNewListDescription}
        onCreateList={handleCreateListFromModal}
        onConfirm={handleConfirmAddToList}
      />
      <Navbar viewer={viewer} onLogout={handleLogout} />

      <Hero
        movie={movie}
        userRating={userRating}
        inVault={inVault}
        inWatchlist={inWatchlist}
        liked={liked}
        onRate={handleRate}
        onToggleVault={handleToggleVault}
        onToggleWatchlist={handleToggleWatchlist}
        onToggleFavorite={handleToggleFavorite}
        onAddToList={handleAddToList}
        onWriteReview={handleWriteReview}
        onShare={handleShare}
      />

      <DirectorQuote director={directorObj?.name || 'Desconocido'} />

      <div className="md-main-layout">
        <main>
          <Synopsis overview={movie.overview || ''} tagline={movie.tagline} />
          <Themes themes={themes} />
          {stills.length > 0 && <Stills stills={stills} />}
          <CastCrew cast={movie.credits?.cast || []} crew={movie.credits?.crew || []} />
          <Reviews
            reviews={reviews}
            likedReviewIds={likedReviewIds}
            viewerId={viewer?.id ?? null}
            onToggleLike={handleToggleReviewLike}
            onReply={handleReplyReview}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
            onWriteReview={handleWriteReview}
          />
          <div ref={composerRef}>
            <InlineComposer
              mode={composerMode}
              text={composerText}
              onTextChange={setComposerText}
              onCancel={() => {
                setComposerMode(null)
                setComposerText('')
              }}
              onSubmit={handleSubmitComposer}
            />
          </div>
        </main>

        <Sidebar movie={movie} similar={similar} directorObj={directorObj ? { id: directorObj.id, name: directorObj.name } : null} />
      </div>

      <Footer />
    </div>
  )
}
