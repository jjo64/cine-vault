import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star } from "lucide-react";
import type { Film, Filters } from "../types";
import { ActiveFilterPills } from "./ActiveFilterPills";
import { ViewToggle } from "./ViewToggle";
import { SortDropdown } from "./SortDropdown";
import { GridCard } from "./GridCard";
import { ListRow } from "./ListRow";
import { CategoryRow } from "./CategoryRow";
import styles from "../FilmsPage.module.css";

interface FilmsResultsProps {
  visibleFilms: Film[];
  isLoading: boolean;
  isTyping: boolean;
  query: string;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  filters: Filters;
  updateFilter: (key: keyof Filters, value: any) => void;
  removeFilter: (key: keyof Filters, value?: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  handleOpenLog: (film: Film) => void;
  upcoming: Film[];
  topRated: Film[];
  cult: Film[];
}

export const FilmsResults: React.FC<FilmsResultsProps> = ({
  visibleFilms,
  isLoading,
  isTyping,
  query,
  view,
  setView,
  filters,
  updateFilter,
  removeFilter,
  clearAllFilters,
  hasActiveFilters,
  handleOpenLog,
  upcoming,
  topRated,
  cult,
}) => {
  return (
    <div className={styles.resultsToolbar}>
      <div className={styles.toolbarInner}>
        <div style={{ flex: 1 }}>
          <AnimatePresence>
            {hasActiveFilters && (
              <ActiveFilterPills filters={filters} onRemove={removeFilter} onClearAll={clearAllFilters} />
            )}
          </AnimatePresence>
          {!hasActiveFilters && (
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}>
              {visibleFilms.length} películas {query ? ` para "${query}"` : ""}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <SortDropdown value={filters.sortBy} onChange={(v) => updateFilter("sortBy", v)} />
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {visibleFilms.length === 0 && !isLoading && !isTyping ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: "64px 0", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "22px", color: "var(--color-text-soft)" }}>
              No hay películas con esos filtros.
            </p>
            <button onClick={clearAllFilters} style={{ background: "none", border: "1px solid var(--color-accent-dim)", color: "var(--color-accent)", padding: "10px 20px", marginTop: "16px", cursor: "pointer" }}>
              REINICIAR BÚSQUEDA
            </button>
          </motion.div>
        ) : isLoading || isTyping ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "64px 0", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "18px", color: "var(--color-text-soft)" }}>
              Buscando en la boveda...
            </p>
          </motion.div>
        ) : view === "grid" ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.resultsGrid}>
            {visibleFilms.map((film, i) => (
              <GridCard key={film.id} film={film} index={i} onLog={handleOpenLog} />
            ))}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.resultsList}>
            <div className={styles.listHeader}>
              <div />
              <div className={styles.columnHeader}>Película</div>
              <div className={styles.columnHeader} style={{ textAlign: "right" }}>Rating</div>
            </div>
            {visibleFilms.map((film, i) => (
              <ListRow key={film.id} film={film} index={i} onLog={handleOpenLog} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.categoriesSection}>
        <CategoryRow title="Próximos estrenos" subtitle="Lo que no te podés perder este año" films={upcoming} />
        <CategoryRow
          title="Mejor valoradas"
          subtitle="Las más aclamadas por la comunidad"
          films={topRated}
          showRank
          badge={
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", background: "var(--color-accent-glow)", border: "1px solid var(--color-accent-dim)" }}>
              <Star size={10} fill="var(--color-gold)" color="var(--color-gold)" />
              <span style={{ fontSize: "8px", color: "var(--color-gold)", textTransform: "uppercase" }}>TOP RATED</span>
            </div>
          }
        />
        <CategoryRow title="Clásicos de culto" subtitle="Incomprendidas en su tiempo. Veneradas para siempre" films={cult} />
      </div>
    </div>
  );
};
