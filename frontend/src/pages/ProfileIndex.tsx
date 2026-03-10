import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getCurrentUser, getStoredAccessToken } from '../services/authServices'
import NotFoundPage from './NotFound'

export default function ProfileIndexPage() {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading')
  const [username, setUsername] = useState('')

  useEffect(() => {
    let alive = true
    let retries = 0

    const load = async () => {
      try {
        const user = await getCurrentUser()
        if (!alive) return
        setUsername(user.username)
        setStatus('authorized')
      } catch {
        if (!alive) return
        const hasToken = Boolean(getStoredAccessToken())
        if (hasToken && retries < 3) {
          retries += 1
          window.setTimeout(load, 250)
          return
        }
        setStatus('unauthorized')
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [])

  if (status === 'loading') {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#080808', color: '#7A7A7A' }}>Cargando perfil...</div>
  }

  if (status === 'unauthorized') {
    return <NotFoundPage />
  }

  return <Navigate to={`/${encodeURIComponent(username)}`} replace />
}
