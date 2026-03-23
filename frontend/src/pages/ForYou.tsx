import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SeoHead } from '../components/SeoHead'
import { getStoredAccessToken } from '../services/authServices'
import { fetchForYouFeed, type ForYouItem } from '../services/socialServices'

const C = {
  bg: '#0a0a0f',
  surface: '#121218',
  border: '#2a2a35',
  accent: '#c9a84c',
  text: '#e8e0d4',
  textSoft: '#888',
} as const

const SANS = "'Syne', sans-serif"
const SERIF = "'Cormorant Garamond', serif"

function ForYouCard({ item }: { item: ForYouItem }) {
  if (item.type === 'movie') {
    const poster = item.movie.poster_path ? `https://image.tmdb.org/t/p/w342${item.movie.poster_path}` : null
    return (
      <article style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 14, display: 'grid', gridTemplateColumns: poster ? '80px 1fr' : '1fr', gap: 14 }}>
        {poster ? <img src={poster} alt={item.movie.title} style={{ width: 80, height: 120, objectFit: 'cover', border: `1px solid ${C.border}` }} /> : null}
        <div>
          <div style={{ color: C.accent, fontFamily: SANS, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Película recomendada
          </div>
          <h3 style={{ margin: '6px 0', fontFamily: SERIF, fontSize: 30, fontWeight: 400 }}>{item.movie.title}</h3>
          <p style={{ margin: '0 0 8px', color: C.textSoft, fontFamily: SERIF, fontSize: 18 }}>{item.movie.reason}</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: SANS, fontSize: 11, color: C.textSoft }}>
            <span>{item.movie.year || 'Año n/d'}</span>
            <span>•</span>
            <span>TMDB {item.movie.vote_average.toFixed(1)}</span>
          </div>
          <Link to={`/movie/${item.movie.id}`} style={{ display: 'inline-block', marginTop: 10, color: C.accent, textDecoration: 'none', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Ver detalle
          </Link>
        </div>
      </article>
    )
  }

  return (
    <article style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 16 }}>
      <div style={{ color: C.accent, fontFamily: SANS, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        Reseña afín
      </div>
      <h3 style={{ margin: '6px 0 4px', fontFamily: SERIF, fontSize: 28, fontWeight: 400 }}>
        {item.user.username}
      </h3>
      <p style={{ margin: '0 0 8px', color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic', fontSize: 20 }}>
        {(item.review.content || 'Sin contenido').slice(0, 220)}
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: SANS, fontSize: 11, color: C.textSoft }}>
        <span>Modo {item.review.mode}</span>
        <span>•</span>
        <span>Rating {item.review.rating ?? 'n/d'}</span>
      </div>
      <Link to={`/movie/${item.movie.tmdb_id}`} style={{ display: 'inline-block', marginTop: 10, color: C.accent, textDecoration: 'none', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Ver película relacionada
      </Link>
    </article>
  )
}

export default function ForYouPage() {
  const [items, setItems] = useState<ForYouItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const requireAuth = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }))
  }, [])

  const loadPage = useCallback(async (nextPage: number, reset = false) => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetchForYouFeed(nextPage)
      setItems((prev) => (reset ? response.items : [...prev, ...response.items]))
      setHasMore(response.has_more)
      setPage(response.page)
    } catch (err) {
      setError((err as Error).message || 'No se pudo cargar tu feed')
    } finally {
      setLoading(false)
    }
  }, [loading])

  useEffect(() => {
    if (!getStoredAccessToken()) {
      requireAuth()
      return
    }
    void loadPage(1, true)
  }, [loadPage, requireAuth])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore) return

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !loading) {
        void loadPage(page + 1)
      }
    }, { rootMargin: '200px' })

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadPage, loading, page])

  const emptyText = useMemo(
    () => 'Tu perfil cinematográfico está en blanco. Empezá a puntuar.',
    []
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <SeoHead.Page
        title="For You | CineVault"
        description="Feed personalizado con películas y reseñas afines a tus gustos cinematográficos."
        canonical="https://cinevault.art/for-you"
      />

      <header style={{ position: 'sticky', top: 0, zIndex: 20, borderBottom: `1px solid ${C.border}`, background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Link to="/" style={{ color: C.text, textDecoration: 'none', fontFamily: SERIF, fontSize: 26 }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </Link>

        <div style={{ color: C.accent, fontFamily: SANS, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          For You
        </div>
      </header>

      <section style={{ width: 'min(860px, 100%)', margin: '0 auto', padding: '22px 16px 80px', display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <ForYouCard key={item.id} item={item} />
        ))}

        {!loading && items.length === 0 && !error ? (
          <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 20, color: C.textSoft, fontFamily: SERIF, fontSize: 22 }}>
            {emptyText}
          </div>
        ) : null}

        {loading ? (
          <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 20, color: C.textSoft, fontFamily: SANS, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Cargando recomendaciones…
          </div>
        ) : null}

        {error ? (
          <div style={{ border: '1px solid #6b2f2f', background: 'rgba(107,47,47,0.12)', padding: 20, color: '#f2b8b8', fontFamily: SERIF, fontSize: 18 }}>
            {error}
            <div>
              <button onClick={() => void loadPage(1, true)} style={{ marginTop: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 12px', cursor: 'pointer' }}>
                Reintentar
              </button>
            </div>
          </div>
        ) : null}

        <div ref={sentinelRef} style={{ height: 1 }} />
      </section>
    </main>
  )
}
