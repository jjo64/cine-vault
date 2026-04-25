import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { C, SERIF, SANS } from "../constants";
import { SectionLabel } from "./SectionLabel";

interface SynopsisProps {
  overview: string;
  tagline: string | null | undefined;
}

export function Synopsis({ overview, tagline }: SynopsisProps) {
  const [expanded, setExpanded] = useState(false);

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
          maxWidth: 680,
          margin: "0 0 16px",
        }}
      >
        {overview || "Sinopsis no disponible."}
      </p>
      {expanded && tagline && (
        <p
          style={{
            fontFamily: SERIF,
            fontSize: 20,
            fontStyle: "italic",
            lineHeight: 1.75,
            color: C.textSoft,
            maxWidth: 680,
            margin: "0 0 16px",
          }}
        >
          {tagline}
        </p>
      )}
      {tagline && (
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
