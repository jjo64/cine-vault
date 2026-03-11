import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Film, NotebookPen, Search, Star, Bookmark } from 'lucide-react'
import { authorizedJson, logoutCurrentUser } from '../services/authServices'

type ActivityMovie = {
  movie_id: number
  movie_title?: string
  title?: string
  movie_poster?: string | null
  poster_path?: string | null
  rating?: number | null
  content?: string | null
}

interface HomeLoggedProps {
  username: string
}

const C = {
  bg: '#080808',
  surface: '#111111',
  elevated: '#171717',
  border: '#252525',
  accent: '#D4AF7A',
  accentSoft: '#9A7A48',
  text: '#E2E2E2',
  textSoft: '#8A8A8A',
} as const

const SANS = "'Syne', sans-serif"
const SERIF = "'Cormorant Garamond', serif"

async function authGet<T>(path: string): Promise<T> {
  return authorizedJson<T>(path)
}

function posterUrl(path?: string | null) {
  if (!path) return '/no-poster.svg'
  if (path.startsWith('http')) return path
  return `https://image.tmdb.org/t/p/w342${path}`
}

export default function HomeLogged({ username }: HomeLoggedProps) {
  const navigate = useNavigate()
  const [watchlist, setWatchlist] = useState<ActivityMovie[]>([])
  const [diary, setDiary] = useState<ActivityMovie[]>([])
  const [reviews, setReviews] = useState<ActivityMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [watchlistRes, diaryRes, reviewsRes] = await Promise.allSettled([
          authGet<ActivityMovie[]>('/api/watchlist'),
          authGet<{ diary?: ActivityMovie[] }>('/api/diary'),
          authGet<ActivityMovie[]>('/api/reviews'),
        ])

        if (!alive) return

        if (watchlistRes.status === 'fulfilled') setWatchlist(watchlistRes.value ?? [])
        if (diaryRes.status === 'fulfilled') setDiary(diaryRes.value?.diary ?? [])
        if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value ?? [])

        if (watchlistRes.status === 'rejected' && diaryRes.status === 'rejected' && reviewsRes.status === 'rejected') {
          setError('No se pudo cargar tu actividad. Revisa sesión o endpoints.')
        }
      } catch (err) {
        if (!alive) return
        setError((err as Error).message || 'No se pudo cargar tu actividad')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [])

  const stats = useMemo(() => {
    const avgRating = reviews.length
      ? (reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0) / reviews.length).toFixed(1)
      : '0.0'

    return {
      watchlist: watchlist.length,
      diary: diary.length,
      reviews: reviews.length,
      avgRating,
    }
  }, [watchlist, diary, reviews])

  const spotlight = diary[0] || watchlist[0] || reviews[0] || null

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: SANS }} data-testid="home-logged">
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 20px 70px' }}>
        <section
          style={{
            border: `1px solid ${C.border}`,
            background: `linear-gradient(140deg, ${C.surface}, #0E0E0E 52%, #16120D)`,
            padding: '24px clamp(18px, 3vw, 34px)',
            marginBottom: 18,
          }}
        >
          <div style={{ color: C.accent, textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: 10, marginBottom: 8 }}>Tu sala</div>
          <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.02 }}>
            Bienvenido, {username}
          </h1>
          <p style={{ margin: '10px 0 0', color: C.textSoft, maxWidth: 760, lineHeight: 1.5 }}>
            Esta es tu cabina diaria: lo que ya viste, lo que quieres ver y lo que opinaste.
          </p>
          <button
            onClick={async () => {
              await logoutCurrentUser()
              navigate('/')
            }}
            style={{ marginTop: 14, border: `1px solid ${C.border}`, background: C.elevated, color: '#FF8A8A', padding: '9px 12px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Cerrar sesion
          </button>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Watchlist', value: stats.watchlist, icon: Bookmark },
            { label: 'Entradas en Vault', value: stats.diary, icon: NotebookPen },
            { label: 'Reseñas', value: stats.reviews, icon: Film },
            { label: 'Promedio', value: stats.avgRating, icon: Star },
          ].map((item) => (
            <article key={item.label} style={{ border: `1px solid ${C.border}`, background: C.surface, padding: '14px 14px 12px' }}>
              <item.icon size={14} color={C.accentSoft} />
              <div style={{ marginTop: 8, fontFamily: SERIF, fontSize: 34, lineHeight: 1 }}>{item.value}</div>
              <div style={{ marginTop: 6, color: C.textSoft, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{item.label}</div>
            </article>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
          <article style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 14 }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 500, fontSize: 30 }}>Actividad reciente</h2>
              <Link to="/profile" style={{ color: C.accent, textDecoration: 'none', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Ver perfil
              </Link>
            </header>

            {loading && <p style={{ color: C.textSoft, margin: 0 }}>Cargando actividad...</p>}
            {error && <p style={{ color: '#FF8A8A', margin: 0 }}>{error}</p>}

            {!loading && !error && (
              <div style={{ display: 'grid', gap: 8 }}>
                {(reviews.slice(0, 3) || []).map((item, index) => (
                  <div key={`${item.movie_id}-${index}`} style={{ border: `1px solid ${C.border}`, background: C.elevated, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: C.accentSoft, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Reseña</div>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>{item.movie_title || item.title || `Película ${item.movie_id}`}</div>
                    <div style={{ color: C.textSoft, marginTop: 3, fontSize: 13 }}>{item.content || 'Sin texto de reseña.'}</div>
                  </div>
                ))}

                {reviews.length === 0 && (
                  <div style={{ color: C.textSoft, border: `1px solid ${C.border}`, background: C.elevated, padding: 12 }}>
                    Todavía no has escrito reseñas. Empieza por una película que te haya movido algo.
                  </div>
                )}
              </div>
            )}
          </article>

          <aside style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 14 }}>
            <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 500, fontSize: 30 }}>Ahora en foco</h2>

            {spotlight ? (
              <Link to={`/movie/${spotlight.movie_id}`} style={{ textDecoration: 'none', color: C.text, display: 'block', marginTop: 10 }}>
                <img
                  src={posterUrl(spotlight.movie_poster || spotlight.poster_path)}
                  alt={spotlight.movie_title || spotlight.title || 'Poster'}
                  style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 2, border: `1px solid ${C.border}` }}
                />
                <div style={{ marginTop: 10, fontSize: 20, fontWeight: 600 }}>{spotlight.movie_title || spotlight.title || `Película ${spotlight.movie_id}`}</div>
                <p style={{ margin: '4px 0 0', color: C.textSoft }}>Abre el detalle para puntuar, comentar o mover tu tracking.</p>
              </Link>
            ) : (
              <p style={{ color: C.textSoft }}>Aún no tienes actividad. Busca una película y empieza tu vault.</p>
            )}

            <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
              <Link to="/search/blade+runner" style={{ border: `1px solid ${C.border}`, color: C.text, background: C.elevated, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', fontSize: 12, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
                <Search size={14} color={C.accentSoft} />
                Explorar títulos
              </Link>
              <Link to="/profile" style={{ border: `1px solid ${C.border}`, color: C.text, background: C.elevated, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', fontSize: 12, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
                <NotebookPen size={14} color={C.accentSoft} />
                Abrir tu perfil
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}