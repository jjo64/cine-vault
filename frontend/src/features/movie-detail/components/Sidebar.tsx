import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { C, SERIF, SANS } from '../constants';
import type { MovieDetailApi } from '../../../services/movieDetailServices';
import type { SimilarFilm } from '../types';
import { Img } from './Img';
import { getCrewByJob, mapPlatforms } from '../utils/mapping';

interface SidebarProps {
  movie: MovieDetailApi;
  similar: SimilarFilm[];
  directorObj: { id: number; name: string } | null;
}

const textClampOneLine = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export function Sidebar({
  movie,
  similar,
  directorObj,
}: SidebarProps) {
  const photography = getCrewByJob(movie, ['Director of Photography', 'Cinematography']);
  const music = getCrewByJob(movie, ['Original Music Composer', 'Music', 'Composer']);
  const production = movie.production_companies?.[0]?.name || 'Desconocido';
  const platforms = mapPlatforms(movie);

  const metaRows = [
    { key: 'País', val: movie.production_countries?.[0]?.name || 'Desconocido' },
    { key: 'Año', val: movie.release_date ? String(new Date(movie.release_date).getFullYear()) : '----' },
    { key: 'Duración', val: movie.runtime ? `${movie.runtime} min` : 'No disponible' },
    { key: 'Idioma', val: movie.spoken_languages?.[0]?.english_name || movie.spoken_languages?.[0]?.name || 'Desconocido' },
    { key: 'Fotografía', val: photography },
    { key: 'Música', val: music },
    { key: 'Producción', val: production },
  ];

  return (
    <aside>
      <div className="md-sidebar-sticky">
        <div className="md-sidebar-panel" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>Ficha técnica</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="md-sidebar-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: SANS }}>Director</span>
              {directorObj ? (
                <Link
                  to={`/person/${directorObj.id}`}
                  className="md-sidebar-value"
                  style={{ fontFamily: SERIF, fontSize: 16, color: C.accent, maxWidth: '100%', ...textClampOneLine, textDecoration: 'none', borderBottom: `1px solid ${C.accentDim}`, paddingBottom: 1 }}
                >
                  {directorObj.name}
                </Link>
              ) : (
                <span className="md-sidebar-value" style={{ fontFamily: SERIF, fontSize: 16, color: C.textSoft, maxWidth: '100%', ...textClampOneLine }}>Desconocido</span>
              )}
            </div>
            {metaRows.map((row) => (
              <div key={row.key} className="md-sidebar-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: SANS }}>{row.key}</span>
                <span className="md-sidebar-value" style={{ fontFamily: SERIF, fontSize: 16, color: C.textSoft, maxWidth: '100%', ...textClampOneLine }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md-sidebar-panel" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>Géneros</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(movie.genres || []).map((genre) => (
              <span key={genre.id} style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textSoft, border: `1px solid ${C.border}`, padding: '4px 10px', fontFamily: SANS }}>
                {genre.name}
              </span>
            ))}
          </div>
        </div>

        <div className="md-sidebar-panel" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>Dónde ver</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {platforms.length === 0 && <div style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>No hay plataformas disponibles.</div>}
            {platforms.map((platform) => (
              <a key={`${platform.name}-${platform.type}`} href={platform.url} target="_blank" rel="noreferrer" className="md-sidebar-platforms" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 12px', background: C.elevated, border: '1px solid transparent', textDecoration: 'none', cursor: 'pointer' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontFamily: SANS, color: C.text, ...textClampOneLine }}>{platform.name}</div>
                  <div style={{ fontSize: 11, fontFamily: SANS, color: C.textMuted }}>{platform.type}</div>
                </div>
                <ExternalLink className="md-platform-icon" size={12} color={C.textMuted} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        <div className="md-sidebar-panel" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 18, fontFamily: SANS }}>También te puede interesar</div>
          <div className="md-sidebar-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {similar.map((film) => (
              <Link key={film.id} to={`/movie/${film.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ aspectRatio: '2/3', borderRadius: 1, overflow: 'hidden', background: C.elevated, marginBottom: 7, position: 'relative' }}>
                  <Img src={film.img} alt={film.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.4)' }} />
                </div>
                <div style={{ fontSize: 11, color: C.text, fontFamily: SANS, lineHeight: 1.3 }}>{film.title}</div>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: SANS }}>{film.year || '----'}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
