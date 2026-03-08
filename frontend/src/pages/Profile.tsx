import { useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router-dom'
import { GrainOverlay } from '../components/profile-v2/primitives'
import { Footer, Navbar, ProfileHero, TabsBar } from '../components/profile-v2/layout'
import { ListsPanel, OverviewPanel, ProfileSidebar, ReviewsPanel, VaultPanel, WatchlistPanel } from '../components/profile-v2/panels'
import { C, SANS } from '../components/profile-v2/theme'
import { useProfilePageData } from '../hooks/useProfilePageData'
import { useResponsive } from '../hooks/useResponsive'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { username } = useParams()
  const { isMobile, isTablet, isTabletOrDown } = useResponsive()
  const [activeTab, setActiveTab] = useState('Resumen')
  const {
    loading,
    error,
    profileHeader,
    stats,
    isAuthenticated,
    isOwnProfile,
    hasTargetProfile,
    isPublicProfile,
    recentlyWatched,
    watchlistFilms,
    reviewItems,
  } = useProfilePageData(username)

  const searchFromNavbar = (query: string) => {
    const formatted = query.replace(/\s+/g, '+')
    navigate(`/search/${formatted}`)
  }

  const canEditProfile = isAuthenticated && isOwnProfile

  const showGuestHint = !loading && !hasTargetProfile && !isAuthenticated

  const panels: Record<string, ReactNode> = {
    Resumen: <OverviewPanel recentlyWatched={recentlyWatched} watchlistFilms={watchlistFilms} reviewItems={reviewItems} isMobile={isMobile} isTablet={isTablet} />,
    Vault: <VaultPanel isMobile={isMobile} isTablet={isTablet} />,
    Watchlist: <WatchlistPanel watchlistFilms={watchlistFilms} isMobile={isMobile} />,
    Reseñas: <ReviewsPanel reviewItems={reviewItems} isMobile={isMobile} />,
    Listas: <ListsPanel isMobile={isMobile} />,
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS, overflowX: 'hidden' }}>
      <GrainOverlay />
      <Navbar onNavigateHome={() => navigate('/')} onSearch={searchFromNavbar} isMobile={isMobile} />

      <div style={{ paddingTop: 64 }}>
        <ProfileHero header={profileHeader} stats={stats} canEditProfile={canEditProfile && !isPublicProfile} isMobile={isMobile} isTablet={isTablet} />
      </div>

      <TabsBar active={activeTab} onSelect={setActiveTab} isMobile={isMobile} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '24px 14px 0' : isTablet ? '32px 24px 0' : '48px 48px 0' }}>
        {loading && <div style={{ color: C.textSoft, marginBottom: 16 }}>Cargando perfil...</div>}
        {error && <div style={{ color: 'salmon', marginBottom: 16 }}>{error}</div>}
        {showGuestHint && (
          <div style={{ color: C.textSoft, marginBottom: 16 }}>
            Para ver un perfil publico como invitado usa una ruta como <code>/nombre_usuario</code>.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isTabletOrDown ? '1fr' : '1fr 280px', gap: isTabletOrDown ? 24 : 40 }}>
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

          <ProfileSidebar isTabletOrDown={isTabletOrDown} />
        </div>
      </div>

      <Footer isMobile={isMobile} />
    </div>
  )
}
