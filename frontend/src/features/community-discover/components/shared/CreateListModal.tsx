import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Plus, Lock, Globe, Search } from "lucide-react";
import { C, SERIF, SANS } from "../../constants";
import { createList, addMovieToList } from "../../../../services/listsServices";
import { searchMovies, type SearchMovieResult } from "../../../../services/searchServices";

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

  // Movie selection states
  const [selectedMovies, setSelectedMovies] = useState<SearchMovieResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMovieResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounced search for movies
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await searchMovies(searchQuery.trim());
        const filtered = (data?.results || []).filter(
          (item) => item.media_type === "movie" || item.media_type === "tv"
        );
        setSearchResults(filtered.slice(0, 5));
      } catch (err) {
        console.error("Error searching movies", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleCreate() {
    if (!title.trim() || loading) return;
    setLoading(true);
    try {
      // 1. Create list
      const created = await createList({
        name: title,
        description: desc,
        is_public: privacy === "public",
        tags: [],
      });

      // 2. Add selected movies to the new list
      if (selectedMovies.length > 0) {
        await Promise.all(
          selectedMovies.map((movie) => addMovieToList(created.id, movie.id))
        );
      }

      setStep("success");
      setTimeout(() => {
        setStep("form");
        setTitle("");
        setDesc("");
        setPrivacy("public");
        setSelectedMovies([]);
        setSearchQuery("");
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
                      Colección configurada con éxito
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

                      <div style={{ marginBottom: 20 }}>
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

                      {/* Add movies search bar */}
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
                          Añadir películas (Opcional)
                        </label>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <Search size={12} style={{ position: "absolute", left: 12, color: "#666" }} />
                          <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar películas o series..."
                            style={{
                              width: "100%",
                              padding: "10px 12px 10px 32px",
                              background: "rgba(255,255,255,0.03)",
                              border: `1px solid ${searchQuery ? C.accentDim : C.border}`,
                              color: C.text,
                              fontFamily: SANS,
                              fontSize: 12,
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery("")}
                              style={{
                                position: "absolute",
                                right: 12,
                                background: "none",
                                border: "none",
                                color: C.textSoft,
                                cursor: "pointer",
                                fontSize: 12,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>

                        {/* Search Results in Modal */}
                        {searchResults.length > 0 && (
                          <div
                            style={{
                              background: C.surface,
                              border: `1px solid ${C.border}`,
                              marginTop: 4,
                              display: "flex",
                              flexDirection: "column",
                              maxHeight: 180,
                              overflowY: "auto",
                            }}
                          >
                            {searchLoading && (
                              <div style={{ padding: "8px 12px", color: C.textSoft, fontSize: 11 }}>
                                Buscando...
                              </div>
                            )}
                            {searchResults.map((item) => (
                              <button
                                type="button"
                                key={item.id}
                                onClick={() => {
                                  // check duplicate
                                  if (!selectedMovies.some((m) => m.id === item.id)) {
                                    setSelectedMovies([...selectedMovies, item]);
                                  }
                                  setSearchQuery("");
                                  setSearchResults([]);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "6px 12px",
                                  background: "transparent",
                                  border: "none",
                                  borderBottom: `1px solid ${C.border}`,
                                  textAlign: "left",
                                  cursor: "pointer",
                                  color: C.text,
                                }}
                              >
                                <div style={{ width: 24, height: 36, background: "#161616", overflow: "hidden", flexShrink: 0 }}>
                                  {item.poster_path && (
                                    <img
                                      src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                      alt=""
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  )}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 500 }}>{item.title || item.name}</div>
                                  <div style={{ fontSize: 10, color: C.textSoft }}>
                                    {item.media_type === "tv" ? "Serie" : "Película"}
                                    {item.release_date || item.first_air_date ? ` (${new Date(item.release_date || item.first_air_date!).getFullYear()})` : ""}
                                  </div>
                                </div>
                                <Plus size={12} color={C.textSoft} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Selected movies list */}
                      {selectedMovies.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ fontFamily: SANS, fontSize: 8, letterSpacing: "0.15em", color: C.textSoft, textTransform: "uppercase", marginBottom: 8 }}>
                            Películas seleccionadas ({selectedMovies.length})
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              maxHeight: 120,
                              overflowY: "auto",
                              paddingRight: 4,
                            }}
                          >
                            {selectedMovies.map((movie) => (
                              <div
                                key={movie.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "6px 10px",
                                  background: "rgba(255,255,255,0.02)",
                                  border: `1px solid ${C.border}`,
                                }}
                              >
                                <span style={{ fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 10 }}>
                                  {movie.title || movie.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedMovies(selectedMovies.filter((m) => m.id !== movie.id))}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#ff7b7b",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
