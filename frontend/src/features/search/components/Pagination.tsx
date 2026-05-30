import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Pagination.module.css";

interface PaginationProps {
  current: number;
  total: number;
  onPage: (n: number) => void;
}

export function Pagination({ current, total, onPage }: PaginationProps) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  const visible = pages.filter(
    (p) => p === 1 || p === total || Math.abs(p - current) <= 2,
  );

  return (
    <div className={styles.container}>
      <button
        onClick={() => onPage(Math.max(1, current - 1))}
        disabled={current === 1}
        aria-label="Ir a la página anterior"
        className={styles.navBtn}
      >
        <ChevronLeft size={14} />
      </button>

      {visible.reduce((acc: React.ReactNode[], p, i) => {
        if (i > 0 && visible[i - 1] !== p - 1) {
          acc.push(
            <span key={`dots-${p}`} className={styles.dots}>
              …
            </span>,
          );
        }

        acc.push(
          <button
            key={p}
            onClick={() => onPage(p)}
            aria-label={`Página ${p}`}
            className={`${styles.pageBtn} ${p === current ? styles.active : ""}`}
          >
            {p}
          </button>,
        );

        return acc;
      }, [])}

      <button
        onClick={() => onPage(Math.min(total, current + 1))}
        disabled={current === total}
        aria-label="Ir a la página siguiente"
        className={styles.navBtn}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
export default Pagination;
