import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { generatePersonSlug } from "../../../utils/slugUtils";
import { C, SANS, SERIF, TMDB_BASE, SIZES } from "../constants";
import { SectionLabel } from "./SectionLabel";
import { Img } from "./Img";
import { initials } from "../../../utils/stringUtils";

interface Person {
  id: number;
  name: string;
  profile_path?: string | null;
}

interface CastPerson extends Person {
  character?: string;
}

interface CrewPerson extends Person {
  job?: string;
}

interface CastCrewProps {
  cast: CastPerson[];
  crew: CrewPerson[];
}

const textClampOneLine = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

export function CastCrew({ cast, crew }: CastCrewProps) {
  const [tab, setTab] = useState<"cast" | "crew">("cast");
  const [castPage, setCastPage] = useState(0);
  const people = tab === "cast" ? cast : crew;
  const pageSize = 8;
  const start = castPage * pageSize;
  const visiblePeople = people.slice(start, start + pageSize);
  const hasPrev = castPage > 0;
  const hasNext = start + pageSize < people.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 64 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <button
          aria-label="Reparto"
          onClick={() => {
            setTab("cast");
            setCastPage(0);
          }}
          style={{
            border: `1px solid ${tab === "cast" ? C.accentDim : C.border}`,
            background: tab === "cast" ? C.accentGlow : "transparent",
            color: tab === "cast" ? C.accent : C.textSoft,
            padding: "6px 12px",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Reparto
        </button>
        <button
          aria-label="Equipo técnico"
          onClick={() => {
            setTab("crew");
            setCastPage(0);
          }}
          style={{
            border: `1px solid ${tab === "crew" ? C.accentDim : C.border}`,
            background: tab === "crew" ? C.accentGlow : "transparent",
            color: tab === "crew" ? C.accent : C.textSoft,
            padding: "6px 12px",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Crew
        </button>
      </div>
      <SectionLabel>{tab === "cast" ? "Reparto" : "Crew técnico"}</SectionLabel>
      <div className="md-cast-list">
        {visiblePeople.map((person, index) => (
          <motion.div
            key={`${tab}-${person.id}-${index}`}
            className="md-cast-item"
            style={{ cursor: "pointer", textAlign: "center" }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25 }}
          >
            <Link
              to={`/person/${generatePersonSlug(person.id, person.name)}`}
              style={{ textDecoration: "none" }}
            >
              <motion.div
                whileHover={{ opacity: 0.8 }}
                transition={{ duration: 0.2 }}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background: C.elevated,
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  marginBottom: 10,
                  fontFamily: SERIF,
                  fontSize: 28,
                  color: C.textMuted,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
              >
                {person.profile_path ? (
                  <Img
                    src={`${TMDB_BASE}${SIZES.PROFILE}${person.profile_path}`}
                    alt={person.name}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  initials(person.name)
                )}
              </motion.div>
            </Link>
            <Link
              to={`/person/${generatePersonSlug(person.id, person.name)}`}
              style={{
                fontSize: 12,
                fontFamily: SANS,
                color: C.text,
                lineHeight: 1.3,
                marginBottom: 2,
                ...textClampOneLine,
                textDecoration: "none",
                display: "block",
              }}
            >
              {person.name}
            </Link>
            <div
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 13,
                color: C.textSoft,
              }}
            >
              <span style={textClampOneLine}>
                {tab === "cast"
                  ? "character" in person
                    ? person.character || "Sin rol"
                    : "Sin rol"
                  : "job" in person
                    ? person.job || "Sin rol"
                    : "Sin rol"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          marginTop: 12,
        }}
      >
        {hasPrev && (
          <motion.button
            aria-label="Ver página anterior"
            onClick={() => setCastPage((prev) => Math.max(0, prev - 1))}
            whileHover={{ borderColor: C.accentDim, color: C.accent }}
            transition={{ duration: 0.2 }}
            style={{
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.textSoft,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={14} />
          </motion.button>
        )}
        {hasNext && (
          <motion.button
            aria-label="Ver página siguiente"
            onClick={() => setCastPage((prev) => prev + 1)}
            whileHover={{ borderColor: C.accentDim, color: C.accent }}
            transition={{ duration: 0.2 }}
            style={{
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.textSoft,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={14} />
          </motion.button>
        )}
      </div>
    </motion.section>
  );
}
