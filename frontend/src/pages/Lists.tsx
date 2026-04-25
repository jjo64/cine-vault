import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/authServices";
import {
  addMovieToList,
  createList,
  deleteList,
  getMyListDetail,
  getMyLists,
  removeMovieFromList,
  type UserListDetail,
  type UserListSummary,
} from "../services/listsServices";
import "./Lists.css";

const C = {
  bg: "#080808",
  surface: "#111111",
  elevated: "#1A1A1A",
  border: "#252525",
  accent: "#D4AF7A",
  accentDim: "#9A7A48",
  text: "#E2E2E2",
  textSoft: "#7A7A7A",
  error: "#ff9d9d",
} as const;

const SANS = "'Syne', sans-serif";
const SERIF = "'Cormorant Garamond', serif";

export default function ListsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<UserListSummary[]>([]);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [activeList, setActiveList] = useState<UserListDetail | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [movieToAdd, setMovieToAdd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sortedLists = useMemo(
    () =>
      [...lists].sort(
        (a, b) => +new Date(b.updated_at) - +new Date(a.updated_at),
      ),
    [lists],
  );

  const refreshLists = async (preferredId?: number | null) => {
    const listData = await getMyLists();
    setLists(Array.isArray(listData) ? listData : []);

    const nextId = preferredId ?? listData[0]?.id ?? null;
    setActiveListId(nextId);
    if (nextId) {
      const detail = await getMyListDetail(nextId);
      setActiveList(detail);
    } else {
      setActiveList(null);
    }
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        await getCurrentUser();
        if (!alive) return;
        await refreshLists();
      } catch (err) {
        if (!alive) return;
        setError((err as Error).message || "No se pudieron cargar tus listas");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const selectList = async (listId: number) => {
    setActiveListId(listId);
    setError(null);

    try {
      const detail = await getMyListDetail(listId);
      setActiveList(detail);
    } catch (err) {
      setError((err as Error).message || "No se pudo cargar la lista");
    }
  };

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name) {
      setError("Poné un nombre para crear la lista");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const created = await createList({
        name,
        description: newListDescription.trim() || null,
      });
      setNewListName("");
      setNewListDescription("");
      await refreshLists(created.id);
      setMessage(`Lista "${created.name}" creada`);
    } catch (err) {
      setError((err as Error).message || "No se pudo crear la lista");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteList = async () => {
    if (!activeListId) return;

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await deleteList(activeListId);
      await refreshLists();
      setMessage("Lista eliminada");
    } catch (err) {
      setError((err as Error).message || "No se pudo eliminar la lista");
    } finally {
      setBusy(false);
    }
  };

  const handleAddMovie = async () => {
    if (!activeListId) return;
    const movieId = Number(movieToAdd);
    if (!Number.isInteger(movieId) || movieId <= 0) {
      setError("Ingresá un movie_id/TMDB ID válido");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await addMovieToList(activeListId, movieId);
      const detail = await getMyListDetail(activeListId);
      setActiveList(detail);
      await refreshLists(activeListId);
      setMovieToAdd("");
      setMessage("Película agregada a la lista");
    } catch (err) {
      setError((err as Error).message || "No se pudo agregar la película");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveMovie = async (movieId: number) => {
    if (!activeListId) return;

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await removeMovieFromList(activeListId, movieId);
      const detail = await getMyListDetail(activeListId);
      setActiveList(detail);
      await refreshLists(activeListId);
      setMessage("Película eliminada de la lista");
    } catch (err) {
      setError((err as Error).message || "No se pudo eliminar la película");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: C.bg,
          color: C.textSoft,
        }}
      >
        Cargando listas...
      </div>
    );
  }

  return (
    <main className="lists-main" style={{ color: C.text }}>
      <div className="lists-container">
        <div className="lists-header">
          <h1
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontSize: "clamp(30px, 5vw, 48px)",
              fontWeight: 400,
            }}
          >
            Mis Listas
          </h1>
          <button
            onClick={() => navigate("/profile")}
            style={{
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.textSoft,
              padding: "8px 12px",
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Volver al perfil
          </button>
        </div>

        {error && (
          <div style={{ color: C.error, fontFamily: SANS, fontSize: 12 }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{ color: C.accent, fontFamily: SANS, fontSize: 12 }}>
            {message}
          </div>
        )}

        <section
          style={{
            border: `1px solid ${C.border}`,
            background: C.surface,
            padding: 14,
            display: "grid",
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontSize: 11,
              color: C.textSoft,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Crear nueva lista
          </div>
          <input
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            placeholder="Nombre"
            style={{
              border: `1px solid ${C.border}`,
              background: C.elevated,
              color: C.text,
              padding: "10px 12px",
              fontFamily: SANS,
            }}
          />
          <textarea
            value={newListDescription}
            onChange={(event) => setNewListDescription(event.target.value)}
            placeholder="Descripción (opcional)"
            style={{
              border: `1px solid ${C.border}`,
              background: C.elevated,
              color: C.textSoft,
              minHeight: 74,
              padding: "10px 12px",
              resize: "vertical",
              fontFamily: SERIF,
              fontStyle: "italic",
            }}
          />
          <button
            onClick={handleCreateList}
            disabled={busy}
            style={{
              justifySelf: "start",
              border: `1px solid ${C.accentDim}`,
              background: "rgba(212,175,122,0.1)",
              color: C.accent,
              padding: "8px 12px",
              cursor: busy ? "default" : "pointer",
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Crear lista
          </button>
        </section>

        <div className="lists-content-grid">
          <section
            style={{
              border: `1px solid ${C.border}`,
              background: C.surface,
              padding: 10,
              display: "grid",
              gap: 8,
              alignContent: "start",
            }}
          >
            <div
              style={{
                fontFamily: SANS,
                fontSize: 11,
                color: C.textSoft,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Tus listas ({sortedLists.length})
            </div>
            {sortedLists.map((list) => (
              <button
                key={list.id}
                onClick={() => selectList(list.id)}
                style={{
                  textAlign: "left",
                  border: `1px solid ${activeListId === list.id ? C.accentDim : C.border}`,
                  background:
                    activeListId === list.id
                      ? "rgba(212,175,122,0.08)"
                      : C.elevated,
                  color: C.text,
                  padding: "10px 12px",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontFamily: SERIF, fontSize: 19 }}>
                  {list.name}
                </div>
                <div
                  style={{ color: C.textSoft, fontSize: 11, fontFamily: SANS }}
                >
                  {list.items_count} películas
                </div>
              </button>
            ))}
            {sortedLists.length === 0 && (
              <div
                style={{
                  color: C.textSoft,
                  fontFamily: SERIF,
                  fontStyle: "italic",
                }}
              >
                Todavía no creaste listas.
              </div>
            )}
          </section>

          <section
            style={{
              border: `1px solid ${C.border}`,
              background: C.surface,
              padding: 12,
              display: "grid",
              gap: 10,
              alignContent: "start",
            }}
          >
            {!activeList ? (
              <div
                style={{
                  color: C.textSoft,
                  fontFamily: SERIF,
                  fontStyle: "italic",
                }}
              >
                Seleccioná una lista para editarla.
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    gap: 10,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontFamily: SERIF,
                        fontSize: 30,
                        fontWeight: 400,
                      }}
                    >
                      {activeList.name}
                    </h2>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: C.textSoft,
                        fontFamily: SERIF,
                        fontStyle: "italic",
                      }}
                    >
                      {activeList.description || "Sin descripción"}
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteList}
                    disabled={busy}
                    style={{
                      border: `1px solid ${C.border}`,
                      background: "transparent",
                      color: C.error,
                      padding: "8px 10px",
                      cursor: busy ? "default" : "pointer",
                      fontSize: 11,
                      fontFamily: SANS,
                      textTransform: "uppercase",
                    }}
                  >
                    Eliminar lista
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    value={movieToAdd}
                    onChange={(event) =>
                      setMovieToAdd(event.target.value.replace(/\D/g, ""))
                    }
                    placeholder="TMDB ID"
                    style={{
                      border: `1px solid ${C.border}`,
                      background: C.elevated,
                      color: C.text,
                      padding: "8px 10px",
                      minWidth: 130,
                      fontFamily: SANS,
                    }}
                  />
                  <button
                    onClick={handleAddMovie}
                    disabled={busy}
                    style={{
                      border: `1px solid ${C.accentDim}`,
                      background: "rgba(212,175,122,0.1)",
                      color: C.accent,
                      padding: "8px 12px",
                      cursor: busy ? "default" : "pointer",
                      fontFamily: SANS,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                    }}
                  >
                    Agregar película
                  </button>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {activeList.items.map((item) => (
                    <div
                      key={`${item.movie_id}-${item.added_at}`}
                      style={{
                        border: `1px solid ${C.border}`,
                        background: C.elevated,
                        padding: "8px 10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: SANS,
                            color: C.text,
                            fontSize: 13,
                          }}
                        >
                          movie_id: {item.movie_id}
                        </div>
                        <div style={{ color: C.textSoft, fontSize: 11 }}>
                          tmdb_id: {item.tmdb_id ?? "-"} ·{" "}
                          {new Date(item.added_at).toLocaleDateString("es-ES")}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMovie(item.movie_id)}
                        disabled={busy}
                        style={{
                          border: `1px solid ${C.border}`,
                          background: "transparent",
                          color: C.error,
                          padding: "6px 8px",
                          cursor: busy ? "default" : "pointer",
                          fontFamily: SANS,
                          fontSize: 10,
                          textTransform: "uppercase",
                        }}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  {activeList.items.length === 0 && (
                    <div
                      style={{
                        color: C.textSoft,
                        fontFamily: SERIF,
                        fontStyle: "italic",
                      }}
                    >
                      No hay películas en esta lista todavía.
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
