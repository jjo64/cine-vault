import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  Award,
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ExternalLink,
  Film,
  MapPin,
  Share2,
  Star,
  Users,
} from "lucide-react";
import { GrainOverlay, Img } from "../../../components/profile-v2/primitives";
import { CREW_FILTERS, DEPARTMENT_LABELS } from "../constants";
import { usePersonData } from "../hooks/usePersonData";
import type { CreditItem, CrewTab, RoleTab } from "../types";
import {
  buildAwards,
  computeStats,
  filterByDecade,
  getBiographyParagraphs,
  getCreditTitle,
  getCreditYear,
  getDecades,
  movieHref,
  roleFromCrew,
  splitCrew,
  toPoster,
} from "../utils";
import { FilmRow } from "./FilmRow";
import styles from "./PersonPageView.module.css";

export function PersonPageView() {
  const navigate = useNavigate();
  const { loading, error, person, credits } = usePersonData();

  const [following, setFollowing] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [roleTab, setRoleTab] = useState<RoleTab>("crew");
  const [crewTab, setCrewTab] = useState<CrewTab>("director");
  const [decade, setDecade] = useState("Todo");

  const castMovies = useMemo(
    () =>
      (credits.cast || []).filter(
        (item) => item.media_type === "movie" && (item.title || item.name),
      ),
    [credits.cast],
  );

  const crewMovies = useMemo(
    () =>
      (credits.crew || []).filter(
        (item) => item.media_type === "movie" && (item.title || item.name),
      ),
    [credits.crew],
  );

  const knownFor = useMemo(() => {
    const unique = new Map<number, CreditItem>();

    for (const item of [...castMovies, ...crewMovies]) {
      if (!unique.has(item.id)) unique.set(item.id, item);
    }

    return Array.from(unique.values())
      .sort(
        (a, b) =>
          Number(b.vote_average || b.popularity || 0) -
          Number(a.vote_average || a.popularity || 0),
      )
      .slice(0, 8);
  }, [castMovies, crewMovies]);

  const crewByRole = useMemo(() => splitCrew(crewMovies), [crewMovies]);

  const activeCrewItems = useMemo(() => {
    const fromRole = crewByRole[crewTab];
    if (fromRole.length > 0) return fromRole;
    return crewMovies;
  }, [crewByRole, crewTab, crewMovies]);

  const actorItems = useMemo(() => {
    return castMovies.slice().sort((a, b) => {
      const aOrder = Number(a.order ?? 9999);
      const bOrder = Number(b.order ?? 9999);
      return aOrder - bOrder;
    });
  }, [castMovies]);

  const decadeOptions = useMemo(() => {
    const source = roleTab === "crew" ? activeCrewItems : actorItems;
    return getDecades(source);
  }, [roleTab, activeCrewItems, actorItems]);

  const visibleItems = useMemo(() => {
    const source = roleTab === "crew" ? activeCrewItems : actorItems;
    return filterByDecade(
      source.slice().sort((a, b) => {
        const aYear = getCreditYear(a) || 0;
        const bYear = getCreditYear(b) || 0;
        return bYear - aYear;
      }),
      decade,
    );
  }, [roleTab, activeCrewItems, actorItems, decade]);

  useEffect(() => {
    if (!decadeOptions.includes(decade)) {
      setDecade("Todo");
    }
  }, [decadeOptions, decade]);

  useEffect(() => {
    if (
      roleTab === "crew" &&
      activeCrewItems.length === 0 &&
      actorItems.length > 0
    ) {
      setRoleTab("actor");
    }
  }, [roleTab, activeCrewItems.length, actorItems.length]);

  const stats = useMemo(
    () =>
      computeStats(
        person?.popularity,
        knownFor,
        castMovies.length,
        crewMovies.length,
      ),
    [person?.popularity, knownFor, castMovies.length, crewMovies.length],
  );

  const awards = useMemo(
    () => buildAwards(person || { id: 0, name: "" }, knownFor),
    [person, knownFor],
  );
  const heroBackdrop = useMemo(
    () => toPoster(knownFor[0]?.poster_path, "original"),
    [knownFor],
  );
  const portrait = useMemo(
    () => toPoster(person?.profile_path, "original"),
    [person?.profile_path],
  );

  const bioParagraphs = useMemo(
    () => getBiographyParagraphs(person?.biography),
    [person?.biography],
  );
  const visibleBio = bioExpanded ? bioParagraphs : bioParagraphs.slice(0, 1);

  if (loading) {
    return (
      <div className={styles.stateScreen}>
        <GrainOverlay />
        Cargando biografia...
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className={styles.errorScreen}>
        <GrainOverlay />
        {error || "Persona no encontrada"}
      </div>
    );
  }

  const departmentLabel =
    DEPARTMENT_LABELS[person.known_for_department || ""] ||
    person.known_for_department ||
    "Persona";

  return (
    <div className={styles.root}>
      <GrainOverlay />

      <div className={styles.pagePadTop}>
        <section className={styles.hero}>
          <Img src={heroBackdrop} alt="" className={styles.heroBgImage} />
          <div className={styles.heroOverlayRight} />
          <div className={styles.heroOverlayBottom} />
          <div className={styles.heroGlow} />

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className={`${styles.desktopPortrait} ${styles.personPhoto}`}
          >
            <Img
              src={portrait}
              alt={person.name}
              className={styles.heroPortrait}
            />
            <div className={styles.heroPortraitOverlay} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            className={styles.heroContent}
          >
            <button onClick={() => navigate(-1)} className={styles.backButton}>
              <ChevronLeft size={14} /> Volver
            </button>

            <div className={styles.departmentTag}>
              <Film size={10} /> {departmentLabel}
            </div>

            <h1 className={styles.personName}>{person.name}</h1>

            <div className={styles.heroMetaRow}>
              <div className={styles.heroMetaItem}>
                <Calendar size={12} color="#9A7A48" />{" "}
                {person.birthday || "Sin fecha"}
                {person.deathday ? ` — ${person.deathday}` : ""}
              </div>
              <div className={styles.heroMetaItem}>
                <MapPin size={12} color="#9A7A48" />{" "}
                {person.place_of_birth || "Lugar desconocido"}
              </div>
            </div>

            <div className={styles.statsRow}>
              <div>
                <div className={styles.statValue}>
                  {stats.fans.toLocaleString()}
                </div>
                <div className={styles.statLabel}>Fans estimados</div>
              </div>
              <div>
                <div className={styles.statValue}>
                  {stats.avgRating ? stats.avgRating.toFixed(1) : "-"}
                </div>
                <div className={styles.statLabel}>Rating medio</div>
              </div>
              <div>
                <div className={styles.statValue}>{stats.totalFilms}</div>
                <div className={styles.statLabel}>Películas destacadas</div>
              </div>
            </div>

            <div className={styles.actionsRow}>
              <button
                onClick={() => setFollowing((value) => !value)}
                className={styles.followButton}
                style={{ background: following ? "#9A7A48" : "#D4AF7A" }}
              >
                <Bell size={12} /> {following ? "Siguiendo" : "Seguir"}
              </button>
              <button className={styles.iconButton}>
                <Share2 size={15} />
              </button>
            </div>
          </motion.div>
        </section>

        <div className={styles.contentWrap}>
          <div className={styles.twoCols}>
            <main>
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={styles.sectionBlock}
              >
                <div className={styles.sectionLabel}>
                  Biografía <div className={styles.sectionLine} />
                </div>
                {visibleBio.map((paragraph, index) => (
                  <p key={index} className={styles.biography}>
                    {paragraph}
                  </p>
                ))}
                {bioParagraphs.length > 1 ? (
                  <button
                    onClick={() => setBioExpanded((value) => !value)}
                    className={styles.toggleBioButton}
                  >
                    {bioExpanded ? (
                      <>
                        <ChevronUp size={13} /> Leer menos
                      </>
                    ) : (
                      <>
                        <ChevronDown size={13} /> Leer más
                      </>
                    )}
                  </button>
                ) : null}
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={styles.sectionBlock}
              >
                <div className={styles.sectionLabel}>
                  Conocido por <div className={styles.sectionLine} />
                </div>
                <div className={styles.knownForRow}>
                  {knownFor.slice(0, 6).map((item) => {
                    const title = getCreditTitle(item);
                    return (
                      <Link
                        key={item.id}
                        to={movieHref(item)}
                        className={styles.knownForLink}
                      >
                        <motion.div
                          whileHover={{ y: -5 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className={styles.knownForPosterWrap}>
                            <Img
                              src={toPoster(item.poster_path)}
                              alt={title}
                              className={styles.knownForPoster}
                            />
                          </div>
                          <div className={styles.knownForTitle}>{title}</div>
                          <div className={styles.knownForYear}>
                            {getCreditYear(item) || "-"}
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={styles.sectionBlock}
              >
                <div className={styles.sectionLabel}>
                  Filmografía <div className={styles.sectionLine} />
                </div>

                <div className={styles.roleTabs}>
                  {(["crew", "actor"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setRoleTab(tab)}
                      className={`${styles.roleTabButton} ${roleTab === tab ? styles.roleTabButtonActive : ""}`}
                    >
                      {tab === "crew"
                        ? `Crew (${crewMovies.length})`
                        : `Actor (${actorItems.length})`}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {roleTab === "crew" ? (
                    <motion.div
                      key="crew"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className={styles.filtersRowCrew}>
                        <div className={styles.pillRow}>
                          {CREW_FILTERS.map((entry) => (
                            <button
                              key={entry.key}
                              onClick={() => setCrewTab(entry.key)}
                              className={`${styles.pillButton} ${crewTab === entry.key ? styles.pillButtonActive : ""}`}
                            >
                              {entry.label}
                            </button>
                          ))}
                        </div>
                        <div className={styles.decadeRow}>
                          {decadeOptions.map((entry) => (
                            <button
                              key={entry}
                              onClick={() => setDecade(entry)}
                              className={`${styles.decadeButton} ${decade === entry ? styles.decadeButtonActive : ""}`}
                            >
                              {entry}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="actor"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className={styles.filtersRowActor}>
                        {decadeOptions.map((entry) => (
                          <button
                            key={entry}
                            onClick={() => setDecade(entry)}
                            className={`${styles.decadeButton} ${decade === entry ? styles.decadeButtonActive : ""}`}
                          >
                            {entry}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {visibleItems.length === 0 ? (
                  <div className={styles.emptyState}>
                    Sin resultados para este filtro.
                  </div>
                ) : (
                  visibleItems.map((item) => (
                    <FilmRow
                      key={`${roleTab}-${item.id}-${item.job || item.character || ""}`}
                      item={item}
                      badge={
                        roleTab === "crew" ? roleFromCrew(item) : undefined
                      }
                    />
                  ))
                )}
              </motion.section>
            </main>

            <aside>
              <div className={styles.stickyAside}>
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className={styles.awardsSection}
                >
                  <div className={styles.sectionLabel}>
                    Reconocimientos <div className={styles.sectionLine} />
                  </div>
                  <div className={styles.awardsList}>
                    {awards.map((entry, index) => (
                      <div key={index} className={styles.awardItem}>
                        <Award size={14} className={styles.awardIcon} />
                        <span className={styles.awardText}>{entry}</span>
                      </div>
                    ))}
                  </div>
                </motion.section>

                <div className={styles.statsCard}>
                  <div className={styles.statsCardTitle}>CineVault</div>
                  <div className={styles.statsCardRows}>
                    {[
                      {
                        icon: <Users size={14} />,
                        label: "Fans",
                        val: stats.fans.toLocaleString(),
                      },
                      {
                        icon: <Film size={14} />,
                        label: "En watchlists",
                        val: stats.watchlists.toLocaleString(),
                      },
                      {
                        icon: <Star size={14} />,
                        label: "Rating medio",
                        val: stats.avgRating ? stats.avgRating.toFixed(1) : "-",
                      },
                    ].map((entry, index) => (
                      <div key={index} className={styles.statsCardRow}>
                        <div className={styles.statsCardLabel}>
                          {entry.icon} {entry.label}
                        </div>
                        <div className={styles.statsCardValue}>{entry.val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <a
                  href={`https://www.themoviedb.org/person/${person.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.externalLink}
                >
                  Ver ficha externa <ExternalLink size={12} />
                </a>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
