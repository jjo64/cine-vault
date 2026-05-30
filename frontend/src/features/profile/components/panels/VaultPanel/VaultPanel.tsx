import { useEffect, useState } from "react";
import { Clock, Heart, Play, Trash, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { createSlug } from "../../../../../utils/stringUtils";
import { Img, Badge } from "../../primitives/primitives";
import { getStoredAccessToken } from "../../../../../services/authServices";
import { removeVaultSocialEntry } from "../../../../../services/profileServices";
import type { VaultSocialEntry } from "../../../../../services/profileServices";
import styles from "./VaultPanel.module.css";

const mediaHref = (
  movieId: number,
  title: string,
  tmdbId: number | null,
  mediaType?: "movie" | "tv" | null,
) => {
  const type = mediaType === "tv" ? "tv" : "movie";
  return `/${type}/${tmdbId ?? movieId}-${createSlug(title)}`;
};

const VAULT_FILTERS = ["Todo", "Reflexion", "Edit", "Critica", "Recomendacion"];

interface VaultCardProps {
  item: VaultSocialEntry;
  delay?: number;
  onRemove?: (id: number) => void;
  canManage?: boolean;
}

function VaultCard({
  item,
  delay = 0,
  onRemove,
  canManage = false,
}: VaultCardProps) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() =>
        item.movie_id &&
        navigate(mediaHref(item.movie_id, item.title, item.tmdb_id))
      }
      className={`${styles.vaultCard} ${hovered ? styles.vaultCardHovered : ""}`}
    >
      <div className={styles.vaultCardPoster}>
        <Img
          src={
            item.movie_info?.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.movie_info.poster_path}`
              : item.cover_url || "https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=800&q=80"
          }
          alt={item.title}
          className={`${styles.vaultCardImg} ${hovered ? styles.vaultCardImgHovered : ""}`}
        />
        <div className={styles.badgePos}>
          <Badge>{item.entry_type}</Badge>
        </div>
        <div className={`${styles.playBtn} ${hovered ? styles.playBtnHovered : ""}`}>
          <Play
            size={12}
            fill="white"
            color="white"
            style={{ marginLeft: 2 }}
          />
        </div>
        {canManage && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            className={styles.deleteBtn}
            aria-label="Eliminar entrada del vault"
          >
            <Trash size={12} color="white" />
          </button>
        )}
      </div>
      <div className={styles.vaultCardInfo}>
        <div className={styles.vaultCardTitle}>
          {item.title}
        </div>
        <div className={styles.vaultCardStats}>
          <span className={styles.statLabel}>
            <Clock size={10} />
            {item.duration_label || "Lectura"}
          </span>
          <span className={styles.statLabel}>
            <Heart size={10} style={{ fill: "currentColor", stroke: "none" }} />
            {item.likes_count} likes
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface VaultPanelProps {
  vaultItems: VaultSocialEntry[];
  canManage: boolean;
}

export function VaultPanel({
  vaultItems: initialItems = [],
  canManage = false,
}: VaultPanelProps) {
  const [filter, setFilter] = useState("Todo");
  const [localItems, setLocalItems] = useState(initialItems);

  useEffect(() => {
    setLocalItems(initialItems);
  }, [initialItems]);

  const filtered =
    filter === "Todo"
      ? localItems
      : localItems.filter(
          (item) => item.entry_type.toLowerCase() === filter.toLowerCase(),
        );

  const handleDeleteEntry = async (id: number) => {
    const token = getStoredAccessToken();
    if (!token) return;
    try {
      await removeVaultSocialEntry(token, id);
      setLocalItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting vault entry:", err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.panelHeader}>
          Mi Vault{" "}
          <em className={styles.panelHeaderEm}>
            — {localItems.length} publicaciones
          </em>
        </div>
        <button className={styles.btnUpload}>
          <Upload size={11} /> Subir al Vault
        </button>
      </div>

      <div className={styles.scrollFilters}>
        {VAULT_FILTERS.map((filterName) => (
          <button
            key={filterName}
            onClick={() => setFilter(filterName)}
            aria-pressed={filter === filterName}
            className={`${styles.filterBtn} ${filter === filterName ? styles.filterBtnActive : ""}`}
          >
            {filterName}
          </button>
        ))}
      </div>

      <div className={styles.grid3}>
        {filtered.map((item, index) => (
          <VaultCard
            key={item.id}
            item={item}
            delay={index * 0.06}
            canManage={canManage}
            onRemove={handleDeleteEntry}
          />
        ))}
      </div>
    </div>
  );
}
