import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Img } from '../../../components/profile-v2/primitives'
import type { CreditItem } from '../types'
import { getCreditTitle, getCreditYear, movieHref, toPoster } from '../utils'
import styles from './PersonPageView.module.css'

type FilmRowProps = {
  item: CreditItem
  badge?: string
}

export function FilmRow({ item, badge }: FilmRowProps) {
  const title = getCreditTitle(item)
  const year = getCreditYear(item)
  const rating = Number(item.vote_average || 0)

  return (
    <Link to={movieHref(item)} className={styles.linkReset}>
      <motion.div whileHover={{ y: -2 }} className={styles.filmRow} transition={{ duration: 0.2 }}>
        <div className={styles.filmYear}>{year || '-'}</div>
        <div className={styles.filmPosterWrap}>
          <Img src={toPoster(item.poster_path)} alt={title} className={styles.filmPoster} />
        </div>
        <div>
          <div className={styles.filmTitle}>{title}</div>
          <div className={styles.filmBadges}>
            {badge ? (
              <span className={styles.filmBadgePrimary}>{badge}</span>
            ) : null}
            {item.character ? (
              <span className={styles.filmBadgeSecondary}>{item.character}</span>
            ) : null}
          </div>
        </div>
        <div className={styles.filmScoreCol}>
          <div className={styles.filmScore}>{rating > 0 ? rating.toFixed(1) : '-'}</div>
          <div className={styles.filmScoreLabel}>TMDB</div>
        </div>
      </motion.div>
    </Link>
  )
}
