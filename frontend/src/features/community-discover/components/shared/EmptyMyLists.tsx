import { motion } from "motion/react";
import { Plus, Film } from "lucide-react";
import { C, SERIF, SANS } from "../../constants";

export function EmptyMyLists({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 40px",
        border: `1px solid ${C.border}`,
        background: C.surface,
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 100%, ${C.accentGlow} 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(to right, transparent, ${C.accentDim}, transparent)`,
          opacity: 0.4,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <svg
          width="320"
          height="320"
          viewBox="0 0 320 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.04 }}
        >
          <circle cx="160" cy="160" r="140" stroke={C.accent} strokeWidth="6" />
          <circle cx="160" cy="160" r="50" stroke={C.accent} strokeWidth="6" />
          <circle cx="160" cy="60" r="22" stroke={C.accent} strokeWidth="5" />
          <circle cx="241" cy="109" r="22" stroke={C.accent} strokeWidth="5" />
          <circle cx="241" cy="211" r="22" stroke={C.accent} strokeWidth="5" />
          <circle cx="160" cy="260" r="22" stroke={C.accent} strokeWidth="5" />
          <circle cx="79" cy="211" r="22" stroke={C.accent} strokeWidth="5" />
          <circle cx="79" cy="109" r="22" stroke={C.accent} strokeWidth="5" />
          <circle cx="160" cy="160" r="14" fill={C.accent} opacity="0.5" />
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <rect
              key={i}
              x="148"
              y="8"
              width="24"
              height="14"
              rx="3"
              fill={C.accent}
              transform={`rotate(${deg} 160 160)`}
            />
          ))}
        </svg>
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 440 }}>
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 24px",
            border: `1px solid ${C.border}`,
            background: "rgba(212,175,122,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Film size={22} color={C.accentDim} />
        </div>

        <h2
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 28,
            color: C.text,
            margin: "0 0 12px",
          }}
        >
          Todavía no curaste ninguna lista
        </h2>
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 17,
            color: C.textSoft,
            lineHeight: 1.72,
            margin: "0 0 32px",
          }}
        >
          Creá tu primera colección. Puede ser un canon personal,
          <br />
          una lista para una noche específica, o lo que quieras.
        </p>

        <motion.button
          onClick={onCreateClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{
            padding: "14px 32px",
            background: C.accent,
            color: "#080808",
            border: "none",
            fontFamily: SANS,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            boxShadow: `0 4px 20px ${C.accentGlow}`,
          }}
        >
          <Plus size={13} /> Crear mi primera lista
        </motion.button>
      </div>
    </motion.div>
  );
}
