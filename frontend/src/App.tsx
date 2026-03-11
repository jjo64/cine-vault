import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router'
import AuthModal from './components/AuthModal'
import SeoManager from './components/SeoManager'
import { SocketProvider } from "./context/SocketContext"
import { getStoredAccessToken, refreshAccessToken } from './services/authServices'
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const FeedPage = lazy(() => import('./pages/Feed'))
const MovieDetail = lazy(() => import('./pages/MovieDetail'))
const SearchResults = lazy(() => import('./pages/SearchResults'))
const PersonPage = lazy(() => import('./pages/PersonPage.tsx'))
const SettingsPage = lazy(() => import('./pages/Settings.tsx'))
const Profile = lazy(() => import('./pages/Profile'))
const ProfileIndexPage = lazy(() => import('./pages/ProfileIndex'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmail'))
const NotFoundPage = lazy(() => import('./pages/NotFound'))
const ComingSoonPage = lazy(() => import('./pages/ComingSoon'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallback'))
const ListsPage = lazy(() => import('./pages/Lists'))

function App() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

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

        const bootstrapSession = async () => {
            const existing = getStoredAccessToken()
            if (existing) {
                scheduleSilentRefresh()
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
        }

        bootstrapSession()

        return () => {
            active = false
            if (refreshTimerId !== null) {
                window.clearInterval(refreshTimerId)
            }
        }
    }, [])

    return (
        <SocketProvider>
            <SeoManager />
            <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#080808', color: '#7A7A7A' }}>Cargando...</div>}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/feed" element={<FeedPage />} />
                    <Route path="/movie/:slugOrId" element={<MovieDetail />} />
                    <Route path="/person/:id" element={<PersonPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/search-results" element={<SearchResults />} />
                    <Route path="/search/:query" element={<SearchResults />} />
                    <Route path="/profile" element={<ProfileIndexPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    <Route path="/coming-soon/:section" element={<ComingSoonPage />} />
                    <Route path="/films" element={<ComingSoonPage />} />
                    <Route path="/lists" element={<ListsPage />} />
                    <Route path="/members" element={<ComingSoonPage />} />
                    <Route path="/journal" element={<ComingSoonPage />} />
                    <Route path="/:username" element={<Profile />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authMode}
            />
        </SocketProvider>
    )
}

export default App
