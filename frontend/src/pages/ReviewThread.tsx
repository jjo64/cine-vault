import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Heart, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { SeoHead } from '../components/SeoHead'
import {
  commentOnReview,
  deleteReviewComment,
  fetchReviewComments,
  fetchReviewThread,
  likeReview,
  unlikeReview,
  updateReviewComment,
  type ReviewCommentApi,
} from '../services/movieDetailServices'
import { getCurrentUser, getStoredAccessToken } from '../services/authServices'

const C = {
  bg: '#080808',
  border: '#252525',
  accent: '#D4AF7A',
  accentDim: '#9A7A48',
  text: '#E2E2E2',
  textSoft: '#7A7A7A',
} as const

const SERIF = "'Cormorant Garamond', serif"
const SANS = "'Syne', sans-serif"

export default function ReviewThreadPage() {
  const { username = 'usuario', slugId = 'pelicula' } = useParams()
  const token = getStoredAccessToken()

  const [viewerId, setViewerId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [thread, setThread] = useState<Awaited<ReturnType<typeof fetchReviewThread>> | null>(null)
  const [comments, setComments] = useState<ReviewCommentApi[]>([])
  const [draft, setDraft] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)

  const requireAuth = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }))
  }, [])

  const mappedSlug = useMemo(() => {
    const raw = String(slugId || '').trim()
    if (!raw) return raw
    return raw
  }, [slugId])

  const loadThread = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchReviewThread(username, mappedSlug)
      setThread(response)
      setLikes(Number(response.likes || 0))
      setLiked(Boolean((response as any).is_liked))

      const loadedComments = await fetchReviewComments(response.id)
      setComments(Array.isArray(loadedComments) ? loadedComments : [])
    } catch (err) {
      setError((err as Error).message || 'No se pudo cargar el hilo de reseña')
    } finally {
      setLoading(false)
    }
  }, [mappedSlug, username])

  useEffect(() => {
    void loadThread()
  }, [loadThread])

  useEffect(() => {
    let active = true
    if (!token) {
      setViewerId(null)
      return
    }

    getCurrentUser()
      .then((user) => {
        if (!active) return
        setViewerId(user.id)
      })
      .catch(() => {
        if (!active) return
        setViewerId(null)
      })

    return () => {
      active = false
    }
  }, [token])

  const onToggleLike = async () => {
    if (!thread) return
    if (!token) {
      requireAuth()
      return
    }

    const previousLiked = liked
    const previousLikes = likes
    setLiked((prev) => !prev)
    setLikes((prev) => (previousLiked ? Math.max(0, prev - 1) : prev + 1))

    try {
      const response = previousLiked
        ? await unlikeReview(token, thread.id)
        : await likeReview(token, thread.id)
      setLikes(Number(response.review.likes || 0))
    } catch {
      setLiked(previousLiked)
      setLikes(previousLikes)
    }
  }

  const onSubmitReply = async () => {
    if (!thread) return
    if (!token) {
      requireAuth()
      return
    }

    const text = draft.trim()
    if (!text) return

    setSaving(true)
    try {
      if (editingCommentId) {
        await updateReviewComment(token, editingCommentId, text)
      } else {
        await commentOnReview(token, thread.id, text)
      }

      const loadedComments = await fetchReviewComments(thread.id)
      setComments(Array.isArray(loadedComments) ? loadedComments : [])
      setDraft('')
      setEditingCommentId(null)
    } catch (err) {
      setError((err as Error).message || 'No se pudo guardar la respuesta')
    } finally {
      setSaving(false)
    }
  }

  const onEditReply = (comment: ReviewCommentApi) => {
    setEditingCommentId(comment.id)
    setDraft(comment.content)
  }

  const onDeleteReply = async (commentId: number) => {
    if (!thread || !token) {
      requireAuth()
      return
    }

    setSaving(true)
    try {
      await deleteReviewComment(token, commentId)
      const loadedComments = await fetchReviewComments(thread.id)
      setComments(Array.isArray(loadedComments) ? loadedComments : [])
      if (editingCommentId === commentId) {
        setEditingCommentId(null)
        setDraft('')
      }
    } catch (err) {
      setError((err as Error).message || 'No se pudo eliminar la respuesta')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'grid', placeItems: 'center' }}>
        Cargando hilo de reseña...
      </main>
    )
  }

  if (error || !thread) {
    return (
      <main style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'grid', placeItems: 'center', padding: 20 }}>
        <section style={{ border: `1px solid ${C.border}`, background: 'rgba(17,17,17,0.9)', padding: '24px 20px', maxWidth: 760, width: '100%' }}>
          <div style={{ color: '#f0b5b5', fontFamily: SERIF, fontSize: 24 }}>
            {error || 'No encontramos esta reseña'}
          </div>
          <button onClick={() => void loadThread()} style={{ marginTop: 14, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, padding: '8px 14px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Reintentar
          </button>
        </section>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
    >
      <SeoHead.Page
        title={`${thread.users?.username || username} | Hilo de reseña`}
        description="Reseña completa con respuestas y participación de la comunidad de CineVault."
        canonical={`https://cinevault.art/reviews/${username}/${mappedSlug}`}
      />

      <section
        style={{
          width: '100%',
          maxWidth: 760,
          border: `1px solid ${C.border}`,
          background: 'rgba(17,17,17,0.9)',
          padding: 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 30px)',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accentDim, marginBottom: 10 }}>
          Hilo de reseña
        </div>
        <h1 style={{ margin: '0 0 4px', fontFamily: SERIF, fontSize: 'clamp(30px, 6vw, 46px)', fontWeight: 400 }}>
          {thread.users?.username || username}
        </h1>
        <p style={{ margin: '0 0 18px', fontFamily: SERIF, fontSize: 20, fontStyle: 'italic', color: C.textSoft }}>
          {thread.content || 'Sin contenido de reseña'}
        </p>

        {thread.veredicto ? (
          <div style={{ margin: '0 0 18px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '12px 0', fontFamily: SERIF, fontSize: 24, color: C.accent }}>
            {thread.veredicto}
          </div>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button onClick={onToggleLike} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${liked ? C.accentDim : C.border}`, background: liked ? 'rgba(212,175,122,0.12)' : 'transparent', color: liked ? C.accent : C.textSoft, padding: '8px 12px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <Heart size={13} /> {liked ? 'Te gusta' : 'Me gusta'}
          </button>
          <span style={{ color: C.textSoft, fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {likes} likes
          </span>
          <span style={{ color: C.textSoft, fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {comments.length} respuestas
          </span>
        </div>

        <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
          {comments.map((comment) => {
            const isOwn = viewerId !== null && comment.user_id === viewerId
            return (
              <article key={comment.id} style={{ border: `1px solid ${C.border}`, background: 'rgba(10,10,10,0.5)', padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ color: C.textSoft, fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {comment.users?.username || `Usuario ${comment.user_id}`} · {new Date(comment.created_at).toLocaleString('es-AR')}
                  </div>

                  {isOwn ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => onEditReply(comment)} style={{ border: 'none', background: 'none', color: C.textSoft, cursor: 'pointer' }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => void onDeleteReply(comment.id)} style={{ border: 'none', background: 'none', color: C.textSoft, cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : null}
                </div>
                <p style={{ margin: '8px 0 0', fontFamily: SERIF, fontSize: 18, color: C.text }}>
                  {comment.content}
                </p>
              </article>
            )
          })}
        </div>

        <div style={{ border: `1px solid ${C.border}`, background: 'rgba(10,10,10,0.5)', padding: 12, marginBottom: 18 }}>
          <div style={{ color: C.accentDim, fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            {editingCommentId ? 'Editar respuesta' : 'Nueva respuesta'}
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribí tu respuesta..."
            rows={4}
            style={{ width: '100%', resize: 'vertical', background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontFamily: SERIF, fontSize: 18, padding: 10, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => void onSubmitReply()} disabled={saving} style={{ border: `1px solid ${C.accentDim}`, background: 'transparent', color: C.accent, padding: '8px 12px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: saving ? 'default' : 'pointer' }}>
              <MessageSquare size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {saving ? 'Guardando…' : editingCommentId ? 'Guardar cambios' : 'Publicar respuesta'}
            </button>
            {editingCommentId ? (
              <button onClick={() => { setEditingCommentId(null); setDraft('') }} disabled={saving} style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, padding: '8px 12px', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Cancelar
              </button>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to={`/${encodeURIComponent(username)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${C.accentDim}`,
              color: C.accent,
              padding: '10px 18px',
              textDecoration: 'none',
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Ir al perfil
          </Link>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${C.border}`,
              color: C.textSoft,
              padding: '10px 18px',
              textDecoration: 'none',
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  )
}
