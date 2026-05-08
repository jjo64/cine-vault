import { useState } from "react";
import { motion } from "motion/react";
import { SectionLabel } from "./shared/SectionLabel";
import { SafeImg } from "./shared/SafeImg";
import { getTmdbImg } from "../utils";
import { TMDB_THUMB } from "../constants";
import { useTVDetailStore } from "../store/useTVDetailStore";

export function Gallery() {
  const [hov, setHov] = useState<number | null>(null);
  const detail = useTVDetailStore((state) => state.detail);

  const backdrops = (detail?.images?.backdrops || []).slice(0, 5);
  if (backdrops.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Imágenes de la serie</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gridTemplateRows: "auto auto",
          gap: 4,
        }}
      >
        {backdrops.map((bd, i) => (
          <div
            key={i}
            style={{
              gridRow: i === 0 ? "span 2" : undefined,
              position: "relative",
              overflow: "hidden",
              aspectRatio: i === 0 ? undefined : "4/3",
              cursor: "pointer",
              ...(i === 0 ? { minHeight: 300 } : {}),
            }}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
          >
            <SafeImg
              src={getTmdbImg(bd.file_path, TMDB_THUMB)}
              alt={`still ${i + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter:
                  hov === i
                    ? "saturate(0.7) brightness(0.75)"
                    : "saturate(0.4) brightness(0.6)",
                transform: hov === i ? "scale(1.03)" : "scale(1)",
                transition: "all 0.45s",
              }}
            />
          </div>
        ))}
      </div>
    </motion.section>
  );
}
