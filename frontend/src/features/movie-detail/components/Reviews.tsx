import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { C, SERIF, SANS, REVIEW_DIMENSIONS } from '../constants';
import type { AppReview } from '../types';
import { SectionLabel } from './SectionLabel';
import { Img } from './Img';
import { ReviewRadar } from './ReviewRadar';
import { initials, formatDateLabel } from '../../../utils/stringUtils';

interface ReviewsProps {
  reviews: AppReview[];
  likedReviewIds: Set<number>;
  viewerId: number | null;
  onToggleLike: (reviewId: number, liked: boolean) => void;
  onReply: (reviewId: number) => void;
  onEditReview: (review: AppReview) => void;
  onDeleteReview: (review: AppReview) => void;
  onWriteReview: () => void;
}

export function Reviews({
  reviews,
  likedReviewIds,
  viewerId,
  onToggleLike,
  onReply,
  onEditReview,
  onDeleteReview,
  onWriteReview,
}: ReviewsProps) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }} 
      transition={{ duration: 0.8 }} 
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Reseñas de la comunidad</SectionLabel>

      {reviews.length === 0 && (
        <div style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>
          Aún no hay reseñas para esta película.
        </div>
      )}

      {reviews.map((review, index) => {
        const liked = likedReviewIds.has(review.id);
        const likesCount = review.likes + (liked ? 1 : 0);
        return (
          <motion.div 
            key={review.id} 
            initial={{ opacity: 0, y: 12 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6, delay: index * 0.1 }} 
            style={{ borderBottom: `1px solid ${C.border}`, padding: '28px 0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <Link to={`/${encodeURIComponent(review.username)}`} style={{ textDecoration: 'none' }}>
                {review.avatarUrl ? (
                  <Img
                    src={review.avatarUrl}
                    alt={review.username}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0, cursor: 'pointer' }}
                  />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.elevated, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 16, color: C.textSoft, flexShrink: 0, cursor: 'pointer' }}>
                    {initials(review.username)}
                  </div>
                )}
              </Link>
              <div>
                <Link to={`/${encodeURIComponent(review.username)}`} style={{ textDecoration: 'none' }}>
                  <div style={{ fontSize: 13, fontFamily: SANS, color: C.text, cursor: 'pointer' }}>{review.username}</div>
                </Link>
                <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, marginTop: 1, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>{formatDateLabel(review.createdAt)}</span>
                  <span style={{ border: `1px solid ${C.border}`, padding: '2px 6px', letterSpacing: '0.08em' }}>{review.mode}</span>
                  {review.tiempoLecturaMin ? <span>{review.tiempoLecturaMin} min lectura</span> : null}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <span key={value} style={{ fontSize: 13, color: value <= review.rating ? C.gold : C.textMuted }}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            {review.veredicto ? (
              <div style={{ marginBottom: 10, fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent }}>
                Veredicto: {review.veredicto}
              </div>
            ) : null}

            <Link
              to={`/${encodeURIComponent(review.username)}/movie/${review.id}`}
              style={{ textDecoration: 'none' }}
            >
              <p style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontSize: 18,
                lineHeight: 1.75,
                color: C.textSoft,
                margin: '0 0 14px',
                cursor: 'pointer',
                transition: 'color 0.18s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.textSoft)}
              >
                {review.content}
              </p>
            </Link>

            {review.quote?.dialogo ? (
              <blockquote style={{ margin: '0 0 12px', padding: '10px 12px', borderLeft: `2px solid ${C.accentDim}`, background: C.elevated, fontFamily: SERIF, fontSize: 15, color: C.text }}>
                "{review.quote.dialogo}"
                {review.quote.personaje ? <span style={{ display: 'block', marginTop: 4, color: C.textSoft }}>- {review.quote.personaje}</span> : null}
              </blockquote>
            ) : null}

            {(review.timestamps.length > 0 || review.contieneSpoilers) && (
              <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {review.contieneSpoilers ? (
                  <span style={{ border: '1px solid #7f3f3f', color: '#ffb6b6', fontFamily: SANS, fontSize: 10, padding: '3px 8px', letterSpacing: '0.08em' }}>
                    SPOILERS
                  </span>
                ) : null}
                {review.timestamps.map((stamp, stampIndex) => (
                  <span key={`${review.id}-stamp-${stampIndex}`} style={{ border: `1px solid ${C.border}`, color: C.textSoft, fontFamily: SANS, fontSize: 10, padding: '3px 8px' }}>
                    {stamp.minuto} {stamp.descripcion}
                  </span>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <ReviewRadar values={review.dimensions} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 4, flex: 1 }}>
                {REVIEW_DIMENSIONS.map((entry) => {
                  const value = review.dimensions[entry.key as keyof typeof review.dimensions]
                  return (
                    <div key={`${review.id}-${entry.key}`} style={{ fontFamily: SANS, fontSize: 11, color: C.textSoft }}>
                      {entry.label}: {value ? value.toFixed(1) : '-'}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <button onClick={() => onToggleLike(review.id, liked)} className="review-action-btn" style={{ background: 'none', border: 'none', color: C.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: 0 }}>
                <Heart size={13} strokeWidth={1.5} fill={liked ? C.accent : 'none'} color={liked ? C.accent : 'currentColor'} />
                {likesCount}
              </button>
              <button onClick={() => onReply(review.id)} className="review-action-btn" style={{ background: 'none', border: 'none', color: C.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: 0 }}>
                <MessageSquare size={13} strokeWidth={1.5} /> Responder
              </button>
              {viewerId === review.userId && (
                <>
                  <button onClick={() => onEditReview(review)} className="review-action-btn" style={{ background: 'none', border: 'none', color: C.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: 0 }}>
                    <Pencil size={13} strokeWidth={1.5} /> Editar
                  </button>
                  <button onClick={() => onDeleteReview(review)} className="review-action-btn" style={{ background: 'none', border: 'none', color: C.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: 0 }}>
                    <Trash2 size={13} strokeWidth={1.5} /> Eliminar
                  </button>
                </>
              )}
            </div>

            {review.comments.length > 0 ? (
              <div style={{ marginTop: 14, paddingLeft: 12, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {review.comments.map((comment) => (
                  <div key={comment.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: SANS, fontSize: 11, color: C.accent }}>@{comment.username}</span>
                    <span style={{ fontFamily: SERIF, fontSize: 15, color: C.textSoft, fontStyle: 'italic' }}>{comment.content}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </motion.div>
        );
      })}

      <button onClick={onWriteReview} style={{ marginTop: 28, padding: '12px 28px', background: 'transparent', color: C.accent, border: `1px solid ${C.accentDim}`, fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        Escribir o editar mi reseña
      </button>
    </motion.section>
  );
}
