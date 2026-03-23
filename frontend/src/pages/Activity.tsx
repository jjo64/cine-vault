import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Film, Heart, MessageCircle, UserPlus } from 'lucide-react'
import { SeoHead } from '../components/SeoHead'
import { getStoredAccessToken } from '../services/authServices'
import { fetchActivityFeed, type ActivityItem } from '../services/socialServices'

const C = {
  bg: '#0a0a0f',
  surface: '#101015',
  border: '#25252f',
  accent: '#c9a84c',
  text: '#e8e0d4',
  textSoft: '#888',
} as const

const SANS = "'Syne', sans-serif"
const SERIF = "'Cormorant Garamond', serif"

type TabType = 'friends' | 'own'

function ActivityCard({ item }: { item: ActivityItem }) {
  const icon =
    item.type === 'review_liked' ? <Heart size={14} /> :
    item.type === 'follow' ? <UserPlus size={14} /> :
    item.type === 'review_published' ? <MessageCircle size={14} /> :
    <Film size={14} />

  const description =
    item.type === 'review_published' ? 'publicó una reseña' :
    item.type === 'diary_entry' ? 'registró una entrada en su diario' :
    item.type === 'vault_added' ? 'añadió una película al vault' :
    item.type === 'watchlist_added' ? 'guardó una película en watchlist' :
    item.type === 'review_liked' ? 'dio like a una reseña' :
    `empezó a seguir a ${item.target_user?.username || 'alguien'}`

  return (
    <article
      style={{
        border: `1px solid ${C.border}`,
        background: C.surface,
        padding: 16,
        display: 'grid',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.textSoft, fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        <span style={{ color: C.accent }}>{icon}</span>
        <span>{new Date(item.created_at).toLocaleString('es-AR')}</span>
      </div>

      <div style={{ color: C.text, fontFamily: SERIF, fontSize: 24 }}>
        {item.user.username}
      </div>

      <p style={{ margin: 0, color: C.textSoft, fontFamily: SERIF, fontSize: 18 }}>
        {description}
      </p>

      {item.review?.content ? (
        <p style={{ margin: 0, color: C.text, fontFamily: SERIF, fontStyle: 'italic', fontSize: 16 }}>
          "{item.review.content.slice(0, 180)}{item.review.content.length > 180 ? '…' : ''}"
        </p>
      ) : null}

      {item.movie?.tmdb_id ? (
        <Link
          to={`/movie/${item.movie.tmdb_id}`}
          style={{ color: C.accent, fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}
        >
          Ver película
        </Link>
      ) : null}
    </article>
  )
}

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('friends')
  const [items, setItems] = useState<ActivityItem[]>([])
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
      const response = await fetchActivityFeed(activeTab, nextPage, 20)
      setItems((prev) => (reset ? response.items : [...prev, ...response.items]))
      setHasMore(response.has_more)
      setPage(response.page)
    } catch (err) {
      setError((err as Error).message || 'No se pudo cargar actividad')
    } finally {
      setLoading(false)
    }
  }, [activeTab, loading])

  useEffect(() => {
    if (!getStoredAccessToken()) {
      requireAuth()
      return
    }
    void loadPage(1, true)
  }, [activeTab, loadPage, requireAuth])

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

  const emptyMessage = useMemo(
    () => activeTab === 'friends'
      ? 'Silencio en la sala. Seguí a alguien para ver su actividad.'
      : 'Todavía no registraste actividad. Empezá por una reseña o una entrada.',
    [activeTab]
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <SeoHead.Page
        title="Actividad | CineVault"
        description="Seguí lo que pasa en tu red y en tu propio recorrido cinematográfico dentro de CineVault."
        canonical="https://cinevault.art/activity"
      />

      <header style={{ position: 'sticky', top: 0, zIndex: 20, borderBottom: `1px solid ${C.border}`, background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Link to="/" style={{ color: C.text, textDecoration: 'none', fontFamily: SERIF, fontSize: 26 }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </Link>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setActiveTab('friends')} style={{ border: `1px solid ${activeTab === 'friends' ? C.accent : C.border}`, background: activeTab === 'friends' ? 'rgba(201,168,76,0.12)' : 'transparent', color: activeTab === 'friends' ? C.accent : C.textSoft, fontFamily: SANS, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '8px 12px', cursor: 'pointer' }}>
            Amigos
          </button>
          <button onClick={() => setActiveTab('own')} style={{ border: `1px solid ${activeTab === 'own' ? C.accent : C.border}`, background: activeTab === 'own' ? 'rgba(201,168,76,0.12)' : 'transparent', color: activeTab === 'own' ? C.accent : C.textSoft, fontFamily: SANS, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '8px 12px', cursor: 'pointer' }}>
            Tú
          </button>
        </div>

        <Bell size={16} color={C.accent} />
      </header>

      <section style={{ width: 'min(960px, 100%)', margin: '0 auto', padding: '20px 16px 80px', display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <ActivityCard key={item.id} item={item} />
        ))}

        {!loading && items.length === 0 && !error ? (
          <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 20, color: C.textSoft, fontFamily: SERIF, fontSize: 22 }}>
            {emptyMessage}
          </div>
        ) : null}

        {loading ? (
          <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 20, color: C.textSoft, fontFamily: SANS, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Cargando actividad…
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
