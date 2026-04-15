import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { C, SANS } from '../../constants'
import { type TVDetailApi } from '../../services/tvDetailServices'
import SeasonTabs from './SeasonsTabs'
import SeasonHeader from './SeasonsHeader'
import EpisodeRow from './EpisodeRow'
import { useSeasonProgress, toggleEpisode, episodeKey } from '../../hooks/useWatchProgress'

// SectionLabel se importa desde TVDetail por ahora — lo moveremos al paso 5
// Por eso lo redefinimos localmente aquí hasta que exista un shared/ui
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase',
      color: C.accent, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14,
      fontFamily: SANS,
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.border}, transparent)` }} />
    </div>
  )
}

const EPISODES_INITIAL = 6

interface SeasonsPanelProps {
  detail: TVDetailApi
  watchedIds: Set<string>
  setWatchedIds: React.Dispatch<React.SetStateAction<Set<string>>>
  isAuthenticated: boolean
}

export default function SeasonsPanel({ detail, watchedIds, setWatchedIds, isAuthenticated }: SeasonsPanelProps) {
  const seasons = useMemo(
    () => (detail.season_details || []).filter(s => s.season_number > 0),
    [detail.season_details]
  )
  const [activeSeason, setActiveSeason] = useState(seasons[0]?.season_number ?? 1)
  const [showAll, setShowAll] = useState(false)

  const season = seasons.find(s => s.season_number === activeSeason)
  const episodes = season?.episodes || []
  const visible = showAll ? episodes : episodes.slice(0, EPISODES_INITIAL)
  const hasMore = episodes.length > EPISODES_INITIAL && !showAll

  const { watched, pct } = useSeasonProgress(watchedIds, activeSeason, episodes, season?.episode_count)

  const handleTabSelect = (seasonNumber: number) => {
    setActiveSeason(seasonNumber)
    setShowAll(false)
  }

  const handleToggle = (episodeNumber: number) => {
    if (!isAuthenticated) return
    setWatchedIds(prev => toggleEpisode(prev, activeSeason, episodeNumber))
  }

  if (seasons.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.8 }}
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Temporadas y episodios</SectionLabel>

      <SeasonTabs
        seasons={seasons}
        activeSeason={activeSeason}
        onSelect={handleTabSelect}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSeason}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
        >
          {season && (
            <SeasonHeader season={season} watched={watched} pct={pct} />
          )}

          {!isAuthenticated && (
            <div
              style={{
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: C.textMuted,
                marginBottom: 14,
              }}
            >
              Inicia sesión para marcar episodios como vistos
            </div>
          )}

          <div>
            {visible.map(ep => (
              <EpisodeRow
                key={ep.id}
                ep={ep}
                watched={watchedIds.has(episodeKey(activeSeason, ep.episode_number ?? 0))}
                canToggle={isAuthenticated}
                onToggle={() => handleToggle(ep.episode_number ?? 0)}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => setShowAll(true)}
                style={{
                  marginTop: 16, padding: '10px 0', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: C.accent,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                Ver más episodios <ChevronDown size={12} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  )
}