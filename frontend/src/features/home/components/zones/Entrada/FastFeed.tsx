import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Heart, MessageCircle, ArrowRight } from "lucide-react";
import { C, SERIF, SANS } from "../../../constants";
import { movieHref } from "../../../utils";
import { SectionLabel } from "../../shared/SectionLabel";
import { SafeImg } from "../../shared/SafeImg";
import styles from "../../HomeLogged.module.css";

interface FastFeedProps {
  followingReviews: any[];
  likedFeedIds: Set<number>;
  likeBusyIds: Set<number>;
  handleToggleFeedLike: (id: number) => void;
}

export const FastFeed: React.FC<FastFeedProps> = ({
  followingReviews,
  likedFeedIds,
  likeBusyIds,
  handleToggleFeedLike,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      style={{ marginBottom: 32 }}
    >
      <SectionLabel link="Abrir feed" linkHref="/feed">
        Feed rapido
      </SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {followingReviews.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={styles.feedPost}
          >
            <Link
              to={movieHref(post.movieId, post.tmdbId, post.film)}
              style={{ textDecoration: "none" }}
            >
              <div className={styles.feedPoster}>
                <SafeImg
                  src={post.posterUrl}
                  alt={post.film}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "saturate(0.4)",
                  }}
                />
              </div>
            </Link>
            <div>
              <div className={styles.feedHeader}>
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  <Link
                    to={`/${encodeURIComponent(post.username)}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div className={styles.activityAvatar} style={{ width: 26, height: 26, fontSize: 12 }}>
                      {post.avatar}
                    </div>
                  </Link>
                  <Link
                    to={`/${encodeURIComponent(post.username)}`}
                    style={{
                      fontFamily: SANS,
                      fontSize: 12,
                      color: C.text,
                      textDecoration: "none",
                    }}
                  >
                    {post.user}
                  </Link>
                </div>
                <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: SANS, fontSize: 11, color: C.textMuted }}>
                    reseño
                  </span>
                  <Link
                    to={movieHref(post.movieId, post.tmdbId, post.film)}
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 13,
                      color: C.accent,
                      textDecoration: "none",
                    }}
                  >
                    {post.film}
                  </Link>
                  <div style={{ display: "flex", gap: 1 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 9,
                          color: s <= post.rating ? C.gold : C.textMuted,
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Link
                to={`/${encodeURIComponent(post.username)}/movie/${post.id}`}
                style={{ textDecoration: "none" }}
              >
                <p
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: C.textSoft,
                    margin: 0,
                    cursor: "pointer",
                    transition: "color 0.18s",
                  }}
                >
                  {post.text}
                </p>
              </Link>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 12,
                paddingTop: 4,
              }}
            >
              <button
                onClick={() => handleToggleFeedLike(post.id)}
                disabled={likeBusyIds.has(post.id)}
                aria-pressed={likedFeedIds.has(post.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  color: likedFeedIds.has(post.id) ? C.accent : C.textSoft,
                  fontFamily: SANS,
                  fontSize: 11,
                  border: "none",
                  background: "none",
                  padding: 0,
                  cursor: likeBusyIds.has(post.id) ? "default" : "pointer",
                }}
              >
                <Heart
                  size={13}
                  strokeWidth={1.5}
                  fill={likedFeedIds.has(post.id) ? C.accent : "none"}
                />
                <span>{post.likes}</span>
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  color: C.textMuted,
                  fontFamily: SANS,
                  fontSize: 11,
                }}
              >
                <MessageCircle size={12} strokeWidth={1.5} /> {post.comments || 0}
              </div>
            </div>
          </motion.div>
        ))}
        <Link
          to="/feed"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "16px 0",
            color: C.accent,
            textDecoration: "none",
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Abrir el feed completo <ArrowRight size={13} />
        </Link>
      </div>
    </motion.div>
  );
};
