import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Heart, Trash2 } from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import {
  fetchVaultSocialEntryById,
  removeVaultSocialEntry,
  type VaultSocialEntry,
} from "../services/profileServices";
import { getCurrentUser, getStoredAccessToken } from "../services/authServices";

const C = {
  bg: "#080808",
  border: "#252525",
  accent: "#D4AF7A",
  accentDim: "#9A7A48",
  text: "#E2E2E2",
  textSoft: "#7A7A7A",
  elevated: "rgba(17,17,17,0.9)",
} as const;

const SERIF = "'Cormorant Garamond', serif";
const SANS = "'Syne', sans-serif";

const extractErrorMessage = (input: unknown) => {
  const fallback = "No se pudo cargar el detalle de la entrada";
  if (input instanceof Error) return input.message;
  return String(input || fallback);
};

export default function VaultDetailPage() {
  const { username: routeUsername, slugId: routeSlugId } = useParams();
  const navigate = useNavigate();
  const token = getStoredAccessToken();

  const [viewerId, setViewerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<VaultSocialEntry | null>(null);

  const normalizedUsername = useMemo(() => {
    const raw = decodeURIComponent(String(routeUsername || "")).trim();
    return raw.replace(/^@+/, "");
  }, [routeUsername]);

  const entryId = useMemo(() => {
    const raw = decodeURIComponent(String(routeSlugId || "")).trim();
    const idPart = raw.split("-")[0];
    const parsed = parseInt(idPart, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [routeSlugId]);

  const loadEntry = useCallback(async () => {
    if (entryId == null) {
      setError("URL de entrada de vault inválida");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchVaultSocialEntryById(entryId, token);
      if (!response) {
        throw new Error("La entrada de vault no existe o no tienes permisos para verla.");
      }
      setEntry(response);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [entryId, token]);

  useEffect(() => {
    void loadEntry();
  }, [loadEntry]);

  useEffect(() => {
    let active = true;
    if (!token) {
      setViewerId(null);
      return;
    }

    getCurrentUser()
      .then((user) => {
        if (!active) return;
        setViewerId(user.id);
      })
      .catch(() => {
        if (!active) return;
        setViewerId(null);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const onDeleteOwnEntry = async () => {
    if (!entry || !token) return;

    if (!window.confirm("¿Estás seguro de que deseas eliminar esta entrada del Vault?")) {
      return;
    }

    setSaving(true);
    try {
      await removeVaultSocialEntry(token, entry.id);
      navigate(`/${encodeURIComponent(normalizedUsername)}/vault`);
    } catch (err) {
      setError((err as Error).message || "No se pudo eliminar la entrada");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: C.bg,
          color: C.text,
          display: "grid",
          placeItems: "center",
        }}
      >
        Cargando detalle de vault...
      </main>
    );
  }

  if (error || !entry) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: C.bg,
          color: C.text,
          display: "grid",
          placeItems: "center",
          padding: 20,
        }}
      >
        <section
          style={{
            border: `1px solid ${C.border}`,
            background: C.elevated,
            padding: "24px 20px",
            maxWidth: 760,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#f0b5b5", fontFamily: SERIF, fontSize: 24 }}>
            {error || "Entrada de vault no encontrada"}
          </div>
          <Link
            to={`/${encodeURIComponent(normalizedUsername)}/vault`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 20,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.textSoft,
              padding: "8px 14px",
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={12} /> Volver al Vault
          </Link>
        </section>
      </main>
    );
  }

  const movieTitle = entry.movie_info?.title || entry.film || "";
  const entryTypeLabel = {
    reflexion: "Reflexión",
    edit: "Edición / Montaje",
    critica: "Análisis Crítico",
    recomendacion: "Recomendación",
  }[entry.entry_type] || entry.entry_type;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        display: "grid",
        placeItems: "center",
        padding: "40px 20px",
      }}
    >
      <SeoHead.Page
        title={`${entry.users?.username || normalizedUsername} | ${entry.title}`}
        description={entry.content?.substring(0, 150) || "Detalle de entrada de Vault"}
        canonical={`https://cinevault.art/${normalizedUsername}/vault/${entry.id}`}
      />

      <section
        style={{
          width: "100%",
          maxWidth: 760,
          border: `1px solid ${C.border}`,
          background: C.elevated,
          padding: "clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px)",
          boxSizing: "border-box",
        }}
      >
        {/* Back link */}
        <div style={{ textAlign: "left", marginBottom: 24 }}>
          <Link
            to={`/${encodeURIComponent(normalizedUsername)}/vault`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: C.textSoft,
              textDecoration: "none",
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            <ArrowLeft size={12} /> Volver al Vault
          </Link>
        </div>

        {/* Poster & Header wrapper */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: entry.movie_info?.poster_path ? "140px 1fr" : "1fr",
            gap: 24,
            textAlign: "left",
            alignItems: "start",
            marginBottom: 32,
          }}
        >
          {entry.movie_info?.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w500${entry.movie_info.poster_path}`}
              alt={movieTitle}
              style={{
                width: "100%",
                borderRadius: 4,
                border: `1px solid ${C.border}`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            />
          )}

          <div>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.accent,
                marginBottom: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{entryTypeLabel}</span>
              {movieTitle && <span style={{ color: C.textSoft }}>· {movieTitle}</span>}
            </div>

            <h1
              style={{
                margin: "0 0 10px",
                fontFamily: SERIF,
                fontSize: "clamp(28px, 5vw, 40px)",
                fontWeight: 400,
                lineHeight: 1.15,
                color: C.text,
              }}
            >
              {entry.title}
            </h1>

            <div
              style={{
                fontSize: 12,
                color: C.textSoft,
                fontFamily: SANS,
                display: "flex",
                gap: 16,
                alignItems: "center",
              }}
            >
              <span>Por @{entry.users?.username || normalizedUsername}</span>
              {entry.duration_label && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Clock size={12} /> {entry.duration_label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cover url custom image */}
        {entry.cover_url && (
          <div style={{ marginBottom: 32 }}>
            <img
              src={entry.cover_url}
              alt=""
              style={{
                width: "100%",
                maxHeight: 340,
                objectFit: "cover",
                borderRadius: 4,
                border: `1px solid ${C.border}`,
              }}
            />
          </div>
        )}

        {/* Content body */}
        <div
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(18px, 4vw, 22px)",
            lineHeight: 1.8,
            color: C.text,
            textAlign: "left",
            whiteSpace: "pre-wrap",
            marginBottom: 40,
            borderBottom: `1px solid ${C.border}`,
            paddingBottom: 40,
          }}
        >
          {entry.content}
        </div>

        {/* Footer info & actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", gap: 16, color: C.textSoft, fontFamily: SANS, fontSize: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Heart size={14} style={{ fill: C.textSoft, stroke: "none" }} /> {entry.likes_count} likes
            </span>
          </div>

          {viewerId !== null && entry.user_id === viewerId ? (
            <button
              onClick={() => void onDeleteOwnEntry()}
              disabled={saving}
              style={{
                border: `1px solid #6a3e3e`,
                background: "transparent",
                color: "#d99898",
                padding: "8px 16px",
                cursor: saving ? "default" : "pointer",
                fontFamily: SANS,
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Trash2 size={13} />
              {saving ? "Eliminando..." : "Eliminar entrada"}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
