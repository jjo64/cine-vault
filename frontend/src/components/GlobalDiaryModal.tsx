import React, { useState, useEffect, useRef } from "react";
import { Search, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { searchMovies, type SearchMovieResult } from "../services/searchServices";
import {
  createReview,
  addToDiary,
  type MovieDetailApi,
  type ReviewMode,
} from "../services/movieDetailServices";
import { getStoredAccessToken, type AuthUser } from "../services/authServices";
import { ReviewLogModal } from "../features/movie-detail/components/ReviewLogModal";
import "./GlobalDiaryModal.css";

interface GlobalDiaryModalProps {
  user: AuthUser | null;
}

export const GlobalDiaryModal: React.FC<GlobalDiaryModalProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchMovieResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected movie and review states
  const [selectedMovie, setSelectedMovie] = useState<MovieDetailApi | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<"movie" | "tv">("movie");
  const [reviewLogOpen, setReviewLogOpen] = useState(false);
  const [reviewLogSaving, setReviewLogSaving] = useState(false);

  const [reviewLogForm, setReviewLogForm] = useState({
    text: "",
    rating: 0,
    mode: "RAPIDO" as ReviewMode,
    veredicto: "",
    contieneSpoilers: false,
    citaDialogo: "",
    citaPersonaje: "",
    timestamps: [] as Array<{ minuto: string; descripcion: string }>,
    dimensions: {
      direccion: 0,
      guion: 0,
      fotografia: 0,
      actuaciones: 0,
      bandaSonora: 0,
    },
    liked: false,
    seenDate: new Date().toISOString().slice(0, 10),
    seenBefore: false,
  });

  const searchRef = useRef<HTMLDivElement>(null);

  // Listen to the custom event to open the search modal
  useEffect(() => {
    const handleOpen = () => {
      setSearchQuery("");
      setResults([]);
      setIsOpen(true);
    };

    window.addEventListener("open-diary-search-modal", handleOpen);
    return () => window.removeEventListener("open-diary-search-modal", handleOpen);
  }, []);

  // Handle outside clicks to close search modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchMovies(debouncedQuery)
      .then((data) => {
        // filter out people, only keep movie/tv
        const filtered = (data?.results || []).filter(
          (item) => item.media_type === "movie" || item.media_type === "tv"
        );
        setResults(filtered.slice(0, 8));
      })
      .catch((err) => {
        console.error("Error fetching movies:", err);
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleSelectMovie = (item: SearchMovieResult) => {
    setSelectedMediaType(item.media_type === "tv" ? "tv" : "movie");
    setSelectedMovie({
      id: item.id,
      title: item.title || item.name || "Sin título",
      poster_path: item.poster_path,
    } as MovieDetailApi);
    setReviewLogForm({
      text: "",
      rating: 0,
      mode: "RAPIDO",
      veredicto: "",
      contieneSpoilers: false,
      citaDialogo: "",
      citaPersonaje: "",
      timestamps: [],
      dimensions: {
        direccion: 0,
        guion: 0,
        fotografia: 0,
        actuaciones: 0,
        bandaSonora: 0,
      },
      liked: false,
      seenDate: new Date().toISOString().slice(0, 10),
      seenBefore: false,
    });
    setIsOpen(false);
    setReviewLogOpen(true);
  };

  const updateForm = (updates: Partial<typeof reviewLogForm>) => {
    setReviewLogForm((prev) => ({ ...prev, ...updates }));
  };

  const updateDimension = (key: keyof typeof reviewLogForm.dimensions, val: number) => {
    setReviewLogForm((p) => ({
      ...p,
      dimensions: { ...p.dimensions, [key]: val },
    }));
  };

  const addTimestamp = () => {
    setReviewLogForm((p) => ({
      ...p,
      timestamps: [...p.timestamps, { minuto: "", descripcion: "" }],
    }));
  };

  const updateTimestamp = (idx: number, field: "minuto" | "descripcion", val: string) => {
    setReviewLogForm((p) => ({
      ...p,
      timestamps: p.timestamps.map((t, i) =>
        i === idx ? { ...t, [field]: val } : t,
      ),
    }));
  };

  const removeTimestamp = (idx: number) => {
    setReviewLogForm((p) => ({
      ...p,
      timestamps: p.timestamps.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveReviewLog = async () => {
    const token = getStoredAccessToken();
    if (!token || !selectedMovie) return;
    setReviewLogSaving(true);
    try {
      const payload = {
        mode: reviewLogForm.mode,
        content: reviewLogForm.text.trim() || undefined,
        rating: reviewLogForm.rating > 0 ? reviewLogForm.rating : undefined,
        veredicto: reviewLogForm.veredicto.trim() || undefined,
        rating_direccion: reviewLogForm.dimensions.direccion || undefined,
        rating_guion: reviewLogForm.dimensions.guion || undefined,
        rating_fotografia: reviewLogForm.dimensions.fotografia || undefined,
        rating_actuaciones: reviewLogForm.dimensions.actuaciones || undefined,
        rating_banda_sonora: reviewLogForm.dimensions.bandaSonora || undefined,
        cita_dialogo: reviewLogForm.citaDialogo.trim() || undefined,
        cita_personaje: reviewLogForm.citaPersonaje.trim() || undefined,
        timestamps: reviewLogForm.timestamps.filter(
          (t) => t.minuto && t.descripcion,
        ),
        contiene_spoilers: reviewLogForm.contieneSpoilers,
      };

      await createReview(token, {
        movie_id: selectedMovie.id,
        media_type: selectedMediaType,
        ...payload,
      });

      await addToDiary(token, selectedMovie.id, reviewLogForm.seenDate, selectedMediaType).catch(() => {});
      
      setReviewLogOpen(false);
      window.dispatchEvent(new CustomEvent("diary-updated"));
    } catch (err) {
      console.error("Error al guardar log", err);
    } finally {
      setReviewLogSaving(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="md-modal-overlay" onClick={() => setIsOpen(false)}>
            <motion.div
              ref={searchRef}
              className="md-modal-card"
              style={{ maxWidth: 500 }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.985 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="md-modal-header">
                <div className="md-modal-header-title">
                  <Plus size={12} strokeWidth={1.6} />
                  Añadir entrada al diario
                </div>
                <button className="md-modal-close-btn" onClick={() => setIsOpen(false)}>
                  <X size={14} />
                </button>
              </div>

              <div className="md-search-layout">
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar película o serie..."
                    className="md-modal-input"
                    autoFocus
                    style={{ marginBottom: 0, paddingRight: 36 }}
                  />
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--md-text-soft)",
                    }}
                  />
                </div>

                {loading && <div className="md-search-loading">Buscando...</div>}
                {!loading && searchQuery && results.length === 0 && (
                  <div className="md-search-loading" style={{ textTransform: "none" }}>
                    No se encontraron películas o series.
                  </div>
                )}

                <div className="md-search-results-list">
                  {results.map((item) => (
                    <button
                      key={`${item.media_type}-${item.id}`}
                      className="md-search-result-item"
                      onClick={() => handleSelectMovie(item)}
                    >
                      <div className="md-search-result-poster">
                        {(item.poster_path || item.profile_path) && (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${item.poster_path || item.profile_path}`}
                            alt=""
                          />
                        )}
                      </div>
                      <div className="md-search-result-info">
                        <div className="md-search-result-title">
                          {item.title || item.name}
                        </div>
                        <div className="md-search-result-meta">
                          {item.media_type === "tv" ? "Serie" : "Película"}
                          {item.release_date || item.first_air_date ? (
                            <span style={{ marginLeft: 6 }}>
                              ({new Date(item.release_date || item.first_air_date!).getFullYear()})
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal wrapper */}
      <ReviewLogModal
        open={reviewLogOpen}
        movie={selectedMovie}
        membership={user?.membership}
        role={user?.role}
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
    </>
  );
};
