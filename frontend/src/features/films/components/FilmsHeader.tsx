import React from "react";
import { motion } from "motion/react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { FilterDropdown } from "./FilterDropdown";
import { GENRE_OPTIONS, YEAR_RANGES, COUNTRY_OPTIONS } from "../constants";
import type { Filters } from "../types";
import styles from "../FilmsPage.module.css";

interface FilmsHeaderProps {
  query: string;
  setQuery: (q: string) => void;
  searchFocused: boolean;
  setSearchFocused: (f: boolean) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  filters: Filters;
  toggleGenre: (g: string) => void;
  updateFilter: (key: keyof Filters, value: any) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  filmsCount: number;
}

export const FilmsHeader: React.FC<FilmsHeaderProps> = ({
  query,
  setQuery,
  searchFocused,
  setSearchFocused,
  searchRef,
  filters,
  toggleGenre,
  updateFilter,
  clearAllFilters,
  hasActiveFilters,
  filmsCount,
}) => {
  return (
    <div className={styles.header}>
      <div className={styles.gridTexture} />
      <div className={styles.accentGlow} />

      <div className={styles.contentWrapper}>
        <div className={styles.titleSection}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={styles.preTitle}>
            La Vitrina · Catálogo
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={styles.title}>
            Catálogo de Películas
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} className={styles.subtitle}>
            {filmsCount.toLocaleString()} películas indexadas. Filtrá, buscá, descubrí.
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={`${styles.searchIcon} ${searchFocused ? styles.searchIconFocused : ""}`} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Título, director, género, año…"
              className={styles.searchInput}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-soft)" }}>
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={styles.filterRow}>
          <div className={styles.filterLabel}>
            <SlidersHorizontal size={11} /> Filtrar por
          </div>

          <FilterDropdown
            label="Género"
            value={filters.genres.length === 1 ? filters.genres[0] : filters.genres.length > 1 ? `${filters.genres.length} géneros` : ""}
            options={GENRE_OPTIONS}
            multi
            selected={filters.genres}
            onSelect={toggleGenre}
            onClear={() => updateFilter("genres", [])}
          />
          <FilterDropdown
            label="Período"
            value={filters.yearRange ?? ""}
            options={YEAR_RANGES.map((y) => y.label)}
            selected={filters.yearRange ? [filters.yearRange] : []}
            onSelect={(v) => updateFilter("yearRange", v)}
            onClear={() => updateFilter("yearRange", null)}
          />
          <FilterDropdown
            label="País"
            value={filters.country ?? ""}
            options={COUNTRY_OPTIONS}
            selected={filters.country ? [filters.country] : []}
            onSelect={(v) => updateFilter("country", v)}
            onClear={() => updateFilter("country", null)}
          />

          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={clearAllFilters}
              style={{ background: "none", border: "1px solid var(--color-border)", color: "var(--color-text-soft)", fontSize: "9px", padding: "9px 12px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.16em" }}
            >
              Limpiar filtros
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};
