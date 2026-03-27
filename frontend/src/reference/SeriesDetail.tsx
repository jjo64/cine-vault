/**
 * CineVault — Series Detail (/series/:id)
 * Página de detalle de serie para cinéfilos.
 * Mock: Twin Peaks (1990–2017) · Lynch & Frost
 *
 * Para integrar: agregar la ruta en routes.ts
 *   { path: '/series/:id', Component: SeriesDetail }
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Bookmark, Share2, List,
  Heart, ChevronRight, ChevronDown,
  Play, Check, Clock, Tv,
  MessageSquare,
} from 'lucide-react';

// ─── PALETTE ─────────────────────────────────────────────────
const C = {
  bg:               '#080808',
  surface:          '#111111',
  elevated:         '#1A1A1A',
  border:           '#252525',
  accent:           '#D4AF7A',
  accentDim:        '#9A7A48',
  accentGlow:       'rgba(212,175,122,0.10)',
  accentGlowStrong: 'rgba(212,175,122,0.18)',
  text:             '#E2E2E2',
  textSoft:         '#7A7A7A',
  textMuted:        '#3A3A3A',
  gold:             '#C8A96E',
} as const;

const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'Syne', sans-serif";

// ─── TYPES ───────────────────────────────────────────────────
interface Episode {
  id:        number;
  season:    number;
  number:    number;
  title:     string;
  duration:  string;
  airdate:   string;
  isKey:     boolean;
  keyNote?:  string;
  director?: string;
  avgRating: number;
}

interface Season {
  id:            number;
  number:        number;
  subtitle?:     string;
  year:          string;
  totalEpisodes: number;
  synopsis:      string;
  poster:        string;
  network:       string;
  episodes:      Episode[];
}

interface CastMember {
  name:    string;
  role:    string;
  initial: string;
}

interface CrewMember {
  name:  string;
  role:  string;
}

// ─── IMAGE HELPER ────────────────────────────────────────────
function Img({ src, alt, style, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = useState(false);
  if (err) return <div style={{ ...style, background: C.elevated }} />;
  return <img src={src} alt={alt} style={style} onError={() => setErr(true)} {...rest} />;
}

// ─── GRAIN ───────────────────────────────────────────────────
function Grain() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 900,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
      opacity: 0.4,
    }}/>
  );
}

// ─── SECTION LABEL ───────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase',
      color: C.accent, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14,
      fontFamily: SANS,
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.border}, transparent)` }}/>
    </div>
  );
}

// ─── INTERACTIVE STARS ───────────────────────────────────────
function StarRating({ value, onChange, size = 26 }: { value: number; onChange: (n: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const labels = ['', 'Mala', 'Regular', 'Buena', 'Muy buena', 'Obra maestra'];
  const active = hover || value;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
            onClick={() => onChange(i)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: size, lineHeight: 1,
              color: i <= active ? C.gold : C.textMuted,
              transform: hover === i ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.15s, color 0.15s',
            }}>★</button>
        ))}
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.textSoft, minWidth: 100 }}>
        {active > 0 ? labels[active] : 'Tu rating'}
      </div>
    </div>
  );
}

// ─── SERIES DATA ─────────────────────────────────────────────
const SERIES = {
  title:         'Twin Peaks',
  originalTitle: 'Twin Peaks',
  years:         '1990 – 2017',
  status:        'Finalizada',
  country:       'Estados Unidos',
  language:      'Inglés',
  genres:        ['Drama de autor', 'Misterio', 'Surrealismo', 'Neo-noir'],
  creators:      ['David Lynch', 'Mark Frost'],
  showrunner:    'Mark Frost',
  mainDirector:  'David Lynch',
  network:       'ABC / Showtime',
  totalSeasons:  3,
  totalEpisodes: 48,
  episodeRuntime:'47 – 120 min',
  globalScore:   4.7,
  totalRatings:  '9.140',
  format:        'Serie dramática de autor',
  synopsis: `En el pequeño pueblo de <strong>Twin Peaks, Washington</strong>, el detective especial del FBI Dale Cooper llega para investigar el asesinato de Laura Palmer, la joven más querida del pueblo.`,
  synopsisFull: `Lo que empieza como un policial se convierte rápidamente en algo mucho más oscuro y más extraño — un <strong>descenso al inconsciente colectivo de la América profunda</strong>, donde el mal no viene del exterior sino de adentro de las familias, de adentro de la gente. Lynch y Frost construyeron algo que el televisor nunca había visto y que el cine tampoco. El formato serial les dio el tiempo que una película nunca puede dar.`,
  quote: 'La televisión es el formato perfecto para el sueño. Podés entrar en él una hora a la semana durante años.',
  quoteAuthor: 'David Lynch — entrevista con Chris Rodley, 1997',
  cinevaultCase: 'Twin Peaks no es una serie. Es un acto de resistencia. David Lynch tomó el formato televisivo de los 90 y lo usó como materia prima para algo que el cine de autor no podía hacer solo: una experiencia de 48 horas de duración dentro de un inconsciente americano. Está aquí porque lo merece.',
  themes: ['Neo-noir', 'El mal americano', 'Surrealismo', 'Trauma familiar', 'El sueño como realidad', 'Doppelgängers', 'Pacific Northwest', 'FBI y burocracia', 'Femme fatale', 'Lo sobrenatural', 'Música y atmósfera', 'Luto'],
  awards: [
    { icon: '🏆', name: 'Premio Peabody', fest: 'George Foster Peabody Awards, 1991' },
    { icon: '🎖️', name: '3 Emmy · Mejor Dirección, Mejor Actriz', fest: '43rd Primetime Emmy Awards, 1991' },
    { icon: '🎞️', name: 'Top 10 series del siglo · Metacritic', fest: 'The Return (2017)' },
    { icon: '⭐', name: 'Premio del Jurado · Cannes 2017', fest: 'The Return, Festival de Cannes' },
  ],
  cast: [
    { name: 'Kyle MacLachlan',    role: 'Agent Dale Cooper / Mr. C',  initial: 'K' },
    { name: 'Sheryl Lee',         role: 'Laura Palmer / Maddy Ferguson',initial: 'S' },
    { name: 'Michael Ontkean',    role: 'Sheriff Harry S. Truman',     initial: 'M' },
    { name: 'Mädchen Amick',      role: 'Shelly Johnson',              initial: 'M' },
    { name: 'Lara Flynn Boyle',   role: 'Donna Hayward',               initial: 'L' },
    { name: 'Ray Wise',           role: 'Leland Palmer',               initial: 'R' },
    { name: 'Frank Silva',        role: 'BOB',                         initial: 'F' },
    { name: 'Grace Zabriskie',    role: 'Sarah Palmer',                initial: 'G' },
  ] as CastMember[],
  crew: [
    { name: 'David Lynch',      role: 'Creador · Director · Compositor' },
    { name: 'Mark Frost',       role: 'Creador · Showrunner · Guionista principal' },
    { name: 'Angelo Badalamenti', role: 'Compositor original' },
    { name: 'Frederick Elmes',  role: 'Director de fotografía (piloto)' },
    { name: 'Duwayne Dunham',   role: 'Director · Editor principal' },
    { name: 'Harley Peyton',    role: 'Guionista — Temporada 2' },
  ] as CrewMember[],
  platforms: [
    { name: 'MUBI',             type: 'The Return disponible',  url: '#' },
    { name: 'Paramount+',       type: 'T1 y T2 disponibles',    url: '#' },
    { name: 'Blu-ray / Criterion', type: 'Edición limitada',    url: '#' },
  ],
};

// ─── SEASON EPISODES ─────────────────────────────────────────
const SEASONS: Season[] = [
  {
    id: 1, number: 1, year: '1990', totalEpisodes: 8, network: 'ABC',
    synopsis: 'El piloto establece Twin Peaks como un lugar que existe entre lo real y lo onírico. Cooper llega, toma café, y el caso de Laura Palmer empieza a revelar que el pueblo tiene secretos que van más allá de cualquier crimen convencional.',
    poster: 'https://images.unsplash.com/photo-1603882924554-4def74ff2aec?w=400&q=80',
    episodes: [
      { id: 101, season: 1, number: 1, title: 'Pilot', duration: '96 min', airdate: '8 abr 1990', isKey: true, keyNote: 'Uno de los pilotos más importantes de la historia. Lynch lo filmó como una película. Dale Cooper entra al pueblo y el mundo ya no es el mismo.', director: 'David Lynch', avgRating: 4.8 },
      { id: 102, season: 1, number: 2, title: 'Traces to Nowhere', duration: '47 min', airdate: '12 abr 1990', isKey: false, avgRating: 4.3 },
      { id: 103, season: 1, number: 3, title: 'Zen, or the Skill to Catch a Killer', duration: '47 min', airdate: '19 abr 1990', isKey: true, keyNote: 'El sueño del Cuarto Rojo aparece por primera vez. Es una de las escenas más influyentes de la televisión.', director: 'David Lynch', avgRating: 4.7 },
      { id: 104, season: 1, number: 4, title: 'Rest in Pain', duration: '47 min', airdate: '26 abr 1990', isKey: false, avgRating: 4.1 },
      { id: 105, season: 1, number: 5, title: 'The One-Armed Man', duration: '47 min', airdate: '3 may 1990', isKey: false, avgRating: 4.0 },
      { id: 106, season: 1, number: 6, title: "Cooper's Dreams", duration: '47 min', airdate: '10 may 1990', isKey: false, avgRating: 4.2 },
      { id: 107, season: 1, number: 7, title: 'Realization Time', duration: '47 min', airdate: '17 may 1990', isKey: false, avgRating: 4.1 },
      { id: 108, season: 1, number: 8, title: 'The Last Evening', duration: '47 min', airdate: '23 may 1990', isKey: false, avgRating: 4.5 },
    ],
  },
  {
    id: 2, number: 2, year: '1990 – 1991', totalEpisodes: 22, network: 'ABC',
    synopsis: 'La segunda temporada revela quién mató a Laura Palmer en sus primeros episodios — y luego paga el costo. Sin el misterio central, la serie se desintegra y se vuelve a encontrar. Los últimos episodios, dirigidos por Lynch, son posiblemente lo mejor de toda la serie.',
    poster: 'https://images.unsplash.com/photo-1717912973650-59604d5659bd?w=400&q=80',
    episodes: [
      { id: 201, season: 2, number: 1, title: 'May the Giant Be with You', duration: '47 min', airdate: '30 sep 1990', isKey: true, keyNote: 'Lynch vuelve a dirigir. El Gigante aparece. El tono cambia de forma radical y definitiva.', director: 'David Lynch', avgRating: 4.6 },
      { id: 202, season: 2, number: 2, title: 'Coma', duration: '47 min', airdate: '6 oct 1990', isKey: false, avgRating: 3.9 },
      { id: 203, season: 2, number: 3, title: 'The Man Behind the Glass', duration: '47 min', airdate: '13 oct 1990', isKey: false, avgRating: 3.8 },
      { id: 204, season: 2, number: 4, title: "Laura's Secret Diary", duration: '47 min', airdate: '20 oct 1990', isKey: false, avgRating: 3.7 },
      { id: 205, season: 2, number: 5, title: "The Orchid's Curse", duration: '47 min', airdate: '3 nov 1990', isKey: false, avgRating: 3.6 },
      { id: 206, season: 2, number: 6, title: 'Demons', duration: '47 min', airdate: '10 nov 1990', isKey: false, avgRating: 3.5 },
      { id: 207, season: 2, number: 7, title: 'Lonely Souls', duration: '47 min', airdate: '3 nov 1990', isKey: true, keyNote: 'El episodio más importante de la serie. Lynch lo dirigió personalmente. Revela quién mató a Laura Palmer. Hay que verlo sin saber nada.', director: 'David Lynch', avgRating: 4.9 },
      { id: 208, season: 2, number: 8, title: 'Drive with a Dead Girl', duration: '47 min', airdate: '17 nov 1990', isKey: false, avgRating: 3.8 },
      { id: 222, season: 2, number: 22, title: 'Beyond Life and Death', duration: '47 min', airdate: '10 jun 1991', isKey: true, keyNote: 'El final más enigmático de la historia de la TV. No resuelve nada. Fue diseñado así. Cooper entra al Cuarto Rojo y la serie termina como si el reloj se detuviera.', director: 'David Lynch', avgRating: 4.8 },
    ],
  },
  {
    id: 3, number: 3, subtitle: 'The Return', year: '2017', totalEpisodes: 18, network: 'Showtime',
    synopsis: 'Veinticinco años después. Lynch y Frost retoman la serie con total libertad creativa en Showtime. El resultado es 18 horas de cine puro — Lynch escribió, dirigió y editó cada parte. No es televisión. Es la película más larga de su carrera.',
    poster: 'https://images.unsplash.com/photo-1706418904655-fce62a6476f6?w=400&q=80',
    episodes: [
      { id: 301, season: 3, number: 1, title: 'The Return — Part 1', duration: '60 min', airdate: '21 may 2017', isKey: true, keyNote: 'Veinticinco años después. Cooper sigue en el Cuarto Rojo. Lynch establece que esto no es una continuación — es otra cosa completamente.', director: 'David Lynch', avgRating: 4.5 },
      { id: 302, season: 3, number: 2, title: 'The Return — Part 2', duration: '60 min', airdate: '21 may 2017', isKey: false, avgRating: 4.4 },
      { id: 303, season: 3, number: 3, title: 'The Return — Part 3', duration: '60 min', airdate: '28 may 2017', isKey: false, avgRating: 4.3 },
      { id: 304, season: 3, number: 4, title: 'The Return — Part 4', duration: '60 min', airdate: '28 may 2017', isKey: false, avgRating: 4.2 },
      { id: 305, season: 3, number: 5, title: 'The Return — Part 5', duration: '60 min', airdate: '4 jun 2017', isKey: false, avgRating: 4.1 },
      { id: 306, season: 3, number: 6, title: 'The Return — Part 6', duration: '60 min', airdate: '11 jun 2017', isKey: false, avgRating: 4.3 },
      { id: 307, season: 3, number: 7, title: 'The Return — Part 7', duration: '60 min', airdate: '18 jun 2017', isKey: false, avgRating: 4.2 },
      { id: 308, season: 3, number: 8, title: 'The Return — Part 8', duration: '60 min', airdate: '25 jun 2017', isKey: true, keyNote: 'El episodio más radical de la historia de la televisión. Lynch deja de contar una historia y muestra el origen del mal. Experimental puro. Hay consenso universal sobre su importancia.', director: 'David Lynch', avgRating: 4.98 },
      { id: 317, season: 3, number: 17, title: 'The Return — Part 17', duration: '60 min', airdate: '3 sep 2017', isKey: true, keyNote: 'Cooper intenta rescribir la historia. La serie alcanza su punto álgido antes del final.', director: 'David Lynch', avgRating: 4.7 },
      { id: 318, season: 3, number: 18, title: 'The Return — Part 18', duration: '60 min', airdate: '3 sep 2017', isKey: true, keyNote: 'El final más perturbador que Lynch filmó. No cierra nada. Lo abre todo. La última imagen es un loop al vacío.', director: 'David Lynch', avgRating: 4.6 },
    ],
  },
];

const STILLS = [
  { label: 'Los bosques de Twin Peaks',  img: 'https://images.unsplash.com/photo-1603882924554-4def74ff2aec?w=900&q=80' },
  { label: 'El Cuarto Rojo',            img: 'https://images.unsplash.com/photo-1702326506930-fb2fdb824908?w=600&q=80' },
  { label: 'La cabaña negra',           img: 'https://images.unsplash.com/photo-1768661608008-74f74ad6923a?w=600&q=80' },
  { label: 'Cooper en la niebla',       img: 'https://images.unsplash.com/photo-1737525589029-b26d4886ed3b?w=600&q=80' },
  { label: 'Double R Diner',            img: 'https://images.unsplash.com/photo-1706418904655-fce62a6476f6?w=600&q=80' },
];

const SIMILAR = [
  { title: 'The Leftovers',      year: '2014–2017', img: 'https://images.unsplash.com/photo-1691573252567-6c1be35aae79?w=400&q=80' },
  { title: 'True Detective T1',  year: '2014',      img: 'https://images.unsplash.com/photo-1563941433-b6a094653ed2?w=400&q=80' },
  { title: 'The Americans',      year: '2013–2018', img: 'https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=400&q=80' },
  { title: 'Rectify',            year: '2013–2016', img: 'https://images.unsplash.com/photo-1670782128814-c5a55b68f50d?w=400&q=80' },
  { title: 'Carnivàle',          year: '2003–2005', img: 'https://images.unsplash.com/photo-1762541693135-fb989de961e1?w=400&q=80' },
  { title: 'Six Feet Under',     year: '2001–2005', img: 'https://images.unsplash.com/photo-1769121803735-59cde1085231?w=400&q=80' },
];

const REVIEWS = [
  {
    id: 1, user: 'Martina Reyes', initial: 'M',
    meta: '347 películas · miembro desde 2024',
    rating: 5, likes: 48, seriesProgress: 'T3 completa',
    text: 'El episodio 8 de The Return me rompió de una forma que no sabía que la televisión podía hacer. Lynch le mostró al cine lo que el formato largo puede conseguir cuando está en manos de alguien que entiende el inconsciente mejor que nadie.',
  },
  {
    id: 2, user: 'Pablo Iriarte', initial: 'P',
    meta: '89 películas · crítico',
    rating: 4, likes: 31, seriesProgress: 'T1 y T2',
    text: 'La T1 y el inicio de la T2 son televisión perfecta. Después Lynch la abandona un poco y Frost lleva el barco. Pero el final — ese final — te deja con la sensación de haber visto algo que no debías ver. Eso es arte.',
  },
  {
    id: 3, user: 'Carmen Ibáñez', initial: 'C',
    meta: '201 películas · 3 años en CineVault',
    rating: 5, likes: 72, seriesProgress: 'T3 completa',
    text: 'La primera imagen de The Return: Cooper en el Cuarto Rojo, veinticinco años después. Sigo sin recuperarme. El cine de Lynch tiene la capacidad de funcionar también en el tiempo — la espera entre temporadas es parte de la obra.',
  },
];

// ─── NAVBAR ──────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 52px', height: 64,
      background: scrolled ? 'rgba(8,8,8,0.97)' : 'linear-gradient(to bottom, rgba(8,8,8,0.97) 0%, transparent 100%)',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
      transition: 'background 0.4s, border-color 0.4s',
    }}>
      <Link to="/" style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 500, letterSpacing: '0.13em', textTransform: 'uppercase', color: C.text, textDecoration: 'none' }}>
        Cine<span style={{ color: C.accent }}>Vault</span>
      </Link>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textSoft, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, transition: 'color 0.2s' }}
        onMouseEnter={e => (e.currentTarget.style.color = C.text)}
        onMouseLeave={e => (e.currentTarget.style.color = C.textSoft)}>
        <ChevronLeft size={14} strokeWidth={1.5} /> Volver
      </button>
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────
function Hero() {
  const [userRating,   setUserRating]   = useState(0);
  const [inVault,      setInVault]      = useState(false);
  const [inWatchlist,  setInWatchlist]  = useState(false);
  const [liked,        setLiked]        = useState(false);
  const [tracking]     = useState(true); // seguimiento activo

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bgY     = useTransform(scrollYProgress, [0, 1], ['0%',  '20%']);
  const posterY = useTransform(scrollYProgress, [0, 1], ['0%',  '14%']);

  return (
    <div ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>

      {/* Backdrop — parallax atmospheric */}
      <motion.div style={{ position: 'absolute', inset: '-10%', y: bgY }}>
        <Img
          src="https://images.unsplash.com/photo-1603882924554-4def74ff2aec?w=1800&q=80"
          alt="backdrop"
          style={{ width: '100%', height: '110%', objectFit: 'cover', filter: 'saturate(0.25) brightness(0.22)', transformOrigin: 'center' }}
        />
      </motion.div>

      {/* Gradient layers */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,8,8,0.98) 42%, rgba(8,8,8,0.6) 70%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 20%, rgba(8,8,8,0.55) 60%, ${C.bg} 100%)` }} />

      {/* Gold glow */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 600, height: 500, background: `radial-gradient(ellipse at bottom left, ${C.accentGlow}, transparent 65%)`, pointerEvents: 'none' }}/>

      {/* TV scan lines — subtle nod to the medium */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)', pointerEvents: 'none', opacity: 0.6 }} />

      {/* Floating poster */}
      <motion.div
        initial={{ opacity: 0, y: -24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        style={{ position: 'absolute', right: '9%', top: '50%', y: posterY, width: 210, zIndex: 10, transform: 'translateY(-50%)' }}
      >
        <div style={{ aspectRatio: '2/3', borderRadius: 2, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)', position: 'relative' }}>
          <Img src="https://images.unsplash.com/photo-1717912973650-59604d5659bd?w=600&q=80" alt="Twin Peaks poster"
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.5) brightness(0.8)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)' }}/>
          <div style={{ position: 'absolute', inset: 0, border: `1px solid rgba(212,175,122,0.12)`, borderRadius: 2 }}/>
          {/* "Serie de autor" badge on poster */}
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, background: 'rgba(8,8,8,0.92)', padding: '3px 8px', border: `1px solid ${C.accentDim}`, fontFamily: SANS }}>
            Serie de autor
          </div>
        </div>
        {/* Status badge below poster */}
        <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'center' }}>
          <span style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.textMuted, border: `1px solid ${C.border}`, padding: '3px 10px', fontFamily: SANS }}>{SERIES.status}</span>
        </div>
      </motion.div>

      {/* Hero content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
        style={{ position: 'relative', zIndex: 10, padding: '0 52px 64px', maxWidth: 680 }}
      >
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, padding: '4px 10px', border: `1px solid ${C.accentDim}`, fontFamily: SANS }}>
            Drama de autor · Misterio
          </span>
          <span style={{ color: C.textMuted, fontSize: 12 }}>·</span>
          <span style={{ fontSize: 11, color: C.textSoft, letterSpacing: '0.08em', fontFamily: SANS }}>
            {SERIES.years} · EE.UU.
          </span>
          <span style={{ color: C.textMuted, fontSize: 12 }}>·</span>
          <span style={{ fontSize: 11, color: C.textSoft, letterSpacing: '0.08em', fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tv size={10} color={C.textMuted} /> {SERIES.totalSeasons} temporadas · {SERIES.totalEpisodes} ep.
          </span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(52px, 6vw, 76px)', fontWeight: 300, lineHeight: 0.92, letterSpacing: '-0.02em', color: C.text, margin: 0 }}>
            {SERIES.title}
          </h1>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(36px, 3.5vw, 52px)', fontWeight: 300, lineHeight: 1, color: 'rgba(226,226,226,0.22)', letterSpacing: '-0.01em', marginTop: 6 }}>
            Lynch · Frost
          </div>
        </div>

        {/* Creators */}
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, color: C.textSoft, marginBottom: 28, letterSpacing: '0.02em', marginTop: 18 }}>
          Creada por{' '}
          {SERIES.creators.map((c, i) => (
            <span key={c}>
              <a href="#" style={{ color: C.accent, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>{c}</a>
              {i < SERIES.creators.length - 1 && <span style={{ color: C.textMuted }}> & </span>}
            </span>
          ))}
        </div>

        {/* Rating row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
          <StarRating value={userRating} onChange={setUserRating} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, paddingLeft: 24, borderLeft: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 300, color: C.gold, lineHeight: 1 }}>{SERIES.globalScore}</span>
            <span style={{ fontSize: 14, color: C.textMuted, fontFamily: SANS }}>/5</span>
            <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, marginLeft: 4 }}>en CineVault</span>
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: SANS }}>{SERIES.totalRatings} ratings</div>
        </div>

        {/* Tracking progress mini */}
        {tracking && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
            style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '12px 18px', marginBottom: 20, display: 'inline-flex', gap: 16, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS, marginBottom: 3 }}>Tu progreso</div>
              <div style={{ fontSize: 13, color: C.text, fontFamily: SANS }}>T2 · <span style={{ color: C.accent }}>Ep. 7</span> de 22</div>
            </div>
            <div style={{ width: 1, height: 28, background: C.border }} />
            <button style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Play size={10} fill={C.accent} /> Continuar
            </button>
          </motion.div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setInVault(v => !v)} style={{ padding: '12px 28px', background: inVault ? C.accentDim : C.accent, color: C.bg, border: 'none', fontFamily: SANS, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
            {inVault ? '✓ En mi Vault' : '+ Vault'}
          </button>
          <button style={{ padding: '12px 22px', background: 'transparent', color: C.textSoft, border: `1px solid ${C.border}`, fontFamily: SANS, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 7 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.textSoft; (e.currentTarget as HTMLElement).style.color = C.text; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textSoft; }}>
            <List size={13} strokeWidth={1.5} /> Añadir a lista
          </button>
          {[
            { icon: <Bookmark size={15} strokeWidth={1.5} fill={inWatchlist ? C.accent : 'none'} />, active: inWatchlist, action: () => setInWatchlist(v => !v), title: 'Watchlist' },
            { icon: <Heart size={15} strokeWidth={1.5} fill={liked ? C.gold : 'none'} />, active: liked, action: () => setLiked(v => !v), title: 'Me gusta' },
            { icon: <Share2 size={15} strokeWidth={1.5} />, active: false, action: () => {}, title: 'Compartir' },
          ].map(btn => (
            <button key={btn.title} title={btn.title} onClick={btn.action} style={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: btn.active ? C.accent : C.textSoft, border: `1px solid ${btn.active ? C.accentDim : C.border}`, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (!btn.active) { (e.currentTarget as HTMLElement).style.borderColor = C.accentDim; (e.currentTarget as HTMLElement).style.color = C.accent; } }}
              onMouseLeave={e => { if (!btn.active) { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textSoft; } }}>
              {btn.icon}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        style={{ position: 'absolute', bottom: 28, left: 52, display: 'flex', alignItems: 'center', gap: 12, zIndex: 10 }}>
        <div style={{ width: 32, height: 1, background: C.textMuted, position: 'relative', overflow: 'hidden' }}>
          <motion.div animate={{ x: ['-100%', '0%', '100%'] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0, background: C.accent }} />
        </div>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS }}>Seguir leyendo</span>
      </motion.div>
    </div>
  );
}

// ─── CREATOR QUOTE ───────────────────────────────────────────
function CreatorQuote() {
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.9 }}
      style={{ padding: '48px 52px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.surface, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 200, background: `radial-gradient(ellipse, ${C.accentGlow}, transparent 70%)`, pointerEvents: 'none' }}/>
      <div style={{ fontFamily: SERIF, fontSize: 'clamp(18px, 2.2vw, 26px)', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.7, color: C.textSoft, maxWidth: 760, margin: '0 auto 16px', position: 'relative' }}>
        <span style={{ color: C.accent, fontSize: '1.3em' }}>"</span>
        {SERIES.quote}
        <span style={{ color: C.accent, fontSize: '1.3em' }}>"</span>
      </div>
      <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS }}>{SERIES.quoteAuthor}</div>
    </motion.div>
  );
}

// ─── CINEVAULT EDITORIAL BADGE ────────────────────────────────
function CineVaultBadge() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
      style={{ background: 'rgba(212,175,122,0.04)', border: `1px solid rgba(212,175,122,0.18)`, borderLeft: `3px solid ${C.accent}`, padding: '28px 32px', marginBottom: 64, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 300, height: '100%', background: `linear-gradient(90deg, ${C.accentGlow}, transparent)`, pointerEvents: 'none' }}/>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.accent, fontFamily: SANS, marginBottom: 12 }}>¿Por qué está esto en CineVault?</div>
        <div style={{ fontFamily: SERIF, fontSize: 18, fontStyle: 'italic', color: C.textSoft, lineHeight: 1.75, maxWidth: 640 }}>
          {SERIES.cinevaultCase}
        </div>
      </div>
    </motion.div>
  );
}

// ─── SYNOPSIS ────────────────────────────────────────────────
function Synopsis() {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Sinopsis</SectionLabel>
      <p style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 300, lineHeight: 1.75, color: C.textSoft, maxWidth: 640, margin: '0 0 16px' }}
        dangerouslySetInnerHTML={{ __html: SERIES.synopsis }} />
      <AnimatePresence>
        {expanded && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 300, lineHeight: 1.75, color: C.textSoft, maxWidth: 640, margin: '0 0 16px' }}
            dangerouslySetInnerHTML={{ __html: SERIES.synopsisFull }} />
        )}
      </AnimatePresence>
      <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, display: 'flex', alignItems: 'center', gap: 6, padding: 0, transition: 'opacity 0.2s' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
        {expanded ? 'Leer menos' : 'Leer más'}
        <ChevronRight size={12} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
    </motion.section>
  );
}

// ─── EPISODE TRACKER ─────────────────────────────────────────
function EpisodeTracker({ watchedIds }: { watchedIds: Set<string> }) {
  // Total episodes across all seasons
  const total = SERIES.totalEpisodes;
  const watched = watchedIds.size;
  const pct = Math.round((watched / total) * 100);

  // Season boundaries for the progress bar markers
  let cumulative = 0;
  const boundaries = SEASONS.map(s => {
    const start = cumulative / total;
    cumulative += s.totalEpisodes;
    return { season: s.number, start: start * 100, subtitle: s.subtitle };
  });

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Tu recorrido</SectionLabel>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
          <span style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 300, color: C.text, lineHeight: 1 }}>{watched}</span>
          <span style={{ fontFamily: SERIF, fontSize: 20, color: C.textSoft }}>de {total} episodios</span>
          <span style={{ marginLeft: 'auto', fontFamily: SERIF, fontSize: 28, color: C.accent, lineHeight: 1 }}>{pct}%</span>
        </div>

        {/* Progress bar with season markers */}
        <div style={{ position: 'relative', height: 6, background: C.border, borderRadius: 2, marginBottom: 18, overflow: 'visible' }}>
          <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ height: '100%', background: `linear-gradient(to right, ${C.accentDim}, ${C.accent})`, borderRadius: 2, position: 'absolute' }} />
          {/* Season boundary markers */}
          {boundaries.slice(1).map(b => (
            <div key={b.season} style={{ position: 'absolute', top: -3, left: `${b.start}%`, width: 1, height: 12, background: C.bg, zIndex: 2 }} />
          ))}
        </div>

        {/* Season labels */}
        <div style={{ display: 'flex', gap: 0 }}>
          {SEASONS.map((s, i) => {
            const width = (s.totalEpisodes / total) * 100;
            const seasonWatched = s.episodes.filter(e => watchedIds.has(`s${s.number}e${e.number}`)).length;
            return (
              <div key={s.id} style={{ width: `${width}%`, paddingRight: i < SEASONS.length - 1 ? 8 : 0 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS, marginBottom: 2 }}>
                  T{s.number}{s.subtitle && ` · ${s.subtitle}`}
                </div>
                <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}>
                  {seasonWatched}/{s.totalEpisodes}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

// ─── SEASONS & EPISODES ──────────────────────────────────────
function EpisodeRow({ ep, watched, onToggle, onRate, userRating }: {
  ep: Episode; watched: boolean; onToggle: () => void; onRate: (n: number) => void; userRating: number;
}) {
  const [hov, setHov] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const numStr = `E${String(ep.number).padStart(2, '0')}`;

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderBottom: `1px solid ${C.border}`,
        background: watched ? 'rgba(255,255,255,0.01)' : 'transparent',
        transition: 'background 0.2s',
      }}>
      {/* Main row */}
      <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 16, padding: '16px 0', alignItems: 'flex-start' }}>
        {/* Episode number */}
        <div style={{ fontFamily: SERIF, fontSize: 22, color: hov ? C.accentDim : C.textMuted, lineHeight: 1, paddingTop: 2, transition: 'color 0.2s' }}>{numStr}</div>

        {/* Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SERIF, fontSize: 18, color: watched ? C.textSoft : C.text, lineHeight: 1.3 }}>{ep.title}</span>
            {ep.isKey && (
              <span style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent, border: `1px solid ${C.accentDim}`, padding: '2px 7px', fontFamily: SANS, flexShrink: 0 }}>Episodio clave</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={9} color={C.textMuted} /> {ep.duration}
            </span>
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: SANS }}>{ep.airdate}</span>
            {ep.director && <span style={{ fontSize: 11, color: C.accentDim, fontFamily: SANS }}>Dir. {ep.director}</span>}
            {/* Stars */}
            <div style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="9" height="9" viewBox="0 0 12 12" fill={i < Math.round(ep.avgRating) ? C.gold : C.textMuted} opacity={0.7}>
                  <path d="M6 1l1.3 2.6L10 4l-2 2 .5 2.8L6 7.5 3.5 8.8 4 6 2 4l2.7-.4z"/>
                </svg>
              ))}
              <span style={{ fontSize: 9, color: C.textMuted, fontFamily: SANS, marginLeft: 3 }}>{ep.avgRating.toFixed(1)}</span>
            </div>
          </div>
          {/* CineVault editorial note */}
          {ep.isKey && ep.keyNote && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              style={{ marginTop: 10, paddingLeft: 14, borderLeft: `2px solid ${C.accentDim}`, fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, color: C.textSoft, lineHeight: 1.65, maxWidth: 520 }}>
              {ep.keyNote}
            </motion.div>
          )}
          {/* User rating row (if rated) */}
          {userRating > 0 && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: C.textMuted, fontFamily: SANS, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Tu nota</span>
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="9" height="9" viewBox="0 0 12 12" fill={i < userRating ? C.accent : C.textMuted}>
                    <path d="M6 1l1.3 2.6L10 4l-2 2 .5 2.8L6 7.5 3.5 8.8 4 6 2 4l2.7-.4z"/>
                  </svg>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', paddingTop: 2 }}>
          {/* Rate */}
          <button onClick={() => setRatingOpen(v => !v)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${ratingOpen ? C.accentDim : C.border}`, color: ratingOpen ? C.accent : C.textSoft, cursor: 'pointer', transition: 'all 0.2s', fontSize: 14, opacity: hov || ratingOpen ? 1 : 0 }}>★</button>
          {/* Mark watched */}
          <button onClick={onToggle} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: watched ? C.accentGlow : 'none', border: `1px solid ${watched ? C.accentDim : C.border}`, color: watched ? C.accent : C.textSoft, cursor: 'pointer', transition: 'all 0.2s' }}>
            <Check size={12} />
          </button>
        </div>
      </div>

      {/* Mini rating panel */}
      <AnimatePresence>
        {ratingOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ paddingLeft: 64, paddingBottom: 14 }}>
            <StarRating value={userRating} onChange={n => { onRate(n); setRatingOpen(false); }} size={20} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SeasonsPanel({ watchedIds, setWatchedIds, episodeRatings, setEpisodeRatings }: {
  watchedIds: Set<string>;
  setWatchedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  episodeRatings: Record<string, number>;
  setEpisodeRatings: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const [activeSeason, setActiveSeason] = useState(1);
  const [showAllEps, setShowAllEps] = useState(false);

  const season = SEASONS.find(s => s.number === activeSeason)!;
  const visibleEps = showAllEps ? season.episodes : season.episodes.slice(0, 6);
  const hasMore = season.episodes.length > 6 && !showAllEps;

  const toggleWatched = (ep: Episode) => {
    const key = `s${ep.season}e${ep.number}`;
    setWatchedIds(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const seasonWatched = season.episodes.filter(e => watchedIds.has(`s${e.season}e${e.number}`)).length;
  const seasonPct = Math.round((seasonWatched / season.totalEpisodes) * 100);

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Temporadas y episodios</SectionLabel>

      {/* Season tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: `1px solid ${C.border}` }}>
        {SEASONS.map(s => {
          const isActive = s.number === activeSeason;
          return (
            <button key={s.id} onClick={() => { setActiveSeason(s.number); setShowAllEps(false); }}
              style={{
                padding: '12px 22px', background: 'none', border: 'none',
                borderBottom: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
                color: isActive ? C.text : C.textSoft,
                fontFamily: SANS, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer', marginBottom: -1, transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}>
              T{s.number}{s.subtitle && ` · ${s.subtitle}`}
              <span style={{ marginLeft: 8, fontSize: 9, color: isActive ? C.accentDim : C.textMuted }}>({s.totalEpisodes} ep.)</span>
            </button>
          );
        })}
      </div>

      {/* Season header */}
      <AnimatePresence mode="wait">
        <motion.div key={activeSeason} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 28, marginBottom: 32 }}>
            {/* Season poster */}
            <div style={{ aspectRatio: '2/3', borderRadius: 1, overflow: 'hidden', border: `1px solid ${C.border}` }}>
              <Img src={season.poster} alt={`Temporada ${season.number}`} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.5) brightness(0.75)' }} />
            </div>
            {/* Season info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: SERIF, fontSize: 22, color: C.text }}>
                  Temporada {season.number}{season.subtitle && <em style={{ fontStyle: 'italic', color: C.textSoft, fontSize: 18 }}> · {season.subtitle}</em>}
                </span>
                <span style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>{season.year}</span>
                <span style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tv size={9} /> {season.network}
                </span>
              </div>
              <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.textSoft, lineHeight: 1.7, marginBottom: 16, maxWidth: 480 }}>
                {season.synopsis}
              </div>
              {/* Season progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, maxWidth: 200, height: 2, background: C.border, borderRadius: 1 }}>
                  <div style={{ height: '100%', width: `${seasonPct}%`, background: C.accent, borderRadius: 1, transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>{seasonWatched}/{season.totalEpisodes} vistos</span>
              </div>
            </div>
          </div>

          {/* Episode list */}
          <div>
            {visibleEps.map((ep) => (
              <EpisodeRow
                key={ep.id} ep={ep}
                watched={watchedIds.has(`s${ep.season}e${ep.number}`)}
                onToggle={() => toggleWatched(ep)}
                onRate={n => setEpisodeRatings(prev => ({ ...prev, [`s${ep.season}e${ep.number}`]: n }))}
                userRating={episodeRatings[`s${ep.season}e${ep.number}`] ?? 0}
              />
            ))}
            {hasMore && (
              <button onClick={() => setShowAllEps(true)}
                style={{ marginTop: 16, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, display: 'flex', alignItems: 'center', gap: 6 }}>
                Ver los {season.totalEpisodes - season.episodes.length} episodios restantes
                <ChevronDown size={12} />
              </button>
            )}
            {season.totalEpisodes > season.episodes.length && (
              <div style={{ marginTop: 12, fontSize: 11, color: C.textMuted, fontFamily: SERIF, fontStyle: 'italic' }}>
                * Se muestran {season.episodes.length} de {season.totalEpisodes} episodios. La base de datos incluye el listado completo.
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}

// ─── THEMES ──────────────────────────────────────────────────
function Themes() {
  const [active, setActive] = useState<string[]>(['Neo-noir', 'El sueño como realidad', 'Trauma familiar']);
  const toggle = (t: string) => setActive(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Temas y atmósferas</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {SERIES.themes.map(theme => {
          const lit = active.includes(theme);
          return (
            <button key={theme} onClick={() => toggle(theme)} style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: lit ? C.accent : C.textSoft, border: `1px solid ${lit ? C.accentDim : C.border}`, background: lit ? C.accentGlow : 'transparent', padding: '6px 14px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: SANS }}
              onMouseEnter={e => { if (!lit) { (e.currentTarget as HTMLElement).style.borderColor = C.accentDim; (e.currentTarget as HTMLElement).style.color = C.accent; } }}
              onMouseLeave={e => { if (!lit) { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textSoft; } }}>
              {theme}
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}

// ─── STILLS GALLERY ──────────────────────────────────────────
function Stills() {
  const [hov, setHov] = useState<number | null>(null);
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Imágenes de la serie</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: 4 }}>
        {STILLS.map((still, i) => {
          const isMain = i === 0;
          return (
            <div key={i}
              style={{ gridRow: isMain ? 'span 2' : undefined, position: 'relative', overflow: 'hidden', aspectRatio: isMain ? undefined : '4/3', cursor: 'pointer', ...(isMain ? { minHeight: 300 } : {}) }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
              <Img src={still.img} alt={still.label}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: hov === i ? 'saturate(0.7) brightness(0.75)' : 'saturate(0.4) brightness(0.6)', transform: hov === i ? 'scale(1.03)' : 'scale(1)', transition: 'all 0.45s' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 14px 10px', background: 'linear-gradient(to top, rgba(8,8,8,0.85) 0%, transparent 100%)', opacity: hov === i ? 1 : 0, transition: 'opacity 0.3s' }}>
                <div style={{ fontSize: 11, color: C.text, fontFamily: SANS, letterSpacing: '0.1em' }}>{still.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

// ─── TECHNICAL SHEET ─────────────────────────────────────────
function TechnicalSheet() {
  const rows = [
    { label: 'Formato',          value: SERIES.format },
    { label: 'Creada por',       value: SERIES.creators.join(', ') },
    { label: 'Showrunner',       value: SERIES.showrunner },
    { label: 'Dirección ppal.',  value: SERIES.mainDirector },
    { label: 'Red / Plataforma', value: SERIES.network },
    { label: 'País',             value: SERIES.country },
    { label: 'Idioma',           value: SERIES.language },
    { label: 'Temporadas',       value: String(SERIES.totalSeasons) },
    { label: 'Episodios totales',value: String(SERIES.totalEpisodes) },
    { label: 'Duración ep.',     value: SERIES.episodeRuntime },
    { label: 'Emisión',          value: SERIES.years },
    { label: 'Estado',           value: SERIES.status },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Ficha técnica</SectionLabel>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 0, borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ padding: '12px 18px', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS, borderRight: `1px solid ${C.border}`, background: C.elevated }}>{row.label}</div>
            <div style={{ padding: '12px 18px', fontSize: 13, color: C.text, fontFamily: SERIF }}>{row.value}</div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── AWARDS ──────────────────────────────────────────────────
function Awards() {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Reconocimientos</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SERIES.awards.map((award, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 20px', background: C.surface, border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{award.icon}</span>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 16, color: C.text, marginBottom: 3 }}>{award.name}</div>
              <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}>{award.fest}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── CAST ────────────────────────────────────────────────────
function Cast() {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Reparto principal</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {SERIES.cast.map(member => (
          <div key={member.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = C.accentDim)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.elevated, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: SERIF, fontSize: 16, color: C.accentDim }}>{member.initial}</span>
            </div>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: C.text, marginBottom: 2 }}>{member.name}</div>
              <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 12, color: C.textSoft }}>{member.role}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── CREW ────────────────────────────────────────────────────
function Crew() {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Equipo creativo</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
        {SERIES.crew.map(member => (
          <div key={member.name} style={{ padding: '14px 18px', background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: SERIF, fontSize: 17, color: C.text, marginBottom: 4 }}>{member.name}</div>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textSoft, fontFamily: SANS }}>{member.role}</div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── PLATFORMS ───────────────────────────────────────────────
function Platforms() {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Dónde verla</SectionLabel>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {SERIES.platforms.map(p => (
          <a key={p.name} href={p.url} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: C.surface, border: `1px solid ${C.border}`, transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = C.accentDim)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
            <span style={{ fontFamily: SANS, fontSize: 13, color: C.text }}>{p.name}</span>
            <span style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>{p.type}</span>
          </a>
        ))}
      </div>
    </motion.section>
  );
}

// ─── REVIEWS ─────────────────────────────────────────────────
function Reviews() {
  const [writerOpen, setWriterOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [userRating, setUserRating] = useState(0);

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>
        <span>Lo que dice la comunidad</span>
        <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'none', fontFamily: SANS }}>3 reseñas</span>
      </SectionLabel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {REVIEWS.map((review, i) => (
          <motion.div key={review.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            style={{ borderBottom: `1px solid ${C.border}`, padding: '24px 0', display: 'grid', gridTemplateColumns: '40px 1fr', gap: 18 }}>
            {/* Avatar */}
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.elevated, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: SERIF, fontSize: 18, color: C.accentDim }}>{review.initial}</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: SANS, fontSize: 13, color: C.text }}>{review.user}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="10" height="10" viewBox="0 0 12 12" fill={i < review.rating ? C.gold : C.textMuted}>
                      <path d="M6 1l1.3 2.6L10 4l-2 2 .5 2.8L6 7.5 3.5 8.8 4 6 2 4l2.7-.4z"/>
                    </svg>
                  ))}
                </div>
                <span style={{ fontSize: 9, color: C.accent, fontFamily: SANS, border: `1px solid ${C.accentDim}`, padding: '1px 7px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{review.seriesProgress}</span>
                <span style={{ fontSize: 10, color: C.textMuted, fontFamily: SANS, marginLeft: 'auto' }}>{review.meta}</span>
              </div>
              <p style={{ fontFamily: SERIF, fontSize: 16, fontStyle: 'italic', color: C.textSoft, lineHeight: 1.75, margin: '0 0 12px', maxWidth: 600 }}>{review.text}</p>
              <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontFamily: SANS, fontSize: 10, padding: 0 }}>
                <Heart size={10} /> {review.likes}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Write review */}
      <div style={{ marginTop: 32 }}>
        {!writerOpen ? (
          <button onClick={() => setWriterOpen(true)} style={{ padding: '12px 24px', background: 'transparent', color: C.accent, border: `1px solid ${C.accentDim}`, fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={12} /> Escribir reseña
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '24px 28px' }}>
            <div style={{ marginBottom: 16 }}><StarRating value={userRating} onChange={setUserRating} /></div>
            <textarea value={draftText} onChange={e => setDraftText(e.target.value)}
              placeholder="Escribí tu reseña aquí. No hay extensión mínima — pero que valga algo."
              style={{ width: '100%', minHeight: 120, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontFamily: SERIF, fontSize: 16, fontStyle: 'italic', padding: 16, resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button style={{ padding: '10px 24px', background: C.accent, color: C.bg, border: 'none', fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}>Publicar</button>
              <button onClick={() => setWriterOpen(false)} style={{ padding: '10px 18px', background: 'none', color: C.textSoft, border: `1px solid ${C.border}`, fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

// ─── SIMILAR SERIES ──────────────────────────────────────────
function SimilarSeries() {
  const [hov, setHov] = useState<number | null>(null);
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ marginBottom: 64 }}>
      <SectionLabel>Series que te van a gustar</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
        {SIMILAR.map((s, i) => (
          <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'pointer' }}>
            <div style={{ aspectRatio: '2/3', borderRadius: 2, overflow: 'hidden', marginBottom: 10, transform: hov === i ? 'translateY(-4px)' : 'none', transition: 'transform 0.3s' }}>
              <Img src={s.img} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: hov === i ? 'saturate(0.9) brightness(0.85)' : 'saturate(0.5) brightness(0.65)', transition: 'filter 0.4s' }} />
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 14, color: C.text, lineHeight: 1.3, marginBottom: 2 }}>{s.title}</div>
            <div style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>{s.year}</div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── PAGE LAYOUT ─────────────────────────────────────────────
export function SeriesDetail() {
  // Shared state for episode tracking
  const [watchedIds,      setWatchedIds]      = useState<Set<string>>(new Set(['s1e1', 's1e2', 's1e3', 's2e1', 's2e2']));
  const [episodeRatings,  setEpisodeRatings]  = useState<Record<string, number>>({ 's1e1': 5, 's1e3': 5, 's2e7': 5 });

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS }}>
      <Grain />
      <Navbar />
      <Hero />
      <CreatorQuote />

      {/* Main content grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 52px 0', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 64, alignItems: 'flex-start' }}>

        {/* ── LEFT COLUMN ── */}
        <main>
          <CineVaultBadge />
          <Synopsis />
          <EpisodeTracker watchedIds={watchedIds} />
          <SeasonsPanel
            watchedIds={watchedIds}
            setWatchedIds={setWatchedIds}
            episodeRatings={episodeRatings}
            setEpisodeRatings={setEpisodeRatings}
          />
          <Themes />
          <Stills />
          <Cast />
          <Crew />
          <Reviews />
          <SimilarSeries />
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside>
          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Global score card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
              style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '28px 24px', marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS, marginBottom: 16 }}>Score CineVault</div>
              <div style={{ fontFamily: SERIF, fontSize: 72, fontWeight: 300, color: C.gold, lineHeight: 1, marginBottom: 4 }}>{SERIES.globalScore}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: SANS, marginBottom: 20 }}>{SERIES.totalRatings} valoraciones</div>
              {/* Mini distribution */}
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 36, marginBottom: 8 }}>
                {[4, 8, 14, 28, 46].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}px`, background: i === 4 ? C.accent : C.elevated, borderRadius: 1 }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.textMuted, fontFamily: SANS }}>
                <span>1★</span><span>5★</span>
              </div>
            </motion.div>

            {/* Technical sheet (compact sidebar version) */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.5 }}>
              <TechnicalSheet />
            </motion.div>

            {/* Platforms */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.6 }}>
              <Platforms />
            </motion.div>

            {/* Awards */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.7 }}>
              <Awards />
            </motion.div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 40 }}>
        <div style={{ fontFamily: SERIF, fontSize: 16, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: SERIF, fontStyle: 'italic' }}>
          "Hay series que también te cambian. Esas también cuentan."
        </div>
      </div>
    </div>
  );
}
