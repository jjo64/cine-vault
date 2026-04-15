import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router'
import SeoManager from './components/SeoManager'
import { SocketProvider } from "./context/SocketContext"
import { getStoredAccessToken, refreshAccessToken } from './services/authServices'
import { BottomNav } from './components/BottomNav'
import AuthenticatedNavbar from './components/AuthenticatedNavbar'
import { getCurrentUser, type AuthUser } from './services/authServices'
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const FeedPage = lazy(() => import('./pages/Feed'))
const ActivityPage = lazy(() => import('./pages/Activity'))
const ForYouPage = lazy(() => import('./pages/ForYou'))
const MovieDetail = lazy(() => import('./pages/MovieDetail'))
const AuthModal = lazy(() => import('./components/AuthModal'))
const TVDetail = lazy(() => import('./pages/TVDetail'))
const SearchResults = lazy(() => import('./pages/SearchResults').then((module) => ({ default: module.Search })))
const PersonPage = lazy(() => import('./pages/PersonPage.tsx'))
const SettingsPage = lazy(() => import('./pages/Settings.tsx'))
const Profile = lazy(() => import('./pages/Profile').then((module) => ({ default: module.Profile })))
const ProfileIndexPage = lazy(() => import('./pages/ProfileIndex'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmail'))
const NotFoundPage = lazy(() => import('./pages/NotFound'))
const ComingSoonPage = lazy(() => import('./pages/ComingSoon'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallback'))
const VaultPage = lazy(() => import('./pages/Vault').then((module) => ({ default: module.Vault })))
const CommunityDiscoverPage = lazy(() => import('./pages/CommunityDiscover'))
const ArcosPage = lazy(() => import('./pages/Arcos').then((module) => ({ default: module.Arcos })))
const ArcoDetailPage = lazy(() => import('./pages/ArcoDetail').then((module) => ({ default: module.ArcoDetail })))
const DiaryPage = lazy(() => import('./pages/Diary').then((module) => ({ default: module.Diary })))
const DirectorAutopsyPage = lazy(() => import('./pages/DirectorAutopsy').then((module) => ({ default: module.DirectorAutopsy })))
const MentirasPage = lazy(() => import('./pages/Mentiras').then((module) => ({ default: module.Mentiras })))
const ReviewThreadPage = lazy(() => import('./pages/ReviewThread'))

function App() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
    const [user, setUser] = useState<AuthUser | null>(null)

    useEffect(() => {
        const handler = (event: Event) => {
            const customEvent = event as CustomEvent<{ mode?: 'login' | 'register' }>
            setAuthMode(customEvent.detail?.mode === 'register' ? 'register' : 'login')
            setIsAuthModalOpen(true)
        }

        window.addEventListener('open-auth-modal', handler as EventListener)
        return () => window.removeEventListener('open-auth-modal', handler as EventListener)
    }, [])

    useEffect(() => {
        let active = true
        let refreshTimerId: number | null = null

        const scheduleSilentRefresh = () => {
            if (refreshTimerId !== null) return
            // Access token expira en 15 min; lo renovamos cada 12 min.
            refreshTimerId = window.setInterval(() => {
                refreshAccessToken().catch(() => null)
            }, 12 * 60 * 1000)
        }

        const fetchUser = async () => {
            try {
                const currentUser = await getCurrentUser()
                setUser(currentUser)
            } catch {
                setUser(null)
            }
        }

        const onAuthChange = (event: Event) => {
            const authEvent = event as CustomEvent<{ authenticated?: boolean }>
            if (authEvent.detail?.authenticated === false) {
                setUser(null)
                return
            }
            fetchUser()
        }

        window.addEventListener('auth-state-changed', onAuthChange)

        const bootstrapSession = async () => {
            const existing = getStoredAccessToken()
            if (existing) {
                scheduleSilentRefresh()
                await fetchUser()
                return
            }

            const refreshed = await refreshAccessToken().catch(() => null)
            if (!active) return

            if (refreshed) {
                scheduleSilentRefresh()
            } else if (refreshTimerId !== null) {
                window.clearInterval(refreshTimerId)
                refreshTimerId = null
            }
            
            fetchUser()
        }

        bootstrapSession()

        return () => {
            active = false
            window.removeEventListener('auth-state-changed', onAuthChange)
            if (refreshTimerId !== null) {
                window.clearInterval(refreshTimerId)
            }
        }
    }, [])

    return (
        <SocketProvider>
            <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#080808', color: '#7A7A7A' }}>Cargando...</div>}>
                <SeoManager />
                <AuthenticatedNavbar user={user} />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/feed" element={<FeedPage />} />
                    <Route path="/discover" element={<FeedPage />} />
                    <Route path="/movie/:slugOrId" element={<MovieDetail />} />
                    <Route path="/tv/:id" element={<TVDetail />} />
                    <Route path="/tv/:slugOrId" element={<TVDetail />} />
                    <Route path="/person/:id" element={<PersonPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/profile" element={<ProfileIndexPage />} />
                    <Route path="/:username/vault" element={<VaultPage />} />
                    <Route path="/vault/:username" element={<VaultPage />} />
                    <Route path="/vault" element={<CommunityDiscoverPage />} />
                    <Route path="/for-you" element={<ForYouPage />} />
                    <Route path="/activity" element={<ActivityPage />} />
                    <Route path="/arcos" element={<ArcosPage />} />
                    <Route path="/arcos/:id" element={<ArcoDetailPage />} />
                    <Route path="/diary" element={<DiaryPage />} />
                    <Route path="/director/:id/autopsy" element={<DirectorAutopsyPage />} />
                    <Route path="/mentiras" element={<MentirasPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    <Route path="/coming-soon/:section" element={<ComingSoonPage />} />
                    <Route path="/films" element={<ComingSoonPage />} />
                    <Route path="/news" element={<ComingSoonPage />} />
                    <Route path="/news/:id" element={<ComingSoonPage />} />
                    <Route path="/lists" element={<CommunityDiscoverPage />} />
                    <Route path="/members" element={<ComingSoonPage />} />
                    <Route path="/journal" element={<ComingSoonPage />} />
                    <Route path="/search-results" element={<SearchResults />} />
                    <Route path="/:username/movie/:slugId" element={<ReviewThreadPage />} />
                    <Route path="/:username/movie/:slugId/:index" element={<ReviewThreadPage />} />
                    <Route path="/:username" element={<Profile />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
            <BottomNav />
            <div className="bottom-nav-spacer" />
            {isAuthModalOpen && (
                <Suspense fallback={null}>
                    <AuthModal
                        isOpen={isAuthModalOpen}
                        onClose={() => setIsAuthModalOpen(false)}
                        initialMode={authMode}
                    />
                </Suspense>
            )}
        </SocketProvider>
    )
}

export default App
