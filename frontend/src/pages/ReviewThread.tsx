import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Heart, MessageSquare, Pencil, Trash2, ChevronLeft, Film, Tv, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SeoHead } from "../components/SeoHead";
import {
  commentOnReview,
  deleteReview,
  deleteReviewComment,
  fetchReviewComments,
  fetchReviewThread,
  likeReview,
  unlikeReview,
  updateReviewComment,
  type ReviewCommentApi,
} from "../services/movieDetailServices";
import { getCurrentUser, getStoredAccessToken } from "../services/authServices";

/* ─── Design tokens ─────────────────────────────────────────────── */
const C = {
  bg:         "#080808",
  surface:    "#0e0e0e",
  surfaceHi:  "#141414",
  border:     "#1e1e1e",
  borderSoft: "#252525",
  accent:     "#D4AF7A",
  accentDim:  "#9A7A48",
  accentFaint:"rgba(212,175,122,0.08)",
  text:       "#E2E2E2",
  textSoft:   "#7A7A7A",
  textMuted:  "#4A4A4A",
  danger:     "#c04c4c",
  dangerFaint:"rgba(192,76,76,0.12)",
} as const;

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS  = "'Syne', system-ui, sans-serif";

/* ─── Helpers ─────────────────────────────────────────────────────── */
const uniqueValues = (values: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
};

const extractErrorMessage = (input: unknown) => {
  const fallback = "No se pudo cargar el hilo de reseña";
  const raw = input instanceof Error ? input.message : String(input || "");
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string }; message?: string };
    return parsed?.error?.message || parsed?.message || raw;
  } catch {
    return raw;
  }
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

/* ─── Avatar component ───────────────────────────────────────────── */
function Avatar({
  src,
  username,
  size = 36,
}: {
  src?: string | null;
  username?: string;
  size?: number;
}) {
  const initial = (username || "?")[0].toUpperCase();
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={username || "Avatar"}
        onError={() => setErrored(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: `1.5px solid ${C.borderSoft}`,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${C.accentDim}55, ${C.accentFaint})`,
        border: `1.5px solid ${C.borderSoft}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: SERIF,
        fontSize: size * 0.4,
        color: C.accent,
        fontWeight: 600,
      }}
    >
      {initial}
    </div>
  );
}

/* ─── Star rating display ────────────────────────────────────────── */
function StarRating({ rating }: { rating?: number | string | null }) {
  const normalized = typeof rating === "number" ? rating : Number(rating);
  if (!Number.isFinite(normalized) || normalized <= 0) return null;
  const stars = Math.round(normalized * 2) / 2; // half-star precision
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          style={{
            fill: i < stars ? C.accent : "transparent",
            color: i < stars ? C.accent : C.borderSoft,
            transition: "all 0.2s",
          }}
        />
      ))}
      <span style={{
        fontFamily: SANS,
        fontSize: 11,
        color: C.textSoft,
        marginLeft: 2,
        letterSpacing: "0.04em",
      }}>
        {normalized.toFixed(1)}
      </span>
    </div>
  );
}

/* ─── Comment card ───────────────────────────────────────────────── */
function CommentCard({
  comment,
  isOwn,
  onEdit,
  onDelete,
}: {
  comment: ReviewCommentApi;
  isOwn: boolean;
  onEdit: (c: ReviewCommentApi) => void;
  onDelete: (id: number) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "36px 1fr",
        gap: "12px",
        padding: "18px 20px",
        background: hovered ? C.surfaceHi : C.surface,
        border: `1px solid ${hovered ? C.borderSoft : C.border}`,
        borderRadius: 2,
        transition: "background 0.2s, border-color 0.2s",
        position: "relative",
      }}
    >
      {/* Left accent line */}
      {isOwn && (
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          background: `linear-gradient(180deg, ${C.accent}88, transparent)`,
          borderRadius: "2px 0 0 2px",
        }} />
      )}

      {/* Avatar */}
      <Avatar
        src={comment.users?.avatar_url}
        username={comment.users?.username}
        size={36}
      />

      {/* Body */}
      <div style={{ minWidth: 0 }}>
        {/* Header row */}
        <div style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 8,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 600,
              color: isOwn ? C.accent : C.text,
              letterSpacing: "0.02em",
            }}>
              {comment.users?.username || `Usuario ${comment.user_id}`}
            </span>
            <span style={{
              fontFamily: SANS,
              fontSize: 10,
              color: C.textMuted,
              letterSpacing: "0.08em",
            }}>
              {formatDate(comment.created_at)} · {formatTime(comment.created_at)}
            </span>
          </div>

          {isOwn && (
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => onEdit(comment)}
                title="Editar"
                style={{
                  border: "none",
                  background: "none",
                  color: C.textSoft,
                  cursor: "pointer",
                  padding: "2px 4px",
                  borderRadius: 2,
                  transition: "color 0.15s",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.textSoft)}
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                title="Eliminar"
                style={{
                  border: "none",
                  background: "none",
                  color: C.textSoft,
                  cursor: "pointer",
                  padding: "2px 4px",
                  borderRadius: 2,
                  transition: "color 0.15s",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.danger)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.textSoft)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <p style={{
          margin: 0,
          fontFamily: SERIF,
          fontSize: 17,
          lineHeight: 1.65,
          color: C.text,
        }}>
          {comment.content}
        </p>
      </div>
    </motion.article>
  );
}

/* ─── Reply box ──────────────────────────────────────────────────── */
function ReplyBox({
  draft,
  setDraft,
  saving,
  editingId,
  onSubmit,
  onCancel,
  viewerAvatar,
  viewerUsername,
}: {
  draft: string;
  setDraft: (v: string) => void;
  saving: boolean;
  editingId: number | null;
  onSubmit: () => void;
  onCancel: () => void;
  viewerAvatar?: string | null;
  viewerUsername?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (editingId && textareaRef.current) textareaRef.current.focus();
  }, [editingId]);

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${focused ? C.accentDim : C.border}`,
      borderRadius: 2,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* Label */}
      <div style={{
        padding: "12px 16px 0",
        fontFamily: SANS,
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: C.accentDim,
      }}>
        {editingId ? "Editando respuesta" : "Tu respuesta"}
      </div>

      {/* Composer row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "36px 1fr",
        gap: 12,
        padding: "10px 16px 14px",
      }}>
        <Avatar src={viewerAvatar} username={viewerUsername} size={36} />

        <div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Comparte tu perspectiva sobre esta reseña..."
            rows={4}
            style={{
              width: "100%",
              resize: "vertical",
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${C.borderSoft}`,
              color: C.text,
              fontFamily: SERIF,
              fontSize: 17,
              lineHeight: 1.6,
              padding: "6px 0",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
            {editingId && (
              <button
                onClick={onCancel}
                disabled={saving}
                style={{
                  border: `1px solid ${C.border}`,
                  background: "transparent",
                  color: C.textSoft,
                  padding: "7px 16px",
                  fontFamily: SANS,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderRadius: 1,
                }}
              >
                Cancelar
              </button>
            )}
            <button
              onClick={onSubmit}
              disabled={saving || !draft.trim()}
              style={{
                border: `1px solid ${draft.trim() ? C.accentDim : C.border}`,
                background: draft.trim() ? C.accentFaint : "transparent",
                color: draft.trim() ? C.accent : C.textMuted,
                padding: "7px 20px",
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: saving || !draft.trim() ? "default" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 1,
                transition: "all 0.2s",
                opacity: saving ? 0.7 : 1,
              }}
            >
              <MessageSquare size={11} />
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Publicar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────── */
export default function ReviewThreadPage() {
  const { username: routeUsername, slugId: routeSlugId, index: routeIndex } = useParams();
  const location = useLocation();
  const mediaType = location.pathname.includes("/tv/") ? "tv" : "movie";
  const token = getStoredAccessToken();

  const [viewerId, setViewerId] = useState<number | null>(null);
  const [viewerUsername, setViewerUsername] = useState<string | undefined>();
  const [viewerAvatar, setViewerAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [thread, setThread] = useState<Awaited<ReturnType<typeof fetchReviewThread>> | null>(null);
  const [comments, setComments] = useState<ReviewCommentApi[]>([]);
  const [draft, setDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);

  const requireAuth = useCallback(() => {
    window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "login" } }));
  }, []);

  const normalizedUsername = useMemo(() => {
    const raw = decodeURIComponent(String(routeUsername || "")).trim();
    return raw.replace(/^@+/, "");
  }, [routeUsername]);

  const mappedSlug = useMemo(() => {
    const raw = decodeURIComponent(String(routeSlugId || "")).trim();
    return raw.replace(/^\/+/, "").replace(/\/+$/, "");
  }, [routeSlugId]);

  const loadThread = useCallback(async () => {
    if (!normalizedUsername || !mappedSlug) {
      setError("URL de reseña inválida");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const usernameCandidates = uniqueValues([normalizedUsername, normalizedUsername.toLowerCase()]);
      if (token) {
        try {
          const current = await getCurrentUser();
          usernameCandidates.push(...uniqueValues([current.username, current.username?.toLowerCase()]));
        } catch { /* continue */ }
      }

      const slugCandidates = uniqueValues([
        mappedSlug,
        mappedSlug.toLowerCase(),
        mappedSlug.replace(/^\d+-/, ""),
      ]);

      let response: Awaited<ReturnType<typeof fetchReviewThread>> | null = null;
      let lastError: unknown = null;

      outer: for (const candidateUsername of usernameCandidates) {
        for (const candidateSlug of slugCandidates) {
          try {
            response = await fetchReviewThread(candidateUsername, candidateSlug, routeIndex, mediaType);
            break outer;
          } catch (e) {
            lastError = e;
          }
        }
      }

      if (!response) throw lastError || new Error("No se pudo cargar el hilo de reseña");

      setThread(response);
      setLikes(Number(response.likes || 0));
      setLiked(Boolean((response as any).is_liked));

      const loadedComments = await fetchReviewComments(response.id);
      setComments(Array.isArray(loadedComments) ? loadedComments : []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [mappedSlug, normalizedUsername, token]);

  useEffect(() => { void loadThread(); }, [loadThread]);

  useEffect(() => {
    let active = true;
    if (!token) { setViewerId(null); return; }
    getCurrentUser()
      .then((user) => {
        if (!active) return;
        setViewerId(user.id);
        setViewerUsername(user.username);
        setViewerAvatar((user as any).avatar_url ?? null);
      })
      .catch(() => { if (active) setViewerId(null); });
    return () => { active = false; };
  }, [token]);

  const onToggleLike = async () => {
    if (!thread) return;
    if (!token) { requireAuth(); return; }
    const prev = { liked, likes };
    setLiked((p) => !p);
    setLikes((p) => (prev.liked ? Math.max(0, p - 1) : p + 1));
    try {
      const res = prev.liked ? await unlikeReview(token, thread.id) : await likeReview(token, thread.id);
      setLikes(Number(res.review.likes || 0));
    } catch {
      setLiked(prev.liked);
      setLikes(prev.likes);
    }
  };

  const onSubmitReply = async () => {
    if (!thread || !token) { if (!token) requireAuth(); return; }
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    try {
      if (editingCommentId) {
        await updateReviewComment(token, editingCommentId, text);
      } else {
        await commentOnReview(token, thread.id, text);
      }
      const loaded = await fetchReviewComments(thread.id);
      setComments(Array.isArray(loaded) ? loaded : []);
      setDraft("");
      setEditingCommentId(null);
    } catch (err) {
      setError((err as Error).message || "No se pudo guardar la respuesta");
    } finally {
      setSaving(false);
    }
  };

  const onEditReply = (comment: ReviewCommentApi) => {
    setEditingCommentId(comment.id);
    setDraft(comment.content);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const onDeleteReply = async (commentId: number) => {
    if (!thread || !token) { requireAuth(); return; }
    setSaving(true);
    try {
      await deleteReviewComment(token, commentId);
      const loaded = await fetchReviewComments(thread.id);
      setComments(Array.isArray(loaded) ? loaded : []);
      if (editingCommentId === commentId) { setEditingCommentId(null); setDraft(""); }
    } catch (err) {
      setError((err as Error).message || "No se pudo eliminar la respuesta");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteOwnReview = async () => {
    if (!thread || !token) { requireAuth(); return; }
    if (!window.confirm("¿Seguro que querés eliminar esta reseña? No se puede deshacer.")) return;
    setSaving(true);
    try {
      await deleteReview(token, thread.id);
      setThread(null);
      setComments([]);
      setError("La reseña fue eliminada correctamente.");
    } catch (err) {
      setError((err as Error).message || "No se pudo eliminar la reseña");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center" }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontFamily: SERIF, fontSize: 22, color: C.textSoft, fontStyle: "italic" }}
        >
          Cargando el hilo…
        </motion.div>
      </main>
    );
  }

  /* ─── Error state ─── */
  if (error && !thread) {
    return (
      <main style={{ minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center", padding: 20 }}>
        <div style={{
          border: `1px solid ${C.border}`,
          background: C.surface,
          padding: "40px 32px",
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
        }}>
          <div style={{ fontFamily: SERIF, fontSize: 26, color: "#f0b5b5", marginBottom: 16 }}>
            {error}
          </div>
          <button
            onClick={() => void loadThread()}
            style={{
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.textSoft,
              padding: "8px 20px",
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  if (!thread) return null;

  const isOwnReview = viewerId !== null && thread.user_id === viewerId;
  const MediaIcon = mediaType === "tv" ? Tv : Film;
  const threadUsername = thread.users?.username || normalizedUsername;

  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <SeoHead.Page
        title={`${threadUsername} | Hilo de reseña`}
        description="Reseña completa con respuestas y participación de la comunidad de CineVault."
        canonical={`https://cinevault.art/reviews/${normalizedUsername}/${mappedSlug}`}
      />

      {/* ── Back navigation ── */}
      <div style={{
        borderBottom: `1px solid ${C.border}`,
        background: `linear-gradient(180deg, ${C.surface} 0%, transparent 100%)`,
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            to={`/${encodeURIComponent(normalizedUsername || routeUsername || "")}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: C.textSoft,
              textDecoration: "none",
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.textSoft)}
          >
            <ChevronLeft size={14} /> Perfil
          </Link>
          <div style={{
            width: 1,
            height: 14,
            background: C.border,
          }} />
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: SANS,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.accentDim,
          }}>
            <MediaIcon size={11} /> Hilo de reseña
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* ── Review header card ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            borderBottom: `1px solid ${C.border}`,
            paddingBottom: 40,
            marginBottom: 40,
          }}
        >
          {/* Author row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            paddingTop: 40,
            marginBottom: 32,
          }}>
            <Avatar src={thread.users?.avatar_url} username={threadUsername} size={48} />
            <div>
              <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                {threadUsername}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 10, color: C.textMuted, letterSpacing: "0.08em" }}>
                {thread.created_at && formatDate(thread.created_at)}
              </div>
            </div>
          </div>

          {/* Veredicto */}
          {thread.veredicto && (
            <div style={{
              fontFamily: SERIF,
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 500,
              lineHeight: 1.1,
              color: C.accent,
              marginBottom: 20,
              letterSpacing: "-0.01em",
            }}>
              "{thread.veredicto}"
            </div>
          )}

          {/* Review content */}
          {thread.content && (
            <blockquote style={{
              margin: "0 0 28px",
              padding: "0 0 0 20px",
              borderLeft: `2px solid ${C.accentDim}66`,
              fontFamily: SERIF,
              fontSize: "clamp(18px, 2.5vw, 22px)",
              lineHeight: 1.75,
              color: C.text,
              fontStyle: "italic",
            }}>
              {thread.content}
            </blockquote>
          )}

          {/* Rating stars */}
          {(thread as any).rating && (
            <div style={{ marginBottom: 24 }}>
              <StarRating rating={(thread as any).rating} />
            </div>
          )}

          {/* Actions row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}>
            {/* Like button */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onToggleLike}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                border: `1px solid ${liked ? C.accentDim : C.border}`,
                background: liked ? C.accentFaint : "transparent",
                color: liked ? C.accent : C.textSoft,
                padding: "8px 16px",
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                borderRadius: 1,
                transition: "all 0.2s",
              }}
            >
              <Heart size={13} fill={liked ? C.accent : "none"} />
              {liked ? "Te gusta" : "Me gusta"} · {likes}
            </motion.button>

            {/* Comments count */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: C.textSoft,
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}>
              <MessageSquare size={12} /> {comments.length} respuesta{comments.length !== 1 ? "s" : ""}
            </div>

            {/* Delete own review */}
            {isOwnReview && (
              <button
                onClick={() => void onDeleteOwnReview()}
                disabled={saving}
                style={{
                  marginLeft: "auto",
                  border: `1px solid ${C.border}`,
                  background: "transparent",
                  color: C.textSoft,
                  padding: "8px 14px",
                  cursor: saving ? "default" : "pointer",
                  fontFamily: SANS,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: saving ? 0.6 : 1,
                  borderRadius: 1,
                  transition: "color 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.danger;
                  e.currentTarget.style.color = C.danger;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.color = C.textSoft;
                }}
              >
                <Trash2 size={12} />
                {saving ? "Eliminando…" : "Eliminar reseña"}
              </button>
            )}
          </div>
        </motion.section>

        {/* ── Comments section ── */}
        <section>
          {/* Heading */}
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 24,
          }}>
            <h2 style={{
              margin: 0,
              fontFamily: SERIF,
              fontSize: 24,
              fontWeight: 400,
              color: C.text,
            }}>
              Conversación
            </h2>
            {comments.length > 0 && (
              <span style={{
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.12em",
                color: C.textMuted,
                textTransform: "uppercase",
              }}>
                {comments.length} aporte{comments.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Comments list */}
          {comments.length === 0 ? (
            <div style={{
              padding: "32px 24px",
              border: `1px dashed ${C.border}`,
              borderRadius: 2,
              textAlign: "center",
              fontFamily: SERIF,
              fontSize: 18,
              color: C.textMuted,
              fontStyle: "italic",
              marginBottom: 28,
            }}>
              Sé el primero en responder esta reseña.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8, marginBottom: 28 }}>
              <AnimatePresence>
                {comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    isOwn={viewerId !== null && comment.user_id === viewerId}
                    onEdit={onEditReply}
                    onDelete={(id) => void onDeleteReply(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Inline error (non-fatal) */}
          {error && thread && (
            <div style={{
              marginBottom: 16,
              padding: "10px 16px",
              background: C.dangerFaint,
              border: `1px solid ${C.danger}55`,
              borderRadius: 2,
              fontFamily: SANS,
              fontSize: 11,
              color: "#f09090",
              letterSpacing: "0.06em",
            }}>
              {error}
            </div>
          )}

          {/* Reply box */}
          <ReplyBox
            draft={draft}
            setDraft={setDraft}
            saving={saving}
            editingId={editingCommentId}
            onSubmit={() => void onSubmitReply()}
            onCancel={() => { setEditingCommentId(null); setDraft(""); }}
            viewerAvatar={viewerAvatar}
            viewerUsername={viewerUsername}
          />
        </section>

        {/* ── Footer nav ── */}
        <div style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: 64,
          paddingTop: 32,
          borderTop: `1px solid ${C.border}`,
        }}>
          <Link
            to={`/${encodeURIComponent(normalizedUsername || routeUsername || "perfil")}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${C.accentDim}`,
              color: C.accent,
              padding: "11px 24px",
              textDecoration: "none",
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              borderRadius: 1,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = C.accentFaint)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
          >
            Ver perfil completo
          </Link>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${C.border}`,
              color: C.textSoft,
              padding: "11px 24px",
              textDecoration: "none",
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              borderRadius: 1,
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = C.borderSoft;
              (e.currentTarget as HTMLAnchorElement).style.color = C.text;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = C.border;
              (e.currentTarget as HTMLAnchorElement).style.color = C.textSoft;
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
