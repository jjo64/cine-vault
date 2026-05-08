import React from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";
import type { Filters } from "../types";
import styles from "./ActiveFilterPills.module.css";

interface ActiveFilterPillsProps {
  filters: Filters;
  onRemove: (key: keyof Filters, value?: string) => void;
  onClearAll: () => void;
}

export const ActiveFilterPills: React.FC<ActiveFilterPillsProps> = ({
  filters,
  onRemove,
  onClearAll,
}) => {
  return (
    <div className={styles.container}>
      {filters.genres.map((g) => (
        <motion.div
          key={`genre-${g}`}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={styles.pill}
        >
          <span className={styles.label}>{g}</span>
          <button className={styles.removeBtn} onClick={() => onRemove("genres", g)}>
            <X size={10} />
          </button>
        </motion.div>
      ))}

      {filters.yearRange && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={styles.pill}
        >
          <span className={styles.label}>{filters.yearRange}</span>
          <button className={styles.removeBtn} onClick={() => onRemove("yearRange")}>
            <X size={10} />
          </button>
        </motion.div>
      )}

      {filters.country && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={styles.pill}
        >
          <span className={styles.label}>{filters.country}</span>
          <button className={styles.removeBtn} onClick={() => onRemove("country")}>
            <X size={10} />
          </button>
        </motion.div>
      )}

      {(filters.genres.length > 0 || filters.yearRange || filters.country) && (
        <button className={styles.clearAllBtn} onClick={onClearAll}>
          Limpiar todo
        </button>
      )}
    </div>
  );
};
