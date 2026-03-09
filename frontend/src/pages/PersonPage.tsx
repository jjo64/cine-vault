import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import { GrainOverlay, Img } from '../components/profile-v2/primitives'
import { Navbar } from '../components/profile-v2/layout'
import { C, SANS, SERIF } from '../components/profile-v2/theme'
import { createSlug } from '../utils/stringUtils'
import { useResponsive } from '../hooks/useResponsive'

type PersonDetail = {
  id: number
  name: string
  biography?: string
  profile_path?: string | null
  birthday?: string | null
  place_of_birth?: string | null
  known_for_department?: string | null
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
}

type CombinedCredits = {
  cast?: CreditItem[]
  crew?: CreditItem[]
}

const API_URL = import.meta.env.VITE_API_URL

type RoleTab = 'actor' | 'crew'
type ActorFilter = 'lead' | 'support'

function personImage(path?: string | null) {
  if (!path) return '/no-poster.svg'
  return `https://image.tmdb.org/t/p/w500${path}`
}

function groupCrewByDepartment(items: CreditItem[]) {
  const map = new Map<string, CreditItem[]>()
  items.forEach((item) => {
    const key = item.department || item.job || 'Crew'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  })
  return Array.from(map.entries())
}

function paginated<T>(items: T[], page: number, perPage = 12) {
  const start = (page - 1) * perPage
  return items.slice(start, start + perPage)
}

export default function PersonPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { isMobile } = useResponsive()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [credits, setCredits] = useState<CombinedCredits>({ cast: [], crew: [] })
  const [tab, setTab] = useState<RoleTab>('actor')
  const [actorFilter, setActorFilter] = useState<ActorFilter>('lead')
  const [page, setPage] = useState(1)

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

  const movieCast = useMemo(
    () => (credits.cast || []).filter((item) => item.media_type === 'movie' && (item.title || item.name)),
    [credits.cast]
  )

  const movieCrew = useMemo(
    () => (credits.crew || []).filter((item) => item.media_type === 'movie' && (item.title || item.name)),
    [credits.crew]
  )

  const leadCast = useMemo(() => movieCast.filter((item, index) => (item as { order?: number }).order ? Number((item as { order?: number }).order) <= 3 : index < 18), [movieCast])
  const supportCast = useMemo(() => movieCast.filter((item) => !leadCast.some((lead) => lead.id === item.id)), [movieCast, leadCast])

  const hasActor = movieCast.length > 0
  const hasCrew = movieCrew.length > 0

  useEffect(() => {
    if (hasActor) {
      setTab('actor')
      return
    }
    if (hasCrew) setTab('crew')
  }, [hasActor, hasCrew])

  useEffect(() => {
    setPage(1)
  }, [tab, actorFilter])

  const actorItems = actorFilter === 'lead' ? leadCast : supportCast
  const actorPageItems = paginated(actorItems, page)
  const actorTotalPages = Math.max(1, Math.ceil(actorItems.length / 12))

  const crewGroups = groupCrewByDepartment(movieCrew)

  const onSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'grid', placeItems: 'center', fontFamily: SERIF }}>
        <GrainOverlay />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.34 }}>Cargando biografía...</motion.div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: '#ff9d9d', display: 'grid', placeItems: 'center', fontFamily: SANS }}>
        <GrainOverlay />
        {error || 'Persona no encontrada'}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: SANS }}>
      <GrainOverlay />
      <Navbar onNavigateHome={() => navigate('/')} onSearch={onSearch} isMobile={isMobile} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '90px 14px 34px' : '96px 24px 54px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 18 }}
        >
          <ChevronLeft size={14} /> Volver
        </button>

        <section style={{ border: `1px solid ${C.border}`, background: C.surface, padding: isMobile ? 14 : 18, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px minmax(0, 1fr)', gap: 16, marginBottom: 22 }}>
          <div>
            <Img src={personImage(person.profile_path)} alt={person.name} style={{ width: '100%', height: isMobile ? 320 : 420, objectFit: 'cover', border: `1px solid ${C.border}` }} />
          </div>

          <div>
            <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 'clamp(34px, 6vw, 48px)', fontWeight: 400 }}>{person.name}</h1>
            <p style={{ margin: '12px 0 14px', fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, lineHeight: 1.65, color: C.textSoft }}>
              {person.biography || 'Sin biografía disponible.'}
            </p>

            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent }}>Nacimiento</div>
              <div style={{ fontFamily: SERIF, color: C.textSoft }}>{person.birthday || 'Sin dato'}</div>
              <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent }}>Nacionalidad / Lugar</div>
              <div style={{ fontFamily: SERIF, color: C.textSoft }}>{person.place_of_birth || 'Sin dato'}</div>
              <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent }}>Departamento</div>
              <div style={{ fontFamily: SERIF, color: C.textSoft }}>{person.known_for_department || 'Sin dato'}</div>
            </div>
          </div>
        </section>

        {hasActor && hasCrew && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button
              onClick={() => setTab('actor')}
              style={{ border: `1px solid ${tab === 'actor' ? C.accentDim : C.border}`, background: tab === 'actor' ? C.accentGlow : 'transparent', color: tab === 'actor' ? C.accent : C.textSoft, padding: '8px 12px', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer' }}
            >
              Como actor
            </button>
            <button
              onClick={() => setTab('crew')}
              style={{ border: `1px solid ${tab === 'crew' ? C.accentDim : C.border}`, background: tab === 'crew' ? C.accentGlow : 'transparent', color: tab === 'crew' ? C.accent : C.textSoft, padding: '8px 12px', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer' }}
            >
              Como director o crew
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {tab === 'actor' && hasActor && (
            <motion.section key="actor" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.34 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  onClick={() => setActorFilter('lead')}
                  style={{ border: `1px solid ${actorFilter === 'lead' ? C.accentDim : C.border}`, background: actorFilter === 'lead' ? C.accentGlow : 'transparent', color: actorFilter === 'lead' ? C.accent : C.textSoft, padding: '7px 10px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Actor principal
                </button>
                <button
                  onClick={() => setActorFilter('support')}
                  style={{ border: `1px solid ${actorFilter === 'support' ? C.accentDim : C.border}`, background: actorFilter === 'support' ? C.accentGlow : 'transparent', color: actorFilter === 'support' ? C.accent : C.textSoft, padding: '7px 10px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Actor secundario
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
                {actorPageItems.map((item) => {
                  const title = item.title || item.name || 'Sin título'
                  return (
                    <Link key={`actor-${item.id}-${title}`} to={`/movie/${item.id}-${createSlug(title)}`} style={{ border: `1px solid ${C.border}`, background: C.surface, textDecoration: 'none', color: C.text }}>
                      <Img src={personImage(item.poster_path)} alt={title} style={{ width: '100%', height: 220, objectFit: 'cover' }} />
                      <div style={{ padding: 10 }}>
                        <div style={{ fontFamily: SANS, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</div>
                        <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: C.textSoft, marginTop: 4 }}>{item.character || 'Sin rol'}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {actorTotalPages > 1 && (
                <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Array.from({ length: Math.min(actorTotalPages, 8) }, (_, index) => index + 1).map((pageItem) => (
                    <button
                      key={`ap-${pageItem}`}
                      onClick={() => setPage(pageItem)}
                      style={{ border: `1px solid ${page === pageItem ? C.accentDim : C.border}`, background: page === pageItem ? C.accentGlow : 'transparent', color: page === pageItem ? C.accent : C.textSoft, padding: '6px 10px', fontFamily: SANS, fontSize: 11, cursor: 'pointer' }}
                    >
                      {pageItem}
                    </button>
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {tab === 'crew' && hasCrew && (
            <motion.section key="crew" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.34 }}>
              <div style={{ display: 'grid', gap: 16 }}>
                {crewGroups.map(([department, items]) => (
                  <div key={department}>
                    <h2 style={{ margin: '0 0 8px', fontFamily: SERIF, fontSize: 30, fontWeight: 400 }}>{department}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
                      {items.slice(0, 16).map((item) => {
                        const title = item.title || item.name || 'Sin título'
                        return (
                          <Link key={`crew-${department}-${item.id}-${title}`} to={`/movie/${item.id}-${createSlug(title)}`} style={{ border: `1px solid ${C.border}`, background: C.surface, textDecoration: 'none', color: C.text }}>
                            <Img src={personImage(item.poster_path)} alt={title} style={{ width: '100%', height: 220, objectFit: 'cover' }} />
                            <div style={{ padding: 10 }}>
                              <div style={{ fontFamily: SANS, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</div>
                              <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: C.textSoft, marginTop: 4 }}>{item.job || 'Crew'}</div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* TODO: reemplazar con API cuando exista endpoint dedicado de filmcards/persona paginadas del backend */}
      </main>
    </div>
  )
}
