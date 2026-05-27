import { useEffect, useState } from "react";
import type { CinematicSignaturePayload } from "../../types";
import styles from "./CinematicSignature.module.css";

interface CinematicSignatureProps {
  value: CinematicSignaturePayload | null;
  canEdit: boolean;
  onSave: (payload: Partial<CinematicSignaturePayload>) => Promise<void>;
}

export function CinematicSignature({
  value,
  canEdit,
  onSave,
}: CinematicSignatureProps) {
  const [busy, setBusy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<CinematicSignaturePayload>({
    pivotal_film: value?.pivotal_film || null,
    pivotal_film_detail: value?.pivotal_film_detail || null,
    formative_director: value?.formative_director || null,
    formative_director_detail: value?.formative_director_detail || null,
    unforgettable_scene: value?.unforgettable_scene || null,
    unforgettable_scene_detail: value?.unforgettable_scene_detail || null,
    cinema_turning_year: value?.cinema_turning_year || null,
    cinema_turning_year_detail: value?.cinema_turning_year_detail || null,
  });

  useEffect(() => {
    setDraft({
      pivotal_film: value?.pivotal_film || null,
      pivotal_film_detail: value?.pivotal_film_detail || null,
      formative_director: value?.formative_director || null,
      formative_director_detail: value?.formative_director_detail || null,
      unforgettable_scene: value?.unforgettable_scene || null,
      unforgettable_scene_detail: value?.unforgettable_scene_detail || null,
      cinema_turning_year: value?.cinema_turning_year || null,
      cinema_turning_year_detail: value?.cinema_turning_year_detail || null,
    });
  }, [value]);

  const handleEdit = () => {
    if (!canEdit || busy) return;
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (busy) return;
    setDraft({
      pivotal_film: value?.pivotal_film || null,
      pivotal_film_detail: value?.pivotal_film_detail || null,
      formative_director: value?.formative_director || null,
      formative_director_detail: value?.formative_director_detail || null,
      unforgettable_scene: value?.unforgettable_scene || null,
      unforgettable_scene_detail: value?.unforgettable_scene_detail || null,
      cinema_turning_year: value?.cinema_turning_year || null,
      cinema_turning_year_detail: value?.cinema_turning_year_detail || null,
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await onSave({
        pivotal_film: (draft.pivotal_film || "").trim() || null,
        pivotal_film_detail: (draft.pivotal_film_detail || "").trim() || null,
        formative_director: (draft.formative_director || "").trim() || null,
        formative_director_detail:
          (draft.formative_director_detail || "").trim() || null,
        unforgettable_scene: (draft.unforgettable_scene || "").trim() || null,
        unforgettable_scene_detail:
          (draft.unforgettable_scene_detail || "").trim() || null,
        cinema_turning_year: (draft.cinema_turning_year || "").trim() || null,
        cinema_turning_year_detail:
          (draft.cinema_turning_year_detail || "").trim() || null,
      });
      setIsEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const fieldsConfig = [
    {
      key: "pivotal_film",
      detailKey: "pivotal_film_detail",
      label: "La película que te cambió la vida",
      icon: (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-accent-dim)">
          <path d="M2 2h12v12H2zM4 4h2v2H4zM10 4h2v2h-2zM4 10h2v2H4zM10 10h2v2h-2z" />
        </svg>
      ),
      value: value?.pivotal_film || "Sin definir",
      detail: value?.pivotal_film_detail || "Sin detalle",
    },
    {
      key: "formative_director",
      detailKey: "formative_director_detail",
      label: "El director que más te formó",
      icon: (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-accent-dim)">
          <path d="M8 1a4 4 0 1 0 0 8A4 4 0 0 0 8 1zM2 11c0-1.1 2.7-2 6-2s6 .9 6 2v1H2v-1z" />
        </svg>
      ),
      value: value?.formative_director || "Sin definir",
      detail: value?.formative_director_detail || "Sin detalle",
    },
    {
      key: "unforgettable_scene",
      detailKey: "unforgettable_scene_detail",
      label: "La escena que nunca olvidás",
      icon: (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-accent-dim)">
          <path d="M4 3l9 5-9 5z" />
        </svg>
      ),
      value: value?.unforgettable_scene || "Sin definir",
      detail: value?.unforgettable_scene_detail || "Sin detalle",
    },
    {
      key: "cinema_turning_year",
      detailKey: "cinema_turning_year_detail",
      label: "El año en que el cine se volvió algo serio",
      icon: (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--color-accent-dim)">
          <path d="M3 2h10v12H3zM5 1h1v2H5zM10 1h1v2h-1zM5 6h6v1H5z" />
        </svg>
      ),
      value: value?.cinema_turning_year || "Sin definir",
      detail: value?.cinema_turning_year_detail || "Sin detalle",
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.mobileHeader}>Firma cinematográfica</div>
      <div className={styles.signatureBar}>
        <div className={styles.labelCol}>
          <div className={styles.labelText}>
            Firma
            <br />
            cinematográfica
          </div>
        </div>

        <div className={styles.fieldsRow}>
          {fieldsConfig.map((field) => (
            <div key={field.label} className={styles.field}>
              <div className={styles.fieldHeader}>
                {field.icon}
                <span className={styles.fieldLabel}>{field.label}</span>
              </div>
              {isEditing ? (
                <>
                  <textarea
                    value={(draft[field.key as keyof CinematicSignaturePayload] as string | null) || ""}
                    onChange={(event) => {
                      const nextValue = event.target.value.slice(0, 280);
                      setDraft((prev) => ({
                        ...prev,
                        [field.key]: nextValue,
                      }));
                    }}
                    rows={2}
                    className={styles.fieldInputText}
                  />
                  <textarea
                    value={(draft[field.detailKey as keyof CinematicSignaturePayload] as string | null) || ""}
                    onChange={(event) => {
                      const nextValue = event.target.value.slice(0, 280);
                      setDraft((prev) => ({
                        ...prev,
                        [field.detailKey]: nextValue,
                      }));
                    }}
                    rows={2}
                    className={styles.fieldInputDetail}
                  />
                  <div className={styles.charCount}>
                    {((draft[field.key as keyof CinematicSignaturePayload] as string | null) || "").length}/280
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.fieldValue}>{field.value}</div>
                  <div className={styles.fieldDetail}>{field.detail}</div>
                </>
              )}
            </div>
          ))}
        </div>

        {canEdit && (
          <div className={styles.actionCol}>
            <div className={styles.actionBox}>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={busy}
                    className={styles.btnPrimary}
                  >
                    {busy ? "Guardando" : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={busy}
                    className={styles.btnSecondary}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={busy}
                  className={styles.btnSecondary}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                    style={{ marginRight: 5 }}
                  >
                    <path d="M11.3 1.3l3.4 3.4-8.6 8.6H2.7v-3.4l8.6-8.6zm-8 10.7h2l7.9-7.9-2-2-7.9 7.9v2z" />
                  </svg>
                  Editar firma
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
