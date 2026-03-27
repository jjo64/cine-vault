import { motion } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import type { MovieDetailApi, ReviewMode } from '../../../services/movieDetailServices';
import type { AppReview } from '../types';
import { REVIEW_DIMENSIONS } from '../constants';
import { Img } from './Img';
import { StarRating } from './StarRating';

interface ReviewLogModalProps {
  open: boolean;
  movie: MovieDetailApi | null;
  membership?: string | null;
  role?: string | null;
  text: string;
  rating: number;
  mode: ReviewMode;
  veredicto: string;
  contieneSpoilers: boolean;
  citaDialogo: string;
  citaPersonaje: string;
  timestamps: Array<{ minuto: string; descripcion: string }>;
  dimensions: AppReview['dimensions'];
  liked: boolean;
  seenDate: string;
  seenBefore: boolean;
  saving: boolean;
  onClose: () => void;
  onTextChange: (value: string) => void;
  onRatingChange: (value: number) => void;
  onModeChange: (value: ReviewMode) => void;
  onVeredictoChange: (value: string) => void;
  onContieneSpoilersChange: (value: boolean) => void;
  onCitaDialogoChange: (value: string) => void;
  onCitaPersonajeChange: (value: string) => void;
  onDimensionsChange: (key: keyof AppReview['dimensions'], value: number) => void;
  onAddTimestamp: () => void;
  onTimestampChange: (index: number, field: 'minuto' | 'descripcion', value: string) => void;
  onRemoveTimestamp: (index: number) => void;
  onToggleLike: () => void;
  onSeenDateChange: (value: string) => void;
  onSeenBeforeChange: (value: boolean) => void;
  onSave: () => void;
}

export function ReviewLogModal({
  open,
  movie,
  membership,
  role,
  text,
  rating,
  mode,
  veredicto,
  contieneSpoilers,
  citaDialogo,
  citaPersonaje,
  timestamps,
  dimensions,
  liked,
  seenDate,
  seenBefore,
  saving,
  onClose,
  onTextChange,
  onRatingChange,
  onModeChange,
  onVeredictoChange,
  onContieneSpoilersChange,
  onCitaDialogoChange,
  onCitaPersonajeChange,
  onDimensionsChange,
  onAddTimestamp,
  onTimestampChange,
  onRemoveTimestamp,
  onToggleLike,
  onSeenDateChange,
  onSeenBeforeChange,
  onSave,
}: ReviewLogModalProps) {
  if (!open || !movie) return null;

  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : '/no-poster.svg';
  const canUseCriticalMode = (String(membership || '').toLowerCase() === 'pro') || (String(role || '').toLowerCase() === 'admin');
  const criticalLocked = mode === 'CRITICO' && !canUseCriticalMode;

  return (
    <div onClick={onClose} className="md-modal-overlay">
      <motion.div
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="md-modal-card"
      >
        <div className="md-modal-header">
          <div className="md-modal-header-title">
            <Heart size={12} strokeWidth={1.6} fill="rgba(212,175,122,0.18)" />
            Review / Log · {mode}
          </div>
          <button onClick={onClose} className="md-modal-close-btn">
            <X size={14} />
          </button>
        </div>

        <div className="md-modal-body">
          <div>
            <div className="md-modal-poster-wrapper">
              <Img
                src={posterUrl}
                alt={movie.title}
                loading="lazy"
                width={260}
                height={390}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div className="md-modal-movie-title">{movie.title}</div>
          </div>

          <div>
            <div className="md-modal-mode-tabs">
              {(['RAPIDO', 'ESTANDAR', 'CRITICO'] as const).map((candidate) => {
                const blocked = candidate === 'CRITICO' && !canUseCriticalMode;
                const active = mode === candidate;
                return (
                  <button
                    key={candidate}
                    onClick={() => !blocked && onModeChange(candidate)}
                    className={`md-modal-mode-btn ${active ? 'md-modal-mode-btn--active' : ''}`}
                    title={blocked ? 'Modo CRITICO disponible para plan Pro (o Admin)' : ''}
                    disabled={blocked}
                  >
                    {candidate}
                  </button>
                );
              })}
            </div>

            {!canUseCriticalMode && (
              <div style={{ marginBottom: 12, color: '#A1A1A1', fontFamily: 'Syne, sans-serif', fontSize: 11 }}>
                El modo CRITICO esta bloqueado en tu plan. Si te interesa desbloquearlo, actualiza a Pro desde Settings suscripcion.
              </div>
            )}

            <textarea
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
              rows={mode === 'CRITICO' ? 10 : 5}
              placeholder="Escribe tu review o log..."
              className="md-modal-textarea"
            />

            {mode !== 'RAPIDO' && (
              <input
                value={veredicto}
                onChange={(event) => onVeredictoChange(event.target.value)}
                placeholder="Veredicto final (obligatorio en ESTANDAR)"
                className="md-modal-input"
              />
            )}

            {(mode === 'ESTANDAR' || mode === 'CRITICO') && (
              <div style={{ marginBottom: 12 }}>
                <div className="md-modal-section-title">Dimensiones</div>
                <div className="md-modal-dimensions-grid">
                  {REVIEW_DIMENSIONS.map((entry) => (
                    <div key={entry.key} className="md-modal-dimension-item">
                      <span className="md-modal-dimension-label">{entry.label}</span>
                      <div style={{ flex: 1 }}>
                        <StarRating
                          value={dimensions[entry.key] || 0}
                          onChange={(next) => onDimensionsChange(entry.key, next)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mode === 'CRITICO' && (
              <>
                <textarea
                  value={citaDialogo}
                  onChange={(event) => onCitaDialogoChange(event.target.value)}
                  rows={2}
                  placeholder="Cita destacada"
                  className="md-modal-textarea"
                  style={{ marginBottom: 8 }}
                />
                <input
                  value={citaPersonaje}
                  onChange={(event) => onCitaPersonajeChange(event.target.value)}
                  placeholder="Personaje de la cita"
                  className="md-modal-input"
                  style={{ marginBottom: 8 }}
                />
                <div style={{ marginBottom: 8 }}>
                  <div className="md-modal-section-title">Timestamps</div>
                  {timestamps.map((stamp, index) => (
                    <div key={`${stamp.minuto}-${index}`} className="md-modal-timestamp-row">
                      <input
                        value={stamp.minuto}
                        onChange={(event) => onTimestampChange(index, 'minuto', event.target.value)}
                        placeholder="00:00"
                        className="md-modal-input"
                        style={{ padding: '8px 10px', fontSize: 12, marginBottom: 0 }}
                      />
                      <input
                        value={stamp.descripcion}
                        onChange={(event) => onTimestampChange(index, 'descripcion', event.target.value)}
                        placeholder="Momento y por que importa"
                        className="md-modal-input"
                        style={{ padding: '8px 10px', fontSize: 14, marginBottom: 0 }}
                      />
                      <button 
                        onClick={() => onRemoveTimestamp(index)} 
                        className="md-modal-close-btn"
                        style={{ width: 'auto', padding: '0 8px' }}
                      >
                        x
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={onAddTimestamp} 
                    className="md-modal-mode-btn"
                    style={{ marginTop: 4 }}
                  >
                    Agregar timestamp
                  </button>
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div className="md-modal-section-title" style={{ marginBottom: 0 }}>Rating</div>
              <StarRating value={rating} onChange={onRatingChange} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <button
                onClick={onToggleLike}
                className={`md-modal-mode-btn ${liked ? 'md-modal-mode-btn--active' : ''}`}
                style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', padding: 0 }}
                title="Me gusta"
              >
                <Heart size={14} strokeWidth={1.6} fill={liked ? "#C8A96E" : 'none'} />
              </button>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#A1A1A1', fontFamily: 'Syne, sans-serif', fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={seenBefore}
                  onChange={(event) => onSeenBeforeChange(event.target.checked)}
                  style={{ accentColor: '#D4AF7A' }}
                />
                Ya la había visto antes
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#A1A1A1', fontFamily: 'Syne, sans-serif', fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={contieneSpoilers}
                  onChange={(event) => onContieneSpoilersChange(event.target.checked)}
                  style={{ accentColor: '#D4AF7A' }}
                />
                Contiene spoilers
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A1A1A1' }}>Vista</span>
                <input
                  type="date"
                  value={seenDate}
                  onChange={(event) => onSeenDateChange(event.target.value)}
                  className="md-modal-input"
                  style={{ padding: '8px 10px', fontSize: 12, marginBottom: 0, width: 'auto' }}
                />
              </div>
            </div>

            {criticalLocked && (
              <div style={{ marginTop: 8, color: '#ffb5b5', fontFamily: 'Syne, sans-serif', fontSize: 11 }}>
                El modo CRITICO requiere plan Pro o permisos Admin.
              </div>
            )}
          </div>
        </div>

        <div className="md-modal-footer">
          <button onClick={onClose} className="md-modal-mode-btn">
            Cancelar
          </button>
          <button onClick={onSave} disabled={saving} className="md-modal-btn-save">
            <Heart size={12} strokeWidth={1.5} fill={saving ? 'none' : "rgba(212,175,122,0.18)"} />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
