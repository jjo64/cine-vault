import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search as SearchIcon,
  X,
  Menu,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Film,
  User,
  Bookmark,
} from 'lucide-react'
import { createSlug } from '../utils/stringUtils'
import { resolveNavPathWithFallback } from '../lib/navigation'
import { fetchMovieDetail } from '../services/movieDetailServices'
import { searchMovies, searchUsers, type SearchMovieResult, type SearchPersonPanel, type SearchUserResult } from '../services/searchServices'
import './SearchResults.css'

const C = {
  bg: '#080808',
  surface: '#111111',
  elevated: '#1A1A1A',
  border: '#252525',
  accent: '#D4AF7A',
  accentDim: '#9A7A48',
  accentGlow: 'rgba(212,175,122,0.10)',
  text: '#FFFFFF',
  textSoft: '#B0B0B0',
  textMuted: '#888888',
  gold: '#C8A96E',
} as const

const SERIF = "'Cormorant Garamond', serif"
const SANS = "'Syne', sans-serif"
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'

function Img({ src, alt, style, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = useState(false)
  if (err) return <div style={{ ...style, background: C.elevated }} />
  return <img src={src} alt={alt} style={style} onError={() => setErr(true)} {...rest} />
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
        opacity: 0.38,
      }}
    />
  )
}

type FilmResult = {
  id: number
  mediaType: 'movie' | 'tv'
  title: string
  originalTitle: string
  year: number | null
  director?: string | null
  description: string
  rating: number
  img: string
  runtime?: number | null
  genres?: string[]
  country?: string | null
}

type FilmDetails = {
  director?: string | null
  runtime?: number | null
  genres?: string[]
  country?: string | null
}

type PersonResult = {
  id: number
  name: string
  role: string
  notable: string[]
  img: string
}

type UserResult = {
  id: number
  username: string
  handle: string
  films: number
  bio: string
  avatar: string
}

function toUserResult(item: SearchUserResult): UserResult {
  const username = item.username || 'usuario'
  return {
    id: item.id,
    username,
    handle: `@${username}`,
    films: Number(item._count?.reviews || 0),
    bio: item.bio?.trim() || 'Cinéfilo de CineVault',
    avatar: username.slice(0, 1).toUpperCase(),
  }
}

type FiltersState = {
  genres: string[]
  yearFrom: string
  yearTo: string
  countries: string[]
  minRating: number
  duration: string | null
  pendientes: boolean
  palmares: boolean
  noVistas: boolean
}

const GENRES = ['Drama', 'Sci-fi', 'Romance', 'Thriller', 'Horror', 'Documental', 'Comedia', 'Animación', 'Bélica', 'Histórica', 'Slow cinema', 'Experimental']
const COUNTRIES = ['Francia', 'Italia', 'EE.UU.', 'Japón', 'Corea del Sur', 'Alemania', 'España', 'Argentina', 'URSS/Rusia', 'Reino Unido', 'Hong Kong', 'Suecia']
const DURATIONS = [
  { label: 'Corta', sub: '<90 min', key: 'short' },
  { label: 'Media', sub: '90–130 min', key: 'medium' },
  { label: 'Larga', sub: '130–180 min', key: 'long' },
  { label: 'Épica', sub: '>3 horas', key: 'epic' },
]

const SPECIAL_FILTERS = [
  { key: 'pendientes' as const, label: 'Solo mis pendientes' },
  { key: 'palmares' as const, label: 'Palmarés (Cannes / Venecia)' },
  { key: 'noVistas' as const, label: 'No vistas todavía' },
]

const TABS = [
  { key: 'all', label: 'Todo', icon: <Film size={12} /> },
  { key: 'film', label: 'Películas', icon: <Film size={12} /> },
  { key: 'tv', label: 'Series', icon: <Film size={12} /> },
  { key: 'person', label: 'Personas', icon: <User size={12} /> },
  { key: 'user', label: 'Usuarios', icon: <User size={12} /> },
]

function toPoster(path?: string | null) {
  return path ? `${TMDB_IMG}${path}` : 'https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=400&q=80'
}

function toFilmResult(item: SearchMovieResult): FilmResult {
  const rawDate = item.release_date || item.first_air_date || ''
  const year = Number.parseInt(rawDate.slice(0, 4), 10)
  const title = item.title || item.name || 'Sin título'
  const mediaType = item.media_type === 'tv' ? 'tv' : 'movie'

  return {
    id: item.id,
    mediaType,
    title,
    originalTitle: item.original_title || item.original_name || title,
    year: Number.isNaN(year) ? null : year,
    director: item.director?.trim() || null,
    description: item.overview || 'Sin sinopsis disponible.',
    rating: Math.max(0, Number((item as SearchMovieResult & { vote_average?: number }).vote_average || 0)),
    img: toPoster(item.poster_path),
    runtime: item.runtime ?? null,
    genres: Array.isArray(item.genres) ? item.genres.map((genre) => genre.name).filter(Boolean) : [],
    country: Array.isArray(item.production_countries) && item.production_countries[0]?.name
      ? item.production_countries[0].name
      : null,
  }
}

function toPersonResult(item: SearchPersonPanel): PersonResult {
  return {
    id: item.id,
    name: item.name,
    role: item.known_for_department || 'Persona',
    notable: (item.known_for || []).slice(0, 3).map((entry) => entry.title || entry.name || 'Sin título'),
    img: toPoster(item.profile_path),
  }
}

function Navbar({ query, onSearch }: { query: string; onSearch: (q: string) => void }) {
  const [val, setVal] = useState(query)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setVal(query)
  }, [query])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (val.trim()) {
      onSearch(val.trim())
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <nav className="search-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, display: 'flex', alignItems: 'center', gap: 24, background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(24px)', borderBottom: `1px solid ${C.border}` }}>
      <Link to="/" style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, letterSpacing: '0.13em', textTransform: 'uppercase', color: C.text, textDecoration: 'none', flexShrink: 0 }}>
        Cine<span style={{ color: C.accent }}>Vault</span>
      </Link>

      <form onSubmit={submit} className="search-input-wrapper search-results-input-wrapper" style={{ flex: 1, maxWidth: 640, position: 'relative' }}>
        <SearchIcon size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: C.textSoft, pointerEvents: 'none' }} />
        <input
          ref={inputRef}
          value={val}
          onChange={(event) => setVal(event.target.value)}
          placeholder="Buscar película, persona, lista..."
          style={{
            width: '100%',
            padding: '10px 44px 10px 44px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            color: C.text,
            fontFamily: SANS,
            fontSize: 13,
            letterSpacing: '0.04em',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={(event) => {
            event.target.style.borderColor = C.accentDim
          }}
          onBlur={(event) => {
            event.target.style.borderColor = C.border
          }}
        />
        {val && (
          <button type="button" onClick={() => setVal('')} aria-label="Limpiar búsqueda" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textSoft, display: 'flex' }}>
            <X size={14} />
          </button>
        )}
      </form>

      <button onClick={() => navigate(-1)} aria-label="Volver a la página anterior" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textSoft, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, flexShrink: 0, transition: 'color 0.2s' }}>
        <ChevronLeft size={13} /> Volver
      </button>

      <button className="search-nav-hamburger" onClick={() => setIsMobileMenuOpen((prev) => !prev)} aria-label="Abrir menu">
        {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      <div className={`search-nav-mobile-menu ${isMobileMenuOpen ? 'search-nav-mobile-menu--open' : ''}`}>
        <form onSubmit={submit} className="search-nav-mobile-search">
          <input
            value={val}
            onChange={(event) => setVal(event.target.value)}
            placeholder="Buscar..."
            className="search-nav-mobile-input"
          />
        </form>
        {['films', 'diary', 'esta noche', 'feed', 'activity', 'lists', 'profile'].map((link) => (
          <button
            key={`mobile-${link}`}
            className="search-nav-mobile-link"
            onClick={() => {
              navigate(resolveNavPathWithFallback(link))
              setIsMobileMenuOpen(false)
            }}
          >
            {link}
          </button>
        ))}
      </div>
    </nav>
  )
}

function FiltersPanel({ filters, onChange, onClear }: { filters: FiltersState; onChange: (k: keyof FiltersState, v: FiltersState[keyof FiltersState]) => void; onClear: () => void }) {
  const [expandedGenres, setExpandedGenres] = useState(false)
  const [expandedCountry, setExpandedCountry] = useState(false)

  const toggleArr = (key: 'genres' | 'countries', val: string) => {
    const arr = filters[key] || []
    onChange(key, arr.includes(val) ? arr.filter((x: string) => x !== val) : [...arr, val])
  }

  const activeCount = [
    (filters.genres || []).length,
    filters.yearFrom ? 1 : 0,
    filters.yearTo ? 1 : 0,
    (filters.countries || []).length,
    filters.minRating ? 1 : 0,
    filters.duration ? 1 : 0,
    filters.pendientes ? 1 : 0,
    filters.palmares ? 1 : 0,
    filters.noVistas ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <div style={{ width: 240, flexShrink: 0 }}>
      <div style={{ position: 'sticky', top: 88 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: SANS, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent }}>
            <SlidersHorizontal size={13} /> Filtros
            {activeCount > 0 && <span style={{ width: 18, height: 18, borderRadius: '50%', background: C.accent, color: C.bg, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeCount}</span>}
          </div>
          {activeCount > 0 && (
            <button onClick={onClear} style={{ fontSize: 10, letterSpacing: '0.14em', color: C.textSoft, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, textTransform: 'uppercase' }}>
              Limpiar
            </button>
          )}
        </div>

        <FilterBlock title="Género">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(expandedGenres ? GENRES : GENRES.slice(0, 6)).map((g) => {
              const active = (filters.genres || []).includes(g)
              return (
                <button key={g} onClick={() => toggleArr('genres', g)} style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? C.accent : C.textSoft, border: `1px solid ${active ? C.accentDim : C.border}`, background: active ? C.accentGlow : 'transparent', padding: '4px 10px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: SANS }}>
                  {g}
                </button>
              )
            })}
          </div>
          <button onClick={() => setExpandedGenres((v) => !v)} style={{ marginTop: 8, fontSize: 10, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, letterSpacing: '0.12em', textTransform: 'uppercase', padding: 0 }}>
            {expandedGenres ? '— Menos' : '+ Ver más'}
          </button>
        </FilterBlock>

        <FilterBlock title="Año">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="number" placeholder="1920" value={filters.yearFrom || ''} onChange={(event) => onChange('yearFrom', event.target.value)} style={{ flex: 1, padding: '7px 10px', background: C.elevated, border: `1px solid ${C.border}`, color: C.text, fontFamily: SANS, fontSize: 12, outline: 'none' }} />
            <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
            <input type="number" placeholder="2026" value={filters.yearTo || ''} onChange={(event) => onChange('yearTo', event.target.value)} style={{ flex: 1, padding: '7px 10px', background: C.elevated, border: `1px solid ${C.border}`, color: C.text, fontFamily: SANS, fontSize: 12, outline: 'none' }} />
          </div>
        </FilterBlock>

        <FilterBlock title="Rating mínimo">
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => onChange('minRating', filters.minRating === s ? 0 : s)} style={{ width: 32, height: 32, background: s <= (filters.minRating || 0) ? C.accentGlow : 'transparent', border: `1px solid ${s <= (filters.minRating || 0) ? C.accentDim : C.border}`, fontSize: 16, color: s <= (filters.minRating || 0) ? C.gold : C.textMuted, cursor: 'pointer' }}>
                ★
              </button>
            ))}
          </div>
        </FilterBlock>

        <FilterBlock title="Duración">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DURATIONS.map((d) => {
              const active = filters.duration === d.key
              return (
                <button key={d.key} onClick={() => onChange('duration', active ? null : d.key)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: active ? C.accentGlow : C.elevated, border: `1px solid ${active ? C.accentDim : C.border}`, cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontFamily: SANS, fontSize: 11, color: active ? C.accent : C.text }}>{d.label}</span>
                  <span style={{ fontFamily: SANS, fontSize: 10, color: C.textMuted }}>{d.sub}</span>
                </button>
              )
            })}
          </div>
        </FilterBlock>

        <FilterBlock title="País / Idioma">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {(expandedCountry ? COUNTRIES : COUNTRIES.slice(0, 5)).map((c) => {
              const active = (filters.countries || []).includes(c)
              return (
                <button key={c} onClick={() => toggleArr('countries', c)} style={{ fontSize: 10, letterSpacing: '0.08em', color: active ? C.accent : C.textSoft, border: `1px solid ${active ? C.accentDim : C.border}`, background: active ? C.accentGlow : 'transparent', padding: '3px 9px', cursor: 'pointer', fontFamily: SANS }}>
                  {c}
                </button>
              )
            })}
          </div>
          <button onClick={() => setExpandedCountry((v) => !v)} style={{ marginTop: 8, fontSize: 10, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, letterSpacing: '0.12em', textTransform: 'uppercase', padding: 0 }}>
            {expandedCountry ? '— Menos' : '+ Ver más'}
          </button>
        </FilterBlock>

        <FilterBlock title="Filtros especiales">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SPECIAL_FILTERS.map((filter) => {
              const active = Boolean(filters[filter.key])
              return (
                <button
                  key={filter.key}
                  onClick={() => onChange(filter.key, !active)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: active ? C.accentGlow : C.elevated,
                    border: `1px solid ${active ? C.accentDim : C.border}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontFamily: SANS, fontSize: 11, color: active ? C.accent : C.text }}>{filter.label}</span>
                  <span style={{ fontFamily: SANS, fontSize: 10, color: active ? C.accent : C.textMuted }}>{active ? 'ON' : 'OFF'}</span>
                </button>
              )
            })}
          </div>
        </FilterBlock>
      </div>
    </div>
  )
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, marginBottom: 12, fontFamily: SANS }}>{title}</div>
      {children}
    </div>
  )
}

function normalizeCountryName(raw?: string | null) {
  if (!raw) return null
  if (raw === 'United States of America') return 'EE.UU.'
  if (raw === 'United Kingdom') return 'Reino Unido'
  if (raw === 'Soviet Union') return 'URSS'
  if (raw === 'Russian Federation') return 'Rusia'
  return raw
}

function getDirectorFromDetail(crew?: Array<{ id: number; name: string; job?: string; profile_path?: string | null }>) {
  if (!Array.isArray(crew)) return null
  const director = crew.find((person) => (person.job || '').toLowerCase() === 'director')
  return director?.name || null
}

function SkeletonPill({ width = 64 }: { width?: number }) {
  return (
    <motion.span
      animate={{ opacity: [0.28, 0.7, 0.28] }}
      transition={{ duration: 1.05, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      style={{ display: 'inline-block', width, height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.12)' }}
    />
  )
}

function FilmResultItem({ item, delay, isDetailsLoading }: { item: FilmResult; delay: number; isDetailsLoading: boolean }) {
  const [hov, setHov] = useState(false)
  const [vaulted, setVaulted] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const href = item.mediaType === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}-${createSlug(item.title)}`
  const visibleGenres = (item.genres || []).slice(0, 3)
  const runtimeLabel = typeof item.runtime === 'number' && item.runtime > 0 ? `${item.runtime} min` : null

  return (
    <motion.div className="search-result-card-layout" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ gap: 28, padding: '32px 0', borderBottom: `1px solid ${C.border}`, background: hov ? 'rgba(212,175,122,0.02)' : 'transparent', transition: 'background 0.2s', position: 'relative' }}>
      <div style={{ position: 'absolute', left: -20, top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom, transparent, ${C.accent}, transparent)`, opacity: hov ? 0.6 : 0, transition: 'opacity 0.3s' }} />

      <Link to={href} aria-hidden="true" tabIndex={-1} style={{ textDecoration: 'none', flexShrink: 0 }}>
        <div className="search-result-poster"  style={{ aspectRatio: '2/3', borderRadius: 1, overflow: 'hidden', border: `1px solid ${hov ? C.accentDim : C.border}`, transition: 'border-color 0.3s' }}>
          <Img src={item.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `saturate(${hov ? 0.8 : 0.5})`, transition: 'filter 0.4s' }} />
        </div>
      </Link>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
          <Link to={href} style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 300, color: C.text, lineHeight: 1.08 }}>{item.title}</span>
          </Link>
          {item.year ? <span style={{ fontFamily: SERIF, fontSize: 18, color: C.gold, lineHeight: 1 }}>{item.year}</span> : null}
        </div>

        {item.director ? <div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 8 }}>{item.director}</div> : null}
        {item.originalTitle !== item.title && <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.textMuted, marginBottom: 10, lineHeight: 1.2 }}>{item.originalTitle}</div>}
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 17, lineHeight: 1.66, color: C.textSoft, margin: '0 0 18px', maxWidth: 860 }}>{item.description}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minHeight: 24 }}>
            {visibleGenres.map((genre) => (
              <span key={genre} style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textSoft, border: `1px solid ${C.border}`, padding: '3px 10px', fontFamily: SANS }}>
                {genre}
              </span>
            ))}
            {isDetailsLoading && visibleGenres.length === 0 && (
              <>
                <span style={{ border: `1px solid ${C.border}`, padding: '5px 13px' }}><SkeletonPill width={52} /></span>
                <span style={{ border: `1px solid ${C.border}`, padding: '5px 13px' }}><SkeletonPill width={62} /></span>
              </>
            )}

            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} /> {isDetailsLoading && !runtimeLabel ? <SkeletonPill width={42} /> : runtimeLabel || 'N/D'}
            </span>
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Globe size={12} /> {isDetailsLoading && !item.country ? <SkeletonPill width={64} /> : item.country || 'N/D'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, minWidth: 138, paddingBottom: 2 }}>
            <span style={{ fontFamily: SERIF, fontSize: 20, color: C.gold, lineHeight: 1 }}>{item.rating ? item.rating.toFixed(1) : '—'}</span>
            <div style={{ display: 'flex', gap: 1 }}>{[1, 2, 3, 4, 5].map((s) => <span key={s} style={{ fontSize: 10, color: s <= Math.round(item.rating / 2) ? C.gold : 'rgba(255,255,255,0.15)' }}>★</span>)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, opacity: hov ? 1 : 0.7, transform: hov ? 'translateY(0)' : 'translateY(4px)', transition: 'opacity 0.25s, transform 0.25s' }}>
          <button onClick={() => setVaulted((v) => !v)} aria-label={vaulted ? "Quitar de la bóveda" : "Añadir a la bóveda"} style={{ padding: '12px 18px', background: vaulted ? C.accentDim : C.accent, color: C.bg, border: 'none', fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}>
            {vaulted ? '✓ En Vault' : '+ Vault'}
          </button>
          <button onClick={() => setBookmarked((v) => !v)} aria-label={bookmarked ? "Quitar de la lista de seguimiento" : "Añadir a la lista de seguimiento"} style={{ padding: '12px 14px', background: 'transparent', color: bookmarked ? C.accent : C.textSoft, border: `1px solid ${bookmarked ? C.accentDim : C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            <Bookmark size={11} fill={bookmarked ? C.accent : 'none'} /> {bookmarked ? 'En watchlist' : 'Watchlist'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function PersonResultItem({ item, delay }: { item: PersonResult; delay: number }) {
  const [hov, setHov] = useState(false)
  const [following, setFollowing] = useState(false)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 20, padding: '20px 0', borderBottom: `1px solid ${C.border}`, background: hov ? 'rgba(212,175,122,0.02)' : 'transparent' }}>
      <Link to={`/person/${item.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${hov ? C.accentDim : C.border}` }}>
          <Img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'saturate(0.5)' }} />
        </div>
      </Link>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <Link to={`/person/${item.id}`} style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: SERIF, fontSize: 24, color: C.text }}>{item.name}</span>
          </Link>
          <span style={{ fontFamily: SANS, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent, border: `1px solid ${C.accentDim}`, padding: '3px 8px' }}>Persona</span>
        </div>

        <div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accentDim, marginBottom: 6 }}>{item.role}</div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.textMuted }}>Conocido por:</span>
          {item.notable.map((entry, index) => (
            <span key={`${entry}-${index}`} style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.textSoft }}>
              {entry}
            </span>
          ))}

          <button onClick={() => setFollowing((v) => !v)} style={{ marginLeft: 'auto', padding: '6px 16px', background: 'transparent', color: following ? C.accent : C.textSoft, border: `1px solid ${following ? C.accentDim : C.border}`, fontFamily: SANS, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
            {following ? '✓ Siguiendo' : '+ Seguir'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function UserResultItem({ item, delay }: { item: UserResult; delay: number }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 16, padding: '16px 0', borderBottom: `1px solid ${C.border}`, background: hov ? 'rgba(212,175,122,0.02)' : 'transparent' }}>
      <Link to={`/${encodeURIComponent(item.username)}`} style={{ textDecoration: 'none' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(212,175,122,0.15)', border: `1px solid ${C.accentDim}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 20, color: C.accent }}>{item.avatar}</div>
      </Link>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Link to={`/${encodeURIComponent(item.username)}`} style={{ fontFamily: SANS, fontSize: 14, color: C.text, textDecoration: 'none' }}>{item.username}</Link>
          <span style={{ fontFamily: SANS, fontSize: 11, color: C.textSoft }}>{item.handle}</span>
          <span style={{ fontFamily: SANS, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.textSoft, border: `1px solid ${C.border}`, padding: '2px 7px' }}>Usuario</span>
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 15, color: C.textSoft }}>{item.bio}</div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: C.textMuted, marginTop: 4 }}>{item.films} películas vistas</div>
      </div>
    </motion.div>
  )
}

function Pagination({ current, total, onPage }: { current: number; total: number; onPage: (n: number) => void }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1)
  const visible = pages.filter((p) => p === 1 || p === total || Math.abs(p - current) <= 2)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '48px 0 32px' }}>
      <button onClick={() => onPage(Math.max(1, current - 1))} disabled={current === 1} aria-label="Ir a la página anterior" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${current === 1 ? C.textMuted : C.border}`, color: current === 1 ? C.textMuted : C.textSoft, cursor: current === 1 ? 'default' : 'pointer' }}>
        <ChevronLeft size={14} />
      </button>

      {visible.reduce((acc: React.ReactNode[], p, i) => {
        if (i > 0 && visible[i - 1] !== p - 1) {
          acc.push(<span key={`dots-${p}`} style={{ color: C.textMuted, fontFamily: SERIF, fontSize: 18, lineHeight: '36px', padding: '0 8px' }}>…</span>)
        }

        acc.push(
          <button key={p} onClick={() => onPage(p)} aria-label={`Página ${p}`} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p === current ? C.accentGlow : 'transparent', border: `1px solid ${p === current ? C.accentDim : C.border}`, color: p === current ? C.accent : C.textSoft, cursor: 'pointer', fontFamily: SERIF, fontSize: 18 }}>
            {p}
          </button>
        )

        return acc
      }, [])}

      <button onClick={() => onPage(Math.min(total, current + 1))} disabled={current === total} aria-label="Ir a la página siguiente" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${current === total ? C.textMuted : C.border}`, color: current === total ? C.textMuted : C.textSoft, cursor: current === total ? 'default' : 'pointer' }}>
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

function ActiveFilters({ filters, onRemove }: { filters: FiltersState; onRemove: (k: keyof FiltersState, v?: string) => void }) {
  const chips: { label: string; onRemove: () => void }[] = []

  ;(filters.genres || []).forEach((g: string) => chips.push({ label: `Género: ${g}`, onRemove: () => onRemove('genres', g) }))
  if (filters.yearFrom) chips.push({ label: `Desde ${filters.yearFrom}`, onRemove: () => onRemove('yearFrom') })
  if (filters.yearTo) chips.push({ label: `Hasta ${filters.yearTo}`, onRemove: () => onRemove('yearTo') })
  if (filters.minRating) chips.push({ label: `★ ${filters.minRating}+`, onRemove: () => onRemove('minRating') })
  if (filters.duration) chips.push({ label: `Duración: ${filters.duration}`, onRemove: () => onRemove('duration') })
  ;(filters.countries || []).forEach((c: string) => chips.push({ label: c, onRemove: () => onRemove('countries', c) }))
  if (filters.pendientes) chips.push({ label: 'Mis pendientes', onRemove: () => onRemove('pendientes') })
  if (filters.palmares) chips.push({ label: 'Palmarés', onRemove: () => onRemove('palmares') })
  if (filters.noVistas) chips.push({ label: 'No vistas', onRemove: () => onRemove('noVistas') })

  if (chips.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
      {chips.map((chip, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: C.accentGlow, border: `1px solid ${C.accentDim}`, fontFamily: SANS, fontSize: 10, letterSpacing: '0.1em', color: C.accent }}>
          {chip.label}
          <button onClick={chip.onRemove} aria-label={`Eliminar filtro ${chip.label}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.accentDim, padding: 0, display: 'flex', lineHeight: 1 }}>
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  )
}

const EMPTY_FILTERS = {
  genres: [],
  yearFrom: '',
  yearTo: '',
  countries: [],
  minRating: 0,
  duration: null,
  pendientes: false,
  palmares: false,
  noVistas: false,
} satisfies FiltersState

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() || ''
  const [activeTab, setActiveTab] = useState('all')
  const [filters, setFilters] = useState<FiltersState>({ ...EMPTY_FILTERS })
  const [page, setPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [filmResults, setFilmResults] = useState<FilmResult[]>([])
  const [personResults, setPersonResults] = useState<PersonResult[]>([])
  const [userResults, setUserResults] = useState<UserResult[]>([])
  const [enrichedFilms, setEnrichedFilms] = useState<Record<number, FilmDetails>>({})
  const [loadingFilmDetails, setLoadingFilmDetails] = useState<Record<number, boolean>>({})
  const detailsCacheRef = useRef<Map<number, FilmDetails>>(new Map())
  const inflightDetailsRef = useRef<Set<number>>(new Set())
  const PER_PAGE = 5

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      return
    }

    let active = true
    setIsSearching(true)

    Promise.all([searchMovies(q, page), searchUsers(q, 16)])
      .then(([data, users]) => {
        if (!active) return

        const rawResults = Array.isArray(data.results) ? data.results : []
        const moviesAndTv = rawResults.filter((item) => item.media_type !== 'person').map(toFilmResult)

        const peopleFromPanel = Array.isArray(data.people_results) ? data.people_results.map(toPersonResult) : []
        const peopleFromResults = rawResults
          .filter((item) => item.media_type === 'person' && item.name)
          .slice(0, 8)
          .map((item) => ({
            id: item.id,
            name: item.name as string,
            role: item.known_for_department || 'Persona',
            notable: [],
            img: toPoster(item.profile_path),
          }))

        const uniquePeople = new Map<number, PersonResult>()
        ;[...peopleFromPanel, ...peopleFromResults].forEach((person) => {
          uniquePeople.set(person.id, person)
        })

        setFilmResults(moviesAndTv)
        setPersonResults(Array.from(uniquePeople.values()))
        setUserResults(users.map(toUserResult))
      })
      .catch(() => {
        if (!active) return
        setFetchError('No se pudieron cargar resultados. Intenta nuevamente.')
        setFilmResults([])
        setPersonResults([])
        setUserResults([])
      })
      .finally(() => {
        if (active) setIsSearching(false)
      })

    return () => {
      active = false
    }
  }, [query, page])

  const mergedFilms = useMemo(
    () =>
      filmResults.map((film) => {
        const details = enrichedFilms[film.id]
        return {
          ...film,
          ...details,
          director: details?.director ?? film.director,
          runtime: details?.runtime ?? film.runtime,
          genres: details?.genres ?? film.genres,
          country: details?.country ?? film.country,
        }
      }),
    [filmResults, enrichedFilms]
  )

  const filteredFilms = useMemo(() => {
    const selectedGenres = (filters.genres || []).map((genre) => genre.toLowerCase())
    const selectedCountries = (filters.countries || []).map((country) => country.toLowerCase())

    return mergedFilms.filter((film) => {
      if (filters.yearFrom && film.year && film.year < parseInt(filters.yearFrom, 10)) return false
      if (filters.yearTo && film.year && film.year > parseInt(filters.yearTo, 10)) return false

      const stars = film.rating > 5 ? film.rating / 2 : film.rating
      if (filters.minRating && stars < filters.minRating) return false

      if (selectedGenres.length > 0) {
        const filmGenres = (film.genres || []).map((genre) => genre.toLowerCase())
        const hasGenre = selectedGenres.some((genre) => filmGenres.some((filmGenre) => filmGenre.includes(genre) || genre.includes(filmGenre)))
        if (!hasGenre) return false
      }

      if (selectedCountries.length > 0) {
        const country = (film.country || '').toLowerCase()
        const hasCountry = selectedCountries.some((selected) => country.includes(selected) || selected.includes(country))
        if (!hasCountry) return false
      }

      if (filters.duration) {
        const runtime = typeof film.runtime === 'number' ? film.runtime : null
        if (!runtime) return false
        if (filters.duration === 'short' && !(runtime < 90)) return false
        if (filters.duration === 'medium' && !(runtime >= 90 && runtime <= 130)) return false
        if (filters.duration === 'long' && !(runtime > 130 && runtime <= 180)) return false
        if (filters.duration === 'epic' && !(runtime > 180)) return false
      }

      return true
    })
  }, [mergedFilms, filters])

  const filteredMovies = useMemo(
    () => filteredFilms.filter((film) => film.mediaType === 'movie'),
    [filteredFilms]
  )

  const filteredSeries = useMemo(
    () => filteredFilms.filter((film) => film.mediaType === 'tv'),
    [filteredFilms]
  )

  const displayedByTab =
    activeTab === 'all'
      ? [...filteredFilms, ...personResults, ...userResults]
      : activeTab === 'film'
      ? filteredMovies
      : activeTab === 'tv'
      ? filteredSeries
      : activeTab === 'person'
      ? personResults
      : userResults

  const totalPages = Math.max(
    1,
    Math.ceil(
      (activeTab === 'film'
        ? filteredMovies.length
        : activeTab === 'tv'
          ? filteredSeries.length
          : filteredFilms.length) / PER_PAGE
    )
  )

  const pageFilms = (activeTab === 'film'
    ? filteredMovies
    : activeTab === 'tv'
      ? filteredSeries
      : filteredFilms).slice((page - 1) * PER_PAGE, page * PER_PAGE)

  useEffect(() => {
    const movieIdsToEnrich = filmResults.filter((film) => film.mediaType === 'movie').map((film) => film.id)
    if (movieIdsToEnrich.length === 0) return

    let active = true

    movieIdsToEnrich.forEach((movieId) => {
      if (detailsCacheRef.current.has(movieId)) return
      if (inflightDetailsRef.current.has(movieId)) return

      inflightDetailsRef.current.add(movieId)

      setLoadingFilmDetails((prev) => ({ ...prev, [movieId]: true }))

      fetchMovieDetail(String(movieId))
        .then((detail) => {
          if (!active) return
          const details: FilmDetails = {
            director: getDirectorFromDetail(detail.credits?.crew),
            runtime: detail.runtime ?? null,
            genres: Array.isArray(detail.genres) ? detail.genres.map((genre) => genre.name).filter(Boolean) : [],
            country: normalizeCountryName(detail.production_countries?.[0]?.name || null),
          }
          detailsCacheRef.current.set(movieId, details)
          setEnrichedFilms((prev) => ({ ...prev, [movieId]: details }))
        })
        .catch(() => {
          if (!active) return
        })
        .finally(() => {
          inflightDetailsRef.current.delete(movieId)
          if (!active) return
          setLoadingFilmDetails((prev) => {
            const next = { ...prev }
            delete next[movieId]
            return next
          })
        })
    })

    return () => {
      active = false
    }
  }, [filmResults])

  const handleFilterChange = (k: keyof FiltersState, v: FiltersState[keyof FiltersState]) => {
    setFilters((prev) => ({ ...prev, [k]: v }))
    setPage(1)
  }

  const handleFilterRemove = (k: keyof FiltersState, v?: string) => {
    setFilters((prev) => {
      if (!v) {
        if (k === 'genres' || k === 'countries') {
          return { ...prev, [k]: [] }
        }
        if (k === 'yearFrom' || k === 'yearTo') {
          return { ...prev, [k]: '' }
        }
        if (k === 'minRating') {
          return { ...prev, [k]: 0 }
        }
        if (k === 'duration') {
          return { ...prev, [k]: null }
        }
        if (k === 'pendientes' || k === 'palmares' || k === 'noVistas') {
          return { ...prev, [k]: false }
        }
        return {
          ...prev,
          [k]: null,
        }
      }
      const arr = ((prev[k] as string[]) || []).filter((entry) => entry !== v)
      return { ...prev, [k]: arr }
    })
    setPage(1)
  }

  const counts = {
    all: filteredFilms.length + personResults.length + userResults.length,
    film: filteredMovies.length,
    tv: filteredSeries.length,
    person: personResults.length,
    user: userResults.length,
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS, textAlign: 'left' }}>
      <Grain />
      <Navbar
        query={query}
        onSearch={(q) => {
          setPage(1)
          setSearchParams({ q })
        }}
      />

      <div style={{ paddingTop: 72 }}>
        <div style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 300, color: C.text }}>{counts.all} resultado{counts.all !== 1 ? 's' : ''}</span>
            <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 22, color: C.textSoft }}> para "{query || '...'}"</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="search-results-desktop-only" onClick={() => setShowFilters((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'transparent', color: showFilters ? C.accent : C.textSoft, border: `1px solid ${showFilters ? C.accentDim : C.border}`, cursor: 'pointer', fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              <SlidersHorizontal size={12} /> {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
          </div>
        </div>

        <div className="search-tabs-bar" style={{ borderBottom: `1px solid ${C.border}`, padding: '0 40px', display: 'flex', gap: 0 }}>
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1) }} style={{ padding: '14px 20px', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab.key ? C.accent : 'transparent'}`, fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: activeTab === tab.key ? C.text : C.textSoft, cursor: 'pointer', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ color: activeTab === tab.key ? C.accent : C.textMuted }}>{tab.icon}</span>
              {tab.label} <span style={{ fontSize: 10, color: C.textMuted }}>({counts[tab.key as keyof typeof counts]})</span>
            </button>
          ))}
        </div>

        <main className="search-results-main" style={{ display: 'flex', gap: 0 }}>
          <AnimatePresence>
            <div className={`search-filters-drawer ${isFiltersOpen ? 'search-filters-drawer--open' : ''}`}>
              <div className="search-filters-drawer-header">
                <div style={{ fontFamily: SANS, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent }}>Filtros</div>
                <button onClick={() => setIsFiltersOpen(false)} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: C.textSoft, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <div className="search-filters-drawer-content">
                <FiltersPanel filters={filters} onChange={handleFilterChange} onClear={() => setFilters({ ...EMPTY_FILTERS })} />
                <button
                  onClick={() => setIsFiltersOpen(false)}
                  style={{
                    width: '100%',
                    marginTop: 32,
                    padding: '14px',
                    background: C.accent,
                    color: C.bg,
                    border: 'none',
                    fontFamily: SANS,
                    fontSize: 11,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  Aplicar filtros
                </button>
              </div>
            </div>

            {showFilters && (
              <motion.div className="search-results-desktop-only" initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.35, ease: 'easeInOut' }} style={{ overflow: 'hidden', flexShrink: 0, borderRight: `1px solid ${C.border}` }}>
                <div style={{ width: 280, padding: '32px 28px' }}>
                  <FiltersPanel filters={filters} onChange={handleFilterChange} onClear={() => setFilters({ ...EMPTY_FILTERS })} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ flex: 1, padding: '32px 40px', minWidth: 0 }}>
            <button className="search-results-mobile-only-btn" onClick={() => setIsFiltersOpen(true)}>
              <SlidersHorizontal size={14} /> Filtros
            </button>
            {fetchError && <div style={{ marginBottom: 16, color: '#C97B7B', fontFamily: SANS, fontSize: 12 }}>{fetchError}</div>}

            <ActiveFilters filters={filters} onRemove={handleFilterRemove} />

            <AnimatePresence mode="wait">
              <motion.div key={`${activeTab}-${page}-${JSON.stringify(filters)}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                {activeTab === 'all' && (
                  <>
                    {personResults.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accentDim, marginBottom: 4, fontFamily: SANS }}>Personas</div>
                        {personResults.map((person, i) => (
                          <PersonResultItem key={person.id} item={person} delay={i * 0.06} />
                        ))}
                      </div>
                    )}

                    {userResults.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accentDim, marginBottom: 4, fontFamily: SANS, marginTop: 16 }}>Usuarios</div>
                        {userResults.map((user, i) => (
                          <UserResultItem key={user.id} item={user} delay={i * 0.06} />
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accentDim, marginBottom: 4, fontFamily: SANS, marginTop: 16 }}>Películas</div>
                    {pageFilms.map((film, i) => {
                      const details = enrichedFilms[film.id]
                      const mergedFilm: FilmResult = {
                        ...film,
                        ...details,
                        director: details?.director ?? film.director,
                        runtime: details?.runtime ?? film.runtime,
                        genres: details?.genres ?? film.genres,
                        country: details?.country ?? film.country,
                      }

                      return <FilmResultItem key={`${film.mediaType}-${film.id}`} item={mergedFilm} delay={i * 0.08} isDetailsLoading={Boolean(loadingFilmDetails[film.id])} />
                    })}
                  </>
                )}

                {activeTab === 'film' &&
                  pageFilms.map((film, i) => {
                    const details = enrichedFilms[film.id]
                    const mergedFilm: FilmResult = {
                      ...film,
                      ...details,
                      director: details?.director ?? film.director,
                      runtime: details?.runtime ?? film.runtime,
                      genres: details?.genres ?? film.genres,
                      country: details?.country ?? film.country,
                    }

                    return <FilmResultItem key={`${film.mediaType}-${film.id}`} item={mergedFilm} delay={i * 0.08} isDetailsLoading={Boolean(loadingFilmDetails[film.id])} />
                  })}
                {activeTab === 'tv' &&
                  pageFilms.map((film, i) => {
                    const details = enrichedFilms[film.id]
                    const mergedFilm: FilmResult = {
                      ...film,
                      ...details,
                      director: details?.director ?? film.director,
                      runtime: details?.runtime ?? film.runtime,
                      genres: details?.genres ?? film.genres,
                      country: details?.country ?? film.country,
                    }

                    return <FilmResultItem key={`${film.mediaType}-${film.id}`} item={mergedFilm} delay={i * 0.08} isDetailsLoading={Boolean(loadingFilmDetails[film.id])} />
                  })}
                {activeTab === 'person' && personResults.map((person, i) => <PersonResultItem key={person.id} item={person} delay={i * 0.06} />)}
                {activeTab === 'user' && userResults.map((user, i) => <UserResultItem key={user.id} item={user} delay={i * 0.06} />)}

                {isSearching ? (
                  <div style={{ padding: '100px 0', textAlign: 'center' }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      style={{ width: 40, height: 40, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', margin: '0 auto 20px' }}
                    />
                    <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 20, color: C.textSoft }}>Buscando en la bóveda...</div>
                  </div>
                ) : displayedByTab.length === 0 ? (
                  <div style={{ padding: '80px 0', textAlign: 'center' }}>
                    <div style={{ fontFamily: SERIF, fontSize: 36, color: C.textMuted, marginBottom: 12 }}>Sin resultados</div>
                    <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: C.textMuted }}>Intenta con otros filtros o una búsqueda diferente.</div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            {(activeTab === 'all' || activeTab === 'film' || activeTab === 'tv') &&
              (activeTab === 'film'
                ? filteredMovies.length
                : activeTab === 'tv'
                  ? filteredSeries.length
                  : filteredFilms.length) > PER_PAGE && (
              <Pagination current={page} total={totalPages} onPage={(nextPage) => { setPage(nextPage); window.scrollTo({ top: 130, behavior: 'smooth' }) }} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
