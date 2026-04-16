import React, { useState } from 'react'
import { motion } from 'motion/react'
import { MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { type AppReview } from '../hooks/useUserActions'
import { C, SANS, SERIF } from '../constants'
import { createSlug } from '../../../utils/stringUtils'

interface ReviewsSectionProps {
  reviews: AppReview[]
  tvTitle?: string
  tvTmdbId?: number | null
  viewerId: number | null
  myReviewId: number | null
  onWriteReview: () => void
  onEditReview: (review: AppReview) => void
  onDeleteReview: () => void
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

export default function ReviewsSection({
  tvTitle,
  tvTmdbId,
  reviews,
  viewerId,
  myReviewId,
  onWriteReview,
  onEditReview,
  onDeleteReview,
}: ReviewsSectionProps) {
  const [deleting, setDeleting] = useState(false)
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

              {viewerId === review.user_id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      onEditReview(review)
                    }}
                    style={{ background: 'none', border: 'none', color: C.textSoft, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: 0 }}
                  >
                    <Pencil size={12} /> Editar
                  </button>
                  <button
                    onClick={async (event) => {
                      event.stopPropagation()
                      if (deleting) return
                      setDeleting(true)
                      try {
                        onDeleteReview()
                      } finally {
                        setDeleting(false)
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#d99898', cursor: deleting ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: 0, opacity: deleting ? 0.7 : 1 }}
                  >
                    <Trash2 size={12} /> {deleting ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
            )
          })()
        ))}
      </div>

      <button
        onClick={onWriteReview}
        style={{ marginTop: 28, padding: '12px 28px', background: 'transparent', color: C.accent, border: `1px solid ${C.accentDim}`, fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <MessageSquare size={12} /> {myReviewId ? 'Editar reseña' : 'Escribir reseña'}
      </button>
    </motion.section>
  )
}