import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { C, SANS } from "../constants";
import { SectionLabel } from "./SectionLabel";

interface ThemesProps {
  themes: string[];
}

export function Themes({ themes }: ThemesProps) {
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Temas y atmósferas</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {themes.map((theme) => (
          <motion.button
            key={theme}
            onClick={() =>
              navigate(`/search?q=${encodeURIComponent(theme)}&genre=`)
            }
            whileHover={{ borderColor: C.accentDim, color: C.accent }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.textSoft,
              border: `1px solid ${C.border}`,
              background: "transparent",
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: SANS,
            }}
          >
            {theme}
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}
