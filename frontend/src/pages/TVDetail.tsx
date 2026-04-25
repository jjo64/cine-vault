import { useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./TVDetail.css";
import "./MovieDetail.css";
import { useTVDetail } from "./TVDetail/hooks/useTVDetail";
import SeasonsPanel from "./TVDetail/components/SeasonsPanel";
import ReviewsSection from "./TVDetail/components/ReviewsSection";
import ScoreCard from "./TVDetail/components/ScoreCard";
import TechnicalSheet from "./TVDetail/components/TechnicalSheet";
import { Hero } from "../features/movie-detail/components/Hero";
import { CastCrew } from "../features/movie-detail/components/CastCrew";
import { ReviewLogModal } from "../features/movie-detail/components/ReviewLogModal";
import { useUserActions } from "./TVDetail/hooks/useUserActions";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type TVDetailApi } from "../services/tvDetailServices";
import {
  C,
  SANS,
  SERIF,
  TMDB_THUMB,
  TMDB_BASE,
  SIZES,
} from "./TVDetail/constants";
// import { Footer, Navbar} from '../components/profile-v2/layout'

function img(path?: string | null, size = SIZES.BACKDROP) {
  return path ? `${TMDB_BASE}${size}${path}` : "";
}

// ─── TYPES ────────────────────────────────────────────────────

// ─── HELPERS ──────────────────────────────────────────────────
function slugify(id: number, name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${id}-${slug}`;
}

function formatYear(d?: string) {
  return d ? d.slice(0, 4) : "—";
}

function Img({
  src,
  alt,
  style,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = useState(false);
  if (!src || err) return <div style={{ ...style, background: C.elevated }} />;
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setErr(true)}
      {...rest}
    />
  );
}

function Grain() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 900,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: C.accent,
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: SANS,
      }}
    >
      {children}
      <div
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(to right, ${C.border}, transparent)`,
        }}
      />
    </div>
  );
}

// ─── HERO ──────────────────────────────────────────────────────
// function Hero({ detail, userRating, onRatingChange, inVault, onVaultToggle, inWatchlist, onWatchlistToggle, liked, onLikedToggle }: {
//   detail: TVDetailApi
//   userRating: number
//   onRatingChange: (n: number) => void
//   inVault: boolean
//   onVaultToggle: () => void
//   inWatchlist: boolean
//   onWatchlistToggle: () => void
//   liked: boolean
//   onLikedToggle: () => void
// }) {
//   const heroRef = useRef<HTMLDivElement>(null)
//   const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
//   const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
//   const posterY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])

//   const creators = (detail.created_by || []).map(c => c.name).slice(0, 3)
//   const genres = (detail.genres || []).slice(0, 2).map(g => g.name).join(' · ')
//   const yearStart = formatYear(detail.first_air_date)
//   const yearEnd = detail.in_production === false ? formatYear(detail.last_air_date) : 'presente'
//   const years = yearStart === yearEnd || !detail.last_air_date ? yearStart : `${yearStart} – ${yearEnd}`
//   const country = (detail.production_countries || []).map(c => c.name).slice(0, 2).join(', ')
//   const scoreOf5 = ((detail.vote_average || 0) / 2).toFixed(1)

//   return (
//     <div ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
//       <motion.div style={{ position: 'absolute', inset: '-10%', y: bgY }}>
//         <Img
//           src={img(detail.backdrop_path)}
//           alt="backdrop"
//           style={{ width: '100%', height: '110%', objectFit: 'cover', filter: 'saturate(0.25) brightness(0.22)', transformOrigin: 'center' }}
//         />
//       </motion.div>
//       <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,8,8,0.98) 42%, rgba(8,8,8,0.6) 70%, transparent 100%)' }} />
//       <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 20%, rgba(8,8,8,0.55) 60%, ${C.bg} 100%)` }} />
//       <div style={{ position: 'absolute', bottom: 0, left: 0, width: 600, height: 500, background: `radial-gradient(ellipse at bottom left, ${C.accentGlow}, transparent 65%)`, pointerEvents: 'none' }} />
//       <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)', pointerEvents: 'none', opacity: 0.6 }} />

//       {/* Poster */}
//       <motion.div
//         initial={{ opacity: 0, y: -24, scale: 0.94 }}
//         animate={{ opacity: 1, y: 0, scale: 1 }}
//         transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
//         style={{ position: 'absolute', right: '9%', top: '50%', y: posterY, width: 210, zIndex: 10, transform: 'translateY(-50%)' }}
//       >
//         <div style={{ aspectRatio: '2/3', borderRadius: 2, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)', position: 'relative' }}>
//           <Img src={img(detail.poster_path, TMDB_POSTER)} alt={detail.name}
//             style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.5) brightness(0.8)' }} />
//           <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)' }} />
//           <div style={{ position: 'absolute', inset: 0, border: `1px solid rgba(212,175,122,0.12)`, borderRadius: 2 }} />
//           {genres && (
//             <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, background: 'rgba(8,8,8,0.92)', padding: '3px 8px', border: `1px solid ${C.accentDim}`, fontFamily: SANS }}>
//               {genres.split(' · ')[0]}
//             </div>
//           )}
//         </div>
//         <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'center' }}>
//           {detail.status && (
//             <span style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.textMuted, border: `1px solid ${C.border}`, padding: '3px 10px', fontFamily: SANS }}>
//               {detail.status}
//             </span>
//           )}
//         </div>
//       </motion.div>

//       {/* Hero content */}
//       <motion.div
//         initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
//         style={{ position: 'relative', zIndex: 10, padding: '0 52px 64px', maxWidth: 680 }}
//       >
//         {/* Eyebrow */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
//           {genres && (
//             <span style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, padding: '4px 10px', border: `1px solid ${C.accentDim}`, fontFamily: SANS }}>
//               {genres}
//             </span>
//           )}
//           <span style={{ color: C.textMuted, fontSize: 12 }}>·</span>
//           <span style={{ fontSize: 11, color: C.textSoft, letterSpacing: '0.08em', fontFamily: SANS }}>
//             {years}{country ? ` · ${country}` : ''}
//           </span>
//           {(detail.number_of_seasons || detail.number_of_episodes) && (
//             <>
//               <span style={{ color: C.textMuted, fontSize: 12 }}>·</span>
//               <span style={{ fontSize: 11, color: C.textSoft, letterSpacing: '0.08em', fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 4 }}>
//                 <Tv size={10} color={C.textMuted} />
//                 {detail.number_of_seasons ? `${detail.number_of_seasons} temp.` : ''}
//                 {detail.number_of_episodes ? ` · ${detail.number_of_episodes} ep.` : ''}
//               </span>
//             </>
//           )}
//         </div>

//         {/* Title */}
//         <div style={{ marginBottom: 4 }}>
//           <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(52px, 6vw, 76px)', fontWeight: 300, lineHeight: 0.92, letterSpacing: '-0.02em', color: C.text, margin: 0 }}>
//             {detail.name}
//           </h1>
//           {detail.original_name && detail.original_name !== detail.name && (
//             <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(24px, 2.5vw, 36px)', fontWeight: 300, lineHeight: 1, color: 'rgba(226,226,226,0.22)', letterSpacing: '-0.01em', marginTop: 6 }}>
//               {detail.original_name}
//             </div>
//           )}
//         </div>

//         {/* Creators */}
//         {creators.length > 0 && (
//           <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, color: C.textSoft, marginBottom: 28, letterSpacing: '0.02em', marginTop: 18 }}>
//             Creada por{' '}
//             {creators.map((c, i) => (
//               <span key={c}>
//                 <span style={{ color: C.accent }}>{c}</span>
//                 {i < creators.length - 1 && <span style={{ color: C.textMuted }}> & </span>}
//               </span>
//             ))}
//           </div>
//         )}

//         {/* Rating */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
//           <StarRating value={userRating} onChange={onRatingChange} />
//           {detail.vote_average != null && (
//             <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, paddingLeft: 24, borderLeft: `1px solid ${C.border}` }}>
//               <span style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 300, color: C.gold, lineHeight: 1 }}>{scoreOf5}</span>
//               <span style={{ fontSize: 14, color: C.textMuted, fontFamily: SANS }}>/5</span>
//               <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, marginLeft: 4 }}>en CineVault</span>
//             </div>
//           )}
//           {detail.vote_count != null && (
//             <div style={{ fontSize: 11, color: C.textMuted, fontFamily: SANS }}>{detail.vote_count.toLocaleString('es-ES')} ratings</div>
//           )}
//         </div>

//         {/* Action buttons */}
//         <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
//           <button onClick={onVaultToggle} style={{ padding: '12px 28px', background: inVault ? C.accentDim : C.accent, color: C.bg, border: 'none', fontFamily: SANS, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
//             {inVault ? '✓ En mi Vault' : '+ Vault'}
//           </button>
//           <button style={{ padding: '12px 22px', background: 'transparent', color: C.textSoft, border: `1px solid ${C.border}`, fontFamily: SANS, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 7 }}
//             onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.textSoft; (e.currentTarget as HTMLElement).style.color = C.text }}
//             onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textSoft }}>
//             <List size={13} strokeWidth={1.5} /> Añadir a lista
//           </button>
//           {[
//             { icon: <Bookmark size={15} strokeWidth={1.5} fill={inWatchlist ? C.accent : 'none'} />, active: inWatchlist, action: onWatchlistToggle, title: 'Watchlist' },
//             { icon: <Heart size={15} strokeWidth={1.5} fill={liked ? C.gold : 'none'} />, active: liked, action: onLikedToggle, title: 'Me gusta' },
//             { icon: <Share2 size={15} strokeWidth={1.5} />, active: false, action: () => { }, title: 'Compartir' },
//           ].map(btn => (
//             <button key={btn.title} title={btn.title} onClick={btn.action}
//               style={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: btn.active ? C.accent : C.textSoft, border: `1px solid ${btn.active ? C.accentDim : C.border}`, cursor: 'pointer', transition: 'all 0.2s' }}
//               onMouseEnter={e => { if (!btn.active) { (e.currentTarget as HTMLElement).style.borderColor = C.accentDim; (e.currentTarget as HTMLElement).style.color = C.accent } }}
//               onMouseLeave={e => { if (!btn.active) { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textSoft } }}>
//               {btn.icon}
//             </button>
//           ))}
//         </div>
//       </motion.div>

//       {/* Scroll hint */}
//       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
//         style={{ position: 'absolute', bottom: 28, left: 52, display: 'flex', alignItems: 'center', gap: 12, zIndex: 10 }}>
//         <div style={{ width: 32, height: 1, background: C.textMuted, position: 'relative', overflow: 'hidden' }}>
//           <motion.div animate={{ x: ['-100%', '0%', '100%'] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
//             style={{ position: 'absolute', inset: 0, background: C.accent }} />
//         </div>
//         <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS }}>Seguir leyendo</span>
//       </motion.div>
//     </div>
//   )
// }

// ─── EPISODE TRACKER ──────────────────────────────────────────
function EpisodeTracker({
  detail,
  watchedIds,
}: {
  detail: TVDetailApi;
  watchedIds: Set<string>;
}) {
  const seasons =
    detail.season_details?.filter((s) => s.season_number > 0) || [];
  const total = detail.number_of_episodes || 0;
  const watched = watchedIds.size;
  const pct = total > 0 ? Math.round((watched / total) * 100) : 0;

  let cumulative = 0;
  const boundaries = seasons.map((s) => {
    const start = total > 0 ? cumulative / total : 0;
    cumulative += s.episode_count || 0;
    return { season: s.season_number, start: start * 100, subtitle: s.name };
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Tu recorrido</SectionLabel>
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          padding: "28px 32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 42,
              fontWeight: 300,
              color: C.text,
              lineHeight: 1,
            }}
          >
            {watched}
          </span>
          <span style={{ fontFamily: SERIF, fontSize: 20, color: C.textSoft }}>
            de {total} episodios
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: SERIF,
              fontSize: 28,
              color: C.accent,
              lineHeight: 1,
            }}
          >
            {pct}%
          </span>
        </div>
        <div
          style={{
            position: "relative",
            height: 6,
            background: C.border,
            borderRadius: 2,
            marginBottom: 18,
            overflow: "visible",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              height: "100%",
              background: `linear-gradient(to right, ${C.accentDim}, ${C.accent})`,
              borderRadius: 2,
              position: "absolute",
            }}
          />
          {boundaries.slice(1).map((b) => (
            <div
              key={b.season}
              style={{
                position: "absolute",
                top: -3,
                left: `${b.start}%`,
                width: 1,
                height: 12,
                background: C.bg,
                zIndex: 2,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {seasons.map((s, i) => {
            const epCount = s.episode_count || 0;
            const width = total > 0 ? (epCount / total) * 100 : 0;
            const seasonWatched = (s.episodes || []).filter((e) =>
              watchedIds.has(`s${s.season_number}e${e.episode_number}`),
            ).length;
            return (
              <div
                key={s.id}
                style={{
                  width: `${width}%`,
                  paddingRight: i < seasons.length - 1 ? 8 : 0,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: C.textMuted,
                    fontFamily: SANS,
                    marginBottom: 2,
                  }}
                >
                  T{s.season_number}
                </div>
                <div
                  style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}
                >
                  {seasonWatched}/{epCount}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

// ─── SYNOPSIS ─────────────────────────────────────────────────
function Synopsis({ detail }: { detail: TVDetailApi }) {
  const [expanded, setExpanded] = useState(false);
  if (!detail.overview) return null;
  const short = detail.overview.slice(0, 300);
  const hasMore = detail.overview.length > 300;
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Sinopsis</SectionLabel>
      <p
        style={{
          fontFamily: SERIF,
          fontSize: 21,
          fontWeight: 300,
          lineHeight: 1.75,
          color: C.textSoft,
          maxWidth: 640,
          margin: "0 0 16px",
        }}
      >
        {expanded ? detail.overview : short}
        {hasMore && !expanded ? "…" : ""}
      </p>
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.accent,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 0,
          }}
        >
          {expanded ? "Leer menos" : "Leer más"}
          <ChevronRight
            size={12}
            style={{
              transform: expanded ? "rotate(90deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </button>
      )}
    </motion.section>
  );
}

// ─── GALLERY ──────────────────────────────────────────────────
function Gallery({ detail }: { detail: TVDetailApi }) {
  const [hov, setHov] = useState<number | null>(null);
  const backdrops = (detail.images?.backdrops || []).slice(0, 5);
  if (backdrops.length === 0) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Imágenes de la serie</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gridTemplateRows: "auto auto",
          gap: 4,
        }}
      >
        {backdrops.map((bd, i) => (
          <div
            key={i}
            style={{
              gridRow: i === 0 ? "span 2" : undefined,
              position: "relative",
              overflow: "hidden",
              aspectRatio: i === 0 ? undefined : "4/3",
              cursor: "pointer",
              ...(i === 0 ? { minHeight: 300 } : {}),
            }}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
          >
            <Img
              src={img(bd.file_path, TMDB_THUMB)}
              alt={`still ${i + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter:
                  hov === i
                    ? "saturate(0.7) brightness(0.75)"
                    : "saturate(0.4) brightness(0.6)",
                transform: hov === i ? "scale(1.03)" : "scale(1)",
                transition: "all 0.45s",
              }}
            />
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── PLATFORMS ────────────────────────────────────────────────
function Platforms({ detail }: { detail: TVDetailApi }) {
  const providers = useMemo(() => {
    if (!detail.watch_providers)
      return [] as { region: string; names: string[] }[];
    const preferred = ["ES", "US", "AR", "MX"];
    const entries = Object.entries(detail.watch_providers);
    const selected = preferred
      .map((code) => ({ region: code, entry: detail.watch_providers![code] }))
      .filter((x) => !!x.entry);
    const source =
      selected.length > 0
        ? selected.map((x) => ({ region: x.region, entry: x.entry }))
        : entries.slice(0, 3).map(([region, entry]) => ({ region, entry }));
    return source
      .map(({ region, entry }) => {
        const all = [
          ...(entry.flatrate || []),
          ...(entry.rent || []),
          ...(entry.buy || []),
        ];
        const names = Array.from(
          new Set(all.map((p) => p.provider_name)),
        ).slice(0, 6);
        return { region, names };
      })
      .filter((x) => x.names.length > 0);
  }, [detail.watch_providers]);
  if (providers.length === 0) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 32 }}
    >
      <SectionLabel>Dónde verla</SectionLabel>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {providers.flatMap(({ region, names }) =>
          names.map((name) => (
            <div
              key={`${region}-${name}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: C.surface,
                border: `1px solid ${C.border}`,
              }}
            >
              <span style={{ fontFamily: SANS, fontSize: 11, color: C.text }}>
                {name}
              </span>
              <span
                style={{ fontSize: 9, color: C.textMuted, fontFamily: SANS }}
              >
                {region}
              </span>
            </div>
          )),
        )}
      </div>
    </motion.section>
  );
}

// ─── SIMILAR ──────────────────────────────────────────────────
function SimilarSeries({ detail }: { detail: TVDetailApi }) {
  const [hov, setHov] = useState<number | null>(null);
  const similar = (detail.similar?.results || [])
    .slice(0, 6)
    .filter((s) => s.poster_path);
  if (similar.length === 0) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Series que te van a gustar</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 14,
        }}
      >
        {similar.map((s, i) => (
          <Link
            key={s.id}
            to={`/tv/${slugify(s.id, s.name || "serie")}`}
            style={{ textDecoration: "none" }}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
          >
            <div
              style={{
                aspectRatio: "2/3",
                borderRadius: 2,
                overflow: "hidden",
                marginBottom: 10,
                transform: hov === i ? "translateY(-4px)" : "none",
                transition: "transform 0.3s",
              }}
            >
              <Img
                src={img(s.poster_path, TMDB_THUMB)}
                alt={s.name || ""}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter:
                    hov === i
                      ? "saturate(0.9) brightness(0.85)"
                      : "saturate(0.5) brightness(0.65)",
                  transition: "filter 0.4s",
                }}
              />
            </div>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 14,
                color: C.text,
                lineHeight: 1.3,
                marginBottom: 2,
              }}
            >
              {s.name}
            </div>
            <div style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>
              {formatYear(s.first_air_date)}
            </div>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}

// ─── REVIEWS ──────────────────────────────────────────────────

// ─── SIDEBAR ──────────────────────────────────────────────────

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function TVDetailPage() {
  const { id: slugOrId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { detail, loading, error } = useTVDetail(slugOrId);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());

  const {
    userRating,
    setUserRating,
    isFavorite,
    inWatchlist,
    inDiary,
    reviews,
    myReviewId,
    isAuthenticated,
    viewer,
    reviewLogOpen,
    setReviewLogOpen,
    reviewLogForm,
    setReviewLogForm,
    reviewLogSaving,
    handleVault,
    handleWatchlist,
    handleWriteReview,
    handleEditReview,
    handleDeleteReview,
    handleSaveReviewLog,
  } = useUserActions(detail?.id);

  if (!slugOrId) return null;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          display: "grid",
          placeItems: "center",
          color: C.textSoft,
          fontFamily: SANS,
          fontSize: 13,
          letterSpacing: "0.1em",
        }}
      >
        Cargando serie...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          display: "grid",
          placeItems: "center",
          color: C.textSoft,
          fontFamily: SANS,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              color: "#ff9b9b",
              marginBottom: 16,
              fontFamily: SERIF,
              fontSize: 18,
            }}
          >
            {error || "No encontramos la serie."}
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              color: C.textSoft,
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              padding: "10px 20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ChevronLeft size={12} /> Volver
          </button>
        </div>
      </div>
    );
  }

  const inVault = inDiary || isFavorite;
  const totalEpisodes =
    detail.number_of_episodes ||
    detail.season_details?.reduce(
      (acc, s) => acc + (s.episode_count || 0),
      0,
    ) ||
    0;
  const runtimeLabel =
    totalEpisodes > 0
      ? `${totalEpisodes} episodios`
      : detail.episode_run_time?.[0]
        ? `${detail.episode_run_time[0]} min / ep`
        : "Episodios desconocidos";

  const directorObj = detail?.created_by?.[0]
    ? {
        id: detail.created_by[0].id,
        name: detail.created_by.map((c) => c.name).join(" & "),
      }
    : null;

  const handleRate = (val: number) => setUserRating(val);
  const handleToggleVault = () => handleVault();
  const handleToggleWatchlist = () => handleWatchlist();
  // TVDetail currently lacks full implementations for these:
  const handleToggleFavorite = () => {
    /* TODO */
  };
  const handleAddToList = () => {
    /* TODO */
  };
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
  };

  const modalMovie = {
    id: detail.id,
    title: detail.name || "Sin título",
    poster_path: detail.poster_path || null,
  };

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        fontFamily: SANS,
      }}
    >
      <Grain />

      <ReviewLogModal
        open={reviewLogOpen}
        movie={modalMovie}
        membership={viewer?.membership}
        role={viewer?.role}
        text={reviewLogForm.text}
        rating={reviewLogForm.rating}
        mode={reviewLogForm.mode}
        veredicto={reviewLogForm.veredicto}
        contieneSpoilers={reviewLogForm.contieneSpoilers}
        citaDialogo={reviewLogForm.citaDialogo}
        citaPersonaje={reviewLogForm.citaPersonaje}
        timestamps={reviewLogForm.timestamps}
        dimensions={reviewLogForm.dimensions}
        liked={reviewLogForm.liked}
        seenDate={reviewLogForm.seenDate}
        seenBefore={reviewLogForm.seenBefore}
        saving={reviewLogSaving}
        onClose={() => setReviewLogOpen(false)}
        onTextChange={(value) =>
          setReviewLogForm((prev) => ({ ...prev, text: value }))
        }
        onRatingChange={(value) =>
          setReviewLogForm((prev) => ({ ...prev, rating: value }))
        }
        onModeChange={(value) =>
          setReviewLogForm((prev) => ({ ...prev, mode: value }))
        }
        onVeredictoChange={(value) =>
          setReviewLogForm((prev) => ({ ...prev, veredicto: value }))
        }
        onContieneSpoilersChange={(value) =>
          setReviewLogForm((prev) => ({ ...prev, contieneSpoilers: value }))
        }
        onCitaDialogoChange={(value) =>
          setReviewLogForm((prev) => ({ ...prev, citaDialogo: value }))
        }
        onCitaPersonajeChange={(value) =>
          setReviewLogForm((prev) => ({ ...prev, citaPersonaje: value }))
        }
        onDimensionsChange={(key, value) =>
          setReviewLogForm((prev) => ({
            ...prev,
            dimensions: { ...prev.dimensions, [key]: value },
          }))
        }
        onAddTimestamp={() =>
          setReviewLogForm((prev) => ({
            ...prev,
            timestamps: [...prev.timestamps, { minuto: "", descripcion: "" }],
          }))
        }
        onTimestampChange={(index, field, value) =>
          setReviewLogForm((prev) => ({
            ...prev,
            timestamps: prev.timestamps.map((stamp, stampIndex) =>
              stampIndex === index ? { ...stamp, [field]: value } : stamp,
            ),
          }))
        }
        onRemoveTimestamp={(index) =>
          setReviewLogForm((prev) => ({
            ...prev,
            timestamps: prev.timestamps.filter(
              (_, stampIndex) => stampIndex !== index,
            ),
          }))
        }
        onToggleLike={() =>
          setReviewLogForm((prev) => ({ ...prev, liked: !prev.liked }))
        }
        onSeenDateChange={(value) =>
          setReviewLogForm((prev) => ({ ...prev, seenDate: value }))
        }
        onSeenBeforeChange={(value) =>
          setReviewLogForm((prev) => ({ ...prev, seenBefore: value }))
        }
        onSave={handleSaveReviewLog}
      />

      <Hero
        title={detail.name || "Sin título"}
        originalTitle={detail.original_name || detail.name}
        releaseYear={
          detail.first_air_date
            ? new Date(detail.first_air_date).getFullYear()
            : "----"
        }
        country={detail.production_countries?.[0]?.name || "País no disponible"}
        runtime={runtimeLabel}
        genresText={
          (detail.genres || [])
            .slice(0, 2)
            .map((genre) => genre.name)
            .join(" · ") || "Sin género"
        }
        director={directorObj}
        score={((detail.vote_average || 0) / 2).toFixed(1)}
        votes={(detail.vote_count || 0).toLocaleString("es-ES")}
        posterPath={detail.poster_path}
        backdropPath={detail.backdrop_path}
        mediaType="tv"
        userRating={userRating}
        inVault={inVault}
        inWatchlist={inWatchlist}
        liked={isFavorite}
        onRate={handleRate}
        onToggleVault={handleToggleVault}
        onToggleWatchlist={handleToggleWatchlist}
        onToggleFavorite={handleToggleFavorite}
        onAddToList={handleAddToList}
        onWriteReview={handleWriteReview}
        onShare={handleShare}
      />

      {detail.tagline && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="tv-detail-quote"
          style={{
            borderTop: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
            background: C.surface,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 400,
              height: 200,
              background: `radial-gradient(ellipse, ${C.accentGlow}, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              fontFamily: SERIF,
              fontSize: "clamp(18px, 2.2vw, 26px)",
              fontStyle: "italic",
              fontWeight: 300,
              lineHeight: 1.7,
              color: C.textSoft,
              maxWidth: 760,
              margin: "0 auto",
              position: "relative",
            }}
          >
            <span style={{ color: C.accent, fontSize: "1.3em" }}>"</span>
            {detail.tagline}
            <span style={{ color: C.accent, fontSize: "1.3em" }}>"</span>
          </div>
        </motion.div>
      )}

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "72px 52px 0",
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 64,
          alignItems: "flex-start",
        }}
      >
        <main>
          <Synopsis detail={detail} />
          {detail.season_details?.some(
            (s) => s.season_number > 0 && (s.episode_count || 0) > 0,
          ) && <EpisodeTracker detail={detail} watchedIds={watchedIds} />}
          <SeasonsPanel
            detail={detail}
            watchedIds={watchedIds}
            setWatchedIds={setWatchedIds}
            isAuthenticated={isAuthenticated}
          />
          <Gallery detail={detail} />
          <CastCrew
            cast={detail.credits?.cast || []}
            crew={detail.credits?.crew || []}
          />
          <ReviewsSection
            reviews={reviews}
            tvTitle={detail.name || ""}
            tvTmdbId={detail.id}
            viewerId={viewer?.id ?? null}
            myReviewId={myReviewId}
            onWriteReview={handleWriteReview}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
          />
          <SimilarSeries detail={detail} />
        </main>
        <aside>
          <div style={{ position: "sticky", top: 80 }}>
            <ScoreCard detail={detail} />
            <TechnicalSheet detail={detail} />
            <Platforms detail={detail} />
          </div>
        </aside>
      </div>

      <div
        style={{
          borderTop: `1px solid ${C.border}`,
          padding: "20px 52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 40,
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 16,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: C.textMuted,
          }}
        >
          Cine<span style={{ color: C.accent }}>Vault</span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.textMuted,
            fontFamily: SERIF,
            fontStyle: "italic",
          }}
        >
          "Hay series que también te cambian. Esas también cuentan."
        </div>
      </div>
    </div>
  );
}
