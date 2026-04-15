import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { C, SANS, SERIF, textClampOneLine } from '../components/profile-v2/theme'
import { useProfilePageData } from '../hooks/useProfilePageData'
import {
  type CuratedGalleryItemData,
  followUser,
  unfollowUser,
  updateOwnerCinematicSignature,
  updateOwnerCuratedGallery,
} from '../services/profileServices'
import { getStoredAccessToken } from '../services/authServices'
import { notify } from '../lib/notify'
import { SeoHead } from '../components/SeoHead'
import { Footer, ProfileHero, TabsBar } from '../components/profile-v2/layout'
import {
  DiaryPanel,
  ListsPanel,
  OverviewPanel,
  ProfileSidebar,
  ReviewsPanel,
  VaultPanel,
  WatchlistPanel,
} from '../components/profile-v2/panels'
import { GrainOverlay, Img } from '../components/profile-v2/primitives'
import type { EnrichedMovie } from '../components/profile-v2/models'
import '../components/profile-v2/Profile.css'

type CinematicSignaturePayload = {
  pivotal_film: string | null
  pivotal_film_detail: string | null
  formative_director: string | null
  formative_director_detail: string | null
  unforgettable_scene: string | null
  unforgettable_scene_detail: string | null
  cinema_turning_year: string | null
  cinema_turning_year_detail: string | null
}

const PROFILE_TABS = ['Resumen', 'Vault', 'Diario', 'Watchlist', 'Reseñas', 'Listas'] as const
const SIDEBAR_MIN_WIDTH = 1300

function CinematicSignature({
  value,
  canEdit,
  onSave,
}: {
  value: CinematicSignaturePayload | null
  canEdit: boolean
  onSave: (payload: Partial<CinematicSignaturePayload>) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [hoveredField, setHoveredField] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<CinematicSignaturePayload>({
    pivotal_film: value?.pivotal_film || null,
    pivotal_film_detail: value?.pivotal_film_detail || null,
    formative_director: value?.formative_director || null,
    formative_director_detail: value?.formative_director_detail || null,
    unforgettable_scene: value?.unforgettable_scene || null,
    unforgettable_scene_detail: value?.unforgettable_scene_detail || null,
    cinema_turning_year: value?.cinema_turning_year || null,
    cinema_turning_year_detail: value?.cinema_turning_year_detail || null,
  })

  useEffect(() => {
    setDraft({
      pivotal_film: value?.pivotal_film || null,
      pivotal_film_detail: value?.pivotal_film_detail || null,
      formative_director: value?.formative_director || null,
      formative_director_detail: value?.formative_director_detail || null,
      unforgettable_scene: value?.unforgettable_scene || null,
      unforgettable_scene_detail: value?.unforgettable_scene_detail || null,
      cinema_turning_year: value?.cinema_turning_year || null,
      cinema_turning_year_detail: value?.cinema_turning_year_detail || null,
    })
  }, [value])

  const handleEdit = () => {
    if (!canEdit || busy) return
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (busy) return
    setDraft({
      pivotal_film: value?.pivotal_film || null,
      pivotal_film_detail: value?.pivotal_film_detail || null,
      formative_director: value?.formative_director || null,
      formative_director_detail: value?.formative_director_detail || null,
      unforgettable_scene: value?.unforgettable_scene || null,
      unforgettable_scene_detail: value?.unforgettable_scene_detail || null,
      cinema_turning_year: value?.cinema_turning_year || null,
      cinema_turning_year_detail: value?.cinema_turning_year_detail || null,
    })
    setIsEditing(false)
  }

  const handleSave = async () => {
    setBusy(true)
    try {
      await onSave({
        pivotal_film: (draft.pivotal_film || '').trim() || null,
        pivotal_film_detail: (draft.pivotal_film_detail || '').trim() || null,
        formative_director: (draft.formative_director || '').trim() || null,
        formative_director_detail: (draft.formative_director_detail || '').trim() || null,
        unforgettable_scene: (draft.unforgettable_scene || '').trim() || null,
        unforgettable_scene_detail: (draft.unforgettable_scene_detail || '').trim() || null,
        cinema_turning_year: (draft.cinema_turning_year || '').trim() || null,
        cinema_turning_year_detail: (draft.cinema_turning_year_detail || '').trim() || null,
      })
      setIsEditing(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      background: 'rgba(212,175,122,0.03)',
      borderTop: `1px solid rgba(212,175,122,0.12)`,
      borderBottom: `1px solid rgba(212,175,122,0.12)`,
      padding: '0 48px',
    }}>
      {/* Header visible solo en mobile */}
      <div className="profile-signature-mobile-header">
        Firma cinematográfica
      </div>
      <div className="profile-signature-bar" style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
      }}>
        <div className="profile-signature-label-col" style={{
          flexShrink: 0,
          padding: '20px 28px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderRight: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 8, letterSpacing: '0.32em', textTransform: 'uppercase', color: C.accent, fontFamily: SANS, lineHeight: 2 }}>
            Firma
            <br />
            cinematográfica
          </div>
        </div>

        <div className="profile-signature-fields" style={{
          flex: 1,
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
        }}>
          {[
          {
            key: 'pivotal_film',
            detailKey: 'pivotal_film_detail',
            label: 'La película que te cambió la vida',
            icon: <svg width="10" height="10" viewBox="0 0 16 16" fill={C.accentDim}><path d="M2 2h12v12H2zM4 4h2v2H4zM10 4h2v2h-2zM4 10h2v2H4zM10 10h2v2h-2z"/></svg>,
            value: value?.pivotal_film || 'Sin definir',
            detail: value?.pivotal_film_detail || 'Sin detalle',
          },
          {
            key: 'formative_director',
            detailKey: 'formative_director_detail',
            label: 'El director que más te formó',
            icon: <svg width="10" height="10" viewBox="0 0 16 16" fill={C.accentDim}><path d="M8 1a4 4 0 1 0 0 8A4 4 0 0 0 8 1zM2 11c0-1.1 2.7-2 6-2s6 .9 6 2v1H2v-1z"/></svg>,
            value: value?.formative_director || 'Sin definir',
            detail: value?.formative_director_detail || 'Sin detalle',
          },
          {
            key: 'unforgettable_scene',
            detailKey: 'unforgettable_scene_detail',
            label: 'La escena que nunca olvidás',
            icon: <svg width="10" height="10" viewBox="0 0 16 16" fill={C.accentDim}><path d="M4 3l9 5-9 5z"/></svg>,
            value: value?.unforgettable_scene || 'Sin definir',
            detail: value?.unforgettable_scene_detail || 'Sin detalle',
          },
          {
            key: 'cinema_turning_year',
            detailKey: 'cinema_turning_year_detail',
            label: 'El año en que el cine se volvió algo serio',
            icon: <svg width="10" height="10" viewBox="0 0 16 16" fill={C.accentDim}><path d="M3 2h10v12H3zM5 1h1v2H5zM10 1h1v2h-1zM5 6h6v1H5z"/></svg>,
            value: value?.cinema_turning_year || 'Sin definir',
            detail: value?.cinema_turning_year_detail || 'Sin detalle',
          },
        ].map((field, i) => (
          <div
            key={field.label}
            className="profile-signature-field"
            onMouseEnter={() => setHoveredField(i)}
            onMouseLeave={() => setHoveredField(null)}
            style={{
              padding: '20px 22px',
              borderRight: i < 3 ? `1px solid ${C.border}` : 'none',
              transition: 'background 0.2s',
              cursor: 'default',
              background: hoveredField === i ? 'rgba(212,175,122,0.04)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
              {field.icon}
              <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.textMuted, fontFamily: SANS }}>{field.label}</span>
            </div>
            {isEditing ? (
              <>
                <textarea
                  value={(draft[field.key as keyof CinematicSignaturePayload] as string | null) || ''}
                  onChange={(event) => {
                    const nextValue = event.target.value.slice(0, 280)
                    setDraft((prev) => ({
                      ...prev,
                      [field.key]: nextValue,
                    }))
                  }}
                  rows={2}
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'none', background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontFamily: 'Cormorant Garamond, serif', fontSize: 18, lineHeight: 1.2, marginBottom: 6, padding: '6px 8px' }}
                />
                <textarea
                  value={(draft[field.detailKey as keyof CinematicSignaturePayload] as string | null) || ''}
                  onChange={(event) => {
                    const nextValue = event.target.value.slice(0, 280)
                    setDraft((prev) => ({
                      ...prev,
                      [field.detailKey]: nextValue,
                    }))
                  }}
                  rows={2}
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'none', background: C.bg, border: `1px solid ${C.border}`, color: C.textSoft, fontFamily: SANS, fontSize: 11, fontStyle: 'italic', marginBottom: 4, padding: '6px 8px' }}
                />
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: SANS, textAlign: 'right' }}>
                  {((draft[field.key as keyof CinematicSignaturePayload] as string | null) || '').length}/280
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 19, fontWeight: 400, color: C.text, lineHeight: 1.2, marginBottom: 4 }}>
                  {field.value}
                </div>
                <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, fontStyle: 'italic' }}>{field.detail}</div>
              </>
            )}
          </div>
        ))}
        </div>

        {canEdit ? (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 0 0 20px', borderLeft: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={busy}
                    style={{
                      padding: '7px 14px',
                      background: busy ? C.accentDim : C.accent,
                      color: C.bg,
                      border: `1px solid ${C.accent}`,
                      fontFamily: SANS,
                      fontSize: 9,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {busy ? 'Guardando' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={busy}
                    style={{
                      padding: '7px 14px',
                      background: 'transparent',
                      color: C.textSoft,
                      border: `1px solid ${C.border}`,
                      fontFamily: SANS,
                      fontSize: 9,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={busy}
                  style={{
                    padding: '7px 14px',
                    background: 'transparent',
                    color: C.textSoft,
                    border: `1px solid ${C.border}`,
                    fontFamily: SANS,
                    fontSize: 9,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.2s',
                  }}
                >
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M11.3 1.3l3.4 3.4-8.6 8.6H2.7v-3.4l8.6-8.6zm-8 10.7h2l7.9-7.9-2-2-7.9 7.9v2z"/></svg>
                  Editar firma
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CompatibilityBanner({ reviewsCount, followersCount }: { reviewsCount: number; followersCount: number }) {
  const score = Math.max(61, Math.min(96, 65 + Math.min(reviewsCount, 20) + Math.min(followersCount, 11)))

  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, background: 'linear-gradient(90deg, rgba(212,175,122,0.14), rgba(212,175,122,0.02))' }}>
      <div className="profile-main-wrapper" style={{ paddingTop: 9, paddingBottom: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ color: C.text, fontFamily: 'Cormorant Garamond, serif', fontSize: 19 }}>
          Compatibilidad cinematográfica: <strong style={{ fontWeight: 600 }}>{score}%</strong>
        </div>
        <div style={{ color: C.textSoft, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Basado en reseñas, ritmo y actividad pública.</div>
      </div>
    </div>
  )
}

export function Profile() {
  const navigate = useNavigate()
  const { username } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromQuery = searchParams.get('tab')
  const isValidTab = (value: string | null): value is (typeof PROFILE_TABS)[number] =>
    Boolean(value) && PROFILE_TABS.includes(value as (typeof PROFILE_TABS)[number])
  const normalizeTab = (value: string | null): (typeof PROFILE_TABS)[number] =>
    isValidTab(value) ? value : 'Resumen'
  const [activeTab, setActiveTab] = useState<(typeof PROFILE_TABS)[number]>(() =>
    normalizeTab(tabFromQuery)
  )
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(
    () => (typeof window === 'undefined' ? true : window.innerWidth >= SIDEBAR_MIN_WIDTH),
  )

  useEffect(() => {
    const syncSidebarVisibility = () => {
      setShowDesktopSidebar(window.innerWidth >= SIDEBAR_MIN_WIDTH)
    }

    syncSidebarVisibility()
    window.addEventListener('resize', syncSidebarVisibility)
    return () => window.removeEventListener('resize', syncSidebarVisibility)
  }, [])

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
    diaryTimeline,
    userLists,
    signature,
    curatedGalleryItems,
    allDiaryFilms,
  } = useProfilePageData(username)

  const [isFollowing, setIsFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)
  const [statsOverride, setStatsOverride] = useState<{ followers?: number; following?: number }>({})
  const [localSignature, setLocalSignature] = useState<CinematicSignaturePayload | null>(signature)
  const [localCuratedItems, setLocalCuratedItems] = useState<CuratedGalleryItemData[]>([])


  const handleTabChange = useCallback(
    (tab: (typeof PROFILE_TABS)[number]) => {
      setActiveTab(tab)
      const next = new URLSearchParams(searchParams)
      next.set('tab', tab)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    const tabInUrl = searchParams.get('tab')
    if (isValidTab(tabInUrl) && tabInUrl !== activeTab) {
      setActiveTab(tabInUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canEditProfile = isAuthenticated && isOwnProfile
  useEffect(() => {
    setStatsOverride({})
  }, [stats.followers, stats.following])

  useEffect(() => {
    setLocalSignature(signature)
  }, [signature])

  useEffect(() => {
    setLocalCuratedItems(curatedGalleryItems)
  }, [curatedGalleryItems])

  const localCuratedMovieIds = useMemo(
    () => [...localCuratedItems].sort((a, b) => a.order_index - b.order_index).map((item) => item.movie_id),
    [localCuratedItems]
  )

  const curatedNotesByMovieId = useMemo(() => {
    const entries = localCuratedItems
      .filter((item) => item.note && item.note.trim().length > 0)
      .map((item) => [item.movie_id, item.note!.trim()] as const)
    return Object.fromEntries(entries) as Record<number, string>
  }, [localCuratedItems])

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
    const token = getStoredAccessToken()
    if (!token) return

    const previousFollowing = isFollowing
    const previousFollowers = displayStats.followers

    setFollowBusy(true)
    setIsFollowing(!previousFollowing)
    setStatsOverride({
      followers: Math.max(0, previousFollowers + (previousFollowing ? -1 : 1)),
    })

    try {
      if (previousFollowing) {
        await unfollowUser(targetUserId, token)
      } else {
        await followUser(targetUserId, token)
      }
    } catch {
      setIsFollowing(previousFollowing)
      setStatsOverride({ followers: previousFollowers })
    } finally {
      setFollowBusy(false)
    }
  }

  const handleSaveSignature = async (payload: Partial<CinematicSignaturePayload>) => {
    const token = getStoredAccessToken()
    if (!token) return
    const response = await updateOwnerCinematicSignature(token, payload)
    setLocalSignature(response.data)
  }

  const [isCurating, setIsCurating] = useState(false)

  const handleCurateGallery = () => {
    setIsCurating(true)
  }

  const handleSaveCurated = async (selectedIds: number[]) => {
    const token = getStoredAccessToken()
    if (!token) return

    try {
      const response = await updateOwnerCuratedGallery(
        token,
        selectedIds.map((movieId, index) => ({
          movie_id: movieId,
          order_index: index + 1,
        }))
      )

      setLocalCuratedItems(response.data.items)
      setIsCurating(false)
      notify.success('Galería actualizada correctamente')
    } catch (err) {
      console.error(err)
      notify.error('No se pudo guardar la galería')
    }
  }

  const showGuestHint = !loading && !hasTargetProfile && !isAuthenticated
  const profileSlug = encodeURIComponent((profileHeader.username || username || '').trim())
  const canonical = profileSlug ? `https://cinevault.art/${profileSlug}` : 'https://cinevault.art/'
  const seoTitle = `${profileHeader.displayName} | Perfil en CineVault`
  const seoDescription = `Actividad, listas y reseñas de ${profileHeader.displayName} en CineVault.`

  const panels: Record<string, ReactNode> = {
    Resumen: (
      <OverviewPanel
        stats={displayStats}
        recentlyWatched={recentlyWatched}
        watchlistFilms={watchlistFilms}
        reviewItems={reviewItems}
        curatedMovieIds={localCuratedMovieIds}
        curatedNotesByMovieId={curatedNotesByMovieId}
        allDiaryFilms={allDiaryFilms}
        canEditCurated={canEditProfile}
        onCurateGallery={handleCurateGallery}
        onJumpToTab={(tab: 'Vault' | 'Watchlist' | 'Reseñas' | 'Diario') => handleTabChange(tab)}
      />
    ),
    Diario: <DiaryPanel diaryTimeline={diaryTimeline} />,
    Vault: <VaultPanel />,
    Watchlist: <WatchlistPanel watchlistFilms={watchlistFilms} />,
    Reseñas: <ReviewsPanel reviewItems={reviewItems} />,
    Listas: <ListsPanel userLists={userLists} />,
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS, overflowX: 'hidden' }}>
      {isPublicProfile ? (
        <SeoHead.Profile title={seoTitle} description={seoDescription} canonical={canonical} image={profileHeader.avatarUrl} />
      ) : (
        <SeoHead.NoIndex title={seoTitle} description={seoDescription} canonical={canonical} image={profileHeader.avatarUrl} />
      )}

      <GrainOverlay />

      <div className="profile-hero-container">
        <ProfileHero
          header={profileHeader}
          stats={displayStats}
          followers={followerUsers}
          following={followingUsers}
          onNavigateToUser={(targetUsername: string) => navigate(`/${encodeURIComponent(targetUsername.trim())}`)}
          canEditProfile={canEditProfile}
          isPublicProfile={isPublicProfile}
          isFollowing={isFollowing}
          followBusy={followBusy}
          onToggleFollow={handleToggleFollow}
          onEditProfile={() => navigate('/settings')}
          onOpenSettings={() => navigate('/settings')}
        />
      </div>

      {isPublicProfile && <CompatibilityBanner reviewsCount={displayStats.reviews} followersCount={displayStats.followers} />}

      <CinematicSignature
        value={localSignature}
        canEdit={canEditProfile}
        onSave={handleSaveSignature}
      />

      <TabsBar active={activeTab} onSelect={(tab: string) => handleTabChange(normalizeTab(tab))} />

      <div className="profile-main-wrapper">
        {loading && <div style={{ color: C.textSoft, marginBottom: 16 }}>Cargando perfil...</div>}
        {error && <div style={{ color: 'salmon', marginBottom: 16 }}>{error}</div>}
        {showGuestHint && (
          <div style={{ color: C.textSoft, marginBottom: 16 }}>
            Para ver un perfil publico como invitado usa una ruta como /nombre_usuario.
          </div>
        )}

        <div className="profile-grid-layout">
          <div className="profile-grid-main">
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
          {showDesktopSidebar && (
            <ProfileSidebar recentlyWatched={recentlyWatched} reviewItems={reviewItems} />
          )}
        </div>
      </div>

      <Footer />

      <AnimatePresence>
        {isCurating && (
          <CuratedGallerySelectionModal
            available={allDiaryFilms}
            initialSelected={localCuratedMovieIds}
            onClose={() => setIsCurating(false)}
            onSave={handleSaveCurated}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CuratedGallerySelectionModal({
  available,
  initialSelected,
  onClose,
  onSave,
}: {
  available: EnrichedMovie[]
  initialSelected: number[]
  onClose: () => void
  onSave: (ids: number[]) => Promise<void>
}) {
  // Deduplicar por movieId
  const [selected, setSelected] = useState<number[]>(initialSelected)
  const [busy, setBusy] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [minRating, setMinRating] = useState<number>(0)
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'title'>('recent')

  const uniqueAvailable = useMemo(() => {
    const seen = new Set<number>()
    let items = available.filter((m) => {
      if (seen.has(m.movieId)) return false
      seen.add(m.movieId)
      return true
    })

    // Filter text
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      items = items.filter(m => 
        (m.title || '').toLowerCase().includes(q) || 
        (m.director || '').toLowerCase().includes(q)
      )
    }

    // Filter rating
    if (minRating > 0) {
      items = items.filter(m => (m.rating || 0) >= minRating)
    }

    // Sort
    items = [...items].sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '')
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      return 0 // 'recent' is default (diary order)
    })

    return items
  }, [available, searchTerm, sortBy])

  const toggle = (id: number) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id)
      if (prev.length >= 6) return prev // Max 6
      return [...prev, id]
    })
  }

  const handleSave = async () => {
    setBusy(true)
    try {
      await onSave(selected)
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{
          width: '100%',
          maxWidth: 900,
          maxHeight: '85vh',
          background: C.surface,
          border: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <div style={{ flexShrink: 0 }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: C.text, margin: 0 }}>Cura tu Galería</h3>
            <p style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '4px 0 0' }}>
              Seleccionados: <strong style={{color: C.accent}}>{selected.length} / 6</strong>
            </p>
          </div>

          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                type="text" 
                placeholder="Busca tus películas vistas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${C.border}`,
                  padding: '10px 16px 10px 40px',
                  color: C.text,
                  fontFamily: SANS,
                  fontSize: 14,
                  outline: 'none',
                  borderRadius: 4,
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <svg 
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textSoft }}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>

            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 4, border: `1px solid ${C.border}` }}>
              {[
                { id: 'recent', label: 'Recientes' },
                { id: 'rating', label: 'Rating' },
                { id: 'title', label: 'A-Z' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as any)}
                  style={{
                    padding: '6px 12px',
                    background: sortBy === opt.id ? C.accent : 'transparent',
                    color: sortBy === opt.id ? C.bg : C.textSoft,
                    border: 'none',
                    borderRadius: 2,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: SANS,
                    transition: 'all 0.2s'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              <span style={{ fontSize: 10, color: C.textMuted, fontFamily: SANS, textTransform: 'uppercase' }}>Min </span>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 4,
                  outline: 'none',
                }}
              >
                <option value={0}>Todas</option>
                <option value={5}>5 ★</option>
                <option value={4}>4+ ★</option>
                <option value={3}>3+ ★</option>
                <option value={2}>2+ ★</option>
                <option value={1}>1+ ★</option>
              </select>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textSoft, cursor: 'pointer', padding: 8, flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 20 }}>
            {uniqueAvailable.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: C.textSoft, padding: '40px 0', fontFamily: SERIF, fontSize: 18 }}>
                No tienes películas suficientes en tu historial de visionado.
              </div>
            ) : (
              uniqueAvailable.map((movie) => {
                const isSelected = selected.includes(movie.movieId)
                return (
                  <div
                    key={movie.movieId}
                    onClick={() => toggle(movie.movieId)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    <div style={{
                      aspectRatio: '2/3',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: `1px solid ${isSelected ? C.accent : C.border}`,
                      opacity: isSelected ? 1 : 0.6,
                      transition: 'all 0.2s',
                    }}>
                      <Img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {isSelected && (
                        <div style={{ position: 'absolute', top: 8, right: 8, background: C.accent, color: C.bg, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                          {selected.indexOf(movie.movieId) + 1}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: isSelected ? C.text : C.textSoft, fontFamily: SANS, marginTop: 8, ...textClampOneLine }}>
                      {movie.title}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div style={{ padding: '20px 32px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 16, background: 'rgba(0,0,0,0.2)' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 24px', background: 'transparent', border: `1px solid ${C.border}`, color: C.textSoft, fontFamily: SANS, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={busy || selected.length === 0}
            style={{
              padding: '10px 28px',
              background: busy ? C.accentDim : C.accent,
              color: C.bg,
              border: 'none',
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: busy ? 'default' : 'pointer',
              fontWeight: 600,
            }}
          >
            {busy ? 'Guardando...' : 'Confirmar Selección'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
