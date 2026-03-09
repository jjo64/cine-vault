import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import './AuthModal.css';
import { setStoredAccessToken } from '../services/authServices'
import { notify } from '../lib/notify'
import { conectarSocket } from '../context/SocketContext'

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [hasSubmitError, setHasSubmitError] = useState(false);

    useEffect(() => {
        setMode(initialMode)
        setHasSubmitError(false)
    }, [initialMode, isOpen])

    useEffect(() => {
        if (!isOpen) return

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (hasSubmitError) setHasSubmitError(false)
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setHasSubmitError(false);

        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const url = `${import.meta.env.VITE_API_URL}${endpoint}`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include' // Important for cookies
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Error en autenticación');

            if (mode === 'login') {
                setStoredAccessToken(data.accessToken);
                conectarSocket(data.accessToken)
                window.dispatchEvent(new CustomEvent('auth-state-changed'))
                notify.loginOk()
                onClose()
            } else {
                setMode('login'); // Ir a login tras registro exitoso
                notify.registerOk()
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setHasSubmitError(true)
            const message = err.message || 'Error en autenticación'
            if (mode === 'login') {
                notify.loginError(message)
            } else {
                notify.loginError(message)
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`
    }

    const title = mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
    const subtitle = mode === 'login' ? 'TU VAULT TE ESPERA' : 'EL CINE EMPIEZA AQUÍ'

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <motion.div
                className="auth-modal-content"
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <button className="auth-modal-close" onClick={onClose}>&times;</button>

                <h2 className="auth-modal-title">{title}</h2>
                <p className="auth-modal-subtitle">{subtitle}</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    {mode === 'register' && (
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className={`auth-input ${hasSubmitError ? 'auth-input-error' : ''}`}
                        />
                    )}
                    <input
                        type="text"
                        name="username"
                        placeholder="Nombre de usuario"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className={`auth-input ${hasSubmitError ? 'auth-input-error' : ''}`}
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className={`auth-input ${hasSubmitError ? 'auth-input-error' : ''}`}
                    />

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'Procesando...' : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
                    </button>
                </form>

                <div className="auth-separator">
                    <span>o</span>
                </div>

                <button type="button" className="auth-google-btn" onClick={handleGoogleLogin}>
                    Continuar con Google
                </button>

                <div className="auth-toggle-text">
                    {mode === 'login' ? (
                        <>¿No tienes cuenta? <span onClick={() => setMode('register')}>Regístrate</span></>
                    ) : (
                        <>¿Ya tienes cuenta? <span onClick={() => setMode('login')}>Inicia Sesión</span></>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AuthModal;
