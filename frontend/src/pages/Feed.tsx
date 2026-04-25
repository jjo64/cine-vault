import { useCallback, useEffect, useState } from "react";
import {
  useFeedData,
  useFeedActions,
  Grain,
  FeedNavbar,
  FeedCard,
  ProgressDots,
  NavArrows,
  FeedCommentsSheet,
  type FeedItem,
  type FeedTab,
} from "../features/feed";
import {
  createReviewComment,
  fetchReviewComments,
  type ReviewComment,
} from "@/services/socialServices";

/**
 * CineVault — Feed Page (/feed)
 * Refactored Orchestrator
 * TikTok-style vertical snap scroll — Reseñas, Vault, Descubrimientos
 */
export default function Feed() {
  const [activeTab, setActiveTab] = useState<FeedTab>("Para ti");
  const [commentItem, setCommentItem] = useState<FeedItem | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navbarHeight = isMobile ? 104 : 72;

  const {
    feed,
    setFeed,
    loading,
    loadingMore,
    error,
    activeIdx,
    containerRef,
    goToCard,
    refreshFeed,
    canUp,
    canDown,
  } = useFeedData(activeTab);

  const {
    animating,
    actionError,
    isPending,
    toggleLike,
    toggleBookmark,
    shareItem,
    dismissItem,
    reportItem,
  } = useFeedActions({ setFeed });

  const loadComments = useCallback(async (item: FeedItem) => {
    if (!item.reviewId) return;
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const response = await fetchReviewComments(item.reviewId);
      setComments(Array.isArray(response) ? response : []);
    } catch (loadError) {
      setCommentsError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar comentarios",
      );
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const openComments = useCallback(
    (item: FeedItem) => {
      if (!item.reviewId || !item.canComment) return;
      setCommentItem(item);
      setCommentDraft("");
      void loadComments(item);
    },
    [loadComments],
  );

  const closeComments = useCallback(() => {
    setCommentItem(null);
    setComments([]);
    setCommentDraft("");
    setCommentsError(null);
  }, []);

  const submitComment = useCallback(async () => {
    if (!commentItem?.reviewId || commentDraft.trim().length === 0) return;
    setCommentSubmitting(true);
    setCommentsError(null);

    try {
      const nextComment = await createReviewComment(
        commentItem.reviewId,
        commentDraft.trim(),
      );
      setComments((prev) => [nextComment, ...prev]);
      setCommentDraft("");
      setFeed((prev) =>
        prev.map((entry) =>
          entry.itemRef === commentItem.itemRef
            ? { ...entry, comments: entry.comments + 1 }
            : entry,
        ),
      );
    } catch (submitError) {
      setCommentsError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo publicar el comentario",
      );
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentDraft, commentItem, setFeed]);

  const handleShare = useCallback(
    async (item: FeedItem) => {
      await shareItem(item);
      const link = `${window.location.origin}/film/${"film" in item ? item.film.id : item.id}`;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(link);
        } catch {
          // Silenciar error de clipboard; el tracking de share ya ocurrió.
        }
      }
    },
    [shareItem],
  );

  const handleReport = useCallback(
    async (item: FeedItem) => {
      if (!item.canReport) return;
      const reason = window.prompt(
        "Cuéntanos por qué reportas este contenido (mínimo 5 caracteres):",
        "Contenido inapropiado",
      );
      if (!reason || reason.trim().length < 5) return;
      await reportItem(item, reason.trim());
    },
    [reportItem],
  );

  useEffect(() => {
    closeComments();
  }, [activeTab, closeComments]);

  return (
    <div
      style={{
        background: "var(--color-bg)",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Grain />

      <FeedNavbar activeTab={activeTab} onTab={setActiveTab} />

      <div
        ref={containerRef}
        style={{
          marginTop: navbarHeight,
          height: `calc(100vh - ${navbarHeight}px)`,
          overflowY: "auto",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
          // Hide scrollbar
          scrollbarWidth: "none",
          ["--feed-card-height" as string]: `calc(100vh - ${navbarHeight}px)`,
        }}
        className="feed-container"
      >
        {error && (
          <div
            className="feed-card"
            data-idx={0}
            style={{
              minHeight: "var(--feed-card-height)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              padding: 24,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#f6d0d0",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.05em",
              }}
            >
              {error}
            </p>
            <button
              onClick={refreshFeed}
              style={{
                background: "var(--color-accent)",
                color: "var(--color-bg)",
                border: "none",
                padding: "10px 18px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontSize: 11,
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {loading && !error && (
          <div
            className="feed-card"
            data-idx={0}
            style={{
              minHeight: "var(--feed-card-height)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "var(--color-text-soft)",
              fontFamily: "var(--font-sans)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontSize: 12,
            }}
          >
            Cargando {activeTab}...
          </div>
        )}

        {!loading && !error && feed.length === 0 && (
          <div
            className="feed-card"
            data-idx={0}
            style={{
              minHeight: "var(--feed-card-height)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
              padding: 24,
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--color-text)",
                fontSize: 22,
              }}
            >
              No hay contenido disponible.
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-sans)",
                color: "var(--color-text-soft)",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Intenta refrescar o sigue mas usuarios.
            </p>
          </div>
        )}

        {feed.map((item, idx) => (
          <FeedCard
            key={item.itemRef}
            item={item}
            idx={idx}
            active={activeIdx === idx}
            likeAnimating={animating === item.id}
            pending={isPending(item.itemRef)}
            onLike={() => void toggleLike(item)}
            onBookmark={() => void toggleBookmark(item)}
            onComment={() => openComments(item)}
            onShare={() => void handleShare(item)}
            onHide={() => void dismissItem(item)}
            onReport={() => void handleReport(item)}
          />
        ))}

        {loadingMore && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 16,
              transform: "translateX(-50%)",
              background: "rgba(8,8,8,0.72)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(10px)",
              color: "var(--color-text-soft)",
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "7px 10px",
              zIndex: 30,
            }}
          >
            Cargando mas cards...
          </div>
        )}
      </div>

      {feed.length > 0 && !isMobile && (
        <ProgressDots total={feed.length} active={activeIdx} onGo={goToCard} />
      )}

      {feed.length > 0 && !isMobile && (
        <NavArrows
          onUp={() => goToCard(activeIdx - 1)}
          onDown={() => goToCard(activeIdx + 1)}
          canUp={canUp}
          canDown={canDown}
        />
      )}

      {(actionError || commentsError) && (
        <div
          style={{
            position: "fixed",
            top: 70,
            left: 12,
            right: 12,
            zIndex: 1100,
            background: "rgba(120,25,25,0.6)",
            border: "1px solid rgba(255,180,180,0.4)",
            color: "#f8e0e0",
            padding: "10px 12px",
            fontFamily: "var(--font-sans)",
            fontSize: 12,
          }}
        >
          {actionError || commentsError}
        </div>
      )}

      <FeedCommentsSheet
        open={Boolean(commentItem)}
        item={commentItem}
        comments={comments}
        loading={commentsLoading}
        error={commentsError}
        draft={commentDraft}
        submitting={commentSubmitting}
        onClose={closeComments}
        onChangeDraft={setCommentDraft}
        onSubmit={() => void submitComment()}
        onReload={() => {
          if (commentItem) void loadComments(commentItem);
        }}
      />
    </div>
  );
}
