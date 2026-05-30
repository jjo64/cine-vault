import { useTVDetailData } from "../hooks/useTVDetailData";
import { useUserActions } from "../hooks/useUserActions";
import { useTVDetailStore } from "../store/useTVDetailStore";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { C, SANS, SERIF } from "../constants";

import "../../../pages/TVDetail.css";
import "../../../pages/MovieDetail.css";

import { Grain } from "./shared/Grain";
import { Synopsis } from "./Synopsis";
import { Gallery } from "./Gallery";
import { Platforms } from "./Platforms";
import { SimilarSeries } from "./SimilarSeries";
import { EpisodeTracker } from "./EpisodeTracker";
import SeasonsPanel from "./SeasonsPanel";
import ReviewsSection from "./ReviewsSection";
import ScoreCard from "./ScoreCard";
import TechnicalSheet from "./TechnicalSheet";
import CrewSection from "./CrewSection";

import { Hero } from "../../movie-detail/components/Hero";
import { ReviewLogModal } from "../../movie-detail/components/ReviewLogModal";

export function TVDetail() {
  const { slugOrId, id } = useParams<{ slugOrId?: string; id?: string }>();
  const identifier = slugOrId || id;
  const navigate = useNavigate();

  useTVDetailData(identifier);
  const { detail, loading, error, watchedIds, toggleEpisodeWatched } = useTVDetailStore();

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

  if (!identifier) return null;

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
            padding: "40px 0"
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
              textAlign: "center",
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
          <Synopsis />
          {detail.season_details?.some(
            (s) => s.season_number > 0 && (s.episode_count || 0) > 0,
          ) && <EpisodeTracker />}
          <SeasonsPanel
            detail={detail}
            watchedIds={watchedIds}
            onToggleEpisode={toggleEpisodeWatched}
            isAuthenticated={isAuthenticated}
          />
          <Gallery />
          <CrewSection detail={detail} />
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
          <SimilarSeries />
        </main>
        <aside>
          <div style={{ position: "sticky", top: 80 }}>
            <ScoreCard detail={detail} />
            <TechnicalSheet detail={detail} />
            <Platforms />
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
