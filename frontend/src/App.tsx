import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router'
import AuthModal from './components/AuthModal'
import SeoManager from './components/SeoManager'
import { SocketProvider } from "./context/SocketContext"
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const MovieDetail = lazy(() => import('./pages/MovieDetail'))
const SearchResults = lazy(() => import('./pages/SearchResults'))
const Profile = lazy(() => import('./pages/Profile'))
const ProfileIndexPage = lazy(() => import('./pages/ProfileIndex'))
const NotFoundPage = lazy(() => import('./pages/NotFound'))

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

    return (
        <SocketProvider>
        <SeoManager />
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#080808', color: '#7A7A7A' }}>Cargando...</div>}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/movie/:slugOrId" element={<MovieDetail />} />
                <Route path="/search-results" element={<SearchResults />} />
                <Route path="/search/:query" element={<SearchResults />} />
                <Route path="/profile" element={<ProfileIndexPage />} />
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
