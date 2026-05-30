import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { FiltersState } from "../types";
import { GENRES, COUNTRIES, DURATIONS, SPECIAL_FILTERS } from "../constants";
import styles from "./FiltersPanel.module.css";

interface FiltersPanelProps {
  filters: FiltersState;
  onChange: (
    k: keyof FiltersState,
    v: FiltersState[keyof FiltersState],
  ) => void;
  onClear: () => void;
}

export function FiltersPanel({
  filters,
  onChange,
  onClear,
}: FiltersPanelProps) {
  const [expandedGenres, setExpandedGenres] = useState(false);
  const [expandedCountry, setExpandedCountry] = useState(false);

  const toggleArr = (key: "genres" | "countries", val: string) => {
    const arr = filters[key] || [];
    onChange(
      key,
      arr.includes(val) ? arr.filter((x: string) => x !== val) : [...arr, val],
    );
  };

  const activeCount = [
    (filters.genres || []).length,
    filters.yearFrom ? 1 : 0,
    filters.yearTo ? 1 : 0,
    (filters.countries || []).length,
    filters.minRating ? 1 : 0,
    filters.duration ? 1 : 0,
    filters.pendientes ? 1 : 0,
    filters.palmares ? 1 : 0,
    filters.noVistas ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrapper}>
          <SlidersHorizontal size={13} /> Filtros
          {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
        </div>
        {activeCount > 0 && (
          <button onClick={onClear} className={styles.clearBtn}>
            Limpiar
          </button>
        )}
      </div>

      {/* Bloque: Géneros */}
      <div className={styles.block}>
        <div className={styles.blockTitle}>Género</div>
        <div className={styles.genresContainer}>
          {(expandedGenres ? GENRES : GENRES.slice(0, 6)).map((g) => {
            const active = (filters.genres || []).includes(g);
            return (
              <button
                key={g}
                onClick={() => toggleArr("genres", g)}
                className={`${styles.filterBtn} ${active ? styles.active : ""}`}
              >
                {g}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setExpandedGenres((v) => !v)}
          className={styles.expandBtn}
        >
          {expandedGenres ? "— Menos" : "+ Ver más"}
        </button>
      </div>

      {/* Bloque: Año */}
      <div className={styles.block}>
        <div className={styles.blockTitle}>Año</div>
        <div className={styles.yearRow}>
          <input
            type="number"
            placeholder="1920"
            value={filters.yearFrom || ""}
            onChange={(event) => onChange("yearFrom", event.target.value)}
            className={styles.yearInput}
          />
          <span className={styles.yearSeparator}>—</span>
          <input
            type="number"
            placeholder="2026"
            value={filters.yearTo || ""}
            onChange={(event) => onChange("yearTo", event.target.value)}
            className={styles.yearInput}
          />
        </div>
      </div>

      {/* Bloque: Rating */}
      <div className={styles.block}>
        <div className={styles.blockTitle}>Rating mínimo</div>
        <div className={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => onChange("minRating", filters.minRating === s ? 0 : s)}
              className={`${styles.starBtn} ${s <= (filters.minRating || 0) ? styles.active : ""}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Bloque: Duración */}
      <div className={styles.block}>
        <div className={styles.blockTitle}>Duración</div>
        <div className={styles.durationsList}>
          {DURATIONS.map((d) => {
            const active = filters.duration === d.key;
            return (
              <button
                key={d.key}
                onClick={() => onChange("duration", active ? null : d.key)}
                className={`${styles.durationBtn} ${active ? styles.active : ""}`}
              >
                <span className={styles.durationLabel}>{d.label}</span>
                <span className={styles.durationSub}>{d.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bloque: País / Idioma */}
      <div className={styles.block}>
        <div className={styles.blockTitle}>País / Idioma</div>
        <div className={styles.countriesContainer}>
          {(expandedCountry ? COUNTRIES : COUNTRIES.slice(0, 5)).map((c) => {
            const active = (filters.countries || []).includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleArr("countries", c)}
                className={`${styles.countryBtn} ${active ? styles.active : ""}`}
              >
                {c}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setExpandedCountry((v) => !v)}
          className={styles.expandBtn}
        >
          {expandedCountry ? "— Menos" : "+ Ver más"}
        </button>
      </div>

      {/* Bloque: Filtros Especiales */}
      <div className={styles.block}>
        <div className={styles.blockTitle}>Filtros especiales</div>
        <div className={styles.specialFiltersList}>
          {SPECIAL_FILTERS.map((filter) => {
            const active = Boolean(filters[filter.key]);
            return (
              <button
                key={filter.key}
                onClick={() => onChange(filter.key, !active)}
                className={`${styles.specialFilterBtn} ${active ? styles.active : ""}`}
              >
                <span className={styles.specialFilterLabel}>{filter.label}</span>
                <span className={styles.specialFilterStatus}>
                  {active ? "ON" : "OFF"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default FiltersPanel;
