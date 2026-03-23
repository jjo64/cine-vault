import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Award, Bell, Calendar, ChevronLeft, ChevronDown, ChevronUp, ExternalLink, Film, MapPin, Share2, Star, Users } from 'lucide-react'
import { GrainOverlay, Img } from '../components/profile-v2/primitives'
import { Navbar } from '../components/profile-v2/layout'
import { createSlug } from '../utils/stringUtils'
import './PersonPage.css'

type PersonDetail = {
  id: number
  name: string
  biography?: string
  profile_path?: string | null
  birthday?: string | null
  deathday?: string | null
  place_of_birth?: string | null
  known_for_department?: string | null
  popularity?: number
}

type CreditItem = {
  id: number
  media_type?: 'movie' | 'tv'
  title?: string
  name?: string
  poster_path?: string | null
  character?: string
  job?: string
  department?: string
  release_date?: string
  first_air_date?: string
  vote_average?: number
  popularity?: number
  order?: number
}

type CombinedCredits = {
  cast?: CreditItem[]
  crew?: CreditItem[]
}

type RoleTab = 'crew' | 'actor'
type CrewTab = 'director' | 'writer' | 'producer'

const API_URL = import.meta.env.VITE_API_URL

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
  gold: '#C8A96E',
} as const

const SERIF = "'Cormorant Garamond', serif"
const SANS = "'Syne', sans-serif"

function toPoster(path?: string | null, size: 'w500' | 'original' = 'w500') {
  if (!path) return '/no-poster.svg'
  return `https://image.tmdb.org/t/p/${size}${path}`
}

function getCreditTitle(item: CreditItem) {
  return item.title || item.name || 'Sin título'
}

function getCreditDate(item: CreditItem) {
  return item.release_date || item.first_air_date || null
}

function getCreditYear(item: CreditItem) {
  const value = getCreditDate(item)
  if (!value) return null
  const parsed = Number.parseInt(value.slice(0, 4), 10)
  return Number.isFinite(parsed) ? parsed : null
}

function movieHref(item: CreditItem) {
  const title = getCreditTitle(item)
  return `/movie/${item.id}-${createSlug(title)}`
}

function buildAwards(person: PersonDetail, knownFor: CreditItem[]) {
  const items = knownFor.slice(0, 4).map((item) => {
    const year = getCreditYear(item)
    return `${year || '—'} · ${getCreditTitle(item)}`
  })

  if (items.length > 0) return items

  return [
    `Popularidad TMDB: ${Math.round(person.popularity || 0)}`,
    'Sin premios registrados en esta fuente',
  ]
}

function getDecades(items: CreditItem[]) {
  const years = items
    .map((item) => getCreditYear(item))
    .filter((year): year is number => Number.isFinite(year))

  if (years.length === 0) return ['Todo']

  const unique = Array.from(
    new Set(
      years.map((year) => `${Math.floor(year / 10) * 10}s`)
    )
  )

  return ['Todo', ...unique.sort((a, b) => Number.parseInt(b, 10) - Number.parseInt(a, 10))]
}

function filterByDecade(items: CreditItem[], decade: string) {
  if (decade === 'Todo') return items
  const base = Number.parseInt(decade, 10)
  if (!Number.isFinite(base)) return items
  return items.filter((item) => {
    const year = getCreditYear(item)
    return year !== null && year >= base && year < base + 10
  })
}

function roleFromCrew(item: CreditItem) {
  return item.job || item.department || 'Crew'
}

function splitCrew(items: CreditItem[]) {
  return {
    director: items.filter((item) => (item.job || '').toLowerCase() === 'director'),
    writer: items.filter((item) => {
      const job = (item.job || '').toLowerCase()
      return job.includes('writer') || job.includes('screenplay') || job.includes('story') || job.includes('novel')
    }),
    producer: items.filter((item) => {
      const job = (item.job || '').toLowerCase()
      return job.includes('producer')
    }),
  }
}

function FilmRow({ item, badge }: { item: CreditItem; badge?: string }) {
  const title = getCreditTitle(item)
  const year = getCreditYear(item)
  const rating = Number(item.vote_average || 0)

  return (
    <Link to={movieHref(item)} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '48px 56px 1fr auto',
          gap: 16,
          alignItems: 'center',
          padding: '16px 0',
          borderBottom: `1px solid ${C.border}`,
          cursor: 'pointer',
        }}
      >
        <div style={{ fontFamily: SERIF, fontSize: 16, color: C.textMuted, textAlign: 'right' }}>{year || '—'}</div>
        <div style={{ aspectRatio: '2/3', borderRadius: 1, overflow: 'hidden', border: `1px solid ${C.border}` }}>
          <Img src={toPoster(item.poster_path)} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.55)' }} />
        </div>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 20, color: C.text, marginBottom: 4, lineHeight: 1.2 }}>{title}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {badge ? (
              <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accent, border: `1px solid ${C.accentDim}`, padding: '2px 8px', fontFamily: SANS }}>
                {badge}
              </span>
            ) : null}
            {item.character ? (
              <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textSoft, border: `1px solid ${C.border}`, padding: '2px 8px', fontFamily: SANS }}>
                {item.character}
              </span>
            ) : null}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: C.gold }}>{rating > 0 ? rating.toFixed(1) : '—'}</div>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: SANS }}>TMDB</div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function PersonPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [credits, setCredits] = useState<CombinedCredits>({ cast: [], crew: [] })
  const [following, setFollowing] = useState(false)
  const [bioExpanded, setBioExpanded] = useState(false)
  const [roleTab, setRoleTab] = useState<RoleTab>('crew')
  const [crewTab, setCrewTab] = useState<CrewTab>('director')
  const [decade, setDecade] = useState('Todo')

  const personId = Number((id || '').split('-')[0])

  useEffect(() => {
    if (!personId) {
      setError('Persona no encontrada')
      setLoading(false)
      return
    }

    let alive = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [personRes, creditsRes] = await Promise.all([
          fetch(`${API_URL}/api/information/person/${personId}`),
          fetch(`${API_URL}/api/information/person/${personId}/combined_credits`),
        ])

        if (!personRes.ok || !creditsRes.ok) throw new Error('No se pudo cargar la biografía')

        const personData = (await personRes.json()) as PersonDetail
        const creditsData = (await creditsRes.json()) as CombinedCredits

        if (!alive) return

        setPerson(personData)
        setCredits(creditsData)
      } catch (err) {
        if (!alive) return
        setError((err as Error).message || 'No se pudo cargar la biografía')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [personId])

  const castMovies = useMemo(
    () => (credits.cast || []).filter((item) => item.media_type === 'movie' && (item.title || item.name)),
    [credits.cast]
  )

  const crewMovies = useMemo(
    () => (credits.crew || []).filter((item) => item.media_type === 'movie' && (item.title || item.name)),
    [credits.crew]
  )

  const knownFor = useMemo(() => {
    const unique = new Map<number, CreditItem>()

    for (const item of [...castMovies, ...crewMovies]) {
      if (!unique.has(item.id)) unique.set(item.id, item)
    }

    return Array.from(unique.values())
      .sort((a, b) => Number(b.vote_average || b.popularity || 0) - Number(a.vote_average || a.popularity || 0))
      .slice(0, 8)
  }, [castMovies, crewMovies])

  const crewByRole = useMemo(() => splitCrew(crewMovies), [crewMovies])

  const activeCrewItems = useMemo(() => {
    const fromRole = crewByRole[crewTab]
    if (fromRole.length > 0) return fromRole
    return crewMovies
  }, [crewByRole, crewTab, crewMovies])

  const actorItems = useMemo(() => {
    return castMovies
      .slice()
      .sort((a, b) => {
        const aOrder = Number(a.order ?? 9999)
        const bOrder = Number(b.order ?? 9999)
        return aOrder - bOrder
      })
  }, [castMovies])

  const decadeOptions = useMemo(() => {
    const source = roleTab === 'crew' ? activeCrewItems : actorItems
    return getDecades(source)
  }, [roleTab, activeCrewItems, actorItems])

  const visibleItems = useMemo(() => {
    const source = roleTab === 'crew' ? activeCrewItems : actorItems
    return filterByDecade(
      source
        .slice()
        .sort((a, b) => {
          const aYear = getCreditYear(a) || 0
          const bYear = getCreditYear(b) || 0
          return bYear - aYear
        }),
      decade
    )
  }, [roleTab, activeCrewItems, actorItems, decade])

  useEffect(() => {
    if (!decadeOptions.includes(decade)) {
      setDecade('Todo')
    }
  }, [decadeOptions, decade])

  useEffect(() => {
    if (roleTab === 'crew' && activeCrewItems.length === 0 && actorItems.length > 0) {
      setRoleTab('actor')
    }
  }, [roleTab, activeCrewItems.length, actorItems.length])

  const stats = useMemo(() => {
    const totalFilms = knownFor.length
    const avgRating = totalFilms > 0
      ? knownFor.reduce((acc, item) => acc + Number(item.vote_average || 0), 0) / totalFilms
      : 0

    return {
      fans: Math.round((person?.popularity || 0) * 100),
      watchlists: castMovies.length * 220 + crewMovies.length * 260,
      avgRating: avgRating || 0,
      totalFilms,
    }
  }, [person?.popularity, knownFor, castMovies.length, crewMovies.length])

  const awards = useMemo(() => buildAwards(person || { id: 0, name: '' }, knownFor), [person, knownFor])

  const heroBackdrop = useMemo(() => {
    const first = knownFor[0]
    if (first?.poster_path) return toPoster(first.poster_path, 'original')
    return '/no-poster.svg'
  }, [knownFor])

  const portrait = useMemo(() => toPoster(person?.profile_path, 'original'), [person?.profile_path])

  const bioParagraphs = useMemo(() => {
    const text = (person?.biography || '').trim()
    if (!text) return ['Sin biografía disponible.']
    return text.split('\n\n').filter(Boolean)
  }, [person?.biography])

  const visibleBio = bioExpanded ? bioParagraphs : bioParagraphs.slice(0, 1)

  const searchFromNavbar = (query: string) => navigate(`/search?q=${encodeURIComponent(query.trim())}`)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, color: C.textSoft, fontFamily: SANS }}>
        <GrainOverlay />
        Cargando biografía...
      </div>
    )
  }

  if (error || !person) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, color: '#C97B7B', fontFamily: SANS }}>
        <GrainOverlay />
        {error || 'Persona no encontrada'}
      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS, overflowX: 'hidden' }}>
      <GrainOverlay />
      <Navbar onNavigateHome={() => navigate('/')} onSearch={searchFromNavbar} />

      <div style={{ paddingTop: 60 }}>
        <section className="person-hero" style={{ position: 'relative', minHeight: 560, overflow: 'hidden' }}>
          <Img src={heroBackdrop} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.35) brightness(0.4)', transform: 'scale(1.04)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,8,8,0.98) 0%, rgba(8,8,8,0.82) 45%, rgba(8,8,8,0.3) 70%, transparent 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,0.98) 0%, transparent 55%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 500, height: 300, background: `radial-gradient(ellipse at bottom left, ${C.accentGlow}, transparent 70%)`, pointerEvents: 'none' }} />

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{ position: 'absolute', right: '8%', top: 0, bottom: 0, width: '34%', overflow: 'hidden' }}
            className="person-page-desktop-portrait person-photo"
          >
            <Img src={portrait} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'saturate(0.6) brightness(0.85)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, transparent 40%, rgba(8,8,8,0.9) 100%)' }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
            className="person-page-hero-content"
            style={{ position: 'relative', zIndex: 3, maxWidth: 700, padding: '0 52px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 560 }}
          >
            <button onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textSoft, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS }}>
              <ChevronLeft size={14} /> Volver
            </button>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', border: `1px solid ${C.accentDim}`, marginBottom: 18, fontFamily: SANS, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, width: 'fit-content' }}>
              <Film size={10} /> {person.known_for_department || 'Persona'}
            </div>

            <h1 style={{ margin: '0 0 8px', fontFamily: SERIF, fontSize: 'clamp(46px,6vw,72px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em' }}>
              {person.name}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textSoft }}><Calendar size={12} color={C.accentDim} /> {person.birthday || 'Sin fecha'}{person.deathday ? ` — ${person.deathday}` : ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textSoft }}><MapPin size={12} color={C.accentDim} /> {person.place_of_birth || 'Lugar desconocido'}</div>
            </div>

            <div style={{ display: 'flex', gap: 24, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
              <div><div style={{ fontFamily: SERIF, fontSize: 26, color: C.gold }}>{stats.fans.toLocaleString()}</div><div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textMuted }}>Fans estimados</div></div>
              <div><div style={{ fontFamily: SERIF, fontSize: 26, color: C.gold }}>{stats.avgRating ? stats.avgRating.toFixed(1) : '—'}</div><div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textMuted }}>Rating medio</div></div>
              <div><div style={{ fontFamily: SERIF, fontSize: 26, color: C.gold }}>{stats.totalFilms}</div><div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textMuted }}>Películas destacadas</div></div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setFollowing((value) => !value)} style={{ padding: '11px 26px', background: following ? C.accentDim : C.accent, color: C.bg, border: 'none', fontFamily: SANS, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Bell size={12} /> {following ? 'Siguiendo' : 'Seguir'}
              </button>
              <button style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: C.textSoft, border: `1px solid ${C.border}` }}><Share2 size={15} /></button>
            </div>
          </motion.div>
        </section>

        <div className="person-page-content-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 52px 0' }}>
          <div className="person-page-two-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 72 }}>
            <main>
              <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.accent, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS }}>
                  Biografía <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.border}, transparent)` }} />
                </div>
                {visibleBio.map((paragraph, index) => (
                  <p key={index} style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, lineHeight: 1.8, color: C.textSoft, margin: '0 0 18px' }}>{paragraph}</p>
                ))}
                {bioParagraphs.length > 1 ? (
                  <button onClick={() => setBioExpanded((value) => !value)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, padding: 0 }}>
                    {bioExpanded ? <><ChevronUp size={13} /> Leer menos</> : <><ChevronDown size={13} /> Leer más</>}
                  </button>
                ) : null}
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.accent, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS }}>
                  Conocido por <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.border}, transparent)` }} />
                </div>
                <div className="person-filmography-grid" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                  {knownFor.slice(0, 6).map((item) => {
                    const title = getCreditTitle(item)
                    return (
                      <Link key={item.id} to={movieHref(item)} style={{ textDecoration: 'none', flexShrink: 0, width: 120 }}>
                        <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.25 }}>
                          <div style={{ aspectRatio: '2/3', borderRadius: 2, overflow: 'hidden', marginBottom: 10, border: `1px solid ${C.border}` }}>
                            <Img src={toPoster(item.poster_path)} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.6)' }} />
                          </div>
                          <div style={{ fontSize: 12, color: C.text, fontFamily: SANS, lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                          <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}>{getCreditYear(item) || '—'}</div>
                        </motion.div>
                      </Link>
                    )
                  })}
                </div>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.accent, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS }}>
                  Filmografía <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.border}, transparent)` }} />
                </div>

                <div style={{ display: 'flex', gap: 2, marginBottom: 22, borderBottom: `1px solid ${C.border}` }}>
                  {(['crew', 'actor'] as const).map((tab) => (
                    <button key={tab} onClick={() => setRoleTab(tab)} style={{ padding: '10px 24px', background: 'none', border: 'none', borderBottom: `2px solid ${roleTab === tab ? C.accent : 'transparent'}`, fontFamily: SANS, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: roleTab === tab ? C.text : C.textSoft, cursor: 'pointer', marginBottom: -1 }}>
                      {tab === 'crew' ? `Crew (${crewMovies.length})` : `Actor (${actorItems.length})`}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {roleTab === 'crew' ? (
                    <motion.div key="crew" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {([
                            { key: 'director', label: 'Director' },
                            { key: 'writer', label: 'Guionista' },
                            { key: 'producer', label: 'Productor' },
                          ] as Array<{ key: CrewTab; label: string }>).map((entry) => (
                            <button key={entry.key} onClick={() => setCrewTab(entry.key)} style={{ padding: '6px 16px', background: crewTab === entry.key ? C.accentGlow : 'transparent', color: crewTab === entry.key ? C.accent : C.textSoft, border: `1px solid ${crewTab === entry.key ? C.accentDim : C.border}`, fontFamily: SANS, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
                              {entry.label}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {decadeOptions.map((entry) => (
                            <button key={entry} onClick={() => setDecade(entry)} style={{ padding: '4px 12px', background: decade === entry ? C.elevated : 'transparent', color: decade === entry ? C.text : C.textMuted, border: `1px solid ${decade === entry ? C.border : 'transparent'}`, fontFamily: SANS, fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer' }}>{entry}</button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="actor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 6, flexWrap: 'wrap' }}>
                        {decadeOptions.map((entry) => (
                          <button key={entry} onClick={() => setDecade(entry)} style={{ padding: '4px 12px', background: decade === entry ? C.elevated : 'transparent', color: decade === entry ? C.text : C.textMuted, border: `1px solid ${decade === entry ? C.border : 'transparent'}`, fontFamily: SANS, fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer' }}>{entry}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {visibleItems.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', color: C.textMuted, fontSize: 18 }}>Sin resultados para este filtro.</div>
                ) : (
                  visibleItems.map((item) => (
                    <FilmRow key={`${roleTab}-${item.id}-${item.job || item.character || ''}`} item={item} badge={roleTab === 'crew' ? roleFromCrew(item) : undefined} />
                  ))
                )}
              </motion.section>
            </main>

            <aside>
              <div className="person-page-sticky-aside" style={{ position: 'sticky', top: 80 }}>
                <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS }}>
                    Reconocimientos <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.border}, transparent)` }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {awards.map((entry, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.surface, borderLeft: `2px solid ${C.accentDim}` }}>
                        <Award size={14} color={C.gold} />
                        <span style={{ fontFamily: SERIF, fontSize: 15, color: C.textSoft }}>{entry}</span>
                      </div>
                    ))}
                  </div>
                </motion.section>

                <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>CineVault</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                      { icon: <Users size={14} />, label: 'Fans', val: stats.fans.toLocaleString() },
                      { icon: <Film size={14} />, label: 'En watchlists', val: stats.watchlists.toLocaleString() },
                      { icon: <Star size={14} />, label: 'Rating medio', val: stats.avgRating ? stats.avgRating.toFixed(1) : '—' },
                    ].map((entry, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textSoft, fontSize: 12, fontFamily: SANS }}>{entry.icon} {entry.label}</div>
                        <div style={{ fontFamily: SERIF, fontSize: 18, color: C.text }}>{entry.val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <a href={`https://www.themoviedb.org/person/${person.id}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.surface, border: `1px solid ${C.border}`, color: C.textSoft, textDecoration: 'none', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Ver ficha externa <ExternalLink size={12} />
                </a>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
