import React, { useState, useRef } from "react";
import { useFilmsData } from "./hooks/useFilmsData";
import { useFilmsFilters } from "./hooks/useFilmsFilters";
import { useReviewLog } from "./hooks/useReviewLog";
import { Grain } from "../../components/shared/Grain";
import { FilmsHeader } from "./components/FilmsHeader";
import { FilmsResults } from "./components/FilmsResults";
import { ReviewLogModal } from "../movie-detail/components/ReviewLogModal";
import type { MovieDetailApi } from "../../services/movieDetailServices";
import styles from "./FilmsPage.module.css";

export const FilmsPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { films, upcoming, topRated, cult, isLoading, isTyping } = useFilmsData(query);
  const {
    filters,
    visibleFilms,
    updateFilter,
    toggleGenre,
    removeFilter,
    clearAllFilters,
    hasActiveFilters,
  } = useFilmsFilters(films, query);

  const {
    logMovie,
    reviewLogOpen,
    reviewLogSaving,
    reviewLogForm,
    handleOpenLog,
    handleSaveReviewLog,
    setReviewLogOpen,
    updateForm,
    updateDimension,
    addTimestamp,
    updateTimestamp,
    removeTimestamp,
  } = useReviewLog();

  return (
    <div className={styles.page}>
      <Grain />

      <FilmsHeader
        query={query}
        setQuery={setQuery}
        searchFocused={searchFocused}
        setSearchFocused={setSearchFocused}
        searchRef={searchRef}
        filters={filters}
        toggleGenre={toggleGenre}
        updateFilter={updateFilter}
        clearAllFilters={clearAllFilters}
        hasActiveFilters={!!hasActiveFilters}
        filmsCount={films.length}
      />

      <FilmsResults
        visibleFilms={visibleFilms}
        isLoading={isLoading}
        isTyping={isTyping}
        query={query}
        view={view}
        setView={setView}
        filters={filters}
        updateFilter={updateFilter}
        removeFilter={removeFilter}
        clearAllFilters={clearAllFilters}
        hasActiveFilters={!!hasActiveFilters}
        handleOpenLog={handleOpenLog}
        upcoming={upcoming}
        topRated={topRated}
        cult={cult}
      />

      <ReviewLogModal
        open={reviewLogOpen}
        movie={logMovie ? ({
          id: Number(logMovie.id),
          title: logMovie.title,
          poster_path: logMovie.img.includes("/p/w500") ? logMovie.img.split("/p/w500")[1] : null
        } as MovieDetailApi) : null}
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
        onTextChange={(val) => updateForm({ text: val })}
        onRatingChange={(val) => updateForm({ rating: val })}
        onModeChange={(val) => updateForm({ mode: val })}
        onVeredictoChange={(val) => updateForm({ veredicto: val })}
        onContieneSpoilersChange={(val) => updateForm({ contieneSpoilers: val })}
        onCitaDialogoChange={(val) => updateForm({ citaDialogo: val })}
        onCitaPersonajeChange={(val) => updateForm({ citaPersonaje: val })}
        onDimensionsChange={updateDimension}
        onAddTimestamp={addTimestamp}
        onTimestampChange={updateTimestamp}
        onRemoveTimestamp={removeTimestamp}
        onToggleLike={() => updateForm({ liked: !reviewLogForm.liked })}
        onSeenDateChange={(val) => updateForm({ seenDate: val })}
        onSeenBeforeChange={(val) => updateForm({ seenBefore: val })}
        onSave={handleSaveReviewLog}
      />
    </div>
  );
};
