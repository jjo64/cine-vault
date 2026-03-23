import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { GrainOverlay } from '../components/profile-v2/primitives'
import { Footer, Navbar, ProfileHero, TabsBar } from '../components/profile-v2/layout'
import {
  DiaryPanel,
  ListsPanel,
  OverviewPanel,
  ProfileSidebar,
  ReviewsPanel,
  VaultPanel,
  WatchlistPanel,
} from '../components/profile-v2/panels'
import { C, SANS } from '../components/profile-v2/theme'
import { useProfilePageData } from '../hooks/useProfilePageData'
import {
  type CuratedGalleryItemData,
  followUser,
  unfollowUser,
  updateOwnerCinematicSignature,
  updateOwnerCuratedGallery,
} from '../services/profileServices'
import { getStoredAccessToken } from '../services/authServices'
import { SeoHead } from '../components/SeoHead'
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
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'stretch', gap: 0 }}>
        <div style={{
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
            onMouseEnter={() => setHoveredField(i)}
            onMouseLeave={() => setHoveredField(null)}
            style={{
              flex: 1,
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
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontFamily: 'Cormorant Garamond, serif', fontSize: 18, lineHeight: 1.2, marginBottom: 6, padding: '6px 8px' }}
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
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', background: C.bg, border: `1px solid ${C.border}`, color: C.textSoft, fontFamily: SANS, fontSize: 11, fontStyle: 'italic', marginBottom: 4, padding: '6px 8px' }}
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
  } = useProfilePageData(username)

  const [isFollowing, setIsFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)
  const [statsOverride, setStatsOverride] = useState<{ followers?: number; following?: number }>({})
  const [localSignature, setLocalSignature] = useState<CinematicSignaturePayload | null>(signature)
  const [localCuratedItems, setLocalCuratedItems] = useState<CuratedGalleryItemData[]>([])

  const searchFromNavbar = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  useEffect(() => {
    if (isValidTab(tabFromQuery) && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery)
      return
    }

    if (!isValidTab(tabFromQuery) && activeTab !== 'Resumen') {
      setActiveTab('Resumen')
    }
  }, [tabFromQuery, activeTab])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (next.get('tab') === activeTab) return
    next.set('tab', activeTab)
    setSearchParams(next, { replace: true })
  }, [activeTab, searchParams, setSearchParams])

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

  const handleCurateGallery = async () => {
    const token = getStoredAccessToken()
    if (!token) return

    const selected = [...recentlyWatched, ...watchlistFilms]
      .map((item) => item.movieId)
      .filter((movieId, index, arr) => arr.indexOf(movieId) === index)
      .slice(0, 6)

    if (selected.length === 0) return

    const response = await updateOwnerCuratedGallery(
      token,
      selected.map((movieId, index) => ({
        movie_id: movieId,
        order_index: index + 1,
      }))
    )

    setLocalCuratedItems(response.data.items)
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
        canEditCurated={canEditProfile}
        onCurateGallery={handleCurateGallery}
        onJumpToTab={(tab) => setActiveTab(tab)}
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
      <Navbar onNavigateHome={() => navigate('/')} onSearch={searchFromNavbar} />

      <div className="profile-hero-container">
        <ProfileHero
          header={profileHeader}
          stats={displayStats}
          followers={followerUsers}
          following={followingUsers}
          onNavigateToUser={(targetUsername) => navigate(`/${encodeURIComponent(targetUsername.trim())}`)}
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

      <TabsBar active={activeTab} onSelect={(tab) => setActiveTab(normalizeTab(tab))} />

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

          <ProfileSidebar recentlyWatched={recentlyWatched} reviewItems={reviewItems} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
