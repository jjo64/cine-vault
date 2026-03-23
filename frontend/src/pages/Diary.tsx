/**
 * CineVault — Diario Cinematográfico (/diary)
 * Con componente de Doble Función / Sesión Triple / Maratón.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createSlug } from '../utils/stringUtils';
import { fetchSearchMovies } from '../services/movieDetailServices';
import './Diary.css';

// ─── PALETTE ─────────────────────────────────────────────────
const C = {
  bg:         '#080808',
  surface:    '#111111',
  elevated:   '#1A1A1A',
  border:     '#2A2A2A',
  accent:     '#D4AF7A',
  accentDim:  '#9A7A48',
  accentGlow: 'rgba(212,175,122,0.15)',
  text:       '#E2E2E2',
  textSoft:   '#7A7A7A',
  textMuted:  '#3A3A3A',
  gold:       '#C8A96E',
} as const;

const SERIF = "'Playfair Display', 'Cormorant Garamond', serif";
const SANS  = "'Syne', sans-serif";

// ─── TYPES ───────────────────────────────────────────────────
type SessionType = 'single' | 'double' | 'triple' | 'marathon';

interface FilmEntry {
  id:       number;
  title:    string;
  year:     number;
  director: string;
  poster:   string;
  rating:   number;
}

interface DiarySession {
  id:        number;
  date:      string;
  dateISO:   string;
  type:      SessionType;
  films:     FilmEntry[];
  note?:     string;
  mood?:     string;
  stage?:    string;
  hasOrder:  boolean;
}

type SearchEntryResult = {
  id: number;
  title?: string;
  name?: string;
  media_type?: 'movie' | 'tv' | 'person';
};

// ─── IMAGE HELPER ─────────────────────────────────────────────
function Img({ src, alt, style, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = useState(false);
  if (err) return <div style={{ ...style, background: '#1a1a1a' }} />;
  return <img src={src} alt={alt} style={style} onError={() => setErr(true)} {...rest} />;
}

function GrainOverlay() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.3 }} />
  );
}

// ─── MOCK DATA ───────────────────────────────────────────────
const I = {
  fog:      'https://images.unsplash.com/photo-1563941433-b6a094653ed2?w=300&q=80',
  filmNoir: 'https://images.unsplash.com/photo-1706460400799-bd339797d306?w=300&q=80',
  night:    'https://images.unsplash.com/photo-1670782128814-c5a55b68f50d?w=300&q=80',
  italy:    'https://images.unsplash.com/photo-1753731622675-56904104f4a9?w=300&q=80',
  hongKong: 'https://images.unsplash.com/photo-1742695760180-92c9a73ffdf2?w=300&q=80',
  forest:   'https://images.unsplash.com/photo-1759360383439-c3fdf352f1b6?w=300&q=80',
  grain:    'https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=300&q=80',
  misty:    'https://images.unsplash.com/photo-1763713441172-37ed2f89b256?w=300&q=80',
  desolate: 'https://images.unsplash.com/photo-1691573252567-6c1be35aae79?w=300&q=80',
  projector:'https://images.unsplash.com/photo-1762541693135-fb989de961e1?w=300&q=80',
};

const SESSIONS: DiarySession[] = [
  // SINGLE
  {
    id: 1, date: '15 de marzo, 2025', dateISO: '2025-03-15', type: 'single', hasOrder: false,
    mood: 'contemplativo', stage: 'Noche de domingo',
    films: [{ id: 1, title: 'Stalker', year: 1979, director: 'Tarkovsky', poster: I.fog, rating: 5 }],
    note: 'Lo vi solo, de noche, en silencio. La Zona era yo.',
  },
  // DOBLE FUNCIÓN
  {
    id: 2, date: '8 de marzo, 2025', dateISO: '2025-03-08', type: 'double', hasOrder: true,
    mood: 'melancólico', stage: 'Fin de semana largo',
    films: [
      { id: 2, title: 'In the Mood for Love', year: 2000, director: 'Wong Kar-wai', poster: I.hongKong, rating: 5 },
      { id: 3, title: '2046',                 year: 2004, director: 'Wong Kar-wai', poster: I.night,    rating: 4 },
    ],
    note: 'Las vi seguidas. La segunda es la resaca de la primera — el amor que ya no es posible, recordado desde el futuro.',
  },
  // SESIÓN TRIPLE — Lars von Trier
  {
    id: 3, date: '22 de febrero, 2025', dateISO: '2025-02-22', type: 'triple', hasOrder: true,
    mood: 'perturbado', stage: 'Fin de relación',
    films: [
      { id: 4, title: 'Anticristo',  year: 2009, director: 'Lars von Trier', poster: I.forest,  rating: 4 },
      { id: 5, title: 'Melancolía',  year: 2011, director: 'Lars von Trier', poster: I.desolate, rating: 5 },
      { id: 6, title: 'Nymphomaniac', year: 2013, director: 'Lars von Trier', poster: I.grain,  rating: 4 },
    ],
    note: 'No lo recomiendo. O sí. Depende de en qué estado estás. Yo estaba en el estado correcto.',
  },
  // MARATÓN
  {
    id: 4, date: '1 de enero, 2025', dateISO: '2025-01-01', type: 'marathon', hasOrder: false,
    mood: 'nostálgico', stage: 'Año nuevo',
    films: [
      { id: 7, title: 'La Dolce Vita',          year: 1960, director: 'Fellini',     poster: I.italy,     rating: 4 },
      { id: 8, title: 'Amarcord',               year: 1973, director: 'Fellini',     poster: I.projector, rating: 4 },
      { id: 9, title: '8½',                     year: 1963, director: 'Fellini',     poster: I.filmNoir,  rating: 5 },
      { id: 10, title: 'Noches de Cabiria',     year: 1957, director: 'Fellini',     poster: I.misty,     rating: 4 },
    ],
    note: 'Empecé el año con Fellini y entendí que toda su obra es el mismo sueño con distintos trajes.',
  },
  // SINGLE
  {
    id: 5, date: '18 de diciembre, 2024', dateISO: '2024-12-18', type: 'single', hasOrder: false,
    mood: 'eufórico', stage: 'Fin de año',
    films: [{ id: 11, title: 'Mulholland Dr.', year: 2001, director: 'Lynch', poster: I.night, rating: 5 }],
    note: 'Quinta vez. Cada vez entiendo menos y la quiero más.',
  },
];

// ─── SESSION BADGE ───────────────────────────────────────────
const SESSION_LABELS: Record<SessionType, string | null> = {
  single:   null,
  double:   'DOBLE FUNCIÓN',
  triple:   'SESIÓN TRIPLE',
  marathon: 'MARATÓN',
};

function Stars({ rating, size = 10 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 12 12" fill={i < rating ? C.gold : C.textMuted}>
          <path d="M6 1l1.3 2.6L10 4l-2 2 .5 2.8L6 7.5 3.5 8.8 4 6 2 4l2.7-.4z"/>
        </svg>
      ))}
    </div>
  );
}

// ─── ABANICO DE POSTERS ───────────────────────────────────────
function PosterFan({ films, type }: { films: FilmEntry[]; type: SessionType }) {
  const count = films.length;
  const posterW = type === 'marathon' ? 60 : 72;
  const posterH = type === 'marathon' ? 86 : 102;

  // Rotation and offset configs per count
  const transforms: Record<number, { rotate: number; tx: number; ty: number; z: number }[]> = {
    1: [{ rotate: 0,  tx: 0,  ty: 0,  z: 1 }],
    2: [
      { rotate: -6, tx: -12, ty: 4,  z: 1 },
      { rotate:  6, tx:  12, ty: 4,  z: 2 },
    ],
    3: [
      { rotate: -8, tx: -20, ty: 6,  z: 1 },
      { rotate:  0, tx:   0, ty: 0,  z: 3 },
      { rotate:  8, tx:  20, ty: 6,  z: 2 },
    ],
    4: [
      { rotate: -12, tx: -28, ty: 10, z: 1 },
      { rotate:  -4, tx:  -9, ty: 3,  z: 2 },
      { rotate:   4, tx:   9, ty: 3,  z: 3 },
      { rotate:  12, tx:  28, ty: 10, z: 4 },
    ],
  };

  const configs = transforms[Math.min(count, 4)] ?? transforms[4];
  const containerW = posterW + 80;

  return (
    <div style={{ position: 'relative', width: containerW + 40, height: posterH + 24, flexShrink: 0 }}>
      {films.slice(0, 4).map((film, i) => {
        const cfg = configs[i] ?? configs[configs.length - 1];
        return (
          <div key={film.id} style={{
            position: 'absolute',
            top: cfg.ty,
            left: '50%',
            width: posterW, height: posterH,
            marginLeft: -(posterW / 2) + cfg.tx,
            zIndex: cfg.z,
            transform: `rotate(${cfg.rotate}deg)`,
            border: '2px solid #0A0A0A',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
            transition: 'transform 0.3s',
          }}>
            <Img src={film.poster} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.65)' }} />
          </div>
        );
      })}
    </div>
  );
}

// ─── SESSION CARD ────────────────────────────────────────────
function SessionCard({ session, delay }: { session: DiarySession; delay: number }) {
  const [hov, setHov] = useState(false);
  const label = SESSION_LABELS[session.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.55 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hov ? C.accentDim : C.border}`,
        padding: '24px 28px',
        transition: 'border-color 0.3s, transform 0.3s, box-shadow 0.3s',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
        position: 'relative', overflow: 'hidden',
      }}>
      {/* Badge */}
      {label && (
        <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, border: `1px solid ${C.accentDim}`, padding: '3px 10px', fontFamily: SANS, background: C.bg }}>
          {label}
        </div>
      )}

      <div className="diary-session-layout" style={{ paddingTop: label ? 28 : 0 }}>
        {/* Abanico */}
        <PosterFan films={session.films} type={session.type} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Date */}
          <div className="diary-session-date-col" style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, marginBottom: 12, letterSpacing: '0.1em' }}>{session.date}</div>

          {/* Film titles */}
          <div style={{ fontFamily: SERIF, fontSize: 18, color: C.text, lineHeight: 1.4, marginBottom: 8 }}>
            {session.films.map((f, i) => (
              <span key={f.id}>
                {f.title}
                {i < session.films.length - 1 && <span style={{ color: C.textMuted, margin: '0 6px' }}>·</span>}
              </span>
            ))}
          </div>

          {/* Per-film ratings */}
          <div className="diary-session-films" style={{ marginBottom: 12 }}>
            {session.films.map(f => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, whiteSpace: 'nowrap' }}>{f.title.length > 14 ? f.title.slice(0, 14) + '…' : f.title}</span>
                <Stars rating={f.rating} size={9} />
              </div>
            ))}
          </div>

          {/* Mood + stage badges */}
          {(session.mood || session.stage) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {session.mood && <span style={{ fontSize: 10, padding: '3px 10px', border: `1px solid rgba(212,175,122,0.3)`, color: C.accent, fontFamily: SANS, letterSpacing: '0.1em' }}>{session.mood}</span>}
              {session.stage && <span style={{ fontSize: 10, padding: '3px 10px', border: `1px solid ${C.border}`, color: C.textSoft, fontFamily: SANS }}>{session.stage}</span>}
              {session.hasOrder && <span style={{ fontSize: 10, padding: '3px 10px', border: `1px solid ${C.border}`, color: C.textMuted, fontFamily: SANS }}>Con orden de visionado</span>}
            </div>
          )}

          {/* Note */}
          {session.note && (
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 15, color: C.textSoft, lineHeight: 1.7 }}>
              "{session.note}"
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────
export function Diary() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SessionType | 'TODO'>('TODO');
  const [isEntrySearchOpen, setIsEntrySearchOpen] = useState(false);
  const [entryQuery, setEntryQuery] = useState('');
  const [debouncedEntryQuery, setDebouncedEntryQuery] = useState('');
  const [entryResults, setEntryResults] = useState<SearchEntryResult[]>([]);
  const [entrySearching, setEntrySearching] = useState(false);
  const filters: Array<SessionType | 'TODO'> = ['TODO', 'single', 'double', 'triple', 'marathon'];
  const filterLabels: Record<string, string> = { 'TODO': 'Todo', 'single': 'Individual', 'double': 'Doble función', 'triple': 'Sesión triple', 'marathon': 'Maratón' };

  const filtered = filter === 'TODO' ? SESSIONS : SESSIONS.filter(s => s.type === filter);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedEntryQuery(entryQuery.trim());
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [entryQuery]);

  useEffect(() => {
    if (!isEntrySearchOpen || !debouncedEntryQuery) {
      setEntryResults([]);
      setEntrySearching(false);
      return;
    }

    let cancelled = false;
    setEntrySearching(true);

    fetchSearchMovies(debouncedEntryQuery)
      .then((response) => {
        if (cancelled) return;
        const nextResults = (response.results || [])
          .filter((item) => item.media_type !== 'person')
          .slice(0, 6);
        setEntryResults(nextResults);
      })
      .catch(() => {
        if (!cancelled) setEntryResults([]);
      })
      .finally(() => {
        if (!cancelled) setEntrySearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedEntryQuery, isEntrySearchOpen]);

  const handleSelectEntry = (item: SearchEntryResult) => {
    const label = item.title || item.name || 'sin-titulo';
    if (item.media_type === 'tv') {
      navigate(`/tv/${item.id}`);
      return;
    }

    navigate(`/movie/${item.id}-${createSlug(label)}?entry=1`);
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS }}>
      <GrainOverlay />

      {/* Navbar */}
      <nav className="diary-navbar" style={{ borderBottom: `1px solid ${C.border}`, gap: 20 }}>
        <Link to="/profile" style={{ color: C.textSoft, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: SANS }}>
          <ArrowLeft size={13} /> Perfil
        </Link>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: SERIF, fontSize: 18, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setIsEntrySearchOpen((prev) => !prev)} style={{ background: C.accent, border: 'none', color: C.bg, padding: '7px 14px', fontFamily: SANS, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={11} /> Nueva entrada
          </button>

          {isEntrySearchOpen && (
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 320, border: `1px solid ${C.border}`, background: C.surface, boxShadow: '0 18px 36px rgba(0,0,0,0.45)', padding: 10 }}>
              <input
                value={entryQuery}
                onChange={(event) => setEntryQuery(event.target.value)}
                autoFocus
                placeholder="Buscar película o serie..."
                style={{ width: '100%', border: `1px solid ${C.border}`, background: C.bg, color: C.text, padding: '10px 12px', fontFamily: SANS, fontSize: 12, outline: 'none' }}
              />
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {entrySearching && <div style={{ color: C.textSoft, fontSize: 11, fontFamily: SANS }}>Buscando...</div>}
                {!entrySearching && debouncedEntryQuery && entryResults.length === 0 && (
                  <div style={{ color: C.textSoft, fontSize: 11, fontFamily: SANS }}>No hay resultados.</div>
                )}
                {entryResults.map((item) => {
                  const title = item.title || item.name || 'Sin título';
                  return (
                    <button
                      key={`${item.media_type || 'movie'}-${item.id}`}
                      onClick={() => handleSelectEntry(item)}
                      style={{
                        border: `1px solid ${C.border}`,
                        background: C.elevated,
                        color: C.text,
                        padding: '10px 12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: SANS,
                      }}
                    >
                      <div style={{ fontSize: 12 }}>{title}</div>
                      <div style={{ fontSize: 10, color: C.textSoft, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {item.media_type === 'tv' ? 'Serie' : 'Película'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="diary-main" style={{ paddingTop: 56 }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 400, color: C.text, lineHeight: 1, marginBottom: 14, letterSpacing: '-0.02em' }}>Diario</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: C.textSoft, marginBottom: 8 }}>Autobiografía en películas.</div>
          <div style={{ fontSize: 13, color: C.textMuted, fontFamily: SANS, lineHeight: 1.7, maxWidth: 560 }}>
            No es un historial. Es el registro de cuándo viste qué y con qué estado de ánimo. Las Dobles Funciones y Maratones tienen su propio formato.
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="diary-main" style={{ paddingTop: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 40 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '12px 18px', background: 'none', border: 'none',
              borderBottom: filter === f ? `2px solid ${C.accent}` : '2px solid transparent',
              color: filter === f ? C.text : C.textSoft,
              fontFamily: SANS, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
              cursor: 'pointer', marginBottom: -1, transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>{filterLabels[f]}</button>
          ))}
        </div>
      </div>

      {/* Sessions */}
      <div className="diary-main" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Demo label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS }}>Marzo 2025</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {filtered.map((session, i) => {
          const isNewMonth = i > 0 && new Date(session.dateISO).getMonth() !== new Date(filtered[i - 1].dateISO).getMonth();
          return (
            <div key={session.id}>
              {isNewMonth && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 8px' }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS }}>
                    {new Date(session.dateISO).toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
                  </span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>
              )}
              <SessionCard session={session} delay={i * 0.07} />
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: SERIF, fontStyle: 'italic', fontSize: 20, color: C.textSoft }}>
            Todavía no tenés entradas de este tipo.
          </div>
        )}
      </div>
    </div>
  );
}
