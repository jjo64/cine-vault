/**
 * CineVault — Las películas que todos vieron. Supuestamente. (/mentiras)
 * Humor e honestidad comunitaria sobre qué películas nadie realmente terminó.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

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
interface ShameFilm {
  id:           number;
  title:        string;
  director:     string;
  year:         number;
  poster:       string;
  shamePct:     number;
  confession:   string;
  voterCount:   number;
}

interface SurprisingFilm {
  id:          number;
  title:       string;
  director:    string;
  year:        number;
  poster:      string;
  finishRate:  number;
  note:        string;
}

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


// ─── SHAME BAR ───────────────────────────────────────────────
function ShameFilmRow({ film, rank, delay, admitted, onToggle }: { film: ShameFilm; rank: number; delay: number; admitted: boolean; onToggle: () => void }) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.5 }}
      style={{ borderBottom: `1px solid ${C.border}`, padding: '22px 0' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ display: 'grid', gridTemplateColumns: '52px 64px 1fr auto', gap: 20, alignItems: 'flex-start' }}>
        {/* Rank */}
        <div style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: hov ? C.accentDim : C.textMuted, lineHeight: 1, transition: 'color 0.3s', paddingTop: 6 }}>
          {String(rank).padStart(2, '0')}
        </div>

        {/* Poster */}
        <div style={{ width: 56, height: 80, borderRadius: 1, overflow: 'hidden', border: `1px solid ${C.border}`, flexShrink: 0 }}>
          <Img src={film.poster} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.5) brightness(0.7)' }} />
        </div>

        {/* Info + bar */}
        <div style={{ paddingTop: 2 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SERIF, fontSize: 20, color: C.text }}>{film.title}</span>
            <span style={{ fontSize: 11, color: C.accent, fontFamily: SANS }}>{film.director}, {film.year}</span>
          </div>
          {/* Shame bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1, maxWidth: 400, height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${film.shamePct}%` }}
                transition={{ duration: 1, delay: delay + 0.3, ease: 'easeOut' }}
                style={{ height: '100%', background: C.accent, borderRadius: 2 }}
              />
            </div>
            <span style={{ fontFamily: SERIF, fontSize: 22, color: C.accent, lineHeight: 1, flexShrink: 0 }}>{film.shamePct}%</span>
            <span style={{ fontSize: 10, color: C.textMuted, fontFamily: SANS, flexShrink: 0 }}>admite no haberla terminado</span>
          </div>
          {/* Confession */}
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.textSoft, lineHeight: 1.65, maxWidth: 560 }}>
            {film.confession}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: C.textMuted, fontFamily: SANS }}>{film.voterCount.toLocaleString('es')} votos</div>
        </div>

        {/* Yo también */}
        <div style={{ paddingTop: 6, flexShrink: 0 }}>
          <button
            onClick={onToggle}
            style={{
              padding: '8px 14px',
              background: admitted ? C.elevated : 'transparent',
              color: admitted ? C.accent : C.textSoft,
              border: `1px solid ${admitted ? C.accentDim : C.border}`,
              fontFamily: SANS, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
            {admitted ? <><Check size={9} /> Admitido</> : 'Yo también'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── CONFESSION CARD ─────────────────────────────────────────
function UserConfessionCard({ count }: { count: number }) {
  const voices: Record<string, string> = {
    '0': 'Mentira. Nadie es tan disciplinado.',
    '1-3': 'Honestidad admirable. O buena memoria.',
    '4+': 'Gracias por tu honestidad. El cine te perdona.',
  };
  const key = count === 0 ? '0' : count <= 3 ? '1-3' : '4+';

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.accentDim}`, borderLeft: `3px solid ${C.accent}`, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 200, height: '100%', background: `linear-gradient(90deg, ${C.accentGlow}, transparent)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.accent, fontFamily: SANS, marginBottom: 10 }}>Tu confesión</div>
        <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: C.text, lineHeight: 1, marginBottom: 12 }}>
          {count} {count === 1 ? 'película' : 'películas'} de la lista
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: C.textSoft, lineHeight: 1.5 }}>
          {voices[key]}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────
export function Mentiras() {
  const [ranking, setRanking] = useState<ShameFilm[]>([]);
  const [completedRanking, setCompletedRanking] = useState<SurprisingFilm[]>([]);
  const [admissions, setAdmissions] = useState<Set<number>>(new Set());
  const [showSurprising, setShowSurprising] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiUrl}/api/mentiras/ranking`);
        if (!response.ok) {
          throw new Error('Endpoint aun no disponible');
        }

        const data = (await response.json()) as {
          shame?: ShameFilm[];
          completed?: SurprisingFilm[];
        };

        if (!active) return;
        setRanking(Array.isArray(data.shame) ? data.shame : []);
        setCompletedRanking(Array.isArray(data.completed) ? data.completed : []);
      } catch {
        if (!active) return;
        setRanking([]);
        setCompletedRanking([]);
        setError('No se pudo cargar el ranking de Mentiras. Intenta nuevamente en unos minutos.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      active = false;
    };
  }, []);

  const totalAdmissions = admissions.size;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS }}>
      <GrainOverlay />

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`, padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <Link to="/" style={{ fontFamily: SERIF, fontSize: 18, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text, textDecoration: 'none' }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </Link>
        <div style={{ display: 'flex', gap: 32 }}>
          {['Explorar', 'Arcos', 'Feed', 'Perfil'].map(l => (
            <a key={l} href="#" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.textSoft, textDecoration: 'none', fontFamily: SANS }}>{l}</a>
          ))}
        </div>
        <div style={{ width: 80 }} />
      </nav>

      {/* Header */}
      <div style={{ padding: '64px 80px 0', maxWidth: 1080, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ fontFamily: SERIF, fontSize: 58, fontWeight: 400, color: C.text, lineHeight: 0.95, marginBottom: 20, letterSpacing: '-0.02em', maxWidth: 700 }}>
            Las películas que todos vieron.{' '}
            <em style={{ fontStyle: 'italic', color: C.textSoft }}>Supuestamente.</em>
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: C.textSoft, marginBottom: 12 }}>
            Votá con honestidad. Nadie te está mirando.
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, fontFamily: SANS, lineHeight: 1.7, maxWidth: 520 }}>
            El porcentaje muestra cuántos usuarios de CineVault admitieron no haber terminado cada película. La confesión más votada está debajo de la barra.
          </div>
        </motion.div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 80px 0', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 56, alignItems: 'flex-start' }}>

        {/* MAIN — Shame ranking */}
        <div>
          {loading && <div style={{ color: C.textSoft, marginBottom: 16 }}>Cargando ranking...</div>}
          {error && <div style={{ color: '#C97B7B', marginBottom: 16 }}>{error}</div>}
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
            Ranking de vergüenza colectiva
          </div>
          {ranking.map((film, i) => (
            <ShameFilmRow
              key={film.id}
              film={film}
              rank={i + 1}
              delay={i * 0.07}
              admitted={admissions.has(film.id)}
              onToggle={() => {
                setAdmissions((prev) => {
                  const next = new Set(prev);
                  if (next.has(film.id)) next.delete(film.id);
                  else next.add(film.id);
                  return next;
                });
              }}
            />
          ))}
          {!loading && ranking.length === 0 && (
            <div style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic', marginBottom: 24 }}>
              No hay entradas disponibles por ahora.
            </div>
          )}

          {/* Surprising section */}
          <div style={{ marginTop: 56 }}>
            <button
              onClick={() => setShowSurprising(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0, marginBottom: 24, color: C.text }}>
              <span style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400 }}>Las que la gente sí terminó</span>
              <em style={{ fontFamily: SERIF, fontSize: 18, color: C.textSoft, fontStyle: 'italic' }}>aunque nadie lo admite</em>
              {showSurprising ? <ChevronUp size={16} color={C.accentDim} /> : <ChevronDown size={16} color={C.accentDim} />}
            </button>

            <AnimatePresence>
              {showSurprising && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    {completedRanking.map((film, i) => (
                      <motion.div key={film.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 62, borderRadius: 1, overflow: 'hidden', border: `1px solid ${C.border}`, flexShrink: 0 }}>
                          <Img src={film.poster} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.5)' }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: SERIF, fontSize: 16, color: C.text, lineHeight: 1.2, marginBottom: 4 }}>{film.title}</div>
                          <div style={{ fontSize: 10, color: C.accent, fontFamily: SANS, marginBottom: 8 }}>{film.finishRate}% la terminó</div>
                          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, color: C.textSoft, lineHeight: 1.6 }}>{film.note}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* SIDEBAR — User confession */}
        <div style={{ position: 'sticky', top: 80 }}>
          <UserConfessionCard count={totalAdmissions} />

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '20px 22px', marginTop: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS, marginBottom: 14 }}>Estadísticas globales</div>
            {[
              { label: 'Películas evaluadas', value: ranking.length.toString() },
              { label: 'Votos totales', value: ranking.reduce((a, f) => a + f.voterCount, 0).toLocaleString('es') },
              { label: 'Peor vergüenza', value: ranking.length ? `${Math.max(...ranking.map(f => f.shamePct))}%` : '—' },
              { label: 'Honestidad promedio', value: ranking.length ? `${Math.round(ranking.reduce((a, f) => a + f.shamePct, 0) / ranking.length)}%` : '—' },
            ].map(stat => (
              <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}>{stat.label}</span>
                <span style={{ fontFamily: SERIF, fontSize: 18, color: C.text }}>{stat.value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: '14px 18px', border: `1px solid ${C.border}`, fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, color: C.textMuted, lineHeight: 1.65 }}>
            "El acto de no terminar una película también dice algo sobre vos como espectador."
          </div>
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}
