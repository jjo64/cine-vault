import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'motion/react'
import {
  ChevronLeft,
  Bookmark,
  Share2,
  List,
  Heart,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react'
import {
  addToDiary,
  addToFavorites,
  addToWatchlist,
  commentOnReview,
  createReview,
  fetchMovieDetail,
  fetchMovieReviews,
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
  type ReviewApi,
  unlikeReview,
  updateReview,
} from '../services/movieDetailServices'
import { getCurrentUser } from '../services/authServices'

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
  username: string
  avatarUrl?: string | null
  content: string
  rating: number
  likes: number
  createdAt: string
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
  const active = hover ?? value

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

function getDirector(movie: MovieDetailApi | null) {
  return (movie?.credits?.crew || []).find((person) => person.job === 'Director')?.name || 'Desconocido'
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
    ;(items || []).forEach((provider) => {
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
  userMeta: Record<number, { username: string; avatarUrl: string | null }>
): AppReview[] {
  return reviews.map((review) => ({
    id: review.id,
    userId: review.user_id,
    username: userMeta[review.user_id]?.username || `Usuario ${review.user_id}`,
    avatarUrl: userMeta[review.user_id]?.avatarUrl || null,
    content: review.content || 'Sin comentario',
    rating: review.rating || 0,
    likes: review.likes || 0,
    createdAt: review.created_at,
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
  isMobile,
  isTablet,
}: {
  viewer: Viewer | null
  onLogout: () => void
  isMobile: boolean
  isTablet: boolean
}) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ id: number; title: string; poster_path: string | null }>>([])
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
  const visibleNavLinks = isMobile ? [] : isTablet ? navLinks.slice(0, 3) : navLinks

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 14px' : isTablet ? '0 24px' : '0 52px',
        height: isMobile ? 56 : 64,
        background: scrolled ? 'rgba(8,8,8,0.97)' : 'linear-gradient(to bottom, rgba(8,8,8,0.97) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'background 0.4s, border-color 0.4s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 30 }}>
        <Link to="/" style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 500, letterSpacing: '0.13em', textTransform: 'uppercase', color: C.text, textDecoration: 'none' }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </Link>
        <ul style={{ display: 'flex', alignItems: 'center', gap: isTablet ? 14 : 24, listStyle: 'none', margin: 0, padding: 0 }}>
          {visibleNavLinks.map((item) => {
            const isAuthLink = item === 'Sign in' || item === 'Create account'
            return (
              <li key={item}>
                {isAuthLink ? (
                  <Link to="/profile" style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textSoft, textDecoration: 'none' }}>
                    {item}
                  </Link>
                ) : (
                  <span style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textSoft }}>{item}</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
        <div ref={wrapperRef} style={{ position: 'relative', width: isMobile ? 130 : isTablet ? 190 : 240 }}>
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
                  navigate(`/search/${query.trim().replace(/\s+/g, '+')}`)
                  setOpenDropdown(false)
                }
              }}
              placeholder="Buscar"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: C.text, fontFamily: SANS, fontSize: 12 }}
            />
          </div>
          {openDropdown && query.trim() && (
            <div style={{ position: 'absolute', top: 44, left: 0, right: 0, border: `1px solid ${C.border}`, background: 'rgba(8,8,8,0.98)', borderRadius: 6, overflow: 'hidden' }}>
              {visibleResults.length > 0 ? (
                visibleResults.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => {
                      navigate(`/movie/${movie.id}`)
                      setOpenDropdown(false)
                      setQuery('')
                    }}
                    style={{ width: '100%', border: 'none', borderBottom: `1px solid ${C.border}`, background: 'transparent', color: C.text, display: 'flex', alignItems: 'center', gap: 10, padding: 8, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Img src={movie.poster_path ? `${TMDB_POSTER}${movie.poster_path}` : ''} alt={movie.title} style={{ width: 30, height: 45, objectFit: 'cover' }} />
                    <span style={{ fontFamily: SANS, fontSize: 12 }}>{movie.title}</span>
                  </button>
                ))
              ) : (
                <div style={{ padding: 10, color: C.textSoft, fontFamily: SANS, fontSize: 11 }}>Sin resultados</div>
              )}
            </div>
          )}
        </div>

        {isMobile && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMobileNavOpen((value) => !value)}
              style={{ width: 36, height: 36, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            >
              {mobileNavOpen ? <X size={14} /> : <Menu size={14} />}
            </button>
            {mobileNavOpen && (
              <div style={{ position: 'absolute', right: 0, top: 42, minWidth: 170, border: `1px solid ${C.border}`, background: 'rgba(8,8,8,0.98)', padding: 8, display: 'grid', gap: 6 }}>
                {navLinks.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      if (item === 'Sign in' || item === 'Create account') navigate('/profile')
                      setMobileNavOpen(false)
                    }}
                    style={{ border: 'none', background: 'transparent', color: C.text, textAlign: 'left', padding: '8px 10px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!viewer ? (
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textSoft, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS }}
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
            Volver
          </button>
        ) : (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen((v) => !v)} style={{ border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', borderRadius: 999, width: 38, height: 38, overflow: 'hidden', padding: 0 }}>
              {viewer.avatar_url ? <Img src={viewer.avatar_url} alt={viewer.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: C.textSoft, fontFamily: SANS, fontSize: 11 }}>{initials(viewer.username)}</div>}
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 44, minWidth: 180, border: `1px solid ${C.border}`, background: 'rgba(8,8,8,0.98)', padding: 6 }}>
                <button onClick={() => navigate('/profile')} style={{ width: '100%', border: 'none', background: 'transparent', color: C.text, textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mi perfil</button>
                <button onClick={() => navigate('/profile')} style={{ width: '100%', border: 'none', background: 'transparent', color: C.text, textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Configuración</button>
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
  onShare,
  isMobile,
  isTablet,
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
  onShare: () => void
  isMobile: boolean
  isTablet: boolean
}) {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const posterY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : '----'
  const runtime = movie.runtime ? `${movie.runtime} min` : 'Duración desconocida'
  const country = movie.production_countries?.[0]?.name || 'País no disponible'
  const genresText = (movie.genres || []).slice(0, 2).map((genre) => genre.name).join(' · ') || 'Sin género'
  const director = getDirector(movie)
  const score = ((movie.vote_average || 0) / 2).toFixed(1)
  const votes = (movie.vote_count || 0).toLocaleString('es-ES')
  const posterUrl = movie.poster_path ? `${TMDB_POSTER}${movie.poster_path}` : ''
  const backdropUrl = movie.backdrop_path ? `${TMDB_IMAGE}${movie.backdrop_path}` : ''

  return (
    <div ref={heroRef} style={{ position: 'relative', minHeight: isMobile ? '78vh' : '100vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
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

      {posterUrl && !isMobile && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ position: 'absolute', right: isTablet ? '5%' : '12%', top: '50%', y: posterY, width: isTablet ? 180 : 220, zIndex: 10, transform: 'translateY(-50%)' }}
        >
          <div style={{ aspectRatio: '2/3', borderRadius: 2, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)', position: 'relative' }}>
            <Img src={posterUrl} alt={`${movie.title} poster`} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.6) brightness(0.85)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.25) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, border: `1px solid rgba(212,175,122,0.15)`, borderRadius: 2 }} />
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }} style={{ position: 'relative', zIndex: 10, padding: isMobile ? '0 16px 28px' : isTablet ? '0 28px 40px' : '0 52px 64px', maxWidth: isMobile ? '100%' : 680 }}>
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
          <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? 'clamp(36px, 12vw, 52px)' : 'clamp(52px, 6vw, 76px)', fontWeight: 300, lineHeight: 0.92, letterSpacing: '-0.02em', color: C.text, margin: 0 }}>
            {movie.title}
          </h1>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: isMobile ? 'clamp(26px, 9vw, 36px)' : 'clamp(40px, 4.5vw, 64px)', fontWeight: 300, lineHeight: 1, color: 'rgba(226,226,226,0.35)', letterSpacing: '-0.01em', marginTop: 2 }}>
            {movie.original_title || movie.title}
          </div>
        </div>

        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: isMobile ? 17 : 20, color: C.textSoft, marginBottom: 20, letterSpacing: '0.02em', marginTop: 14 }}>
          Una película de <span style={{ color: C.accent }}>{director}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 12 : 24, marginBottom: 24 }}>
          <StarRating value={userRating} onChange={onRate} />

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, paddingLeft: isMobile ? 0 : 24, borderLeft: isMobile ? 'none' : `1px solid ${C.border}` }}>
            <span style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 300, color: C.gold, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 14, color: C.textMuted, fontFamily: SANS }}>/5</span>
            <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, marginLeft: 4 }}>en CineVault</span>
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: SANS }}>{votes} ratings</div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onToggleVault}
            style={{
              padding: '12px 20px',
              width: isMobile ? '100%' : 'auto',
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
            onClick={onAddToList}
            style={{
              padding: '12px 20px',
              width: isMobile ? '100%' : 'auto',
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
            <List size={13} strokeWidth={1.5} /> Añadir a lista
          </button>

          <button title="Watchlist" onClick={onToggleWatchlist} style={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: inWatchlist ? C.accent : C.textSoft, border: `1px solid ${inWatchlist ? C.accentDim : C.border}`, cursor: 'pointer' }}>
            <Bookmark size={15} strokeWidth={1.5} fill={inWatchlist ? C.accent : 'none'} />
          </button>
          <button title="Me gusta" onClick={onToggleFavorite} style={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: liked ? C.accent : C.textSoft, border: `1px solid ${liked ? C.accentDim : C.border}`, cursor: 'pointer' }}>
            <Heart size={15} strokeWidth={1.5} fill={liked ? C.gold : 'none'} />
          </button>
          <button title="Compartir" onClick={onShare} style={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: C.textSoft, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
            <Share2 size={15} strokeWidth={1.5} />
          </button>
        </div>
      </motion.div>

      {!isMobile && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} style={{ position: 'absolute', bottom: 28, left: 52, display: 'flex', alignItems: 'center', gap: 12, zIndex: 10 }}>
        <div style={{ width: 32, height: 1, background: C.textMuted, position: 'relative', overflow: 'hidden' }}>
          <motion.div animate={{ x: ['-100%', '0%', '100%'] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} style={{ position: 'absolute', inset: 0, background: C.accent }} />
        </div>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS }}>Seguir leyendo</span>
      </motion.div>}
    </div>
  )
}

function DirectorQuote({ director, isMobile }: { director: string; isMobile: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.9 }} style={{ padding: isMobile ? '32px 16px' : '48px 52px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.surface, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
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
  const [active, setActive] = useState<string[]>(themes.slice(0, 3))
  const toggle = (theme: string) => setActive((prev) => (prev.includes(theme) ? prev.filter((item) => item !== theme) : [...prev, theme]))

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Temas y atmósferas</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {themes.map((theme) => {
          const isActive = active.includes(theme)
          return (
            <button key={theme} onClick={() => toggle(theme)} style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: isActive ? C.accent : C.textSoft, border: `1px solid ${isActive ? C.accentDim : C.border}`, background: isActive ? C.accentGlow : 'transparent', padding: '6px 14px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: SANS }}>
              {theme}
            </button>
          )
        })}
      </div>
    </motion.section>
  )
}

function Stills({ stills, isMobile }: { stills: string[]; isMobile: boolean }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Imágenes de la película</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr', gridTemplateRows: isMobile ? 'auto' : 'auto auto', gap: 4 }}>
        {stills.map((still, i) => (
          <div key={still + i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} style={{ gridColumn: !isMobile && i === 0 ? '1 / 2' : undefined, gridRow: !isMobile && i === 0 ? '1 / 3' : undefined, aspectRatio: i === 0 && !isMobile ? '3/4' : '16/10', position: 'relative', overflow: 'hidden', cursor: 'pointer', background: C.elevated }}>
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
  const people = tab === 'cast' ? cast : crew

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <button onClick={() => setTab('cast')} style={{ border: `1px solid ${tab === 'cast' ? C.accentDim : C.border}`, background: tab === 'cast' ? C.accentGlow : 'transparent', color: tab === 'cast' ? C.accent : C.textSoft, padding: '6px 12px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Reparto</button>
        <button onClick={() => setTab('crew')} style={{ border: `1px solid ${tab === 'crew' ? C.accentDim : C.border}`, background: tab === 'crew' ? C.accentGlow : 'transparent', color: tab === 'crew' ? C.accent : C.textSoft, padding: '6px 12px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Crew</button>
      </div>
      <SectionLabel>{tab === 'cast' ? 'Reparto' : 'Crew técnico'}</SectionLabel>
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
        {people.map((person, index) => (
          <motion.div key={`${tab}-${person.id}-${index}`} style={{ flexShrink: 0, width: 96, cursor: 'pointer', textAlign: 'center' }} whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: C.elevated, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 10, fontFamily: SERIF, fontSize: 28, color: C.textMuted }}>
              {person.profile_path ? (
                <Img src={`${TMDB_POSTER}${person.profile_path}`} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials(person.name)
              )}
            </div>
            <div style={{ fontSize: 12, fontFamily: SANS, color: C.text, lineHeight: 1.3, marginBottom: 2, ...textClampOneLine }}>{person.name}</div>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, color: C.textSoft }}>
              <span style={textClampOneLine}>
                {tab === 'cast' ? ('character' in person ? person.character || 'Sin rol' : 'Sin rol') : 'job' in person ? person.job || 'Sin rol' : 'Sin rol'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

function Reviews({
  reviews,
  likedReviewIds,
  onToggleLike,
  onReply,
  onWriteReview,
}: {
  reviews: AppReview[]
  likedReviewIds: Set<number>
  onToggleLike: (reviewId: number, liked: boolean) => void
  onReply: (reviewId: number) => void
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
              {review.avatarUrl ? (
                <Img
                  src={review.avatarUrl}
                  alt={review.username}
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.elevated, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 16, color: C.textSoft, flexShrink: 0 }}>
                  {initials(review.username)}
                </div>
              )}
              <div>
                <div style={{ fontSize: 13, fontFamily: SANS, color: C.text }}>{review.username}</div>
                <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, marginTop: 1 }}>{formatDateLabel(review.createdAt)}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <span key={value} style={{ fontSize: 13, color: value <= review.rating ? C.gold : C.textMuted }}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, lineHeight: 1.75, color: C.textSoft, margin: '0 0 14px' }}>{review.content}</p>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <button onClick={() => onToggleLike(review.id, liked)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: liked ? C.accent : C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: SANS, letterSpacing: '0.1em' }}>
                <Heart size={13} strokeWidth={1.5} fill={liked ? C.accent : 'none'} />
                {likesCount}
              </button>
              <button onClick={() => onReply(review.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: SANS, letterSpacing: '0.1em' }}>
                <MessageSquare size={13} strokeWidth={1.5} /> Responder
              </button>
            </div>
          </motion.div>
        )
      })}

      <button onClick={onWriteReview} style={{ marginTop: 28, padding: '12px 28px', background: 'transparent', color: C.accent, border: `1px solid ${C.accentDim}`, fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        Escribir mi reseña
      </button>
    </motion.section>
  )
}

function Sidebar({ movie, similar, compact }: { movie: MovieDetailApi; similar: SimilarFilm[]; compact: boolean }) {
  const director = getDirector(movie)
  const photography = getCrewByJob(movie, ['Director of Photography', 'Cinematography'])
  const music = getCrewByJob(movie, ['Original Music Composer', 'Music', 'Composer'])
  const production = movie.production_companies?.[0]?.name || 'Desconocido'
  const platforms = mapPlatforms(movie)

  const metaRows = [
    { key: 'Director', val: director },
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
      <div style={{ position: compact ? 'static' : 'sticky', top: 80 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: compact ? 16 : 24, marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>Ficha técnica</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {metaRows.map((row) => (
              <div key={row.key} style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', justifyContent: 'space-between', alignItems: compact ? 'flex-start' : 'baseline', gap: compact ? 4 : 0 }}>
                <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: SANS }}>{row.key}</span>
                <span style={{ fontFamily: SERIF, fontSize: compact ? 15 : 16, color: C.textSoft, textAlign: compact ? 'left' : 'right', maxWidth: '100%', ...textClampOneLine }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: compact ? 16 : 24, marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>Géneros</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(movie.genres || []).map((genre) => (
              <span key={genre.id} style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textSoft, border: `1px solid ${C.border}`, padding: '4px 10px', fontFamily: SANS }}>
                {genre.name}
              </span>
            ))}
          </div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: compact ? 16 : 24, marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>Dónde ver</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {platforms.length === 0 && <div style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>No hay plataformas disponibles.</div>}
            {platforms.map((platform) => (
              <a key={`${platform.name}-${platform.type}`} href={platform.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: compact ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', background: C.elevated, border: '1px solid transparent', textDecoration: 'none', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 13, fontFamily: SANS, color: C.text, ...textClampOneLine }}>{platform.name}</div>
                  <div style={{ fontSize: 11, fontFamily: SANS, color: C.textMuted }}>{platform.type}</div>
                </div>
                {!compact && <ExternalLink size={12} color={C.textMuted} strokeWidth={1.5} />}
              </a>
            ))}
          </div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: compact ? 16 : 24, marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>También te puede interesar</div>
          <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
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

function Footer({ isMobile, isTablet }: { isMobile: boolean; isTablet: boolean }) {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, padding: isMobile ? '16px' : isTablet ? '20px 24px' : '24px 52px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0, alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/" style={{ fontFamily: SERIF, fontSize: 16, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, textDecoration: 'none' }}>
        Cine<span style={{ color: C.accent }}>Vault</span>
      </Link>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.textMuted }}>&quot;Toda gran colección empieza con una.&quot;</div>
    </footer>
  )
}

export default function MovieDetailPage() {
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

  const [userRating, setUserRating] = useState(0)
  const [myReviewId, setMyReviewId] = useState<number | null>(null)
  const [inVault, setInVault] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [liked, setLiked] = useState(false)
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
  const isCompactSidebar = viewportWidth < 1500
  const shouldStackLayout = viewportWidth < 1320
  const isMobileViewport = viewportWidth < 768
  const isTabletViewport = viewportWidth >= 768 && viewportWidth < 1100

  const token = localStorage.getItem('token')
  const movieId = useMemo(() => parseMovieId(slugOrId), [slugOrId])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slugOrId])

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!token) {
      setViewer(null)
      return
    }
    getCurrentUser()
      .then((user) => {
        setViewer({ id: user.id, username: user.username, avatar_url: user.avatar_url })
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

        setReviews(mapMovieReviews(movieReviews, userMeta))

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
            fetchMyReviews(token),
            fetchMyWatchlist(token),
            fetchMyFavorites(token),
            fetchMyDiary(token),
          ])

          if (!alive) return

          const myReview = myReviews.find((review) => review.movie_id === detail.id)
          setMyReviewId(myReview?.id ?? null)
          setUserRating(Number(myReview?.rating ?? 0))
          setInWatchlist(myWatchlist.some((entry) => entry.movie_id === detail.id))
          setLiked(myFavorites.some((entry) => entry.movie_id === detail.id))
          setInVault((myDiary.diary || []).some((entry) => entry.movie_id === detail.id))
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
  }, [slugOrId, token])

  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 3000)
    return () => window.clearTimeout(id)
  }, [notice])

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
        const created = await createReview(token, movie.id, value, 'Rating rápido desde Movie Detail')
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

    if (inVault) {
      setNoticeType('info')
      setNotice('Ya está en tu Vault')
      return
    }

    try {
      await addToDiary(token, movie.id)
      setInVault(true)
      showSuccess('Añadida a tu Vault')
    } catch (err) {
      const message = (err as Error).message || 'No se pudo añadir al Vault'
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

    try {
      await addToFavorites(token, movie.id)
      setLiked(true)
      showSuccess('Añadida a tu lista rápida (favoritos)')
    } catch (err) {
      const message = (err as Error).message || 'No se pudo añadir a lista'
      if (/ya|conflict|duplicate/i.test(message)) {
        setLiked(true)
        showSuccess('Esta película ya estaba en tu lista rápida')
        return
      }
      showError(message)
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

    setReplyTargetId(null)
    setComposerText('')
    setComposerMode('review')
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
      try {
        await commentOnReview(token, replyTargetId, text)
        showSuccess('Comentario enviado')
        setComposerMode(null)
        setComposerText('')
      } catch (err) {
        showError((err as Error).message || 'No se pudo enviar el comentario')
      }
      return
    }

    if (!movie) return

    const ratingToUse = userRating > 0 ? userRating : 4

    try {
      if (myReviewId) {
        await updateReview(token, myReviewId, ratingToUse)
        showSuccess('Reseña actualizada')
      } else {
        const created = await createReview(token, movie.id, ratingToUse, text)
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
      setReviews(mapMovieReviews(freshReviews, userMeta))
      setComposerMode(null)
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>
        Cargando película...
      </div>
    )
  }

  if (error || !movie || !movieId) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, color: '#ff8a8a', fontFamily: SANS }}>
        <div style={{ textAlign: 'center' }}>
          <p>{error || 'No se pudo cargar la película'}</p>
          <button onClick={() => navigate('/')} style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.text, padding: '8px 14px', cursor: 'pointer' }}>
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS, overflowX: 'hidden' }}>
      <Grain />
      <NoticeBar message={notice} type={noticeType} />
      <Navbar viewer={viewer} onLogout={handleLogout} isMobile={isMobileViewport} isTablet={isTabletViewport} />

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
        onShare={handleShare}
        isMobile={isMobileViewport}
        isTablet={isTabletViewport}
      />

      <DirectorQuote director={getDirector(movie)} isMobile={isMobileViewport} />

      <div
        style={{
          padding: shouldStackLayout ? '56px 20px' : viewportWidth < 1500 ? '72px 28px' : '80px 52px',
          display: 'grid',
          gridTemplateColumns: shouldStackLayout ? 'minmax(0, 1fr)' : viewportWidth < 1500 ? 'minmax(0, 1fr) 300px' : 'minmax(0, 1fr) 320px',
          gap: shouldStackLayout ? 28 : viewportWidth < 1500 ? 32 : 80,
          maxWidth: 1300,
          margin: '0 auto',
        }}
      >
        <main>
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
          <Synopsis overview={movie.overview || ''} tagline={movie.tagline} />
          <Themes themes={themes} />
          {stills.length > 0 && <Stills stills={stills} isMobile={isMobileViewport} />}
          <CastCrew cast={(movie.credits?.cast || []).slice(0, 12)} crew={(movie.credits?.crew || []).slice(0, 12)} />
          <Reviews reviews={reviews} likedReviewIds={likedReviewIds} onToggleLike={handleToggleReviewLike} onReply={handleReplyReview} onWriteReview={handleWriteReview} />
        </main>

        <Sidebar movie={movie} similar={similar} compact={isCompactSidebar} />
      </div>

      <Footer isMobile={isMobileViewport} isTablet={isTabletViewport} />
    </div>
  )
}
