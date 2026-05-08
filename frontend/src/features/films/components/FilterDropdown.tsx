import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";
import styles from "./FilterDropdown.module.css";

interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  selected: string[];
  onSelect: (val: string) => void;
  onClear: () => void;
  multi?: boolean;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  options,
  selected,
  onSelect,
  onClear,
  multi = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasSelection = selected.length > 0;

  return (
    <div className={styles.container} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`${styles.trigger} ${hasSelection ? styles.triggerActive : ""}`}
      >
        <span>{label}</span>
        {value && <span style={{ opacity: 0.6 }}>: {value}</span>}
        <ChevronDown
          size={10}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={styles.dropdown}
          >
            <div className={styles.dropdownHeader}>
              <span className={styles.dropdownTitle}>{label}</span>
              {hasSelection && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className={styles.clearBtn}
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className={styles.optionsList}>
              {options.map((opt) => {
                const isSelected = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      onSelect(opt);
                      if (!multi) setOpen(false);
                    }}
                    className={`${styles.option} ${isSelected ? styles.optionSelected : ""}`}
                  >
                    {isSelected ? (
                      <Check size={10} />
                    ) : (
                      <div style={{ width: 10 }} />
                    )}
                    {opt}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
