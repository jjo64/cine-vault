import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Star, TrendingUp, AlertTriangle, Users } from 'lucide-react'

const C = {
  bg: '#080808',
  surface: '#111111',
  elevated: '#1A1A1A',
  border: '#2A2A2A',
  accent: '#D4AF7A',
  accentDim: '#9A7A48',
  accentGlow: 'rgba(212,175,122,0.15)',
  text: '#E2E2E2',
  textSoft: '#7A7A7A',
  textMuted: '#3A3A3A',
  gold: '#C8A96E',
} as const

const SERIF = "'Playfair Display', 'Cormorant Garamond', serif"
const SANS = "'Syne', sans-serif"
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'

type ApiMovieDirected = {
  id: number
  title: string
  release_date: string
  vote_average: number
  vote_count: number
  poster_path: string | null
}

type ApiTimelineEntry = {
  year: number
  count: number
  avg_rating: number
}

type ApiDirectorAutopsy = {
  person_id: number
  name: string
  profile_path: string | null
  years: string | null
  nationality: string
  biography: string
  movies_directed: ApiMovieDirected[]
  statistics: {
    total_movies: number
    avg_rating: number
    top_rated: { title: string; score: number } | null
    most_voted: { title: string; votes: number } | null
    first_year: number | null
    last_year: number | null
  }
  timeline: ApiTimelineEntry[]
}

interface TimelineFilm {
  id: number
  year: number
  title: string
  poster: string
  vitalNote: string
  avgRating: number
  vaultCount: number
}

interface ContextCard {
  id: number
  year: number
  text: string
  type: 'event'
}

type TimelineItem = ({ kind: 'film' } & TimelineFilm) | ({ kind: 'context' } & ContextCard)

interface DirectorData {
  id: number
  name: string
  photo: string
  years: string
  nationality: string
  editorial: string
  totalMovies: number
  timeline: TimelineItem[]
  stats: {
    mostVoted: string
    mostVotedVotes: number | null
    topRated: string
    topRatedScore: number | null
    averageScore: number | null
  }
}

function toTmdbImage(path?: string | null) {
  if (!path) return '/no-poster.svg'
  if (path.startsWith('http')) return path
  return `${TMDB_IMG}${path}`
}

function parseYear(releaseDate?: string | null) {
  if (!releaseDate) return null
  const parsed = Number.parseInt(releaseDate.slice(0, 4), 10)
  return Number.isFinite(parsed) ? parsed : null
}

function buildVitalNote(movie: ApiMovieDirected) {
  const score = Number.isFinite(movie.vote_average) ? movie.vote_average.toFixed(1) : 'N/D'
  const votes = Number.isFinite(movie.vote_count) ? movie.vote_count.toLocaleString('es') : 'N/D'
  return `${score}/10 en TMDB - ${votes} votos`
}

function mapAutopsyPayload(payload: ApiDirectorAutopsy): DirectorData {
  const sortedMovies = [...(payload.movies_directed || [])].sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))

  const films: TimelineFilm[] = sortedMovies
    .map((movie) => {
      const year = parseYear(movie.release_date)
      if (!year) return null
      return {
        id: movie.id,
        year,
        title: movie.title || 'Sin titulo',
        poster: toTmdbImage(movie.poster_path),
        vitalNote: buildVitalNote(movie),
        avgRating: Number(movie.vote_average || 0),
        vaultCount: Number(movie.vote_count || 0),
      } satisfies TimelineFilm
    })
    .filter((movie): movie is TimelineFilm => Boolean(movie))

  const timelineByYear = payload.timeline || []
  const timeline: TimelineItem[] = []

  timelineByYear.forEach((entry, index) => {
    timeline.push({
      kind: 'context',
      id: 1000 + index,
      year: entry.year,
      type: 'event',
      text: `${entry.count} pelicula${entry.count === 1 ? '' : 's'} dirigidas en ${entry.year} con promedio ${entry.avg_rating.toFixed(1)} en TMDB.`,
    })

    films
      .filter((film) => film.year === entry.year)
      .forEach((film) => {
        timeline.push({ kind: 'film', ...film })
      })
  })

  const fallbackTimeline = timeline.length > 0 ? timeline : films.map((film) => ({ kind: 'film', ...film } as TimelineItem))

  const firstKnownYear = payload.statistics.first_year || films[0]?.year || null
  const lastKnownYear = payload.statistics.last_year || films[films.length - 1]?.year || null

  return {
    id: payload.person_id,
    name: payload.name || 'Sin nombre',
    photo: toTmdbImage(payload.profile_path),
    years: payload.years || (firstKnownYear && lastKnownYear ? `${firstKnownYear} - ${lastKnownYear}` : 'Sin fechas disponibles'),
    nationality: payload.nationality || 'N/D',
    editorial: payload.biography?.trim() || 'Sin contexto biografico disponible.',
    totalMovies: Number(payload.statistics.total_movies || films.length || 0),
    timeline: fallbackTimeline,
    stats: {
      mostVoted: payload.statistics.most_voted?.title || 'N/D',
      mostVotedVotes: payload.statistics.most_voted?.votes ?? null,
      topRated: payload.statistics.top_rated?.title || 'N/D',
      topRatedScore: payload.statistics.top_rated?.score ?? null,
      averageScore: Number.isFinite(payload.statistics.avg_rating) ? payload.statistics.avg_rating : null,
    },
  }
}

function Img({ src, alt, style, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = useState(false)
  if (err) return <div style={{ ...style, background: '#1a1a1a' }} />
  return <img src={src} alt={alt} style={style} onError={() => setErr(true)} {...rest} />
}

function GrainOverlay() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.3 }} />
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={10} height={10} viewBox="0 0 12 12" fill={i < Math.round(rating / 2) ? C.gold : C.textMuted}>
          <path d="M6 1l1.3 2.6L10 4l-2 2 .5 2.8L6 7.5 3.5 8.8 4 6 2 4l2.7-.4z" />
        </svg>
      ))}
      <span style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS, marginLeft: 4 }}>{Number.isFinite(rating) ? rating.toFixed(1) : 'N/D'}</span>
    </div>
  )
}

export function DirectorAutopsy() {
  const { id } = useParams<{ id: string }>()
  const [director, setDirector] = useState<DirectorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const run = async () => {
      if (!id) {
        setError('ID de director invalido.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const apiUrl = import.meta.env.VITE_API_URL
        const response = await fetch(`${apiUrl}/api/directors/${encodeURIComponent(id)}/autopsy`)
        if (!response.ok) throw new Error('No se pudo cargar la autopsia')

        const payload = (await response.json()) as ApiDirectorAutopsy
        if (!active) return

        setDirector(mapAutopsyPayload(payload))
      } catch {
        if (!active) return
        setDirector(null)
        setError('No se pudo cargar la autopsia del director en este momento.')
      } finally {
        if (active) setLoading(false)
      }
    }

    run()
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS, display: 'grid', placeItems: 'center' }}>
        Cargando autopsia...
      </div>
    )
  }

  if (!director) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 760, textAlign: 'center' }}>
          <div style={{ fontFamily: SERIF, fontSize: 42, marginBottom: 16 }}>Autopsia no disponible</div>
          <div style={{ color: C.textSoft, fontSize: 14, lineHeight: 1.7 }}>{error || 'Sin datos para este director.'}</div>
        </div>
      </div>
    )
  }

  const films = director.timeline.filter((t): t is ({ kind: 'film' } & TimelineFilm) => t.kind === 'film')
  const firstYear = films[0]?.year
  const lastYear = films[films.length - 1]?.year
  const yearRange = firstYear && lastYear ? `${firstYear} - ${lastYear}` : director.years

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS }}>
      <GrainOverlay />

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`, padding: '0 48px', display: 'flex', alignItems: 'center', gap: 20, height: 60 }}>
        <Link to="/search?tab=person" style={{ color: C.textSoft, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: SANS }}>
          <ArrowLeft size={13} /> Directores
        </Link>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: SERIF, fontSize: 18, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </div>
        <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent, border: `1px solid ${C.accentDim}`, padding: '3px 10px', fontFamily: SANS }}>AUTOPSY</span>
      </nav>

      <div style={{ position: 'relative', minHeight: 480, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Img src={director.photo} alt={director.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) brightness(0.35)' }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(212,175,122,0.08) 0%, transparent 60%)` }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(8,8,8,0.6) 65%, #080808 100%)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 80px 56px', maxWidth: 1080, margin: '0 auto' }}
        >
          <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.accent, fontFamily: SANS, marginBottom: 14 }}>
            {yearRange} - {director.nationality}
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 68, fontWeight: 400, color: C.text, lineHeight: 0.92, marginBottom: 22, letterSpacing: '-0.03em' }}>
            {director.name}
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 22, color: C.textSoft, maxWidth: 720, lineHeight: 1.5 }}>
            {director.editorial}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20 }}>
            <Users size={12} color={C.textSoft} />
            <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}>{director.totalMovies} peliculas dirigidas registradas</span>
          </div>
        </motion.div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 48px 0' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.accent, fontFamily: SANS, marginBottom: 48 }}>
          Filmografia cronologica con contexto de carrera
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 64, top: 0, bottom: 0, width: 1, background: `linear-gradient(to bottom, ${C.accent}55, ${C.accentDim}22 80%, transparent)` }} />

          {director.timeline.map((item, i) => {
            if (item.kind === 'context') {
              return (
                <motion.div
                  key={`ctx-${item.id}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.45 }}
                  style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 0, marginBottom: 40, position: 'relative' }}
                >
                  <div style={{ textAlign: 'right', paddingRight: 20, paddingTop: 12 }}>
                    <span style={{ fontFamily: SERIF, fontSize: 15, color: C.textMuted }}>{item.year}</span>
                  </div>
                  <div style={{ position: 'absolute', left: 57, top: 13, width: 14, height: 14, borderRadius: '50%', background: C.border, border: `1.5px solid ${C.accentDim}`, zIndex: 2 }} />
                  <div style={{ paddingLeft: 28 }}>
                    <div style={{ background: C.elevated, border: `1px solid ${C.border}`, padding: '16px 20px', fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.textMuted, lineHeight: 1.7 }}>
                      {item.text}
                    </div>
                  </div>
                </motion.div>
              )
            }

            return (
              <motion.div
                key={`film-${item.id}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.45 }}
                style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 0, marginBottom: 48, position: 'relative' }}
              >
                <div style={{ textAlign: 'right', paddingRight: 20, paddingTop: 10 }}>
                  <span style={{ fontFamily: SERIF, fontSize: 15, color: C.accentDim, display: 'block' }}>{item.year}</span>
                </div>
                <div style={{ position: 'absolute', left: 56, top: 10, width: 16, height: 16, borderRadius: '50%', background: C.bg, border: `2px solid ${C.accent}`, zIndex: 2, boxShadow: `0 0 8px ${C.accentGlow}` }} />
                <div style={{ paddingLeft: 28 }}>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', background: C.surface, border: `1px solid ${C.border}`, padding: '20px 22px' }}>
                    <div style={{ width: 60, height: 84, flexShrink: 0, borderRadius: 1, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                      <Img src={item.poster} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.5) brightness(0.75)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: SERIF, fontSize: 22, color: C.text, lineHeight: 1.2, marginBottom: 8 }}>{item.title}</div>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center' }}>
                        <Stars rating={item.avgRating} />
                        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: SANS }}>{item.vaultCount.toLocaleString('es')} votos</span>
                      </div>
                      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.textSoft, lineHeight: 1.7 }}>
                        {item.vitalNote}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '64px auto 0', padding: '0 48px 80px' }}>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 48, marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.accent, fontFamily: SANS, marginBottom: 8 }}>Su obra en CineVault</div>
          <div style={{ fontFamily: SERIF, fontSize: 26, color: C.text }}>Lectura de comunidad y recepcion</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            {
              icon: <TrendingUp size={14} color={C.accent} />,
              label: 'Mas votada',
              value: director.stats.mostVoted,
              sub: director.stats.mostVotedVotes ? `${director.stats.mostVotedVotes.toLocaleString('es')} votos acumulados` : 'Sin datos de votos',
            },
            {
              icon: <Star size={14} color={C.gold} fill={C.gold} />,
              label: 'Rating mas alto',
              value: director.stats.topRated,
              sub: director.stats.topRatedScore ? `${director.stats.topRatedScore.toFixed(1)} promedio` : 'Sin score disponible',
            },
            {
              icon: <AlertTriangle size={14} color={C.accent} />,
              label: 'Promedio global',
              value: director.stats.averageScore ? `${director.stats.averageScore.toFixed(2)} / 10` : 'N/D',
              sub: 'Media de peliculas dirigidas en TMDB',
            },
            {
              icon: <Users size={14} color={C.textSoft} />,
              label: 'Peliculas dirigidas',
              value: director.totalMovies.toLocaleString('es'),
              sub: 'Total filmografico detectado',
            },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.07 }} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '22px 24px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ marginTop: 2, flexShrink: 0 }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS, marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontFamily: SERIF, fontSize: 22, color: C.text, lineHeight: 1.2, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, fontStyle: 'italic' }}>{stat.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
