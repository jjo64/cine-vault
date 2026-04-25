import type { FeedItem } from "../types";
import type { ReviewComment } from "@/services/socialServices";

type Props = {
  open: boolean;
  item: FeedItem | null;
  comments: ReviewComment[];
  loading: boolean;
  error: string | null;
  draft: string;
  submitting: boolean;
  onClose: () => void;
  onChangeDraft: (value: string) => void;
  onSubmit: () => void;
  onReload: () => void;
};

export function FeedCommentsSheet({
  open,
  item,
  comments,
  loading,
  error,
  draft,
  submitting,
  onClose,
  onChangeDraft,
  onSubmit,
  onReload,
}: Props) {
  if (!open || !item) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "78vh",
          background:
            "linear-gradient(180deg, rgba(21,21,21,0.98) 0%, rgba(8,8,8,0.99) 100%)",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 -18px 44px rgba(0,0,0,0.5)",
          padding: "14px 14px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: 56,
              height: 4,
              borderRadius: 999,
              background: "rgba(255,255,255,0.22)",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-text)",
            }}
          >
            Comentarios
          </h3>
          <button
            onClick={onClose}
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "var(--color-text-soft)",
              cursor: "pointer",
              padding: "6px 10px",
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Cerrar
          </button>
        </div>

        {loading ? (
          <div
            style={{
              color: "var(--color-text-soft)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
            }}
          >
            Cargando comentarios...
          </div>
        ) : (
          <div
            style={{
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              paddingRight: 2,
            }}
          >
            {error && (
              <div
                style={{
                  border: "1px solid rgba(214,120,120,0.4)",
                  background: "rgba(120,20,20,0.25)",
                  color: "#f4d7d7",
                  padding: "8px 10px",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                }}
              >
                {error}{" "}
                <button
                  onClick={onReload}
                  style={{
                    marginLeft: 8,
                    border: "none",
                    background: "transparent",
                    color: "var(--color-accent)",
                    cursor: "pointer",
                  }}
                >
                  Reintentar
                </button>
              </div>
            )}

            {comments.length === 0 && !error && (
              <div
                style={{
                  color: "var(--color-text-soft)",
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: 16,
                }}
              >
                Todavia no hay comentarios. Se la primera persona en comentar.
              </div>
            )}

            {comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    fontFamily: "var(--font-sans)",
                    fontSize: 11,
                    color: "var(--color-text-soft)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>
                    {comment.user?.username || `usuario${comment.user_id}`}
                  </span>
                  <span>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-text)",
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    lineHeight: 1.55,
                    fontSize: 16,
                  }}
                >
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            value={draft}
            onChange={(event) => onChangeDraft(event.target.value)}
            placeholder="Escribe tu comentario..."
            rows={3}
            style={{
              flex: 1,
              resize: "none",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.35)",
              color: "var(--color-text)",
              padding: "10px 12px",
              fontFamily: "var(--font-serif)",
              fontSize: 16,
            }}
          />
          <button
            disabled={submitting || draft.trim().length === 0}
            onClick={onSubmit}
            style={{
              minWidth: 98,
              border: "1px solid var(--color-accent-dim)",
              background: "var(--color-accent)",
              color: "var(--color-bg)",
              cursor:
                submitting || draft.trim().length === 0 ? "default" : "pointer",
              opacity: submitting || draft.trim().length === 0 ? 0.55 : 1,
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              padding: "0 10px",
            }}
          >
            {submitting ? "Enviando" : "Comentar"}
          </button>
        </div>
      </div>
    </div>
  );
}
