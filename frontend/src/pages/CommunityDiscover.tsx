import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Flame, Star, Users } from 'lucide-react'

const C = {
  bg: '#080808',
  surface: '#111111',
  elevated: '#1A1A1A',
  border: '#252525',
  accent: '#D4AF7A',
  text: '#E2E2E2',
  textSoft: '#7A7A7A',
} as const

const SANS = "'Syne', sans-serif"
const SERIF = "'Cormorant Garamond', serif"

type DiscoverItem = {
  id: string
  title: string
  subtitle: string
  metric: string
  href: string
}

const trendingItems: DiscoverItem[] = [
  { id: 't1', title: 'Stalker', subtitle: 'Tarkovsky vuelve a dominar el feed', metric: '4.8k menciones', href: '/movie/1398-stalker' },
  { id: 't2', title: 'In the Mood for Love', subtitle: 'Sube entre reseñas destacadas', metric: '3.9k menciones', href: '/movie/843-in-the-mood-for-love' },
  { id: 't3', title: 'Persona', subtitle: 'Top de rewatch semanal', metric: '3.1k menciones', href: '/movie/797-persona' },
]

const popularItems: DiscoverItem[] = [
  { id: 'p1', title: 'Lista: Neo-noir para una maratón', subtitle: 'Curada por @cinevault', metric: '12.4k guardados', href: '/lists' },
  { id: 'p2', title: 'Top directores de culto', subtitle: 'Actividad alta en comunidad', metric: '9.2k guardados', href: '/lists' },
  { id: 'p3', title: 'Arco: Cine y memoria', subtitle: 'Más completado del mes', metric: '7.7k guardados', href: '/arcos' },
]

const followedItems: DiscoverItem[] = [
  { id: 'f1', title: '@martinareyes', subtitle: 'Publicó 2 reseñas nuevas', metric: '1.2k seguidores', href: '/martinareyes' },
  { id: 'f2', title: '@cinefilonight', subtitle: 'Nuevo hilo en Vault', metric: '980 seguidores', href: '/cinefilonight' },
  { id: 'f3', title: '@framesandvoid', subtitle: 'Curó galería semanal', metric: '840 seguidores', href: '/framesandvoid' },
]

function DiscoverSection({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: DiscoverItem[]
}) {
  return (
    <section style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: C.accent, fontFamily: SANS, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {icon}
        {title}
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            style={{
              textDecoration: 'none',
              border: `1px solid ${C.border}`,
              background: C.elevated,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontFamily: SERIF, fontSize: 21, color: C.text, marginBottom: 3 }}>{item.title}</div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: C.textSoft, marginBottom: 6 }}>{item.subtitle}</div>
            <div style={{ fontFamily: SANS, fontSize: 10, color: C.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.metric}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function CommunityDiscoverPage() {
  const { pathname } = useLocation()

  const title = useMemo(() => {
    if (pathname === '/lists') return 'Discover · Listas de la Comunidad'
    return 'Discover · Vault de la Comunidad'
  }, [pathname])

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: '86px 16px 36px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <Link to="/vault" style={{ textDecoration: 'none', border: `1px solid ${C.border}`, padding: '7px 11px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: pathname === '/vault' ? C.accent : C.textSoft }}>
            Vault
          </Link>
          <Link to="/lists" style={{ textDecoration: 'none', border: `1px solid ${C.border}`, padding: '7px 11px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: pathname === '/lists' ? C.accent : C.textSoft }}>
            Lists
          </Link>
        </div>

        <h1 style={{ margin: '0 0 18px', fontFamily: SERIF, fontSize: 'clamp(34px,5vw,54px)', fontWeight: 400 }}>{title}</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <DiscoverSection title="Trending" icon={<Flame size={14} />} items={trendingItems} />
          <DiscoverSection title="Populares" icon={<Star size={14} />} items={popularItems} />
          <DiscoverSection title="Más Seguidas" icon={<Users size={14} />} items={followedItems} />
        </div>
      </div>
    </main>
  )
}
