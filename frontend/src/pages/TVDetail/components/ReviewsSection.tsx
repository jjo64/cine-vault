import React, { useState } from 'react'
import { motion } from 'motion/react'
import { MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { type AppReview } from '../hooks/useUserActions'
import { C, SANS, SERIF } from '../constants'
import { createSlug } from '../../../utils/stringUtils'

interface ReviewsSectionProps {
  reviews: AppReview[]
  tvTitle?: string
  tvTmdbId?: number | null
  userRating: number
  reviewText: string
  setReviewText: (v: string) => void
  onRate: (n: number) => void
  onSave: () => void
  savingAction: boolean
  actionMessage: string | null
  isAuthenticated: boolean
  myReviewId: number | null
}

// --- Helpers Internos ---
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32 }}>
    <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, fontFamily: SANS, fontWeight: 600 }}>
      {children}
    </div>
  </div>
)

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Reutilizamos el StarRating que deberías tener en TVDetail o lo definimos rápido
const StarRating = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <div style={{ display: 'flex', gap: 6 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => onChange(star)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <svg width="18" height="18" viewBox="0 0 12 12" fill={star <= value ? C.accent : C.textMuted}>
          <path d="M6 1l1.3 2.6L10 4l-2 2 .5 2.8L6 7.5 3.5 8.8 4 6 2 4l2.7-.4z" />
        </svg>
      </button>
    ))}
  </div>
)

export default function ReviewsSection({
  tvTitle,
  tvTmdbId,
  reviews, userRating, reviewText, setReviewText, onRate, onSave,
  savingAction, actionMessage, isAuthenticated, myReviewId
}: ReviewsSectionProps) {
  const [writerOpen, setWriterOpen] = useState(false)
  const navigate = useNavigate()

  const buildReviewThreadHref = (review: AppReview) => {
    const username = encodeURIComponent((review.username || '').trim())
    const safeTitle = String(tvTitle || '').trim()
    const titleSlug = safeTitle ? createSlug(safeTitle) : ''
    const preferredId = (tvTmdbId != null && Number.isFinite(tvTmdbId))
      ? tvTmdbId
      : ((review.tmdb_id != null && Number.isFinite(review.tmdb_id)) ? review.tmdb_id : null)

    if (preferredId != null) {
      const suffix = titleSlug ? `-${titleSlug}` : ''
      return `/${username}/tv/${preferredId}${suffix}`
    }

    if (titleSlug) {
      return `/${username}/tv/${review.movie_id}-${titleSlug}`
    }

    return `/${username}/tv/${review.movie_id}`
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }} 
      transition={{ duration: 0.8 }} 
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>
        <span>Lo que dice la comunidad</span>
        <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'none', fontFamily: SANS }}>
          {reviews.length} reseñas
        </span>
      </SectionLabel>

      {reviews.length === 0 && (
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 16, color: C.textMuted, marginBottom: 32 }}>
          Todavía no hay reseñas para esta serie.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {reviews.map((review, i) => (
          (() => {
            const threadHref = buildReviewThreadHref(review)
            return (
          <motion.div 
            key={review.id} 
            initial={{ opacity: 0, y: 12 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(threadHref)}
            role="link"
            tabIndex={0}
            aria-label={`Ver hilo de reseña de ${review.username}`}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                navigate(threadHref)
              }
            }}
            style={{ borderBottom: `1px solid ${C.border}`, padding: '24px 0', display: 'grid', gridTemplateColumns: '40px 1fr', gap: 18, cursor: 'pointer' }}
          >
            {/* Avatar */}
            <div style={{ 
              width: 40, height: 40, borderRadius: '50%', background: C.elevated, 
              border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <span style={{ fontFamily: SERIF, fontSize: 18, color: C.accentDim }}>
                {(review.username || '?')[0].toUpperCase()}
              </span>
            </div>

            {/* Contenido */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: SANS, fontSize: 13, color: C.text }}>@{review.username}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} width="10" height="10" viewBox="0 0 12 12" fill={j < Number(review.rating || 0) ? C.accent : C.textMuted}>
                      <path d="M6 1l1.3 2.6L10 4l-2 2 .5 2.8L6 7.5 3.5 8.8 4 6 2 4l2.7-.4z" />
                    </svg>
                  ))}
                </div>
                <span style={{ fontSize: 10, color: C.textMuted, fontFamily: SANS, marginLeft: 'auto' }}>
                  {formatDate(review.created_at)}
                </span>
              </div>
              <p style={{ 
                fontFamily: SERIF, fontSize: 16, fontStyle: 'italic', color: C.textSoft, 
                lineHeight: 1.75, margin: '0 0 8px', maxWidth: 600 
              }}>
                {review.content || 'Sin texto.'}
              </p>
            </div>
          </motion.div>
            )
          })()
        ))}
      </div>

      {/* Editor de Reseña */}
      <div style={{ marginTop: 32 }}>
        {!writerOpen ? (
          <button 
            onClick={() => setWriterOpen(true)} 
            style={{ 
              padding: '12px 24px', background: 'transparent', color: C.accent, 
              border: `1px solid ${C.accentDim}`, fontFamily: SANS, fontSize: 11, 
              letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', gap: 8 
            }}
          >
            <MessageSquare size={12} /> {myReviewId ? 'Editar reseña' : 'Escribir reseña'}
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '24px 28px' }}
          >
            <div style={{ marginBottom: 20 }}>
              <StarRating value={userRating} onChange={onRate} />
            </div>
            
            <textarea 
              value={reviewText} 
              onChange={e => setReviewText(e.target.value)} 
              placeholder={isAuthenticated ? "Escribí tu reseña aquí..." : "Inicia sesión para escribir una reseña."}
              disabled={!isAuthenticated}
              style={{ 
                width: '100%', minHeight: 120, background: C.bg, border: `1px solid ${C.border}`, 
                color: C.text, fontFamily: SERIF, fontSize: 16, fontStyle: 'italic', 
                padding: 16, resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box' 
              }} 
            />

            {actionMessage && (
              <div style={{ fontSize: 12, color: C.accent, fontFamily: SANS, marginTop: 12 }}>
                {actionMessage}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button 
                onClick={onSave} 
                disabled={savingAction || !isAuthenticated}
                style={{ 
                  padding: '10px 24px', background: C.accent, color: C.bg, border: 'none', 
                  fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', 
                  textTransform: 'uppercase', cursor: 'pointer', 
                  opacity: savingAction || !isAuthenticated ? 0.5 : 1 
                }}
              >
                {savingAction ? 'Guardando…' : 'Publicar'}
              </button>
              <button 
                onClick={() => setWriterOpen(false)} 
                style={{ 
                  padding: '10px 18px', background: 'none', color: C.textSoft, 
                  border: `1px solid ${C.border}`, fontFamily: SANS, fontSize: 11, 
                  letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' 
                }}
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  )
}