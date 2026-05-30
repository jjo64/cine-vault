/**
 * @file AddMediaModal.tsx
 * @description Modal para que el dueño de la cuenta agregue videos y clips al vault controlando los límites.
 */

import React, { useState, useEffect } from "react";
import { X, ShieldAlert, Sparkles } from "lucide-react";
import { getSubscriptionStatus, addVaultVideo, addVaultClip } from "../../../services/subscriptionServices";
import type { SubscriptionStatus } from "../../../services/subscriptionServices";
import styles from "./AddMediaModal.module.css";

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMediaModal({ isOpen, onClose, onSuccess }: AddMediaModalProps) {
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [type, setType] = useState<"video" | "clip">("video");
  const [title, setTitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [movieId, setMovieId] = useState("");
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [saving, setSaving] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadStatus() {
      setLoadingStatus(true);
      try {
        const data = await getSubscriptionStatus();
        setSubStatus(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStatus(false);
      }
    }

    loadStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const maxAllowed = type === "video" 
    ? (subStatus?.entitlements.max_videos ?? 0) 
    : 999; // Clips no tienen limite de subida sino de fijados (pinned)
  
  const currentCount = type === "video"
    ? (subStatus?.usage.videos ?? 0)
    : 0;

  const isLimitExceeded = type === "video" && currentCount >= maxAllowed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !mediaUrl) {
      setError("Por favor completa el título y la URL.");
      return;
    }

    if (isLimitExceeded) {
      setError(`Has alcanzado el límite de videos para tu plan (${maxAllowed}). Actualiza tu plan.`);
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title,
      video_url: type === "video" ? mediaUrl : undefined,
      clip_url: type === "clip" ? mediaUrl : undefined,
      cover_url: coverUrl || undefined,
      movie_id: movieId ? Number(movieId) : undefined,
      media_type: movieId ? mediaType : undefined,
    };

    try {
      if (type === "video") {
        await addVaultVideo(payload as any);
      } else {
        await addVaultClip(payload as any);
      }
      onSuccess();
      onClose();
      // Limpiar formulario
      setTitle("");
      setMediaUrl("");
      setCoverUrl("");
      setMovieId("");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al subir recurso multimedia.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2 className={styles.title}>Agregar Multimedia al Vault</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        {loadingStatus ? (
          <div className={styles.loading}>Comprobando límites de tu plan...</div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorBox}>
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Type selector */}
            <div className={styles.typeSelector}>
              <button
                type="button"
                onClick={() => setType("video")}
                className={`${styles.typeBtn} ${type === "video" ? styles.typeBtnActive : ""}`}
              >
                Video
              </button>
              <button
                type="button"
                onClick={() => setType("clip")}
                className={`${styles.typeBtn} ${type === "clip" ? styles.typeBtnActive : ""}`}
              >
                Clip fijable
              </button>
            </div>

            {/* Limit alert */}
            {type === "video" && (
              <div className={`${styles.limitAlert} ${isLimitExceeded ? styles.limitExceeded : ""}`}>
                <Sparkles size={14} />
                <span>
                  Uso de videos: <strong>{currentCount} / {maxAllowed}</strong> en plan{" "}
                  <strong>{subStatus?.membership.toUpperCase()}</strong>.
                </span>
              </div>
            )}

            {/* Fields */}
            <div className={styles.field}>
              <label className={styles.label}>Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del video/clip"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>URL del medio</label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>URL de la portada (Opcional)</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className={styles.input}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field} style={{ flex: 2 }}>
                <label className={styles.label}>ID de TMDB vinculado (Opcional)</label>
                <input
                  type="number"
                  value={movieId}
                  onChange={(e) => setMovieId(e.target.value)}
                  placeholder="ej: 157336"
                  className={styles.input}
                />
              </div>

              {movieId && (
                <div className={styles.field} style={{ flex: 1 }}>
                  <label className={styles.label}>Tipo</label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as "movie" | "tv")}
                    className={styles.select}
                  >
                    <option value="movie">Película</option>
                    <option value="tv">Serie TV</option>
                  </select>
                </div>
              )}
            </div>

            <footer className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || isLimitExceeded}
                className={styles.submitBtn}
              >
                {saving ? "Guardando..." : "Subir recurso"}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
