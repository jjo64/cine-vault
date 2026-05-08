import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { C, SANS, SERIF } from "../constants";

export function Hero({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <div style={{ paddingTop: 60 }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9 }}
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "52px 40px 44px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.018) 39px, rgba(255,255,255,0.018) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.012) 39px, rgba(255,255,255,0.012) 40px)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 180,
            background: `radial-gradient(ellipse at 20% 100%, ${C.accentGlow} 0%, transparent 55%)`,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1160,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{
                  fontFamily: SANS,
                  fontSize: 9,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: C.accent,
                  marginBottom: 14,
                }}
              >
                La Vitrina · Directorio
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.18 }}
                style={{
                  fontFamily: SERIF,
                  fontWeight: 300,
                  fontSize: "clamp(36px, 5vw, 56px)",
                  color: C.text,
                  margin: "0 0 10px",
                  lineHeight: 1.0,
                  letterSpacing: "-0.01em",
                }}
              >
                Listas Curadas
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.28 }}
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 17,
                  color: C.textSoft,
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                Colecciones editoriales y personales.
              </motion.p>
            </div>

            <motion.button
              onClick={onOpenModal}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                flexShrink: 0,
                padding: "14px 28px",
                background: C.accent,
                color: "#080808",
                border: "none",
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 9,
                boxShadow: `0 4px 24px ${C.accentGlowStrong}`,
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={13} /> Crear nueva lista
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
