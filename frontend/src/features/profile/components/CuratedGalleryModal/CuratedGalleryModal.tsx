import { useState, useMemo } from "react";
import { motion } from "motion/react";
import type { EnrichedMovie } from "../../types";
import { Img } from "../primitives/primitives";
import styles from "./CuratedGalleryModal.module.css";

interface CuratedGalleryModalProps {
  available: EnrichedMovie[];
  initialSelected: number[];
  onClose: () => void;
  onSave: (ids: number[]) => Promise<void>;
}

export function CuratedGalleryModal({
  available,
  initialSelected,
  onClose,
  onSave,
}: CuratedGalleryModalProps) {
  const [selected, setSelected] = useState<number[]>(initialSelected);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "title">("recent");

  const uniqueAvailable = useMemo(() => {
    const seen = new Set<number>();
    let items = available.filter((m) => {
      if (seen.has(m.movieId)) return false;
      seen.add(m.movieId);
      return true;
    });

    // Filter text
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      items = items.filter(
        (m) =>
          (m.title || "").toLowerCase().includes(q) ||
          (m.director || "").toLowerCase().includes(q),
      );
    }

    // Filter rating
    if (minRating > 0) {
      items = items.filter((m) => (m.rating || 0) >= minRating);
    }

    // Sort
    items = [...items].sort((a, b) => {
      if (sortBy === "title")
        return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0; // 'recent' is default (diary order)
    });

    return items;
  }, [available, searchTerm, sortBy, minRating]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 6) return prev; // Max 6
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await onSave(selected);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={styles.modalOverlay}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={styles.modalContent}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header Section */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleArea}>
            <h3 className={styles.modalTitle}>Cura tu Galería</h3>
            <p className={styles.modalSubtitle}>
              Seleccionados:{" "}
              <strong className={styles.countAccent}>{selected.length} / 6</strong>
            </p>
          </div>

          <div className={styles.headerFiltersArea}>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder="Busca tus películas vistas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              <svg
                className={styles.searchIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>

            <div className={styles.sortButtons}>
              {[
                { id: "recent", label: "Recientes" },
                { id: "rating", label: "Rating" },
                { id: "title", label: "A-Z" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as any)}
                  className={`${styles.sortBtn} ${sortBy === opt.id ? styles.activeSort : ""}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className={styles.ratingFilter}>
              <span className={styles.filterLabel}>Min</span>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className={styles.ratingSelect}
              >
                <option value={0}>Todas</option>
                <option value={5}>5 ★</option>
                <option value={4}>4+ ★</option>
                <option value={3}>3+ ★</option>
                <option value={2}>2+ ★</option>
                <option value={1}>1+ ★</option>
              </select>
            </div>
          </div>

          <button onClick={onClose} className={styles.closeBtn} aria-label="Cerrar modal">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Grid Section */}
        <div className={styles.modalBody}>
          <div className={styles.movieGrid}>
            {uniqueAvailable.length === 0 ? (
              <div className={styles.emptyText}>
                No tienes películas suficientes en tu historial de visionado.
              </div>
            ) : (
              uniqueAvailable.map((movie) => {
                const isSelected = selected.includes(movie.movieId);
                return (
                  <div
                    key={movie.movieId}
                    onClick={() => toggle(movie.movieId)}
                    className={styles.movieCard}
                  >
                    <div
                      className={`${styles.posterWrapper} ${isSelected ? styles.selectedPoster : ""}`}
                    >
                      <Img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className={styles.posterImg}
                      />
                      {isSelected && (
                        <div className={styles.selectBadge}>
                          {selected.indexOf(movie.movieId) + 1}
                        </div>
                      )}
                    </div>
                    <div className={`${styles.movieTitle} ${isSelected ? styles.selectedTitle : ""}`}>
                      {movie.title}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Section */}
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnSecondary}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={busy || selected.length === 0}
            className={styles.btnPrimary}
          >
            {busy ? "Guardando..." : "Confirmar Selección"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
