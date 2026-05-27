import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { Bookmark, ArrowLeft, Crown, Plus } from "lucide-react";
import { useVaultStore } from "../store/useVaultStore";
import { useVaultData } from "../hooks/useVaultData";
import { FILTER_MAP } from "../constants";
import { GrainOverlay } from "./shared/GrainOverlay/GrainOverlay";
import { SafeImg } from "./shared/SafeImg/SafeImg";
import { EntryCard } from "./Cards/EntryCard";
import type { FilterType } from "../types";
import styles from "./Vault.module.css";

export function Vault() {
  const { username } = useParams<{ username: string }>();

  // Carga de datos asíncronos en el custom hook
  useVaultData(username);

  // Leer estado de Zustand
  const {
    user,
    entries,
    isOwner,
    loading,
    loadError,
    activeFilter,
    setActiveFilter,
  } = useVaultStore();

  const filters: FilterType[] = [
    "TODO",
    "VIDEOS",
    "IMÁGENES",
    "AUDIOS",
    "MOOD BOARDS",
    "LISTAS",
    "RESEÑAS",
  ];

  const filtered =
    activeFilter === "TODO"
      ? entries
      : entries.filter((e) => e.type === FILTER_MAP[activeFilter]);

  const profileLink = user.username ? `/${user.username}` : "/profile";

  return (
    <div className={styles.root}>
      <GrainOverlay />

      {/* Top nav */}
      <nav className={styles.navbar}>
        <Link to={profileLink} className={styles.backLink}>
          <ArrowLeft size={13} /> Perfil
        </Link>
        <div className={styles.brand}>
          Cine<span className={styles.brandAccent}>Vault</span>
        </div>
        <Bookmark size={16} color="var(--color-text-soft)" style={{ cursor: "pointer" }} />
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className={styles.header}
      >
        {/* Avatar */}
        <div className={styles.avatarContainer}>
          <div className={styles.avatarBorder}>
            <SafeImg
              src={user.avatar}
              alt={user.name}
              className={styles.avatarImage}
            />
          </div>
          <div className={styles.badge}>
            <Crown size={8} /> {user.tier}
          </div>
        </div>

        {/* Info */}
        <div className={styles.info}>
          <div className={styles.name}>{user.name}</div>
          <div className={styles.username}>@{user.username}</div>
          <div className={styles.bio}>{user.bio}</div>
        </div>

        {/* Stats + actions */}
        <div className={styles.statsActions}>
          <div className={styles.statsText}>
            <span className={styles.statsNumber}>{user.entries}</span>
            <span className={styles.statsLabel}>entradas</span>
          </div>
          {!isOwner ? (
            <button className={styles.followBtn}>Seguir</button>
          ) : (
            <div className={styles.ownerNotice}>Tu vault</div>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <div className={styles.filtersWrap}>
        <div className={styles.typeTabs}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`${styles.filterBtn} ${activeFilter === f ? styles.filterBtnActive : ""}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className={styles.content}>
        {loading && <div className={styles.statusText}>Cargando vault...</div>}
        {loadError && <div className={styles.errorText}>{loadError}</div>}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {filtered.length === 0 ? (
              <div className={styles.emptyText}>
                Este vault está vacío. Toda gran colección empieza con una decisión.
              </div>
            ) : (
              <ResponsiveMasonry columnsCountBreakPoints={{ 640: 2, 1024: 3 }}>
                <Masonry gutter="0px">
                  {filtered.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ padding: "0 6px" }}
                    >
                      <EntryCard entry={entry} avatar={user.avatar} />
                    </motion.div>
                  ))}
                </Masonry>
              </ResponsiveMasonry>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating add button (owner only) */}
      {isOwner && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className={styles.addButton}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={13} /> Agregar al vault
        </motion.button>
      )}
    </div>
  );
}
