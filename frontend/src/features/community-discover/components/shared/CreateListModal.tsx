import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Plus, Lock, Globe } from "lucide-react";
import { C, SERIF, SANS } from "../../constants";
import { createList } from "../../../../services/listsServices";

export function CreateListModal({
  open,
  onClose,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!title.trim() || loading) return;
    setLoading(true);
    try {
      await createList({
        name: title,
        description: desc,
        is_public: privacy === "public",
        tags: [],
      });
      setStep("success");
      setTimeout(() => {
        setStep("form");
        setTitle("");
        setDesc("");
        setPrivacy("public");
        setLoading(false);
        onClose();
        onRefresh();
      }, 1600);
    } catch (err) {
      console.error("Error creating list", err);
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 16px",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              background: "rgba(8,8,8,0.94)",
              backdropFilter: "blur(12px)",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.99 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative",
              zIndex: 1,
              width: "min(480px, 100%)",
              maxHeight: "calc(100vh - 40px)",
              background: C.surface,
              border: `1px solid ${C.border}`,
              boxShadow:
                "0 32px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,122,0.06)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                height: 2,
                flexShrink: 0,
                background: `linear-gradient(to right, transparent, ${C.accent}, transparent)`,
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background: `radial-gradient(ellipse at 50% 0%, ${C.accentGlow} 0%, transparent 60%)`,
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
            >
              <AnimatePresence mode="wait">
                {step === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ padding: "52px 40px", textAlign: "center" }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 22,
                      }}
                      style={{
                        width: 52,
                        height: 52,
                        margin: "0 auto 20px",
                        background: C.accentGlow,
                        border: `1px solid ${C.accentDim}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={22} color={C.accent} />
                    </motion.div>
                    <p
                      style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontSize: 22,
                        color: C.text,
                        margin: "0 0 6px",
                      }}
                    >
                      Lista creada
                    </p>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: 10,
                        color: C.textSoft,
                        letterSpacing: "0.1em",
                      }}
                    >
                      Ya podés añadir películas
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div
                      style={{
                        padding: "24px 28px 20px",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: SANS,
                            fontSize: 9,
                            letterSpacing: "0.3em",
                            textTransform: "uppercase",
                            color: C.accent,
                            marginBottom: 6,
                          }}
                        >
                          Nueva lista
                        </div>
                        <h2
                          style={{
                            fontFamily: SERIF,
                            fontWeight: 300,
                            fontSize: 24,
                            color: C.text,
                            margin: 0,
                          }}
                        >
                          Curar una colección
                        </h2>
                      </div>
                      <button
                        onClick={onClose}
                        style={{
                          background: "none",
                          border: `1px solid ${C.border}`,
                          cursor: "pointer",
                          width: 32,
                          height: 32,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: C.textSoft,
                          transition: "all 0.2s",
                          flexShrink: 0,
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div style={{ padding: "24px 28px 28px" }}>
                      <div style={{ marginBottom: 20 }}>
                        <label
                          style={{
                            fontFamily: SANS,
                            fontSize: 9,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: C.textSoft,
                            display: "block",
                            marginBottom: 8,
                          }}
                        >
                          Título *
                        </label>
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Dale un nombre a tu colección"
                          style={{
                            width: "100%",
                            padding: "11px 14px",
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${title ? C.accentDim : C.border}`,
                            color: C.text,
                            fontFamily: SERIF,
                            fontSize: 17,
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.2s",
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <label
                          style={{
                            fontFamily: SANS,
                            fontSize: 9,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: C.textSoft,
                            display: "block",
                            marginBottom: 8,
                          }}
                        >
                          Descripción
                        </label>
                        <textarea
                          value={desc}
                          onChange={(e) => setDesc(e.target.value)}
                          rows={3}
                          placeholder="¿Qué une a estas películas? (opcional)"
                          style={{
                            width: "100%",
                            padding: "11px 14px",
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${C.border}`,
                            color: C.text,
                            fontFamily: SERIF,
                            fontSize: 15,
                            outline: "none",
                            resize: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.2s",
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: 32 }}>
                        <label
                          style={{
                            fontFamily: SANS,
                            fontSize: 9,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: C.textSoft,
                            display: "block",
                            marginBottom: 12,
                          }}
                        >
                          Privacidad
                        </label>
                        <div style={{ display: "flex", gap: 12 }}>
                          <button
                            onClick={() => setPrivacy("public")}
                            style={{
                              flex: 1,
                              padding: "14px",
                              background: privacy === "public" ? "rgba(212,175,122,0.08)" : "transparent",
                              border: `1px solid ${privacy === "public" ? C.accentDim : C.border}`,
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 8,
                              transition: "all 0.2s",
                            }}
                          >
                            <Globe size={16} color={privacy === "public" ? C.accent : C.textMuted} />
                            <div style={{ fontFamily: SANS, fontSize: 9, color: privacy === "public" ? C.text : C.textSoft, letterSpacing: "0.1em" }}>PÚBLICA</div>
                          </button>
                          <button
                            onClick={() => setPrivacy("private")}
                            style={{
                              flex: 1,
                              padding: "14px",
                              background: privacy === "private" ? "rgba(212,175,122,0.08)" : "transparent",
                              border: `1px solid ${privacy === "private" ? C.accentDim : C.border}`,
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 8,
                              transition: "all 0.2s",
                            }}
                          >
                            <Lock size={16} color={privacy === "private" ? C.accent : C.textMuted} />
                            <div style={{ fontFamily: SANS, fontSize: 9, color: privacy === "private" ? C.text : C.textSoft, letterSpacing: "0.1em" }}>PRIVADA</div>
                          </button>
                        </div>
                      </div>

                      <motion.button
                        onClick={handleCreate}
                        disabled={!title.trim() || loading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          width: "100%",
                          padding: "16px",
                          background: title.trim() ? C.accent : C.border,
                          color: title.trim() ? "#080808" : C.textSoft,
                          border: "none",
                          fontFamily: SANS,
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          cursor: title.trim() ? "pointer" : "default",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          transition: "all 0.2s",
                        }}
                      >
                        <Plus size={12} /> {loading ? "Creando..." : "Crear lista"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
