import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
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
  vote_average?: number
  popularity?: number
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

  const knownForTop = useMemo(() => {
    const unique = new Map<number, CreditItem>()
    movieCast.forEach((item) => {
      if (!unique.has(item.id)) unique.set(item.id, item)
    })
    movieCrew.forEach((item) => {
      if (!unique.has(item.id)) unique.set(item.id, item)
    })

    return Array.from(unique.values())
      .sort((a, b) => Number(b.vote_average || b.popularity || 0) - Number(a.vote_average || a.popularity || 0))
      .slice(0, 3)
  }, [movieCast, movieCrew])

  const onSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  if (loading) {
    return (
      <div className="person-page-loading">
        <GrainOverlay />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.34 }}>Cargando biografía...</motion.div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="person-page-error">
        <GrainOverlay />
        {error || 'Persona no encontrada'}
      </div>
    )
  }

  return (
    <div className="person-page-container">
      <GrainOverlay />
      <Navbar onNavigateHome={() => navigate('/')} onSearch={onSearch} />

      <main className="person-page-main">
        <button
          onClick={() => navigate(-1)}
          className="back-button"
        >
          <ChevronLeft size={14} /> Volver
        </button>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <section className="person-detail-layout">
              <div>
                <Img src={personImage(person.profile_path)} alt={person.name} className="person-profile-image" />
              </div>

              <div>
                <h1 className="person-name">{person.name}</h1>
                <p className="person-biography">
                  {person.biography || 'Sin biografía disponible.'}
                </p>

                <div className="person-info-grid">
                  <div className="person-info-label">Nacimiento</div>
                  <div className="person-info-value">{person.birthday || 'Sin dato'}</div>
                  <div className="person-info-label">Nacionalidad / Lugar</div>
                  <div className="person-info-value">{person.place_of_birth || 'Sin dato'}</div>
                  <div className="person-info-label">Departamento</div>
                  <div className="person-info-value">{person.known_for_department || 'Sin dato'}</div>
                </div>

                <div className="person-metrics-grid">
                  <article className="person-metric-card">
                    <div className="person-metric-label">Acting credits</div>
                    <div className="person-metric-value">{movieCast.length}</div>
                  </article>
                  <article className="person-metric-card">
                    <div className="person-metric-label">Crew credits</div>
                    <div className="person-metric-value">{movieCrew.length}</div>
                  </article>
                  <article className="person-metric-card">
                    <div className="person-metric-label">Known for</div>
                    <div className="person-metric-list">
                      {knownForTop.length === 0
                        ? 'Sin títulos destacados'
                        : knownForTop.map((item) => item.title || item.name || 'Sin título').join(' · ')}
                    </div>
                  </article>
                </div>
              </div>
            </section>
          </motion.div>
        </AnimatePresence>

        {hasActor && hasCrew && (
          <div className="role-tabs">
            <button
              onClick={() => setTab('actor')}
              className={`tab-button ${tab === 'actor' ? 'active' : ''}`}
            >
              Como actor
            </button>
            <button
              onClick={() => setTab('crew')}
              className={`tab-button ${tab === 'crew' ? 'active' : ''}`}
            >
              Como director o crew
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {tab === 'actor' && hasActor && (
            <motion.section key="actor" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.34 }}>
              <div className="actor-filter-buttons">
                <button
                  onClick={() => setActorFilter('lead')}
                  className={`filter-button ${actorFilter === 'lead' ? 'active' : ''}`}
                >
                  Actor principal
                </button>
                <button
                  onClick={() => setActorFilter('support')}
                  className={`filter-button ${actorFilter === 'support' ? 'active' : ''}`}
                >
                  Actor secundario
                </button>
              </div>

              <div className="person-credits-grid">
                {actorPageItems.map((item) => {
                  const title = item.title || item.name || 'Sin título'
                  return (
                    <Link key={`actor-${item.id}-${title}`} to={`/movie/${item.id}-${createSlug(title)}`} className="credit-card">
                      <Img src={personImage(item.poster_path)} alt={title} className="credit-card-image" />
                      <div className="credit-card-info">
                        <div className="credit-card-title">{title}</div>
                        <div className="credit-card-role">{item.character || 'Sin rol'}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {actorTotalPages > 1 && (
                <div className="pagination-controls">
                  {Array.from({ length: Math.min(actorTotalPages, 8) }, (_, index) => index + 1).map((pageItem) => (
                    <button
                      key={`ap-${pageItem}`}
                      onClick={() => setPage(pageItem)}
                      className={`pagination-button ${page === pageItem ? 'active' : ''}`}
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
              <div className="crew-departments">
                {crewGroups.map(([department, items]) => (
                  <div key={department}>
                    <h2 className="crew-department-title">{department}</h2>
                    <div className="person-credits-grid">
                      {items.slice(0, 16).map((item) => {
                        const title = item.title || item.name || 'Sin título'
                        return (
                          <Link key={`crew-${department}-${item.id}-${title}`} to={`/movie/${item.id}-${createSlug(title)}`} className="credit-card">
                            <Img src={personImage(item.poster_path)} alt={title} className="credit-card-image" />
                            <div className="credit-card-info">
                              <div className="credit-card-title">{title}</div>
                              <div className="credit-card-role">{item.job || 'Crew'}</div>
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
