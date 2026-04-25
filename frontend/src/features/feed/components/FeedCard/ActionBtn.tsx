import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { fmtCount } from "../../../../utils/stringUtils";

// Using tokens directly in style objects to maintain original behavior with modern tokens
export function ActionBtn({
  icon,
  count,
  active,
  onClick,
  animating,
}: {
  icon: ReactNode;
  count?: number;
  active?: boolean;
  onClick: () => void;
  animating?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        cursor: "pointer",
      }}
    >
      <motion.button
        onClick={onClick}
        animate={animating ? { scale: [1, 1.5, 0.85, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={
          {
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: active ? "rgba(212,175,122,0.18)" : "rgba(8,8,8,0.55)",
            border: `1px solid ${active ? "rgba(212,175,122,0.5)" : "rgba(255,255,255,0.12)"}`,
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: active ? "var(--color-accent)" : "rgba(255,255,255,0.9)",
            transition: "background 0.2s, border-color 0.2s, color 0.2s",
          } as CSSProperties
        }
        whileHover={{ scale: 1.08 }}
      >
        {icon}
      </motion.button>
      {count !== undefined && (
        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.85)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.04em",
          }}
        >
          {fmtCount(count)}
        </span>
      )}
    </div>
  );
}
