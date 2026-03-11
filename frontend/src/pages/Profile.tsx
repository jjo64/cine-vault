import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router-dom'
import { GrainOverlay } from '../components/profile-v2/primitives'
import { Footer, Navbar, ProfileHero, TabsBar } from '../components/profile-v2/layout'
import { HistoryPanel, ListsPanel, OverviewPanel, ProfileSidebar, ReviewsPanel, VaultPanel, WatchlistPanel } from '../components/profile-v2/panels'
import { C, SANS } from '../components/profile-v2/theme'
import { useProfilePageData } from '../hooks/useProfilePageData'
import '../components/profile-v2/Profile.css'
import { followUser, unfollowUser } from '../services/profileServices'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { username } = useParams()
  const [activeTab, setActiveTab] = useState('Resumen')
  const {
    loading,
    error,
    profileHeader,
    stats,
    followerUsers,
    followingUsers,
    isAuthenticated,
    isOwnProfile,
    hasTargetProfile,
    isPublicProfile,
    targetUserId,
    initialIsFollowing,
    recentlyWatched,
    watchlistFilms,
    reviewItems,
    userLists,
  } = useProfilePageData(username)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)
  const [statsOverride, setStatsOverride] = useState<{ followers?: number; following?: number }>({})

  const searchFromNavbar = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const canEditProfile = isAuthenticated && isOwnProfile

  useEffect(() => {
    setStatsOverride({})
  }, [stats.followers, stats.following])

  useEffect(() => {
    if (!isPublicProfile) {
      setIsFollowing(false)
      return
    }
    setIsFollowing(initialIsFollowing)
  }, [initialIsFollowing, isPublicProfile, targetUserId])

  const displayStats = useMemo(
    () => ({
      ...stats,
      followers: statsOverride.followers ?? stats.followers,
      following: statsOverride.following ?? stats.following,
    }),
    [stats, statsOverride]
  )

  const handleToggleFollow = async () => {
    if (!targetUserId || followBusy) return

    const previousFollowing = isFollowing
    const previousFollowers = displayStats.followers

    setFollowBusy(true)
    setIsFollowing(!previousFollowing)
    setStatsOverride({
      followers: Math.max(0, previousFollowers + (previousFollowing ? -1 : 1)),
    })

    try {
      if (previousFollowing) {
        await unfollowUser(targetUserId)
      } else {
        await followUser(targetUserId)
      }
    } catch {
      setIsFollowing(previousFollowing)
      setStatsOverride({ followers: previousFollowers })
    } finally {
      setFollowBusy(false)
    }
  }

  const showGuestHint = !loading && !hasTargetProfile && !isAuthenticated

  const panels: Record<string, ReactNode> = {
    Resumen: (
      <OverviewPanel
        recentlyWatched={recentlyWatched}
        watchlistFilms={watchlistFilms}
        reviewItems={reviewItems}
        onJumpToTab={(tab) => setActiveTab(tab)}
      />
    ),
    Historial: <HistoryPanel recentlyWatched={recentlyWatched} />,
    Vault: <VaultPanel />,
    Watchlist: <WatchlistPanel watchlistFilms={watchlistFilms} />,
    Reseñas: <ReviewsPanel reviewItems={reviewItems} />,
    Listas: <ListsPanel userLists={userLists} />,
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS, overflowX: 'hidden' }}>
      <GrainOverlay />
      <Navbar onNavigateHome={() => navigate('/')} onSearch={searchFromNavbar} />

      <div className="profile-hero-container">
        <ProfileHero
          header={profileHeader}
          stats={displayStats}
          followers={followerUsers}
          following={followingUsers}
          onNavigateToUser={(targetUsername) => navigate(`/${targetUsername}`)}
          canEditProfile={canEditProfile && !isPublicProfile}
          isPublicProfile={isPublicProfile}
          isFollowing={isFollowing}
          followBusy={followBusy}
          onToggleFollow={handleToggleFollow}
          onEditProfile={() => navigate('/settings')}
          onOpenSettings={() => navigate('/settings')}
        />
      </div>

      <TabsBar active={activeTab} onSelect={setActiveTab} />

      <div className="profile-main-wrapper">
        {loading && <div style={{ color: C.textSoft, marginBottom: 16 }}>Cargando perfil...</div>}
        {error && <div style={{ color: 'salmon', marginBottom: 16 }}>{error}</div>}
        {showGuestHint && (
          <div style={{ color: C.textSoft, marginBottom: 16 }}>
            Para ver un perfil publico como invitado usa una ruta como <code>/nombre_usuario</code>.
          </div>
        )}

        <div className="profile-grid-layout">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {panels[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>

          <ProfileSidebar />
        </div>
      </div>

      <Footer />
    </div>
  )
}
