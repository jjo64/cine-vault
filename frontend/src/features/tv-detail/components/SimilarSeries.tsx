import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { C, SANS, SERIF, TMDB_THUMB } from "../constants";
import { SectionLabel } from "./shared/SectionLabel";
import { SafeImg } from "./shared/SafeImg";
import { getTmdbImg, formatYear, slugify } from "../utils";
import { useTVDetailStore } from "../store/useTVDetailStore";

export function SimilarSeries() {
  const [hov, setHov] = useState<number | null>(null);
  const detail = useTVDetailStore((state) => state.detail);

  const similar = (detail?.similar?.results || [])
    .slice(0, 6)
    .filter((s) => s.poster_path);

  if (similar.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Series que te van a gustar</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 14,
        }}
      >
        {similar.map((s, i) => (
          <Link
            key={s.id}
            to={`/tv/${slugify(s.id, s.name || "serie")}`}
            style={{ textDecoration: "none" }}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
          >
            <div
              style={{
                aspectRatio: "2/3",
                borderRadius: 2,
                overflow: "hidden",
                marginBottom: 10,
                transform: hov === i ? "translateY(-4px)" : "none",
                transition: "transform 0.3s",
              }}
            >
              <SafeImg
                src={getTmdbImg(s.poster_path, TMDB_THUMB)}
                alt={s.name || ""}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter:
                    hov === i
                      ? "saturate(0.9) brightness(0.85)"
                      : "saturate(0.5) brightness(0.65)",
                  transition: "filter 0.4s",
                }}
              />
            </div>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 14,
                color: C.text,
                lineHeight: 1.3,
                marginBottom: 2,
              }}
            >
              {s.name}
            </div>
            <div style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>
              {formatYear(s.first_air_date)}
            </div>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
