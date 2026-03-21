import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { Star, Clock, Users, ChevronRight } from 'lucide-react'
import { fetchArcos, type ArcoSummary } from '../services/arcosServices'

const C = {
  bg: '#080808',
  surface: '#111111',
  border: '#2A2A2A',
  accent: '#D4AF7A',
  accentDim: '#9A7A48',
  text: '#E2E2E2',
  textSoft: '#7A7A7A',
  textMuted: '#3A3A3A',
  gold: '#C8A96E',
} as const

const SERIF = "'Playfair Display', 'Cormorant Garamond', serif"
const SANS = "'Syne', sans-serif"

type FilterLevel = 'TODOS' | 'INICIACION' | 'INTERMEDIO' | 'AVANZADO' | 'OFICIALES'

type ViewArco = ArcoSummary & {
  posters: string[]
  hours: number
}

const POSTERS = [
  'https://images.unsplash.com/photo-1563941433-b6a094653ed2?w=400&q=80',
  'https://images.unsplash.com/photo-1706460400799-bd339797d306?w=400&q=80',
  'https://images.unsplash.com/photo-1761502479994-3a5e07ec243e?w=400&q=80',
  'https://images.unsplash.com/photo-1769121803735-59cde1085231?w=400&q=80',
  'https://images.unsplash.com/photo-1670782128814-c5a55b68f50d?w=400&q=80',
  'https://images.unsplash.com/photo-1762541693135-fb989de961e1?w=400&q=80',
  'https://images.unsplash.com/photo-1761429944940-fe98ec7ba4cb?w=400&q=80',
  'https://images.unsplash.com/photo-1753731622675-56904104f4a9?w=400&q=80',
]

const normalizeLevel = (raw: string) => {
  const plain = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()

  if (plain.includes('INICI')) return 'INICIACION'
  if (plain.includes('INTER')) return 'INTERMEDIO'
  return 'AVANZADO'
}

const postersForArco = (id: number) => {
  const base = id % POSTERS.length
  return [
    POSTERS[base],
    POSTERS[(base + 1) % POSTERS.length],
    POSTERS[(base + 2) % POSTERS.length],
    POSTERS[(base + 3) % POSTERS.length],
  ]
}

function StackedPosters({ posters }: { posters: string[] }) {
  return (
    <div style={{ position: 'relative', width: 80, height: 114, flexShrink: 0 }}>
      {posters.slice(0, 3).map((src, i) => {
        const idx = posters.slice(0, 3).length - 1 - i
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: (2 - idx) * 5,
              left: (2 - idx) * 5,
              width: 68,
              height: 96,
              zIndex: idx + 1,
              border: `2px solid ${C.bg}`,
              transform: `rotate(${(idx - 1) * 4}deg)`,
              overflow: 'hidden',
              boxShadow: '0 3px 12px rgba(0,0,0,0.7)',
            }}
          >
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )
      })}
    </div>
  )
}

function ArcoCard({ arco, delay }: { arco: ViewArco; delay: number }) {
  const [hov, setHov] = useState(false)
  const normalized = normalizeLevel(arco.level)
  const levelColor: Record<'INICIACION' | 'INTERMEDIO' | 'AVANZADO', string> = {
    INICIACION: '#5C8A6B',
    INTERMEDIO: '#8A7A5C',
    AVANZADO: C.accent,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <Link to={`/arcos/${arco.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{
            background: C.surface,
            border: `1px solid ${hov ? C.accentDim : C.border}`,
            padding: '24px 22px',
            cursor: 'pointer',
            transform: hov ? 'translateY(-4px)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: hov ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {hov && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: C.accent, opacity: 0.6 }} />}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 18 }}>
            <StackedPosters posters={arco.posters} />
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 8,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: levelColor[normalized],
                    border: `1px solid ${levelColor[normalized]}`,
                    padding: '2px 8px',
                    fontFamily: SANS,
                  }}
                >
                  {normalized}
                </span>
                {arco.official && (
                  <span
                    style={{
                      fontSize: 8,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: C.gold,
                      border: `1px solid ${C.gold}`,
                      padding: '2px 8px',
                      fontFamily: SANS,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <Star size={7} fill={C.gold} /> OFICIAL
                  </span>
                )}
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 18, color: C.text, lineHeight: 1.3, marginBottom: 6 }}>{arco.title}</div>
            </div>
          </div>

          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, color: C.textSoft, lineHeight: 1.65, marginBottom: 16 }}>
            {arco.description || 'Arco editorial en construccion.'}
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill={C.textMuted}>
                <rect x="1" y="2" width="10" height="14" rx="1" />
                <rect x="5" y="1" width="10" height="14" rx="1" fill={C.textMuted} opacity="0.5" />
              </svg>
              {arco.films} peliculas
            </span>
            <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={10} color={C.textMuted} /> {arco.hours}h
            </span>
            <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={10} color={C.textMuted} /> {arco.usersCompleted.toLocaleString('es')}
            </span>
          </div>

          <div
            style={{
              position: 'absolute',
              top: 22,
              right: 18,
              opacity: hov ? 1 : 0,
              transition: 'opacity 0.2s, transform 0.2s',
              transform: hov ? 'translateX(0)' : 'translateX(-4px)',
            }}
          >
            <ChevronRight size={16} color={C.accent} />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function Arcos() {
  const [activeFilter, setActiveFilter] = useState<FilterLevel>('TODOS')
  const [arcos, setArcos] = useState<ViewArco[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const filters: FilterLevel[] = ['TODOS', 'INICIACION', 'INTERMEDIO', 'AVANZADO', 'OFICIALES']

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const rows = await fetchArcos()
        if (!active) return

        const next = rows.map((row) => ({
          ...row,
          posters: postersForArco(row.id),
          hours: Math.max(2, Math.round((row.films || 1) * 2.2)),
        }))

        setArcos(next)
      } catch {
        if (active) {
          setError('No se pudo cargar Arcos en este momento.')
          setArcos([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(
    () =>
      arcos.filter((a) => {
        if (activeFilter === 'TODOS') return true
        if (activeFilter === 'OFICIALES') return a.official
        return normalizeLevel(a.level) === activeFilter
      }),
    [arcos, activeFilter]
  )

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(8,8,8,0.97)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${C.border}`,
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
        }}
      >
        <Link to="/" style={{ fontFamily: SERIF, fontSize: 18, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text, textDecoration: 'none' }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </Link>
        <div style={{ width: 80 }} />
      </nav>

      <div style={{ padding: '64px 48px 0', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 400, color: C.text, lineHeight: 1, marginBottom: 12, letterSpacing: '-0.02em' }}>Arcos</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 20, color: C.textSoft, marginBottom: 8 }}>Rutas de formacion. No listas.</div>
          <div style={{ fontSize: 13, color: C.textMuted, fontFamily: SANS, maxWidth: 600, lineHeight: 1.7 }}>
            Cada arco es una secuencia pensada. El orden importa. El contexto importa.
          </div>
        </motion.div>
      </div>

      <div style={{ padding: '36px 48px 0', maxWidth: 1200, margin: '0 auto', marginBottom: 40, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '14px 22px',
                background: 'none',
                border: 'none',
                borderBottom: activeFilter === f ? `2px solid ${C.accent}` : '2px solid transparent',
                color: activeFilter === f ? C.text : C.textSoft,
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                marginBottom: -1,
                transition: 'all 0.2s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px 80px' }}>
        {loading && <div style={{ color: C.textSoft, marginBottom: 12 }}>Cargando arcos...</div>}
        {error && <div style={{ color: '#C97B7B', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map((arco, i) => (
            <ArcoCard key={arco.id} arco={arco} delay={i * 0.06} />
          ))}
        </div>
      </div>
    </div>
  )
}
