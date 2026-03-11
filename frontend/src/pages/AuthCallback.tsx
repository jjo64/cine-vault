import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { conectarSocket } from '../context/SocketContext'
import { finalizeOAuthCallback, notifyAuthStateChanged } from '../services/authServices'
import { notify } from '../lib/notify'

const C = {
  bg: '#080808',
  border: '#252525',
  accent: '#D4AF7A',
  text: '#E2E2E2',
  textSoft: '#7A7A7A',
} as const

const SANS = "'Syne', sans-serif"

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [statusText, setStatusText] = useState('Validando inicio de sesion...')

  useEffect(() => {
    let alive = true

    const run = async () => {
      try {
        const accessToken = await finalizeOAuthCallback()
        if (!alive) return

        conectarSocket(accessToken)
        notifyAuthStateChanged(true)
        notify.loginOk()
        navigate('/profile', { replace: true })
      } catch {
        if (!alive) return
        setStatusText('No se pudo completar el login con Google.')
        notify.loginError('No se pudo completar el login con Google')
        window.setTimeout(() => navigate('/', { replace: true }), 1400)
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [navigate])

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, color: C.text }}>
      <section style={{ border: `1px solid ${C.border}`, background: 'rgba(17,17,17,0.92)', padding: '20px 24px', fontFamily: SANS }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accent }}>
          OAuth Callback
        </div>
        <p style={{ margin: '10px 0 0', color: C.textSoft, fontSize: 13 }}>{statusText}</p>
      </section>
    </main>
  )
}
