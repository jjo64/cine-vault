import { useState } from "react";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { C, SERIF, SANS } from "../constants";
import { SectionLabel } from "./shared/SectionLabel";
import { useTVDetailStore } from "../store/useTVDetailStore";

export function Synopsis() {
  const [expanded, setExpanded] = useState(false);
  const detail = useTVDetailStore((state) => state.detail);

  if (!detail?.overview) return null;

  const short = detail.overview.slice(0, 300);
  const hasMore = detail.overview.length > 300;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Sinopsis</SectionLabel>
      <p
        style={{
          fontFamily: SERIF,
          fontSize: 21,
          fontWeight: 300,
          lineHeight: 1.75,
          color: C.textSoft,
          maxWidth: 640,
          margin: "0 0 16px",
        }}
      >
        {expanded ? detail.overview : short}
        {hasMore && !expanded ? "…" : ""}
      </p>
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.accent,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 0,
          }}
        >
          {expanded ? "Leer menos" : "Leer más"}
          <ChevronRight
            size={12}
            style={{
              transform: expanded ? "rotate(90deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </button>
      )}
    </motion.section>
  );
}
