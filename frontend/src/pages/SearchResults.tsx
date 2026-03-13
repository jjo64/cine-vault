import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Menu, X, Filter } from 'lucide-react'
import { createSlug } from '../utils/stringUtils'
import { resolveNavPathWithFallback } from '../lib/navigation'
import {
  fetchMovieGenres,
  searchMovie,
  searchMoviesDebug,
  searchMovies,
  searchPerson,
  searchTV,
  type GenreItem,
  type SearchPersonPanel,
  type SearchMovieResult,
  type SearchSuggestionItem,
} from '../services/searchServices'
import { getCurrentUser, logoutCurrentUser } from '../services/authServices'
import './SearchResults.css'

const C = {
  bg: '#080808',
  surface: '#111111',
  elevated: '#1A1A1A',
  border: '#252525',
  accent: '#D4AF7A',
  accentDim: '#9A7A48',
  accentGlow: 'rgba(212,175,122,0.12)',
  text: '#E2E2E2',
  textSoft: '#7A7A7A',
  textMuted: '#3A3A3A',
} as const

const SANS = "'Syne', sans-serif"
const SERIF = "'Cormorant Garamond', serif"

type SortMode = 'relevance' | 'year-desc' | 'year-asc' | 'title-asc'
type SearchTab = 'all' | 'movie' | 'person' | 'tv'
type PersonFilter = 'all' | 'acting' | 'directing' | 'production' | 'crew'
type Viewer = {
  id: number
  username: string
  avatar_url?: string | null
}

const TAB_OPTIONS: Array<{ value: SearchTab; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'movie', label: 'Películas' },
  { value: 'person', label: 'Personas' },
  { value: 'tv', label: 'Series' },
]

function GrainOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 90,
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
        opacity: 0.35,
      }}
    />
  )
}

function Img({ src, alt, style, className, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = useState(false)
  if (err) return <div style={{ ...style, background: C.elevated }} className={className} />
  return <img src={src} alt={alt} style={style} className={className} onError={() => setErr(true)} {...rest} />
}

function initials(name: string) {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return 'CV'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'CV'
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''} `.toUpperCase()
}

function parseTmdbImage(path: string | null | undefined, size: 'w500' | 'original' = 'w500') {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : ''
}

function navigateByResultType(navigate: ReturnType<typeof useNavigate>, item: SearchSuggestionItem) {
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

export function Navbar({
  viewer,
  onLogout,
}: {
  viewer: Viewer | null
  onLogout: () => void
}) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchSuggestionItem[]>([])
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
        const data = await searchMovies(debouncedQuery)
        setResults(
          Array.isArray(data.results)
            ? data.results.slice(0, 6).map((item) => ({
              id: item.id,
              title: item.title,
              name: item.name,
              media_type: item.media_type,
              poster_path: item.poster_path || null,
              profile_path: item.profile_path || null,
            }))
            : []
        )
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
  const openAuthModal = () => navigate('/login?returnTo=' + encodeURIComponent(window.location.pathname + window.location.search))

  return (
    <nav
      className="search-nav"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        height: 56,
        background: scrolled ? 'rgba(8,8,8,0.97)' : 'linear-gradient(to bottom, rgba(8,8,8,0.97) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border} ` : '1px solid transparent',
        transition: 'background 0.4s, border-color 0.4s',
      }}
    >
      <div className="search-nav-gap" style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 500, letterSpacing: '0.13em', textTransform: 'uppercase', color: C.text, textDecoration: 'none' }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </Link>
        <ul className="search-nav-links search-results-desktop-flex">
          {navLinks.map((item) => {
            const isAuthLink = item === 'Sign in' || item === 'Create account'
            return (
              <li key={item}>
                {isAuthLink ? (
                  <button
                    onClick={openAuthModal}
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

      <div className="search-nav-actions-gap" style={{ display: 'flex', alignItems: 'center' }}>
        <div ref={wrapperRef} className="search-input-wrapper" style={{ position: 'relative' }}>
          <div style={{ height: 38, borderRadius: 999, border: `1px solid ${C.border} `, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
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
            <div className="search-nav-dropdown" style={{ position: 'absolute', top: 44, right: 0, width: 'min(92vw, 420px)', border: `1px solid ${C.border} `, background: 'rgba(8,8,8,0.98)', borderRadius: 6, overflow: 'hidden', maxHeight: '65vh', overflowY: 'auto' }}>
              {visibleResults.length > 0 ? (
                visibleResults.map((item) => (
                  <button
                    key={`${item.media_type || 'movie'}-${item.id}`}
                    onClick={() => {
                      navigateByResultType(navigate, item)
                      setOpenDropdown(false)
                      setQuery('')
                    }}
                    className="search-nav-dropdown-item"
                    style={{ width: '100%', border: 'none', borderBottom: `1px solid ${C.border} `, background: 'transparent', color: C.text, display: 'flex', alignItems: 'flex-start', gap: 10, padding: 8, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Img src={parseTmdbImage(item.media_type === 'person' ? item.profile_path : item.poster_path)} alt={item.title || item.name || 'Sin titulo'} style={{ width: 30, height: 45, objectFit: 'cover' }} />
                    <span className="search-nav-dropdown-title" style={{ fontFamily: SANS, fontSize: 12 }}>{item.title || item.name || 'Sin titulo'}</span>
                  </button >
                ))
              ) : (
                <div style={{ padding: 10, color: C.textSoft, fontFamily: SANS, fontSize: 11 }}>Sin resultados</div>
              )}
            </div >
          )}
        </div >

        <div className="search-results-mobile-only" style={{ position: 'relative' }}>
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
                    if (item === 'Sign in' || item === 'Create account') {
                      openAuthModal()
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
            </div>
          )}
        </div>

        {
          !viewer ? (
            <button
              onClick={() => navigate(-1)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textSoft, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS }}
            >
              <ChevronDown size={14} strokeWidth={1.5} />
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
                  <button onClick={() => navigate('/settings')} style={{ width: '100%', border: 'none', background: 'transparent', color: C.text, textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Configuración</button>
                  <button onClick={onLogout} style={{ width: '100%', border: 'none', background: 'transparent', color: '#ff8d8d', textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cerrar sesión</button>
                </div>
              )}
            </div>
          )
        }
      </div >
    </nav >
  )
}

function SkeletonGroup({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`sk-${index}`}
          style={{
            height: 122,
            border: `1px solid ${C.border}`,
            background: `linear-gradient(90deg, ${C.surface} 0%, ${C.elevated} 50%, ${C.surface} 100%)`,
            backgroundSize: '200% 100%',
            animation: 'search-shimmer 1.2s linear infinite',
          }}
        />
      ))}
      <style>{`@keyframes search-shimmer {0% {background-position: 200% 0;} 100% {background-position: -200% 0;}}`}</style>
    </div>
  )
}

function personFilterMatch(item: SearchMovieResult, filter: PersonFilter) {
  const dept = (item.known_for_department || '').toLowerCase()
  if (filter === 'all') return true
  if (filter === 'acting') return dept.includes('act')
  if (filter === 'directing') return dept.includes('direct')
  if (filter === 'production') return dept.includes('produc')
  return dept.length > 0 && !dept.includes('act') && !dept.includes('direct') && !dept.includes('produc')
}

function ResultCard({ item }: { item: SearchMovieResult }) {
  const navigate = useNavigate()
  const title = item.title || item.name || 'Sin título'
  const year = item.release_date || item.first_air_date
  const isPerson = item.media_type === 'person'
  const isTV = item.media_type === 'tv'
  const typeLabel = isPerson ? 'Persona' : isTV ? 'Serie' : 'Película'

  const linkTarget = isPerson
    ? `/person/${item.id}`
    : isTV
      ? undefined
      : `/movie/${item.id}-${createSlug(title)}`

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="search-result-card-layout"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        cursor: 'pointer',
        overflow: 'hidden',
      }}
      onClick={() => navigate(isPerson ? `/person/${item.id}` : isTV ? `/tv/${item.id}` : `/movie/${item.id}-${createSlug(title)}`)}
      whileHover={{ borderColor: C.accentDim, y: -2 }}
    >
      <div style={{ position: 'relative' }}>
        <Img
          src={parseTmdbImage(isPerson ? item.profile_path : item.poster_path)}
          alt={isPerson ? item.name : (item.title || item.name || 'Sin título')}
          className="search-result-poster"
          style={{ objectFit: 'cover', background: C.elevated }}
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: C.text, padding: '4px 8px', fontFamily: SANS, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {typeLabel}
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: '2px 0 4px', color: C.text, fontFamily: SERIF, fontSize: 'clamp(18px, 2vw, 22px)', fontWeight: 400, lineHeight: 1.08 }}>
          {title}
        </h2>

        {year && (
          <div style={{ marginBottom: 4, color: C.textMuted, fontFamily: SANS, fontSize: 12 }}>
            {year.split('-')[0]}
          </div>
        )}

        {!!item.original_title && item.original_title !== title && (
          <div style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, marginBottom: 6 }}>
            Título original: {item.original_title}
          </div>
        )}

        {!!item.known_for_department && (
          <div style={{ color: C.accentDim, fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            {item.known_for_department}
          </div>
        )}

        {!!item.director && <div style={{ color: C.accentDim, fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{item.director}</div>}

        <p style={{ margin: 0, color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic', lineHeight: 1.6, fontSize: 16 }}>
          {item.overview ? `${item.overview.slice(0, 220)}${item.overview.length > 220 ? '...' : ''}` : 'Sin descripción disponible.'}
        </p>
      </div>
    </motion.div>
  )

  if (!linkTarget) {
    return <div>{content}</div>
  }

  return <Link to={linkTarget} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</Link>
}

function PeoplePanel({ people }: { people: SearchPersonPanel[] }) {
  if (people.length === 0) return null

  return (
    <section style={{ display: 'grid', gap: 12, marginTop: 18 }}>
      <h3 style={{ margin: 0, fontFamily: SERIF, fontSize: 30, fontWeight: 400 }}>Personas</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {people.map((person) => (
          <Link
            key={`person-panel-${person.id}`}
            to={`/person/${person.id}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              border: `1px solid ${C.border}`,
              background: C.surface,
              padding: 12,
              display: 'grid',
              gridTemplateColumns: '70px 1fr',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <Img
              src={parseTmdbImage(person.profile_path || null)}
              alt={person.name}
              style={{ width: 70, height: 92, objectFit: 'cover', background: C.elevated }}
            />
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 24, lineHeight: 1.1 }}>{person.name}</div>
              <div style={{ color: C.accentDim, fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>
                {person.known_for_department || 'Departamento desconocido'}
              </div>
              {Array.isArray(person.known_for) && person.known_for.length > 0 && (
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                  {person.known_for.slice(0, 3).map((credit) => (
                    <div key={`known-${person.id}-${credit.id}`} style={{ minWidth: 0 }}>
                      <Img
                        src={parseTmdbImage(credit.poster_path || null)}
                        alt={credit.title || credit.name || 'Título'}
                        style={{ width: '100%', height: 64, objectFit: 'cover', background: C.elevated }}
                      />
                      <div style={{ marginTop: 4, color: C.textSoft, fontFamily: SANS, fontSize: 10, lineHeight: 1.3 }}>
                        {credit.title || credit.name || 'Título'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function SearchResultsPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const query = (params.get('q') || '').replace(/\s+/g, ' ').trim()
  const debugMode = params.get('debug') === '1'

  const [results, setResults] = useState<SearchMovieResult[]>([])
  const [allResults, setAllResults] = useState<SearchMovieResult[]>([])
  const [allPeopleResults, setAllPeopleResults] = useState<SearchPersonPanel[]>([])
  const tabParam = (params.get('tab') || '').toLowerCase()
  const initialTab: SearchTab = tabParam === 'movie' || tabParam === 'person' || tabParam === 'tv'
    ? tabParam
    : 'all'
  const [tab, setTab] = useState<SearchTab>(initialTab)
  const [personFilter, setPersonFilter] = useState<PersonFilter>('all')
  const [genres, setGenres] = useState<GenreItem[]>([])
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('relevance')
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    const raw = (params.get('tab') || '').toLowerCase()
    const nextTab: SearchTab = raw === 'movie' || raw === 'person' || raw === 'tv' ? raw : 'all'
    setTab((prev) => (prev === nextTab ? prev : nextTab))
  }, [params])

  useEffect(() => {
    fetchMovieGenres().then((data) => setGenres(data.slice(0, 14))).catch(() => setGenres([]))
  }, [])

  useEffect(() => {
    if (!query) {
      setResults([])
      setAllResults([])
      setAllPeopleResults([])
      setTotalPages(1)
      setTotalResults(0)
      return
    }

    let alive = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        if (tab === 'all') {
          const multi = debugMode
            ? await searchMoviesDebug(query, currentPage)
            : await searchMovies(query, currentPage)
          if (!alive) return

          const merged = Array.isArray(multi.results)
            ? multi.results
            : [
              ...(Array.isArray(multi.movie_results) ? multi.movie_results : []),
              ...(Array.isArray(multi.tv_results) ? multi.tv_results : []),
            ]
          const people = Array.isArray(multi.people_results) ? multi.people_results : []

          setAllResults(merged)
          setAllPeopleResults(people)
          setResults(merged)
          setTotalPages(Number(multi.total_pages || 1))
          setTotalResults(Number(multi.total_results || merged.length))
          return
        }

        if (tab === 'movie') {
          const data = await searchMovie(query, currentPage, selectedGenres)
          if (!alive) return
          setAllResults([])
          setAllPeopleResults([])
          setResults(
            Array.isArray(data.results)
              ? data.results.map((item) => ({ ...item, media_type: item.media_type || 'movie' }))
              : []
          )
          setTotalPages(Number(data.total_pages || 1))
          setTotalResults(Number(data.total_results || 0))
          return
        }

        if (tab === 'person') {
          const data = await searchPerson(query, currentPage)
          if (!alive) return
          setAllResults([])
          setAllPeopleResults([])
          setResults(
            Array.isArray(data.results)
              ? data.results.map((item) => ({ ...item, media_type: 'person' }))
              : []
          )
          setTotalPages(Number(data.total_pages || 1))
          setTotalResults(Number(data.total_results || 0))
          return
        }

        const data = await searchTV(query, currentPage)
        if (!alive) return
        setAllResults([])
        setAllPeopleResults([])
        setResults(
          Array.isArray(data.results)
            ? data.results.map((item) => ({ ...item, media_type: item.media_type || 'tv' }))
            : []
        )
        setTotalPages(Number(data.total_pages || 1))
        setTotalResults(Number(data.total_results || 0))
      } catch (err) {
        if (!alive) return
        setError((err as Error).message || 'No se pudo buscar')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [query, currentPage, tab, selectedGenres])

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
        localStorage.removeItem('token')
      })
  }, [token])

  useEffect(() => {
    const genreParam = params.get('genre')
    if (!genreParam) {
      setSelectedGenres([])
      return
    }

    const parsed = Number(genreParam)
    if (!Number.isFinite(parsed)) {
      setSelectedGenres([])
      return
    }

    setSelectedGenres((prev) => (prev.length === 1 && prev[0] === parsed ? prev : [parsed]))
  }, [params])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, tab, personFilter, selectedGenres])

  const sortedResults = useMemo(() => {
    const source = tab === 'all' ? allResults : results
    const list = tab === 'person'
      ? source.filter((item) => personFilterMatch(item, personFilter))
      : [...source]

    if (sortMode === 'relevance') return list

    if (sortMode === 'title-asc') {
      return list.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || '', 'es'))
    }

    if (sortMode === 'year-desc') {
      return list.sort((a, b) => Number((b.release_date || b.first_air_date || '').slice(0, 4) || 0) - Number((a.release_date || a.first_air_date || '').slice(0, 4) || 0))
    }

    return list.sort((a, b) => Number((a.release_date || a.first_air_date || '').slice(0, 4) || 0) - Number((b.release_date || b.first_air_date || '').slice(0, 4) || 0))
  }, [results, allResults, sortMode, tab, personFilter])

  const updateSearchUrl = (nextQuery: string, nextGenres: number[]) => {
    const newParams = new URLSearchParams()
    if (nextQuery.trim()) newParams.set('q', nextQuery.trim())
    if (nextGenres.length > 0) newParams.set('genre', String(nextGenres[0]))
    if (tab !== 'all') newParams.set('tab', tab)
    const next = newParams.toString()
    navigate(next ? `/search?${next}` : '/search')
  }

  const handleLogout = () => {
    logoutCurrentUser()
    setViewer(null)
    navigate('/')
  }

  const pageButtons = Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: SANS }}>
      <GrainOverlay />
      <Navbar viewer={viewer} onLogout={handleLogout} />

      <main className="search-results-main">
        <div style={{ marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em', color: C.accent, marginBottom: 6 }}>Resultados</div>
            <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.08 }}>
              {totalResults.toLocaleString('es-ES')} coincidencias para &quot;{query || '...'}&quot;
            </h1>
            {debugMode && tab === 'all' && allResults.length > 0 && (
              <div style={{ marginTop: 10, border: `1px solid ${C.border}`, padding: 10, background: C.surface }}>
                <div style={{ color: C.accentDim, fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Debug ranking activo
                </div>
                <div style={{ color: C.textSoft, fontFamily: SANS, fontSize: 12 }}>
                  Añade o quita <strong>debug=1</strong> en la URL para activar/desactivar este panel.
                </div>
                {allResults[0]?._score_debug && (
                  <div style={{ marginTop: 8, color: C.textSoft, fontFamily: SANS, fontSize: 12 }}>
                    Top 1 score: {Math.round(
                      (allResults[0]._score_debug.title_rank || 0) +
                      (allResults[0]._score_debug.title_source_boost || 0) +
                      (allResults[0]._score_debug.token_source_boost || 0) +
                      (allResults[0]._score_debug.exact_title_boost || 0) +
                      (allResults[0]._score_debug.exact_token_boost || 0) +
                      (allResults[0]._score_debug.fuzzy_boost || 0) +
                      (allResults[0]._score_debug.contextual_token_boost || 0) +
                      (allResults[0]._score_debug.person_role_boost || 0) +
                      (allResults[0]._score_debug.strong_person_match_boost || 0) +
                      (allResults[0]._score_debug.local_boost || 0)
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div className="search-results-filter-bar">
            {TAB_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setTab(option.value)}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${tab === option.value ? C.accentDim : C.border}`,
                  background: tab === option.value ? C.accentGlow : 'transparent',
                  color: tab === option.value ? C.accent : C.textSoft,
                  cursor: 'pointer',
                  fontFamily: SANS,
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, border: `1px solid ${C.border}`, background: C.surface, padding: '7px 10px' }}>
            <Filter size={14} color={C.textSoft} />
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} style={{ background: 'transparent', border: 'none', outline: 'none', color: C.textSoft, fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer' }}>
              <option value="relevance">Relevancia</option>
              <option value="year-desc">Año: recientes</option>
              <option value="year-asc">Año: antiguas</option>
              <option value="title-asc">Título A-Z</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {TAB_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setTab(option.value)}
              style={{
                padding: '8px 12px',
                border: `1px solid ${tab === option.value ? C.accentDim : C.border}`,
                background: tab === option.value ? C.accentGlow : 'transparent',
                color: tab === option.value ? C.accent : C.textSoft,
                cursor: 'pointer',
                fontFamily: SANS,
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {tab === 'person' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {[
              { value: 'all', label: 'Todos' },
              { value: 'acting', label: 'Actores' },
              { value: 'directing', label: 'Directores' },
              { value: 'production', label: 'Productores' },
              { value: 'crew', label: 'Crew' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPersonFilter(option.value as PersonFilter)}
                style={{
                  padding: '7px 10px',
                  border: `1px solid ${personFilter === option.value ? C.accentDim : C.border}`,
                  background: personFilter === option.value ? C.accentGlow : 'transparent',
                  color: personFilter === option.value ? C.accent : C.textSoft,
                  cursor: 'pointer',
                  fontFamily: SANS,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {tab === 'movie' && genres.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {genres.map((genre) => {
              const active = selectedGenres.includes(genre.id)
              return (
                <button
                  key={genre.id}
                  onClick={() => {
                    setSelectedGenres((prev) => {
                      const next = prev.includes(genre.id)
                        ? prev.filter((id) => id !== genre.id)
                        : [...prev, genre.id]
                      updateSearchUrl(query, next)
                      return next
                    })
                  }}
                  style={{
                    padding: '7px 10px',
                    border: `1px solid ${active ? C.accentDim : C.border}`,
                    background: active ? C.accentGlow : 'transparent',
                    color: active ? C.accent : C.textSoft,
                    cursor: 'pointer',
                    fontFamily: SANS,
                    fontSize: 11,
                    letterSpacing: '0.08em',
                  }}
                >
                  {genre.name}
                </button>
              )
            })}
          </div>
        )}

        {loading && <SkeletonGroup count={6} />}
        {error && <div style={{ color: '#ff8a8a', marginBottom: 14 }}>{error}</div>}

        {!loading && tab !== 'all' && sortedResults.length === 0 && (
          <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 18, color: C.textSoft }}>
            No encontramos resultados para esa búsqueda.
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${tab}-${query}-${currentPage}-${personFilter}-${selectedGenres.join(',')}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.34 }}
          >
            {tab === 'all' && !loading && (
              <section style={{ display: 'grid', gap: 18 }}>
                {sortedResults.length > 0 || allPeopleResults.length > 0 ? (
                  <>
                    {sortedResults.length > 0 && (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {sortedResults.map((item) => (
                          <ResultCard key={`all-${item.media_type || 'movie'}-${item.id}`} item={item} />
                        ))}
                      </div>
                    )}

                    <PeoplePanel people={allPeopleResults.slice(0, 3)} />
                  </>
                ) : (
                  <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 18, color: C.textSoft }}>
                    No encontramos resultados para esa búsqueda.
                  </div>
                )}
              </section>
            )}

            {tab !== 'all' && !loading && (
              <section style={{ display: 'grid', gap: 10 }}>
                <h3 style={{ margin: '0 0 8px', fontFamily: SERIF, fontSize: 30, fontWeight: 400 }}>
                  {tab === 'movie' ? 'Películas' : tab === 'person' ? 'Personas' : 'Series'}
                </h3>
                {sortedResults.map((item) => (
                  <ResultCard key={`${tab}-${item.id}`} item={item} />
                ))}
              </section>
            )}
          </motion.div>
        </AnimatePresence>

        {totalPages > 1 && (
          <div style={{ marginTop: 26, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
            {pageButtons.map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} style={{ padding: '8px 12px', background: currentPage === page ? C.accentGlow : 'transparent', border: `1px solid ${currentPage === page ? C.accentDim : C.border}`, color: currentPage === page ? C.accent : C.textSoft, cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em' }}>
                {page}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
