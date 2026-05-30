import { useEffect, useState } from "react";
import { Edit3, Share2, Settings, UserPlus, UserMinus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useProfileStore } from "../../../store/useProfileStore";
import { backdropImages } from "../../../constants";
import { Img } from "../../primitives/primitives";
import styles from "./ProfileHero.module.css";

interface ProfileHeroProps {
  onToggleFollow: () => void;
}

export function ProfileHero({ onToggleFollow }: ProfileHeroProps) {
  const navigate = useNavigate();

  const profileHeader = useProfileStore((s) => s.profileHeader);
  const stats = useProfileStore((s) => s.stats);
  const followerUsers = useProfileStore((s) => s.followerUsers);
  const followingUsers = useProfileStore((s) => s.followingUsers);
  const isOwnProfile = useProfileStore((s) => s.isOwnProfile);
  const isAuthenticated = useProfileStore((s) => s.isAuthenticated);
  const isPublicProfile = useProfileStore((s) => s.isPublicProfile);
  const isFollowing = useProfileStore((s) => s.isFollowing);
  const followBusy = useProfileStore((s) => s.followBusy);

  const canEditProfile = isAuthenticated && isOwnProfile;

  const [openList, setOpenList] = useState<"followers" | "following" | null>(null);
  const listItems = openList === "followers" ? followerUsers : followingUsers;

  useEffect(() => {
    if (!openList) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenList(null);
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [openList]);

  const onNavigateToUser = (targetUsername: string) => {
    navigate(`/${encodeURIComponent(targetUsername.trim())}`);
  };

  return (
    <div className={styles.heroContainer}>
      <div className={styles.hero}>
        <div className={styles.heroBackdrops}>
          {backdropImages.map((src, index) => (
            <div key={index} className={styles.backdropItem}>
              <Img
                src={src}
                alt=""
                className={styles.backdropImg}
              />
            </div>
          ))}
        </div>

        <div className={styles.heroGradient} />

        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
        >
          <div className={styles.avatarWrapperContainer}>
            <div className={styles.avatarWrapper}>
              <Img
                src={profileHeader.avatarUrl}
                alt={profileHeader.displayName}
                className={styles.avatarImg}
              />
            </div>
            <div className={styles.activeDot} />
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.displayNameWrapper}>
              <h1 className={styles.displayName}>
                {profileHeader.displayName}
              </h1>
              {profileHeader.membership && profileHeader.membership !== "free" && (
                <span className={`${styles.membershipBadge} ${styles[profileHeader.membership]}`}>
                  {profileHeader.membership.toUpperCase()}
                </span>
              )}
            </div>
            <div className={styles.metaText}>
              @{profileHeader.username} · miembro desde {profileHeader.memberSince}
            </div>
            <div className={styles.bioText}>
              {profileHeader.bio}
            </div>

            {canEditProfile && (
              <div className={styles.actionButtons}>
                <button
                  onClick={() => navigate("/settings")}
                  className={styles.btnPrimary}
                >
                  <Edit3 size={11} /> Editar perfil
                </button>
                <button
                  className={styles.btnSecondary}
                >
                  <Share2 size={11} /> Compartir
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className={styles.btnSettings}
                  aria-label="Ajustes"
                >
                  <Settings size={13} />
                </button>
              </div>
            )}

            {!canEditProfile && isPublicProfile && (
              <div className={styles.actionButtons}>
                <button
                  onClick={onToggleFollow}
                  disabled={followBusy}
                  className={`${styles.followBtn} ${isFollowing ? styles.following : styles.notFollowing}`}
                >
                  {isFollowing ? <UserMinus size={11} /> : <UserPlus size={11} />}
                  {followBusy
                    ? "Actualizando..."
                    : isFollowing
                      ? "Dejar de seguir"
                      : "Seguir"}
                </button>
              </div>
            )}
          </div>

          <div className={styles.statsWrapper}>
            {[
              { num: String(stats.views), label: "vistas" },
              { num: String(stats.reviews), label: "reseñas" },
              { num: String(stats.watchlist), label: "watchlist" },
            ].map((item) => (
              <div
                key={item.label}
                className={styles.statItem}
              >
                <span className={styles.statNum}>
                  {item.num}
                </span>
                <span className={styles.statLabel}>
                  {item.label}
                </span>
              </div>
            ))}
            <button
              onClick={() =>
                setOpenList(openList === "following" ? null : "following")
              }
              className={`${styles.statItem} ${styles.interactiveStat}`}
            >
              <span className={styles.statNum}>
                {stats.following}
              </span>
              <span className={styles.statLabel}>
                following
              </span>
            </button>
            <button
              onClick={() =>
                setOpenList(openList === "followers" ? null : "followers")
              }
              className={`${styles.statItem} ${styles.interactiveStat}`}
            >
              <span className={styles.statNum}>
                {stats.followers}
              </span>
              <span className={styles.statLabel}>
                followers
              </span>
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {openList && (
            <motion.div
              onClick={() => setOpenList(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={styles.popupOverlay}
            >
              <motion.div
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 16, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.99 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={styles.popupContent}
              >
                <div className={styles.popupHeader}>
                  <div className={styles.popupTitle}>
                    {openList === "followers" ? "Followers" : "Following"}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenList(null)}
                    aria-label="Cerrar popup"
                    className={styles.popupCloseBtn}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className={styles.popupBody}>
                  {listItems.length === 0 && (
                    <div className={styles.popupEmpty}>
                      Aún no hay usuarios aquí.
                    </div>
                  )}
                  {listItems.map((user) => (
                    <button
                      key={`${openList}-${user.id}`}
                      onClick={() => {
                        setOpenList(null);
                        onNavigateToUser(user.username);
                      }}
                      className={styles.popupUserRow}
                    >
                      <div className={styles.popupAvatar}>
                        <Img
                          src={user.avatarUrl || "https://images.unsplash.com/photo-1628070435838-19eb835ad70d?w=400&q=80"}
                          alt={user.username}
                          className={styles.popupAvatarImg}
                        />
                      </div>
                      <span className={styles.popupUsername}>
                        @{user.username}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
