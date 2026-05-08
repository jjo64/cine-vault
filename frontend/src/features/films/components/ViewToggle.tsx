import React from "react";
import { LayoutGrid, List } from "lucide-react";
import styles from "./ViewToggle.module.css";

interface ViewToggleProps {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ view, onChange }) => {
  return (
    <div className={styles.container}>
      <button
        className={`${styles.button} ${view === "grid" ? styles.active : ""}`}
        onClick={() => onChange("grid")}
        title="Grid view"
      >
        <LayoutGrid size={14} />
      </button>
      <button
        className={`${styles.button} ${view === "list" ? styles.active : ""}`}
        onClick={() => onChange("list")}
        title="List view"
      >
        <List size={14} />
      </button>
    </div>
  );
};
