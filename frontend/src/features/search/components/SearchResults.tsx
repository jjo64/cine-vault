import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, X, Film, User } from "lucide-react";
import { useSearchStore } from "../store/useSearchStore";
import { useSearchData } from "../hooks/useSearchData";
import { useEnrichFilms } from "../hooks/useEnrichFilms";
import { TABS_CONFIG } from "../constants";
import type { FiltersState, FilmResult, PersonResult } from "../types";

// Subcomponentes extraídos
import { FiltersPanel } from "./FiltersPanel";
import { ActiveFilters } from "./ActiveFilters";
import { Pagination } from "./Pagination";
import { FilmResultItem } from "./FilmResultItem";
import { PersonResultItem } from "./PersonResultItem";
import { UserResultItem } from "./UserResultItem";

// Componentes compartidos
import { Grain } from "../../../components/shared/Grain";

// Estilos
import styles from "./SearchResults.module.css";

const PER_PAGE = 5;

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() || "";

  // 1. Carga de datos y detalles
  useSearchData(query);

  // 2. Estado de Zustand
  const activeTab = useSearchStore((state) => state.activeTab);
  const setActiveTab = useSearchStore((state) => state.setActiveTab);
  const filters = useSearchStore((state) => state.filters);
  const setFilters = useSearchStore((state) => state.setFilters);
  const page = useSearchStore((state) => state.page);
  const setPage = useSearchStore((state) => state.setPage);
  const isSearching = useSearchStore((state) => state.isSearching);
  const showFilters = useSearchStore((state) => state.showFilters);
  const setShowFilters = useSearchStore((state) => state.setShowFilters);
  const isFiltersOpen = useSearchStore((state) => state.isFiltersOpen);
  const setIsFiltersOpen = useSearchStore((state) => state.setIsFiltersOpen);

  const filmResults = useSearchStore((state) => state.filmResults);
  const personResults = useSearchStore((state) => state.personResults);
  const userResults = useSearchStore((state) => state.userResults);
  const enrichedFilms = useSearchStore((state) => state.enrichedFilms);
  const loadingFilmDetails = useSearchStore((state) => state.loadingFilmDetails);
  const fetchError = useSearchStore((state) => state.fetchError);
  const resetFilters = useSearchStore((state) => state.resetFilters);

  // 3. Handlers de filtros
  const handleFilterChange = (
    k: keyof FiltersState,
    v: FiltersState[keyof FiltersState],
  ) => {
    setFilters((prev) => ({ ...prev, [k]: v }));
    setPage(1);
  };

  const handleFilterRemove = (k: keyof FiltersState, v?: string) => {
    setFilters((prev) => {
      if (!v) {
        if (k === "genres" || k === "countries") return { ...prev, [k]: [] };
        if (k === "yearFrom" || k === "yearTo") return { ...prev, [k]: "" };
        if (k === "minRating") return { ...prev, [k]: 0 };
        if (k === "duration") return { ...prev, [k]: null };
        if (k === "pendientes" || k === "palmares" || k === "noVistas")
          return { ...prev, [k]: false };
        return { ...prev, [k]: null };
      }
      const arr = ((prev[k] as string[]) || []).filter((entry) => entry !== v);
      return { ...prev, [k]: arr };
    });
    setPage(1);
  };

  // 4. Lógica de negocio (useMemo)
  const mergedFilms = useMemo(
    () =>
      filmResults.map((film) => {
        const details = enrichedFilms[film.id];
        return {
          ...film,
          ...details,
          director: details?.director ?? film.director,
          runtime: details?.runtime ?? film.runtime,
          genres: details?.genres ?? film.genres,
          country: details?.country ?? film.country,
        };
      }),
    [filmResults, enrichedFilms],
  );

  const filteredFilms = useMemo(() => {
    const selectedGenres = (filters.genres || []).map((genre) =>
      genre.toLowerCase(),
    );
    const selectedCountries = (filters.countries || []).map((country) =>
      country.toLowerCase(),
    );

    return mergedFilms.filter((film) => {
      if (
        filters.yearFrom &&
        film.year &&
        film.year < parseInt(filters.yearFrom, 10)
      )
        return false;
      if (
        filters.yearTo &&
        film.year &&
        film.year > parseInt(filters.yearTo, 10)
      )
        return false;

      const stars = film.rating > 5 ? film.rating / 2 : film.rating;
      if (filters.minRating && stars < filters.minRating) return false;

      if (selectedGenres.length > 0) {
        const filmGenres = (film.genres || []).map((genre) =>
          genre.toLowerCase(),
        );
        const hasGenre = selectedGenres.some((genre) =>
          filmGenres.some(
            (filmGenre) =>
              filmGenre.includes(genre) || genre.includes(filmGenre),
          ),
        );
        if (!hasGenre) return false;
      }

      if (selectedCountries.length > 0) {
        const country = (film.country || "").toLowerCase();
        const hasCountry = selectedCountries.some(
          (selected) =>
            country.includes(selected) || selected.includes(country),
        );
        if (!hasCountry) return false;
      }

      if (filters.duration) {
        const runtime = typeof film.runtime === "number" ? film.runtime : null;
        if (!runtime) return false;
        if (filters.duration === "short" && !(runtime < 90)) return false;
        if (filters.duration === "medium" && !(runtime >= 90 && runtime <= 130))
          return false;
        if (filters.duration === "long" && !(runtime > 130 && runtime <= 180))
          return false;
        if (filters.duration === "epic" && !(runtime > 180)) return false;
      }

      return true;
    });
  }, [mergedFilms, filters]);

  const filteredMovies = useMemo(
    () => filteredFilms.filter((film) => film.mediaType === "movie"),
    [filteredFilms],
  );

  const filteredSeries = useMemo(
    () => filteredFilms.filter((film) => film.mediaType === "tv"),
    [filteredFilms],
  );

  const displayedByTab =
    activeTab === "all"
      ? [...filteredFilms, ...personResults, ...userResults]
      : activeTab === "film"
        ? filteredMovies
        : activeTab === "tv"
          ? filteredSeries
          : activeTab === "person"
            ? personResults
            : userResults;

  const totalPages = Math.max(
    1,
    Math.ceil(
      (activeTab === "film"
        ? filteredMovies.length
        : activeTab === "tv"
          ? filteredSeries.length
          : filteredFilms.length) / PER_PAGE,
    ),
  );

  const pageFilms = useMemo(() => {
    return (
      activeTab === "film"
        ? filteredMovies
        : activeTab === "tv"
          ? filteredSeries
          : filteredFilms
    ).slice((page - 1) * PER_PAGE, page * PER_PAGE);
  }, [activeTab, page, filteredMovies, filteredSeries, filteredFilms]);

  useEnrichFilms(pageFilms);

  const counts = {
    all: filteredFilms.length + personResults.length + userResults.length,
    film: filteredMovies.length,
    tv: filteredSeries.length,
    person: personResults.length,
    user: userResults.length,
  };

  return (
    <div className={styles.container}>
      <Grain />

      <div style={{ paddingTop: "var(--nav-height, 72px)" }}>
        {/* Barra de cabecera de resultados */}
        <div className={styles.searchHeader}>
          <div>
            <span className={styles.resultsCount}>
              {counts.all} resultado{counts.all !== 1 ? "s" : ""}
            </span>
            <span className={styles.resultsQuery}> para "{query || "..."}"</span>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`${styles.toggleFiltersBtn} ${showFilters ? styles.active : ""}`}
            >
              <SlidersHorizontal size={12} />{" "}
              {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            </button>
          </div>
        </div>

        {/* Barra de tabs */}
        <div className={styles.tabsBar}>
          {TABS_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={`${styles.tabBtn} ${activeTab === tab.key ? styles.active : ""}`}
            >
              <span className={styles.tabIcon}>
                {tab.iconName === "film" ? <Film size={12} /> : <User size={12} />}
              </span>
              {tab.label}{" "}
              <span className={styles.tabCount}>
                ({counts[tab.key as keyof typeof counts]})
              </span>
            </button>
          ))}
        </div>

        {/* Panel de filtros y resultados */}
        <main className={styles.mainContent}>
          <AnimatePresence>
            {/* Drawer de filtros mobile */}
            <div
              className={`${styles.filtersDrawer} ${
                isFiltersOpen ? styles.filtersDrawerOpen : ""
              }`}
            >
              <div className={styles.drawerHeader}>
                <div className={styles.drawerTitle}>Filtros</div>
                <button
                  onClick={() => setIsFiltersOpen(false)}
                  aria-label="Cerrar"
                  className={styles.drawerCloseBtn}
                >
                  <X size={20} />
                </button>
              </div>
              <div className={styles.drawerContent}>
                <FiltersPanel
                  filters={filters}
                  onChange={handleFilterChange}
                  onClear={resetFilters}
                />
                <button
                  onClick={() => setIsFiltersOpen(false)}
                  className={styles.drawerApplyBtn}
                >
                  Aplicar filtros
                </button>
              </div>
            </div>

            {/* Panel de filtros desktop */}
            {showFilters && (
              <motion.div
                key="desktop-filters-panel"
                className={styles.desktopFilters}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <div style={{ width: 280, padding: "32px 28px" }}>
                  <FiltersPanel
                    filters={filters}
                    onChange={handleFilterChange}
                    onClear={resetFilters}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.resultsPanel}>
            <button
              className={styles.mobileFiltersBtn}
              onClick={() => setIsFiltersOpen(true)}
            >
              <SlidersHorizontal size={14} /> Filtros
            </button>

            {fetchError && <div className={styles.fetchError}>{fetchError}</div>}

            <ActiveFilters filters={filters} onRemove={handleFilterRemove} />

            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${page}-${JSON.stringify(filters)}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "all" && (
                  <>
                    {personResults.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div className={styles.sectionHeader}>Personas</div>
                        {personResults.map((person: PersonResult, i: number) => (
                          <PersonResultItem
                            key={person.id}
                            item={person}
                            delay={i * 0.06}
                          />
                        ))}
                      </div>
                    )}

                    {userResults.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div className={styles.sectionHeader}>Usuarios</div>
                        {userResults.map((user, i) => (
                          <UserResultItem
                            key={user.id}
                            item={user}
                            delay={i * 0.06}
                          />
                        ))}
                      </div>
                    )}

                    <div className={styles.sectionHeader}>Películas y Series</div>
                    {pageFilms.map((film: FilmResult, i: number) => {
                      const details = enrichedFilms[film.id];
                      const mergedFilm: FilmResult = {
                        ...film,
                        ...details,
                        director: details?.director ?? film.director,
                        runtime: details?.runtime ?? film.runtime,
                        genres: details?.genres ?? film.genres,
                        country: details?.country ?? film.country,
                      };
                      return (
                        <FilmResultItem
                          key={`${mergedFilm.id}-${mergedFilm.mediaType}`}
                          item={mergedFilm}
                          delay={i * 0.05}
                          isDetailsLoading={Boolean(loadingFilmDetails[mergedFilm.id])}
                        />
                      );
                    })}
                  </>
                )}

                {activeTab === "film" &&
                  pageFilms.map((film: FilmResult, i: number) => {
                    const details = enrichedFilms[film.id];
                    const mergedFilm: FilmResult = {
                      ...film,
                      ...details,
                      director: details?.director ?? film.director,
                      runtime: details?.runtime ?? film.runtime,
                      genres: details?.genres ?? film.genres,
                      country: details?.country ?? film.country,
                    };

                    return (
                      <FilmResultItem
                        key={`${film.id}-movie`}
                        item={mergedFilm}
                        delay={i * 0.05}
                        isDetailsLoading={Boolean(loadingFilmDetails[film.id])}
                      />
                    );
                  })}

                {activeTab === "tv" &&
                  pageFilms.map((film: FilmResult, i: number) => {
                    const details = enrichedFilms[film.id];
                    const mergedFilm: FilmResult = {
                      ...film,
                      ...details,
                      director: details?.director ?? film.director,
                      runtime: details?.runtime ?? film.runtime,
                      genres: details?.genres ?? film.genres,
                      country: details?.country ?? film.country,
                    };

                    return (
                      <FilmResultItem
                        key={`${film.id}-tv`}
                        item={mergedFilm}
                        delay={i * 0.05}
                        isDetailsLoading={Boolean(loadingFilmDetails[film.id])}
                      />
                    );
                  })}

                {activeTab === "person" &&
                  personResults.map((person: PersonResult, i: number) => (
                    <PersonResultItem
                      key={person.id}
                      item={person}
                      delay={i * 0.06}
                    />
                  ))}

                {activeTab === "user" &&
                  userResults.map((user, i: number) => (
                    <UserResultItem
                      key={user.id}
                      item={user}
                      delay={i * 0.06}
                    />
                  ))}

                {isSearching ? (
                  <div className={styles.loadingContainer}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                      className={styles.spinner}
                    />
                    <div className={styles.loadingText}>Buscando en la bóveda...</div>
                  </div>
                ) : displayedByTab.length === 0 ? (
                  <div className={styles.emptyContainer}>
                    <div className={styles.emptyTitle}>Sin resultados</div>
                    <div className={styles.emptySub}>
                      Intenta con otros filtros o una búsqueda diferente.
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            {(activeTab === "all" ||
              activeTab === "film" ||
              activeTab === "tv") &&
              (activeTab === "film"
                ? filteredMovies.length
                : activeTab === "tv"
                  ? filteredSeries.length
                  : filteredFilms.length) > PER_PAGE && (
                <Pagination
                  current={page}
                  total={totalPages}
                  onPage={(nextPage) => {
                    setPage(nextPage);
                    window.scrollTo({ top: 130, behavior: "smooth" });
                  }}
                />
              )}
          </div>
        </main>
      </div>
    </div>
  );
}
export default SearchResults;
