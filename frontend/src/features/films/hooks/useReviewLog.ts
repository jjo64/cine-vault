import { useState } from "react";
import type { Film } from "../types";
import { getStoredAccessToken } from "../../../services/authServices";
import { createReview } from "../../../services/movieDetailServices";
import { notify } from "../../../lib/notify";

export function useReviewLog() {
  const [logMovie, setLogMovie] = useState<Film | null>(null);
  const [reviewLogOpen, setReviewLogOpen] = useState(false);
  const [reviewLogSaving, setReviewLogSaving] = useState(false);
  const [reviewLogForm, setReviewLogForm] = useState({
    text: "",
    rating: 0,
    mode: "RAPIDO" as any,
    veredicto: "",
    contieneSpoilers: false,
    citaDialogo: "",
    citaPersonaje: "",
    timestamps: [] as any[],
    dimensions: {
      direccion: 0,
      guion: 0,
      fotografia: 0,
      actuaciones: 0,
      bandaSonora: 0,
    },
    liked: false,
    seenDate: new Date().toISOString().split("T")[0],
    seenBefore: false,
  });

  const handleOpenLog = (film: Film) => {
    const token = getStoredAccessToken();
    if (!token) {
      notify.unauthorized();
      window.dispatchEvent(
        new CustomEvent("open-auth-modal", { detail: { mode: "login" } }),
      );
      return;
    }
    setLogMovie(film);
    setReviewLogForm((p) => ({ ...p, liked: film.liked || false }));
    setReviewLogOpen(true);
  };

  const handleSaveReviewLog = async () => {
    const token = getStoredAccessToken();
    if (!token || !logMovie) return;
    setReviewLogSaving(true);
    try {
      await createReview(token, {
        movie_id: Number(logMovie.id),
        media_type: logMovie.mediaType === "tv" ? "tv" : "movie",
        mode: reviewLogForm.mode,
        content: reviewLogForm.text,
        rating: reviewLogForm.rating,
        veredicto: reviewLogForm.veredicto,
        contiene_spoilers: reviewLogForm.contieneSpoilers,
        cita_dialogo: reviewLogForm.citaDialogo,
        cita_personaje: reviewLogForm.citaPersonaje,
        timestamps: reviewLogForm.timestamps,
        rating_direccion: reviewLogForm.dimensions.direccion,
        rating_guion: reviewLogForm.dimensions.guion,
        rating_fotografia: reviewLogForm.dimensions.fotografia,
        rating_actuaciones: reviewLogForm.dimensions.actuaciones,
        rating_banda_sonora: reviewLogForm.dimensions.bandaSonora,
      });
      setReviewLogOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewLogSaving(false);
    }
  };

  const updateForm = (updates: Partial<typeof reviewLogForm>) => {
    setReviewLogForm((prev) => ({ ...prev, ...updates }));
  };

  const updateDimension = (key: keyof typeof reviewLogForm.dimensions, val: number) => {
    setReviewLogForm((p) => ({
      ...p,
      dimensions: { ...p.dimensions, [key]: val },
    }));
  };

  const addTimestamp = () => {
    setReviewLogForm((p) => ({
      ...p,
      timestamps: [...p.timestamps, { minuto: "", descripcion: "" }],
    }));
  };

  const updateTimestamp = (idx: number, field: string, val: string) => {
    setReviewLogForm((p) => ({
      ...p,
      timestamps: p.timestamps.map((t, i) =>
        i === idx ? { ...t, [field]: val } : t,
      ),
    }));
  };

  const removeTimestamp = (idx: number) => {
    setReviewLogForm((p) => ({
      ...p,
      timestamps: p.timestamps.filter((_, i) => i !== idx),
    }));
  };

  return {
    logMovie,
    reviewLogOpen,
    reviewLogSaving,
    reviewLogForm,
    handleOpenLog,
    handleSaveReviewLog,
    setReviewLogOpen,
    updateForm,
    updateDimension,
    addTimestamp,
    updateTimestamp,
    removeTimestamp,
  };
}
