import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Trash, Globe, Lock, Film, Check, Edit3, X, Search, Plus, Trash2 } from "lucide-react";
import { getCurrentUser, type AuthUser } from "../services/authServices";
import {
  getPublicListDetail,
  getMyListDetail,
  updateList,
  deleteList,
  addMovieToList,
  removeMovieFromList,
  type UserListDetail,
  type UserListItem,
} from "../services/listsServices";
import { searchMovies, type SearchMovieResult } from "../services/searchServices";
import { Grain } from "../components/shared/Grain";
import { Img } from "../components/shared/Img";
import styles from "./ListDetail.module.css";

const C = {
  bg: "#080808",
  surface: "#111111",
  elevated: "#161616",
  border: "#222222",
  accent: "#D4AF7A",
  accentDim: "#9A7A48",
  accentGlow: "rgba(212,175,122,0.12)",
  text: "#E2E2E2",
  textSoft: "#888888",
  textMuted: "#444444",
  error: "#ff7b7b",
} as const;

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const listId = id ? parseInt(id, 10) : NaN;
  const navigate = useNavigate();

  const [detail, setDetail] = useState<UserListDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Edit list states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPublic, setEditPublic] = useState(true);

  // Add movie search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMovieResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const isOwner = useMemo(() => {
    if (!detail || !currentUser) return false;
    return detail.user_id === currentUser.id;
  }, [detail, currentUser]);

  const loadList = async () => {
    if (!Number.isFinite(listId) || listId <= 0) {
      setError("ID de lista inválido.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user profile if logged in
      let user: AuthUser | null = null;
      try {
        user = await getCurrentUser();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      }

      // Try fetching public detail first
      let data: UserListDetail | null = null;
      try {
        data = await getPublicListDetail(listId);
      } catch (publicErr) {
        // If public fails and we have a user, try private fetch
        if (user) {
          try {
            data = await getMyListDetail(listId);
          } catch (privateErr) {
            throw new Error("No tienes permisos para ver esta lista o no existe.");
          }
        } else {
          throw new Error("Esta lista es privada o no existe. Iniciá sesión si es tuya.");
        }
      }

      if (data) {
        setDetail(data);
        setEditName(data.name);
        setEditDesc(data.description || "");
        setEditPublic(data.is_public);
      } else {
        throw new Error("Lista no encontrada.");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar la lista.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, [listId]);

  // Debounce search movies query
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

  const handleUpdateMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || busy || !detail) return;

    setBusy(true);
    try {
      const updated = await updateList(detail.id, {
        name: editName.trim(),
        description: editDesc.trim() || null,
        is_public: editPublic,
      });
      setDetail((prev) => prev ? { ...prev, ...updated } : null);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar la lista.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteList = async () => {
    if (!window.confirm("¿Seguro que querés eliminar esta lista permanentemente?") || !detail) return;

    setBusy(true);
    try {
      await deleteList(detail.id);
      navigate("/lists");
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar la lista.");
      setBusy(false);
    }
  };

  const handleAddMovie = async (item: SearchMovieResult) => {
    if (!detail) return;
    setBusy(true);
    try {
      // Check if already in list
      const alreadyInList = detail.items.some(
        (listItem) => listItem.tmdb_id === item.id
      );
      if (alreadyInList) {
        alert("Esta película ya está en la lista.");
        setBusy(false);
        return;
      }

      await addMovieToList(detail.id, item.id);
      setSearchQuery("");
      setSearchResults([]);

      // Reload list detail
      const refreshedDetail = await getMyListDetail(detail.id);
      setDetail(refreshedDetail);
    } catch (err: any) {
      alert(err.message || "No se pudo agregar la película.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveMovie = async (movieId: number) => {
    if (!detail) return;
    setBusy(true);
    try {
      await removeMovieFromList(detail.id, movieId);
      // Reload list detail
      const refreshedDetail = await getMyListDetail(detail.id);
      setDetail(refreshedDetail);
    } catch (err: any) {
      alert(err.message || "No se pudo quitar la película.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Grain />
        <div style={{ color: C.textSoft }}>Cargando lista...</div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className={styles.loadingContainer}>
        <Grain />
        <div className={styles.errorSection}>
          <p className={styles.errorText}>{error || "No se pudo encontrar la lista."}</p>
          <button onClick={() => navigate("/lists")} className={styles.backBtn}>
            <ArrowLeft size={12} /> Volver al descubridor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Grain />
      
      {/* Header Navigation */}
      <nav className={styles.navbar}>
        <Link to="/lists" className={styles.navBackLink}>
          <ArrowLeft size={13} /> Descubrir Listas
        </Link>
        <div className={styles.navTitle}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </div>
        <div style={{ width: 100 }} />
      </nav>

      <div className={styles.contentWrapper}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className={styles.headerSection}
        >
          {/* Top badges and actions */}
          <div className={styles.badgeRow}>
            <div style={{ display: "flex", gap: 8 }}>
              {detail.is_official && (
                <span className={styles.officialBadge}>
                  OFICIAL CINEVAULT
                </span>
              )}
              {detail.is_public ? (
                <span className={styles.privacyBadgePublic}>
                  <Globe size={9} /> PÚBLICA
                </span>
              ) : (
                <span className={styles.privacyBadgePrivate}>
                  <Lock size={9} /> PRIVADA
                </span>
              )}
            </div>

            {isOwner && !isEditing && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setIsEditing(true)}
                  className={styles.editBtn}
                >
                  <Edit3 size={11} /> Editar
                </button>
                <button
                  onClick={handleDeleteList}
                  className={styles.deleteBtn}
                  disabled={busy}
                >
                  <Trash2 size={11} /> Eliminar
                </button>
              </div>
            )}
          </div>

          {/* Title or Editor */}
          {isEditing ? (
            <form onSubmit={handleUpdateMetadata} className={styles.editForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Título</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Descripción</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className={styles.formTextarea}
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Visibilidad</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setEditPublic(true)}
                    className={`${styles.visibilitySelect} ${editPublic ? styles.visibilitySelectActive : ""}`}
                  >
                    <Globe size={12} /> Pública
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPublic(false)}
                    className={`${styles.visibilitySelect} ${!editPublic ? styles.visibilitySelectActive : ""}`}
                  >
                    <Lock size={12} /> Privada
                  </button>
                </div>
              </div>

              <div className={styles.editFormActions}>
                <button type="submit" className={styles.saveBtn} disabled={busy}>
                  {busy ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(detail.name);
                    setEditDesc(detail.description || "");
                    setEditPublic(detail.is_public);
                  }}
                  className={styles.cancelBtn}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className={styles.listTitle}>{detail.name}</h1>
              {detail.description && (
                <p className={styles.listDescription}>{detail.description}</p>
              )}
            </>
          )}

          {/* Owner info row */}
          {!isEditing && (
            <div className={styles.ownerRow}>
              <Link to={`/${detail.owner?.username}`} className={styles.ownerLink}>
                <div className={styles.avatarWrapper}>
                  {detail.owner?.avatar_url ? (
                    <Img src={detail.owner.avatar_url} className={styles.avatarImg} />
                  ) : (
                    detail.owner?.username?.slice(0, 1).toUpperCase() || "U"
                  )}
                </div>
                <span className={styles.ownerName}>
                  Curada por <strong>{detail.owner?.username || "Anónimo"}</strong>
                </span>
              </Link>

              <span className={styles.statsLabel}>
                <Film size={11} /> {detail.items_count} películas
              </span>
            </div>
          )}
        </motion.div>

        {/* Owner movie addition tool */}
        {isOwner && !isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className={styles.addMoviesSection}
          >
            <h3 className={styles.addMoviesTitle}>Añadir películas a esta colección</h3>
            <div className={styles.searchWrapper}>
              <Search size={14} className={styles.searchIcon} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título de película o serie..."
                className={styles.searchInput}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className={styles.clearSearchBtn}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Live search results */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={styles.searchResultsDropdown}
                >
                  {searchLoading && <div className={styles.dropdownLoading}>Buscando...</div>}
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAddMovie(item)}
                      className={styles.resultItem}
                      disabled={busy}
                    >
                      <div className={styles.resultPoster}>
                        {item.poster_path && (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                            alt=""
                          />
                        )}
                      </div>
                      <div className={styles.resultInfo}>
                        <div className={styles.resultItemTitle}>{item.title || item.name}</div>
                        <div className={styles.resultMeta}>
                          {item.media_type === "tv" ? "Serie" : "Película"}
                          {item.release_date || item.first_air_date ? (
                            <span style={{ marginLeft: 6 }}>
                              ({new Date(item.release_date || item.first_air_date!).getFullYear()})
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Plus size={14} className={styles.addPlusIcon} />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Movie listing */}
        <div className={styles.gridSection}>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            {detail.items.length === 0 ? (
              <div className={styles.emptyMessage}>
                Esta colección está vacía. {isOwner && "Añadí algunas películas arriba para empezar."}
              </div>
            ) : (
              <div className={styles.moviesGrid}>
                {detail.items.map((item, index) => {
                  const releaseYear = item.movie_info?.release_date
                    ? new Date(item.movie_info.release_date).getFullYear()
                    : null;
                  
                  return (
                    <motion.div
                      key={`${item.movie_id}-${item.added_at}`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: index * 0.04 }}
                      className={styles.movieCard}
                    >
                      <Link to={`/${item.media_type || "movie"}/${item.tmdb_id}`} className={styles.posterLink}>
                        <div className={styles.posterWrapper}>
                          {item.movie_info?.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w342${item.movie_info.poster_path}`}
                              alt={item.movie_info.title}
                              className={styles.posterImg}
                            />
                          ) : (
                            <div className={styles.posterPlaceholder}>
                              <span>{item.movie_info?.title || "Película"}</span>
                            </div>
                          )}
                          
                          {/* Hover Overlay */}
                          <div className={styles.cardHoverOverlay}>
                            <span className={styles.viewDetailsText}>Ver detalles</span>
                          </div>
                        </div>
                      </Link>

                      <div className={styles.cardMeta}>
                        <Link to={`/${item.media_type || "movie"}/${item.tmdb_id}`} className={styles.cardTitleLink}>
                          <h4 className={styles.cardMovieTitle} title={item.movie_info?.title}>
                            {item.movie_info?.title || `ID #${item.tmdb_id}`}
                          </h4>
                        </Link>
                        {releaseYear && <span className={styles.cardYear}>({releaseYear})</span>}
                        
                        {isOwner && (
                          <button
                            onClick={() => handleRemoveMovie(item.movie_id)}
                            className={styles.removeMovieBtn}
                            title="Quitar de la lista"
                            disabled={busy}
                          >
                            <Trash size={11} /> Quitar
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListDetailPage;
