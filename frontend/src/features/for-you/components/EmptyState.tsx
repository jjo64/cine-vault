import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Users, Film } from "lucide-react";
import { C, SANS, SERIF } from "../constants";

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      style={{
        margin: "80px 40px 0",
        border: `1px solid ${C.border}`,
        background: C.surface,
        padding: "56px 48px",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 100%, ${C.accentGlow} 0%, transparent 65%)`, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: SERIF, fontSize: 48, color: C.accentDim, marginBottom: 20, lineHeight: 1 }}>◈</div>
        <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 32, color: C.text, margin: "0 0 12px" }}>Tu vault está vacío</h2>
        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 18, color: C.textSoft, lineHeight: 1.7, margin: "0 auto 32px", maxWidth: 480 }}>
          Seguí algunos cinéfilos o registrá tus primeras 3 películas para desbloquear recomendaciones personalizadas.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <motion.button whileHover={{ scale: 1.02 }} style={{ padding: "13px 28px", background: C.accent, color: "#080808", border: "none", fontFamily: SANS, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={12} /> Descubrir miembros
          </motion.button>
          <Link to="/search">
            <motion.button whileHover={{ scale: 1.02 }} style={{ padding: "13px 24px", background: "transparent", color: C.accent, border: `1px solid ${C.accentDim}`, fontFamily: SANS, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Film size={12} /> Buscar películas
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
