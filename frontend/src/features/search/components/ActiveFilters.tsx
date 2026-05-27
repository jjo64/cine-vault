import { X } from "lucide-react";
import type { FiltersState } from "../types";
import styles from "./ActiveFilters.module.css";

interface ActiveFiltersProps {
  filters: FiltersState;
  onRemove: (k: keyof FiltersState, v?: string) => void;
}

export function ActiveFilters({ filters, onRemove }: ActiveFiltersProps) {
  const chips: { label: string; onRemove: () => void }[] = [];

  (filters.genres || []).forEach((g: string) =>
    chips.push({
      label: `Género: ${g}`,
      onRemove: () => onRemove("genres", g),
    }),
  );
  if (filters.yearFrom)
    chips.push({
      label: `Desde ${filters.yearFrom}`,
      onRemove: () => onRemove("yearFrom"),
    });
  if (filters.yearTo)
    chips.push({
      label: `Hasta ${filters.yearTo}`,
      onRemove: () => onRemove("yearTo"),
    });
  if (filters.minRating)
    chips.push({
      label: `★ ${filters.minRating}+`,
      onRemove: () => onRemove("minRating"),
    });
  if (filters.duration)
    chips.push({
      label: `Duración: ${filters.duration}`,
      onRemove: () => onRemove("duration"),
    });
  (filters.countries || []).forEach((c: string) =>
    chips.push({ label: c, onRemove: () => onRemove("countries", c) }),
  );
  if (filters.pendientes)
    chips.push({
      label: "Mis pendientes",
      onRemove: () => onRemove("pendientes"),
    });
  if (filters.palmares)
    chips.push({ label: "Palmarés", onRemove: () => onRemove("palmares") });
  if (filters.noVistas)
    chips.push({ label: "No vistas", onRemove: () => onRemove("noVistas") });

  if (chips.length === 0) return null;

  return (
    <div className={styles.container}>
      {chips.map((chip, i) => (
        <div key={i} className={styles.chip}>
          {chip.label}
          <button
            onClick={chip.onRemove}
            aria-label={`Eliminar filtro ${chip.label}`}
            className={styles.removeBtn}
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  );
}
export default ActiveFilters;
