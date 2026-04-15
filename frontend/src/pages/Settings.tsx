import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Trash2, Upload } from 'lucide-react'
import { GrainOverlay } from '../components/profile-v2/primitives'
import { C, SANS, SERIF } from '../components/profile-v2/theme'
import {
  checkUsernameAvailability,
  deleteAccountSettings,
  fetchAuthSessions,
  revokeAllAuthSessions,
  revokeAuthSession,
  updateAuthSettings,
  updateAvatarSettings,
  updateProfileSettings,
  type SessionEntry,
} from '../services/profileServices'
import {
  activateTwoFactor,
  clearStoredAccessToken,
  confirmTwoFactor,
  disableTwoFactor,
  getCurrentUser,
  getRecoveryCodesStatus,
  getStoredAccessToken,
  regenerateRecoveryCodes,
  authorizedFetch,
} from '../services/authServices'
import './Settings.css'

type SectionKey = 'perfil' | 'seguridad' | 'cuenta'

type ProfileForm = {
  username: string
  email: string
  bio: string
}

type PasswordForm = {
  password_actual: string
  password_nueva: string
  password_confirmacion: string
}

const sectionTabs: Array<{ key: SectionKey; label: string }> = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'seguridad', label: 'Seguridad' },
  { key: 'cuenta', label: 'Cuenta' },
]

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
    reader.readAsDataURL(file)
  })
}

function FieldError({ children }: { children?: string | null }) {
  if (!children) return null
  return <div style={{ color: '#ff9c9c', fontSize: 11, fontFamily: SANS, marginTop: 4 }}>{children}</div>
}

export default function SettingsPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('perfil')
  const [profileForm, setProfileForm] = useState<ProfileForm>({ username: '', email: '', bio: '' })
  const [initialProfile, setInitialProfile] = useState<ProfileForm>({ username: '', email: '', bio: '' })
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({ password_actual: '', password_nueva: '', password_confirmacion: '' })
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [deleteStep, setDeleteStep] = useState(0)
  const [deleteInput, setDeleteInput] = useState('')
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false)
  const [twoFactorQr, setTwoFactorQr] = useState<string | null>(null)
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorDisableCode, setTwoFactorDisableCode] = useState('')
  const [twoFactorBusy, setTwoFactorBusy] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [recoveryCodesRemaining, setRecoveryCodesRemaining] = useState<number | null>(null)
  const [recoveryRegenerateCode, setRecoveryRegenerateCode] = useState('')
  const [recoveryBusy, setRecoveryBusy] = useState(false)

  const token = getStoredAccessToken()

  const hasUnsavedChanges = useMemo(() => {
    const profileDirty =
      profileForm.username !== initialProfile.username ||
      profileForm.email !== initialProfile.email ||
      profileForm.bio !== initialProfile.bio
    return profileDirty || Boolean(avatarBase64)
  }, [profileForm, initialProfile, avatarBase64])

  useEffect(() => {
    let alive = true

    const loadRecoveryStatus = async () => {
      try {
        const status = await getRecoveryCodesStatus()
        if (!alive) return
        setRecoveryCodesRemaining(status.remaining)
      } catch {
        if (!alive) return
        setRecoveryCodesRemaining(0)
      }
    }

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const current = await getCurrentUser()
        const usersRes = await authorizedFetch('/api/users', { method: 'GET' })

        if (!usersRes.ok) throw new Error('No se pudo cargar el perfil')
        const users = (await usersRes.json()) as Array<{ id: number; username: string; email?: string; bio?: string; avatar_url?: string | null }>
        const me = users.find((item) => item.id === current.id)

        if (!alive) return

        const nextProfile = {
          username: me?.username || current.username || '',
          email: me?.email || '',
          bio: me?.bio || '',
        }

        setProfileForm(nextProfile)
        setInitialProfile(nextProfile)
        setAvatarPreview(me?.avatar_url || current.avatar_url || null)
        const twoFactorEnabled = Boolean(current.two_factor_enabled)
        setIsTwoFactorEnabled(twoFactorEnabled)

        const sessionsRes = await fetchAuthSessions(token)
        if (!alive) return
        setSessions(Array.isArray(sessionsRes.sessions) ? sessionsRes.sessions : [])

        if (twoFactorEnabled) {
          await loadRecoveryStatus()
        }
      } catch (err) {
        if (!alive) return
        setError((err as Error).message || 'No se pudo cargar ajustes')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [navigate, token])

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [hasUnsavedChanges])

  const validateProfile = () => {
    const errors: Record<string, string> = {}

    if (!profileForm.username.trim()) errors.username = 'El username es obligatorio'
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(profileForm.username.trim())) {
      errors.username = '3-30 caracteres, solo letras, números y _'
    }

    if (!profileForm.email.trim()) errors.email = 'El email es obligatorio'
    if (profileForm.email.trim() && !/^\S+@\S+\.\S+$/.test(profileForm.email.trim())) {
      errors.email = 'Formato de email inválido'
    }

    if (profileForm.bio.length > 280) errors.bio = 'Máximo 280 caracteres'

    setInlineErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUsernameBlur = async () => {
    const candidate = profileForm.username.trim()
    if (!candidate || candidate.toLowerCase() === initialProfile.username.toLowerCase()) {
      setUsernameStatus('idle')
      return
    }

    try {
      setUsernameStatus('checking')
      const result = await checkUsernameAvailability(candidate)
      setUsernameStatus(result.available ? 'available' : 'taken')
      setInlineErrors((prev) => ({
        ...prev,
        username: result.available ? '' : 'Ese username ya está ocupado',
      }))
    } catch {
      setUsernameStatus('idle')
    }
  }

  const onAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const base64 = await toBase64(file)
      setAvatarBase64(base64)
      setAvatarPreview(base64)
      setSuccessMessage(null)
    } catch (err) {
      setError((err as Error).message || 'No se pudo procesar imagen')
    }
  }

  const saveProfile = async () => {
    if (!token) return
    if (!validateProfile()) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (avatarBase64) {
        await updateAvatarSettings(token, avatarBase64)
      }

      await updateProfileSettings(token, {
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        bio: profileForm.bio.trim(),
      })

      const nextInitial = {
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        bio: profileForm.bio.trim(),
      }

      setInitialProfile(nextInitial)
      setProfileForm(nextInitial)
      setAvatarBase64(null)
      setSuccessMessage('Cambios guardados correctamente')
    } catch (err) {
      setError((err as Error).message || 'No se pudo guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async () => {
    if (!token) return

    if (!passwordForm.password_actual || !passwordForm.password_nueva || !passwordForm.password_confirmacion) {
      setInlineErrors((prev) => ({ ...prev, password: 'Completa todos los campos de contraseña' }))
      return
    }

    if (passwordForm.password_nueva !== passwordForm.password_confirmacion) {
      setInlineErrors((prev) => ({ ...prev, password: 'La confirmación no coincide' }))
      return
    }

    try {
      await updateAuthSettings(token, passwordForm)
      setPasswordForm({ password_actual: '', password_nueva: '', password_confirmacion: '' })
      setInlineErrors((prev) => ({ ...prev, password: '' }))
      setSuccessMessage('Contraseña actualizada')
    } catch (err) {
      setError((err as Error).message || 'No se pudo cambiar contraseña')
    }
  }

  const removeSession = async (sessionId: string) => {
    if (!token) return

    try {
      await revokeAuthSession(token, sessionId)
      setSessions((prev) => prev.filter((session) => session.id !== sessionId))
    } catch (err) {
      setError((err as Error).message || 'No se pudo revocar la sesión')
    }
  }

  const closeAllSessions = async () => {
    if (!token) return

    try {
      await revokeAllAuthSessions(token)
      const refreshed = await fetchAuthSessions(token)
      setSessions(refreshed.sessions || [])
      setSuccessMessage('Se revocaron las sesiones activas')
    } catch (err) {
      setError((err as Error).message || 'No se pudieron revocar las sesiones')
    }
  }

  const deleteAccount = async () => {
    if (!token) return

    if (deleteStep === 0) {
      setDeleteStep(1)
      return
    }

    if (deleteInput !== 'ELIMINAR') {
      setInlineErrors((prev) => ({ ...prev, delete: 'Escribe ELIMINAR para confirmar' }))
      return
    }

    try {
      await deleteAccountSettings(token)
      clearStoredAccessToken()
      navigate('/')
    } catch (err) {
      setError((err as Error).message || 'No se pudo eliminar la cuenta')
    }
  }

  const beginTwoFactorSetup = async () => {
    setTwoFactorBusy(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { qr, secreto } = await activateTwoFactor()
      setTwoFactorQr(qr)
      setTwoFactorSecret(secreto)
      setTwoFactorCode('')
      setInlineErrors((prev) => ({ ...prev, twofactor: '' }))
      setSuccessMessage('Escaneá el QR y confirmá con tu código 2FA')
    } catch (err) {
      setError((err as Error).message || 'No se pudo iniciar la configuración 2FA')
    } finally {
      setTwoFactorBusy(false)
    }
  }

  const confirmTwoFactorSetup = async () => {
    const code = twoFactorCode.trim()
    if (!code) {
      setInlineErrors((prev) => ({ ...prev, twofactor: 'Ingresá tu código 2FA de 6 dígitos' }))
      return
    }

    setTwoFactorBusy(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const payload = await confirmTwoFactor(code)
      setIsTwoFactorEnabled(true)
      setTwoFactorQr(null)
      setTwoFactorSecret(null)
      setTwoFactorCode('')
      setRecoveryCodes(Array.isArray(payload.recoveryCodes) ? payload.recoveryCodes : [])
      setRecoveryCodesRemaining(Array.isArray(payload.recoveryCodes) ? payload.recoveryCodes.length : null)
      setRecoveryRegenerateCode('')
      setInlineErrors((prev) => ({ ...prev, twofactor: '' }))
      setSuccessMessage('2FA activado correctamente. Guardá tus recovery codes en un lugar seguro.')
    } catch (err) {
      setError((err as Error).message || 'No se pudo confirmar 2FA')
    } finally {
      setTwoFactorBusy(false)
    }
  }

  const disableTwoFactorSetup = async () => {
    const code = twoFactorDisableCode.trim()
    if (!code) {
      setInlineErrors((prev) => ({ ...prev, twofactorDisable: 'Ingresá el código actual para desactivar 2FA' }))
      return
    }

    setTwoFactorBusy(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await disableTwoFactor(code)
      setIsTwoFactorEnabled(false)
      setTwoFactorDisableCode('')
      setRecoveryCodes([])
      setRecoveryCodesRemaining(null)
      setRecoveryRegenerateCode('')
      setInlineErrors((prev) => ({ ...prev, twofactorDisable: '' }))
      setSuccessMessage('2FA desactivado correctamente')
    } catch (err) {
      setError((err as Error).message || 'No se pudo desactivar 2FA')
    } finally {
      setTwoFactorBusy(false)
    }
  }

  const regenerateRecoveryCodesAction = async () => {
    const code = recoveryRegenerateCode.trim()
    if (!code) {
      setInlineErrors((prev) => ({ ...prev, recoveryRegenerate: 'Ingresá tu código 2FA actual para regenerar' }))
      return
    }

    setRecoveryBusy(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const codes = await regenerateRecoveryCodes(code)
      setRecoveryCodes(codes)
      setRecoveryCodesRemaining(codes.length)
      setRecoveryRegenerateCode('')
      setInlineErrors((prev) => ({ ...prev, recoveryRegenerate: '' }))
      setSuccessMessage('Recovery codes regenerados. Los anteriores ya no sirven.')
    } catch (err) {
      setError((err as Error).message || 'No se pudieron regenerar los recovery codes')
    } finally {
      setRecoveryBusy(false)
    }
  }

  const handleTryLeave = () => {
    if (!hasUnsavedChanges) {
      navigate(-1)
      return
    }
    setShowLeaveModal(true)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, color: C.textSoft, fontFamily: SERIF }}>
        <GrainOverlay />
        Cargando ajustes...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: SANS }}>
      <GrainOverlay />


      <main className="settings-main">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, cursor: 'pointer' }} onClick={handleTryLeave}>
          <button
            style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}
          >
            <ArrowLeft size={14} /> Volver
          </button>
        </div>

        <h1 style={{ margin: '0 0 12px', fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(36px, 6vw, 52px)' }}>Editar perfil</h1>

        <div className="settings-tabs" style={{ gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {sectionTabs.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className="settings-tab-btn"
              style={{
                border: `1px solid ${activeSection === section.key ? C.accentDim : C.border}`,
                background: activeSection === section.key ? C.accentGlow : 'transparent',
                color: activeSection === section.key ? C.accent : C.textSoft,
                padding: '8px 12px',
                fontFamily: SANS,
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {section.label}
            </button>
          ))}
        </div>

        {error && <div style={{ color: '#ff9d9d', marginBottom: 10, fontSize: 12 }}>{error}</div>}
        {successMessage && <div style={{ color: C.accent, marginBottom: 10, fontSize: 12 }}>{successMessage}</div>}

        {activeSection === 'perfil' && (
          <section className="settings-section" style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 14, display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${C.border}`, background: C.elevated }}>
                {avatarPreview ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
              </div>

              <label style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, cursor: 'pointer', padding: '8px 12px', display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <Upload size={14} /> Cambiar avatar
                <input type="file" accept="image/*" onChange={onAvatarChange} style={{ display: 'none' }} />
              </label>
            </div>

            <div>
              <div style={{ color: C.textSoft, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Username</div>
              <input
                value={profileForm.username}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, username: event.target.value }))}
                onBlur={handleUsernameBlur}
                style={{ width: '100%', border: `1px solid ${C.border}`, background: C.elevated, color: C.text, padding: '10px 12px', fontFamily: SANS }}
              />
              <FieldError>{inlineErrors.username}</FieldError>
              <div style={{ color: usernameStatus === 'available' ? C.accent : C.textSoft, fontSize: 11, marginTop: 4 }}>
                {usernameStatus === 'checking' && 'Verificando disponibilidad...'}
                {usernameStatus === 'available' && 'Username disponible'}
                {usernameStatus === 'taken' && 'Username no disponible'}
              </div>
            </div>

            <div>
              <div style={{ color: C.textSoft, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Email</div>
              <input
                value={profileForm.email}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                style={{ width: '100%', border: `1px solid ${C.border}`, background: C.elevated, color: C.text, padding: '10px 12px', fontFamily: SANS }}
              />
              <FieldError>{inlineErrors.email}</FieldError>
            </div>

            <div>
              <div style={{ color: C.textSoft, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Bio</div>
              <textarea
                value={profileForm.bio}
                maxLength={280}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
                style={{ width: '100%', minHeight: 120, border: `1px solid ${C.border}`, background: C.elevated, color: C.textSoft, padding: '10px 12px', fontFamily: SERIF, fontStyle: 'italic', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FieldError>{inlineErrors.bio}</FieldError>
                <div style={{ color: C.textSoft, fontSize: 11, fontFamily: SANS }}>{profileForm.bio.length}/280</div>
              </div>
            </div>
          </section>
        )}

        {activeSection === 'seguridad' && (
          <section className="settings-section" style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 14, display: 'grid', gap: 14 }}>
            <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 28 }}>Autenticación en 2 pasos</h2>

            <div style={{ border: `1px solid ${isTwoFactorEnabled ? C.accentDim : C.border}`, background: isTwoFactorEnabled ? C.accentGlow : C.elevated, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: isTwoFactorEnabled ? C.accent : C.textSoft }}>
                Estado 2FA: {isTwoFactorEnabled ? 'Activo' : 'Inactivo'}
              </div>

              {!isTwoFactorEnabled ? (
                <button
                  onClick={beginTwoFactorSetup}
                  disabled={twoFactorBusy}
                  style={{ border: `1px solid ${C.accentDim}`, background: C.accentGlow, color: C.accent, padding: '8px 12px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: twoFactorBusy ? 'default' : 'pointer', fontFamily: SANS }}
                >
                  {twoFactorBusy ? 'Preparando...' : 'Activar 2FA'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Código para desactivar"
                    value={twoFactorDisableCode}
                    onChange={(event) => setTwoFactorDisableCode(event.target.value.replace(/\D/g, ''))}
                    style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.text, padding: '8px 10px', fontFamily: SANS, minWidth: 180 }}
                  />
                  <button
                    onClick={disableTwoFactorSetup}
                    disabled={twoFactorBusy}
                    style={{ border: '1px solid #6f3131', background: 'rgba(140,48,48,0.18)', color: '#ff9d9d', padding: '8px 12px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: twoFactorBusy ? 'default' : 'pointer', fontFamily: SANS }}
                  >
                    {twoFactorBusy ? 'Procesando...' : 'Desactivar 2FA'}
                  </button>
                </div>
              )}
            </div>
            <FieldError>{inlineErrors.twofactorDisable}</FieldError>

            {twoFactorQr && !isTwoFactorEnabled && (
              <div style={{ border: `1px solid ${C.border}`, background: C.elevated, padding: 12, display: 'grid', gap: 10 }}>
                <div style={{ color: C.textSoft, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: SANS }}>
                  Escaneá este QR en tu app autenticadora
                </div>

                <div style={{ width: 180, height: 180, border: `1px solid ${C.border}`, background: '#fff', padding: 8 }}>
                  <img src={twoFactorQr} alt="QR 2FA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>

                <div>
                  <div style={{ color: C.textSoft, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Clave manual</div>
                  <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: '10px 12px', fontFamily: SANS, color: C.text, wordBreak: 'break-all', fontSize: 12 }}>
                    {twoFactorSecret}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Código de 6 dígitos"
                    value={twoFactorCode}
                    onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, ''))}
                    style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.text, padding: '8px 10px', fontFamily: SANS, minWidth: 180 }}
                  />
                  <button
                    onClick={confirmTwoFactorSetup}
                    disabled={twoFactorBusy}
                    style={{ border: `1px solid ${C.accentDim}`, background: C.accentGlow, color: C.accent, padding: '8px 12px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: twoFactorBusy ? 'default' : 'pointer', fontFamily: SANS }}
                  >
                    {twoFactorBusy ? 'Confirmando...' : 'Confirmar activación'}
                  </button>
                </div>
                <FieldError>{inlineErrors.twofactor}</FieldError>
              </div>
            )}

            {isTwoFactorEnabled && (
              <div style={{ border: `1px solid ${C.border}`, background: C.elevated, padding: 12, display: 'grid', gap: 10 }}>
                <h3 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 24 }}>Recovery codes</h3>
                <p style={{ margin: 0, color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>
                  Usalos si perdés acceso a tu app autenticadora. Cada código funciona una sola vez.
                </p>
                <div style={{ color: C.textSoft, fontSize: 12 }}>
                  Códigos restantes: {recoveryCodesRemaining ?? '...'}
                </div>

                {recoveryCodes.length > 0 && (
                  <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 10, display: 'grid', gap: 6 }}>
                    {recoveryCodes.map((code) => (
                      <code key={code} style={{ color: C.accent, fontSize: 13, letterSpacing: '0.08em' }}>{code}</code>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Código 2FA actual"
                    value={recoveryRegenerateCode}
                    onChange={(event) => setRecoveryRegenerateCode(event.target.value.replace(/\D/g, ''))}
                    style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.text, padding: '8px 10px', fontFamily: SANS, minWidth: 180 }}
                  />
                  <button
                    onClick={regenerateRecoveryCodesAction}
                    disabled={recoveryBusy}
                    style={{ border: `1px solid ${C.accentDim}`, background: C.accentGlow, color: C.accent, padding: '8px 12px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: recoveryBusy ? 'default' : 'pointer', fontFamily: SANS }}
                  >
                    {recoveryBusy ? 'Regenerando...' : 'Regenerar recovery codes'}
                  </button>
                </div>
                <FieldError>{inlineErrors.recoveryRegenerate}</FieldError>
              </div>
            )}

            <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 28 }}>Contraseña</h2>

            <input
              type="password"
              placeholder="Contraseña actual"
              value={passwordForm.password_actual}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, password_actual: event.target.value }))}
              style={{ width: '100%', border: `1px solid ${C.border}`, background: C.elevated, color: C.text, padding: '10px 12px', fontFamily: SANS }}
            />
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={passwordForm.password_nueva}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, password_nueva: event.target.value }))}
              style={{ width: '100%', border: `1px solid ${C.border}`, background: C.elevated, color: C.text, padding: '10px 12px', fontFamily: SANS }}
            />
            <input
              type="password"
              placeholder="Confirmación"
              value={passwordForm.password_confirmacion}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, password_confirmacion: event.target.value }))}
              style={{ width: '100%', border: `1px solid ${C.border}`, background: C.elevated, color: C.text, padding: '10px 12px', fontFamily: SANS }}
            />
            <FieldError>{inlineErrors.password}</FieldError>

            <button
              onClick={savePassword}
              style={{ border: `1px solid ${C.accentDim}`, background: C.accentGlow, color: C.accent, padding: '9px 12px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS }}
            >
              Cambiar contraseña
            </button>

            <h2 style={{ margin: '8px 0 0', fontFamily: SERIF, fontWeight: 400, fontSize: 28 }}>Sesiones activas</h2>

            <button
              onClick={closeAllSessions}
              style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, padding: '9px 12px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS, justifySelf: 'start' }}
            >
              Cerrar sesión en todos los dispositivos
            </button>

            <div style={{ display: 'grid', gap: 8 }}>
              {sessions.map((session) => (
                <div key={session.id} style={{ border: `1px solid ${C.border}`, background: C.elevated, padding: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.text }}>{session.user_agent || 'Navegador desconocido'}</div>
                    <div style={{ fontSize: 11, color: C.textSoft }}>IP {session.ip_address || '-'} · {new Date(session.created_at).toLocaleString('es-ES')}</div>
                  </div>
                  <button
                    onClick={() => removeSession(session.id)}
                    style={{ border: `1px solid ${C.border}`, background: 'transparent', color: '#ff9d9d', padding: '8px 10px', fontSize: 11, cursor: 'pointer', fontFamily: SANS, textTransform: 'uppercase' }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              {sessions.length === 0 && <div style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>No hay sesiones activas.</div>}
            </div>
          </section>
        )}

        {activeSection === 'cuenta' && (
          <section className="settings-section" style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 14, display: 'grid', gap: 14 }}>
            <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 28, color: '#ffb1b1' }}>Eliminar cuenta</h2>
            <p style={{ margin: 0, color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>
              Esta acción es irreversible. Se eliminarán tus datos de CineVault.
            </p>

            {deleteStep > 0 && (
              <div>
                <div style={{ color: C.textSoft, fontSize: 11, marginBottom: 6 }}>Escribe ELIMINAR para confirmar</div>
                <input
                  value={deleteInput}
                  onChange={(event) => setDeleteInput(event.target.value)}
                  style={{ width: '100%', border: `1px solid ${C.border}`, background: C.elevated, color: C.text, padding: '10px 12px', fontFamily: SANS }}
                />
                <FieldError>{inlineErrors.delete}</FieldError>
              </div>
            )}

            <button
              onClick={deleteAccount}
              style={{ border: `1px solid #6f3131`, background: 'rgba(140,48,48,0.18)', color: '#ff9d9d', padding: '9px 12px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS, justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Trash2 size={14} /> {deleteStep === 0 ? 'Iniciar eliminación' : 'Confirmar eliminación'}
            </button>
          </section>
        )}
      </main>

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 140, borderTop: `1px solid ${C.border}`, background: 'rgba(8,8,8,0.96)', backdropFilter: 'blur(8px)', padding: '10px 14px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={saveProfile}
          disabled={saving || !hasUnsavedChanges}
          style={{ border: `1px solid ${C.accentDim}`, background: hasUnsavedChanges ? C.accentGlow : 'transparent', color: hasUnsavedChanges ? C.accent : C.textMuted, padding: '10px 14px', minWidth: 220, cursor: hasUnsavedChanges ? 'pointer' : 'default', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: SANS }}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.34 }}
            style={{ position: 'fixed', inset: 0, zIndex: 180, background: 'rgba(6,6,6,0.78)', display: 'grid', placeItems: 'center', padding: 16 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.34 }}
              style={{ width: '100%', maxWidth: 420, border: `1px solid ${C.border}`, background: C.surface, padding: 14 }}
            >
              <h3 style={{ margin: '0 0 8px', fontFamily: SERIF, fontWeight: 400, fontSize: 30 }}>Cambios sin guardar</h3>
              <p style={{ margin: '0 0 12px', color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>
                Tienes cambios sin guardar. ¿Seguro que quieres salir?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setShowLeaveModal(false)} style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Cancelar
                </button>
                <button
                  onClick={() => navigate(-1)}
                  style={{ border: `1px solid #6f3131`, background: 'rgba(140,48,48,0.18)', color: '#ff9d9d', padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}
                >
                  Salir igual
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TODO: reemplazar con API dedicada de perfil privado si se expone endpoint /api/settings/me */}
    </div>
  )
}
