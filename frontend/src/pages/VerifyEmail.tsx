import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { notify } from '../lib/notify'

const C = {
  bg: '#080808',
  surface: '#111111',
  border: '#252525',
  accent: '#D4AF7A',
  text: '#E2E2E2',
  textSoft: '#8A8A8A',
  error: '#FF8A8A',
} as const

const SANS = "'Syne', sans-serif"
const SERIF = "'Cormorant Garamond', serif"

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams])
  const status = searchParams.get('status')

  useEffect(() => {
    if (status === 'verified') {
      setDone(true)
      setLoading(false)
      return
    }

    if (!token) {
      setError('Falta el token de verificación en el enlace.')
      setLoading(false)
      return
    }

    let active = true

    const verify = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email/${encodeURIComponent(token)}`, {
          method: 'POST',
          credentials: 'include',
        })

        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.message || data?.error?.message || 'No se pudo verificar el correo')
        }

        if (!active) return
        setDone(true)
        notify.emailVerified()
        setTimeout(() => navigate('/'), 1500)
      } catch (err) {
        if (!active) return
        setError((err as Error).message || 'No se pudo verificar el correo')
      } finally {
        if (active) setLoading(false)
      }
    }

    verify()
    return () => {
      active = false
    }
  }, [token, status])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'grid', placeItems: 'center', padding: '20px', fontFamily: SANS }}>
      <div style={{ width: '100%', maxWidth: 620, border: `1px solid ${C.border}`, background: `linear-gradient(160deg, ${C.surface} 0%, #0c0c0c 100%)`, padding: '34px 28px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 10 }}>CineVault</div>
        <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(34px,6vw,52px)', lineHeight: 1.02 }}>
          Verificación de email
        </h1>

        {loading && <p style={{ marginTop: 16, color: C.textSoft }}>Validando enlace...</p>}
        {!loading && done && (
          <>
            <p style={{ marginTop: 16, color: C.textSoft, lineHeight: 1.6 }}>
              Tu correo fue verificado correctamente. Ya puedes iniciar sesión y seguir con tu recorrido donde lo dejaste.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }))}
                style={{ border: 'none', background: C.accent, color: '#080808', padding: '10px 16px', cursor: 'pointer', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: SANS }}
              >
                Iniciar sesión
              </button>
              <Link to="/" style={{ border: `1px solid ${C.border}`, color: C.text, textDecoration: 'none', padding: '10px 16px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Ir al inicio
              </Link>
            </div>
          </>
        )}

        {!loading && error && (
          <>
            <p style={{ marginTop: 16, color: C.error, lineHeight: 1.6 }}>{error}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <Link to="/" style={{ border: `1px solid ${C.border}`, color: C.text, textDecoration: 'none', padding: '10px 16px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Volver al inicio
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
