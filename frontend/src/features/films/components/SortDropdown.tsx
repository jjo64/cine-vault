import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, ChevronDown, Check } from "lucide-react";
import type { SortId } from "../types";
import { SORT_OPTIONS } from "../constants";
import styles from "./SortDropdown.module.css";

interface SortDropdownProps {
  value: SortId;
  onChange: (v: SortId) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => {
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

  const currentLabel = SORT_OPTIONS.find((s) => s.id === value)?.label;

  return (
    <div className={styles.container} ref={ref}>
      <button onClick={() => setOpen(!open)} className={styles.trigger}>
        <ArrowUpDown size={11} />
        <span>{currentLabel}</span>
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
            className={styles.dropdown}
          >
            {SORT_OPTIONS.map((opt) => {
              const active = value === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id as SortId);
                    setOpen(false);
                  }}
                  className={`${styles.option} ${active ? styles.optionActive : ""}`}
                >
                  {active ? <Check size={10} /> : <div style={{ width: 10 }} />}
                  {opt.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
