import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Search as SearchIcon } from "lucide-react";
import { C, SERIF, SANS } from "../../../constants";
import { SectionLabel } from "../../shared/SectionLabel";
import { SafeImg } from "../../shared/SafeImg";
import styles from "../../HomeLogged.module.css";

interface VitrinaZoneProps {
  searchValue: string;
  setSearchValue: (val: string) => void;
  arcos: any[];
  directorCards: any[];
  communityLists: any[];
}

export const VitrinaZone: React.FC<VitrinaZoneProps> = ({
  searchValue,
  setSearchValue,
  arcos,
  directorCards,
  communityLists,
}) => {
  const navigate = useNavigate();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
  };

  return (
    <motion.div
      key="vitrina"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ marginBottom: 56 }}
      >
        <SectionLabel>Buscar en CineVault</SectionLabel>
        <form onSubmit={submitSearch} style={{ position: "relative", maxWidth: 600 }}>
          <SearchIcon
            size={16}
            style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: C.textSoft, pointerEvents: "none" }}
          />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Titulo, director, actor, lista..."
            style={{
              width: "100%",
              padding: "16px 18px 16px 48px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: C.text,
              fontFamily: SANS,
              fontSize: 14,
              letterSpacing: "0.03em",
              outline: "none",
            }}
          />
          {searchValue && (
            <button
              type="submit"
              style={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.accent,
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Buscar →
            </button>
          )}
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{ marginBottom: 56 }}
      >
        <SectionLabel link="Abrir arcos" linkHref="/arcos">
          Arcos editoriales
        </SectionLabel>
        <div className={styles.vaultGrid}>
          {arcos.length > 0 ? (
            arcos.slice(0, 3).map((arco) => (
              <Link key={arco.id} to={`/arcos/${arco.id}-${arco.slug}`} style={{ textDecoration: "none" }}>
                <motion.div
                  whileHover={{ y: -3 }}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, padding: "20px 22px", height: "100%" }}
                >
                  <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent, fontFamily: SANS, marginBottom: 8 }}>
                    {arco.level}
                  </div>
                  <div style={{ fontFamily: SERIF, fontSize: 18, color: C.text, marginBottom: 10, lineHeight: 1.1 }}>
                    {arco.title}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: C.textSoft, lineHeight: 1.5 }}>
                    {arco.usersCompleted || 0} cinéfilos completaron este reto.
                  </div>
                </motion.div>
              </Link>
            ))
          ) : (
            <Link to="/arcos" style={{ textDecoration: "none", gridColumn: "1 / -1" }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, padding: "20px 22px" }}>
                <div style={{ fontFamily: SERIF, fontSize: 26, color: C.text, marginBottom: 10 }}>Descubre y completa Arcos</div>
                <p style={{ color: C.textSoft }}>Secuencias curatoriales pensadas para ver cine con contexto.</p>
              </div>
            </Link>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{ marginBottom: 56 }}
      >
        <SectionLabel link="Ver todos" linkHref="/search?tab=person">
          Directores que quizas no conoces
        </SectionLabel>
        <div className={styles.achievementsGrid}>
          {directorCards.map((d) => (
            <Link key={d.id} to={`/person/${d.id}`} style={{ textDecoration: "none" }}>
              <motion.div whileHover={{ y: -4 }}>
                <div style={{ aspectRatio: "1/1", borderRadius: "50%", overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 10 }}>
                  <SafeImg src={d.img} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.55) brightness(0.8)" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: C.text, lineHeight: 1.3 }}>{d.name}</div>
                  <div style={{ fontFamily: SANS, fontSize: 9, color: C.textMuted }}>{d.films} films</div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <SectionLabel link="Ver todas" linkHref="/lists">
          Listas de la comunidad
        </SectionLabel>
        <div className={styles.vaultGrid}>
          {communityLists.map((list) => (
            <Link key={list.id} to={list.href} style={{ textDecoration: "none" }}>
              <motion.div whileHover={{ y: -3 }} style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ aspectRatio: "16/9", position: "relative", overflow: "hidden" }}>
                  <SafeImg src={list.img} alt={list.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.38) brightness(0.5)" }} />
                  <div style={{ position: "absolute", bottom: 10, left: 12, fontSize: 9, color: C.accentDim }}>{list.count} items</div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontFamily: SERIF, fontSize: 17, color: C.text }}>{list.title}</div>
                  <div style={{ fontFamily: SANS, fontSize: 10, color: C.textSoft }}>{list.user}</div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
