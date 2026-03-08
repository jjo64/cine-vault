import React, { useEffect, useState } from 'react';
import './AuthModal.css';

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
    const [error, setError] = useState('');

    useEffect(() => {
        setMode(initialMode)
        setError('')
    }, [initialMode, isOpen])

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

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
                localStorage.setItem('token', data.accessToken);
                window.dispatchEvent(new CustomEvent('auth-state-changed'))
                onClose()
                window.location.reload(); // mantiene el flujo actual mientras migramos estado global
            } else {
                setMode('login'); // Ir a login tras registro exitoso
                setError('¡Cuenta creada! Por favor inicia sesión.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal-content" onClick={e => e.stopPropagation()}>
                <button className="auth-modal-close" onClick={onClose}>&times;</button>

                <h2 className="auth-modal-title">
                    {mode === 'login' ? 'Bienvenido de nuevo' : 'Únete a Cinevault'}
                </h2>

                {error && <div className="auth-error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {mode === 'register' && (
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="auth-input"
                        />
                    )}
                    <input
                        type="text"
                        name="username"
                        placeholder="Nombre de usuario"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="auth-input"
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="auth-input"
                    />

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'Procesando...' : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
                    </button>
                </form>

                <div className="auth-toggle-text">
                    {mode === 'login' ? (
                        <>¿No tienes cuenta? <span onClick={() => setMode('register')}>Regístrate</span></>
                    ) : (
                        <>¿Ya tienes cuenta? <span onClick={() => setMode('login')}>Inicia Sesión</span></>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
