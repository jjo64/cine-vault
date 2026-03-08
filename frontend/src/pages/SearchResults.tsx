import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { createSlug } from '../utils/stringUtils'
import { searchMovies } from '../services/searchServices'
import { useResponsive } from '../hooks/useResponsive'

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

type SearchMovie = {
  id: number
  title: string
  original_title?: string
  release_date?: string
  poster_path?: string | null
  director?: string
  overview?: string
}

type SortMode = 'relevance' | 'year-desc' | 'year-asc' | 'title-asc'

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

function SearchTopBar({
  query,
  onSearch,
  isMobile,
}: {
  query: string
  onSearch: (q: string) => void
  isMobile: boolean
}) {
  const [input, setInput] = useState(query)
  const navigate = useNavigate()

  useEffect(() => {
    setInput(query)
  }, [query])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 120,
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(8,8,8,0.92)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div style={{ maxWidth: 1260, margin: '0 auto', padding: isMobile ? '12px 14px' : '14px 20px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <button onClick={() => navigate('/')} style={{ border: 'none', background: 'none', color: C.text, textDecoration: 'none', cursor: 'pointer', fontFamily: SERIF, fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </button>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!input.trim()) return
            onSearch(input.trim())
          }}
          style={{ flex: 1, maxWidth: isMobile ? '100%' : 560, minWidth: isMobile ? '100%' : undefined }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40, borderRadius: 999, border: `1px solid ${C.border}`, background: C.elevated, padding: '0 12px 0 14px' }}>
            <Search size={15} color={C.textSoft} />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Buscar películas, directores..."
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: C.text, fontFamily: SANS, fontSize: 12, letterSpacing: '0.05em' }}
            />
          </div>
        </form>
      </div>
    </header>
  )
}

export default function SearchResultsPage() {
  const { query: urlQuery } = useParams<{ query: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const queryFromParams = searchParams.get('q') || ''
  const query = (urlQuery ? decodeURIComponent(urlQuery).replace(/\+/g, ' ') : queryFromParams).trim()

  const [results, setResults] = useState<SearchMovie[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('relevance')
  const { isMobile, isTablet } = useResponsive()

  useEffect(() => {
    if (!query) {
      setResults([])
      setTotalPages(1)
      setTotalResults(0)
      return
    }

    let alive = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await searchMovies(query, currentPage)
        if (!alive) return
        setResults(Array.isArray(data?.results) ? data.results : [])
        setTotalPages(Number(data?.total_pages || 1))
        setTotalResults(Number(data?.total_results || 0))
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
  }, [query, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [query])

  const sortedResults = useMemo(() => {
    const list = [...results]
    if (sortMode === 'relevance') return list

    if (sortMode === 'title-asc') {
      return list.sort((a, b) => a.title.localeCompare(b.title, 'es'))
    }

    if (sortMode === 'year-desc') {
      return list.sort((a, b) => Number(b.release_date?.slice(0, 4) || 0) - Number(a.release_date?.slice(0, 4) || 0))
    }

    return list.sort((a, b) => Number(a.release_date?.slice(0, 4) || 0) - Number(b.release_date?.slice(0, 4) || 0))
  }, [results, sortMode])

  const handleSearch = (nextQuery: string) => {
    navigate(`/search/${nextQuery.replace(/\s+/g, '+')}`)
  }

  const pageButtons = Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: SANS }}>
      <GrainOverlay />
      <SearchTopBar query={query} onSearch={handleSearch} isMobile={isMobile} />

      <main style={{ maxWidth: 1260, margin: '0 auto', padding: isMobile ? '18px 12px 36px' : isTablet ? '24px 16px 42px' : '28px 20px 56px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em', color: C.accent, marginBottom: 6 }}>Resultados</div>
            <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.08 }}>
              {totalResults.toLocaleString('es-ES')} coincidencias para &quot;{query || '...'}&quot;
            </h1>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, border: `1px solid ${C.border}`, background: C.surface, padding: '7px 10px', width: isMobile ? '100%' : 'auto' }}>
            <SlidersHorizontal size={14} color={C.textSoft} />
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} style={{ background: 'transparent', border: 'none', outline: 'none', color: C.textSoft, fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer' }}>
              <option value="relevance">Relevancia</option>
              <option value="year-desc">Año: recientes</option>
              <option value="year-asc">Año: antiguas</option>
              <option value="title-asc">Título A-Z</option>
            </select>
          </div>
        </div>

        {loading && <div style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic', marginBottom: 14 }}>Buscando...</div>}
        {error && <div style={{ color: '#ff8a8a', marginBottom: 14 }}>{error}</div>}

        {!loading && sortedResults.length === 0 && (
          <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 18, color: C.textSoft }}>
            No encontramos resultados para esa búsqueda.
          </div>
        )}

        <section style={{ display: 'grid', gap: 10 }}>
          {sortedResults.map((movie) => (
            <Link key={movie.id} to={`/movie/${movie.id}-${createSlug(movie.title)}`} style={{ textDecoration: 'none' }}>
              <article style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '92px minmax(0, 1fr)', gap: 14, border: `1px solid ${C.border}`, background: C.surface, padding: 10, transition: 'border-color 0.2s, transform 0.2s', cursor: 'pointer' }}>
                <img src={movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : '/no-poster.svg'} alt={movie.title} style={{ width: isMobile ? '100%' : 92, height: isMobile ? 220 : 138, objectFit: 'cover', borderRadius: 2, background: C.elevated }} />

                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: '2px 0 6px', color: C.text, fontFamily: SANS, fontSize: isMobile ? 20 : 26, textTransform: 'uppercase', lineHeight: 1.02, letterSpacing: '0.02em' }}>
                    {movie.title}
                    {movie.release_date && <span style={{ marginLeft: 8, color: C.textSoft, fontSize: 14, fontWeight: 400, textTransform: 'none' }}>{movie.release_date.split('-')[0]}</span>}
                  </h2>

                  {movie.original_title && movie.original_title !== movie.title && <div style={{ color: C.textSoft, fontSize: 12, marginBottom: 6 }}>Título original: {movie.original_title}</div>}

                  <div style={{ color: C.accentDim, fontSize: 12, marginBottom: 8 }}>{movie.director || 'Dirección no disponible'}</div>

                  <p style={{ margin: 0, color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic', lineHeight: 1.5, fontSize: 15 }}>
                    {movie.overview ? `${movie.overview.slice(0, 220)}${movie.overview.length > 220 ? '...' : ''}` : 'Sin descripción disponible.'}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </section>

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
