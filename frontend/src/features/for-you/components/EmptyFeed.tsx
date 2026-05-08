import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { UserPlus, Film } from "lucide-react";
import { C, SANS, SERIF } from "../constants";

export function EmptyFeed({ isNewUser }: { isNewUser: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        border: `1px solid ${C.border}`,
        background: C.surface,
        padding: "64px 32px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 100%, ${C.accentGlow} 0%, transparent 60%)`, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: SERIF, fontSize: 40, color: C.accentDim, marginBottom: 16, lineHeight: 1 }}>{isNewUser ? "◈" : "≋"}</div>
        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 18, color: C.textSoft, lineHeight: 1.75, margin: "0 auto 28px", maxWidth: 440 }}>
          {isNewUser
            ? "Tu vault está vacío. Seguí algunos cinéfilos o registrá tus primeras 3 películas para desbloquear recomendaciones personalizadas."
            : "Todo está muy tranquilo por aquí... Seguí a más personas para ver qué están viendo o empezá vos la conversación."}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <motion.button whileHover={{ scale: 1.02 }} style={{ padding: "11px 24px", background: C.accent, color: "#080808", border: "none", fontFamily: SANS, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
            <UserPlus size={11} /> Descubrir miembros
          </motion.button>
          {!isNewUser && (
            <Link to="/search">
              <motion.button whileHover={{ scale: 1.02 }} style={{ padding: "11px 22px", background: "transparent", color: C.accent, border: `1px solid ${C.accentDim}`, fontFamily: SANS, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                <Film size={11} /> Buscar películas
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
