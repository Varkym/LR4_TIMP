import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({ login: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); setSuccess('');
    };

    const getPasswordStrength = (password) => {
        if (!password) return { level: 0, text: '', color: '', percent: 0 };
        let s = 0;
        if (password.length >= 6) s++;
        if (password.length >= 10) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/[0-9]/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        if (s <= 2) return { level: 1, text: 'Слабый', color: 'var(--color-danger)', percent: 33 };
        if (s <= 3) return { level: 2, text: 'Средний', color: 'var(--color-warning)', percent: 66 };
        return { level: 3, text: 'Надёжный', color: 'var(--color-success)', percent: 100 };
    };

    const ps = getPasswordStrength(formData.password);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccess('');
        if (formData.password !== formData.confirmPassword) { setError('Пароли не совпадают!'); return; }
        if (ps.level < 2) { setError('Пароль слишком слабый!'); return; }
        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/register`, {
                login: formData.login, email: formData.email,
                password: formData.password, role: 'viewer'
            });
            setSuccess('Регистрация успешна!');
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка регистрации');
        } finally { setLoading(false); }
    };

    const labelStyle = {
        display: 'block', marginBottom: '8px', color: '#7d7571',
        fontWeight: '500', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase'
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            background: '#faf8f5', position: 'relative', overflow: 'hidden'
        }}>
            {/* Левая панель — бренд */}
            <div style={{
                flex: '0 0 42%', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center',
                background: 'linear-gradient(160deg, #f0e8dd 0%, #faf8f5 50%, #f5ede3 100%)',
                padding: '60px', position: 'relative'
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `radial-gradient(rgba(196,149,106,0.06) 1px, transparent 1px)`,
                    backgroundSize: '24px 24px', pointerEvents: 'none'
                }} />

                <svg width="100" height="100" viewBox="0 0 100 100" style={{ marginBottom: '28px', position: 'relative' }}>
                    <defs>
                        <linearGradient id="rGold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#c4956a"/>
                            <stop offset="100%" stopColor="#a67a52"/>
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="url(#rGold)" strokeWidth="1.5" strokeDasharray="4 4"/>
                    <circle cx="50" cy="50" r="25" fill="none" stroke="url(#rGold)" strokeWidth="1"/>
                    <circle cx="50" cy="50" r="6" fill="url(#rGold)" opacity="0.7"/>
                    <path d="M50 10 L50 24 M50 76 L50 90 M10 50 L24 50 M76 50 L90 50" stroke="#c4956a" strokeWidth="0.8" opacity="0.4"/>
                </svg>

                <h1 style={{
                    fontSize: '28px', fontWeight: '700', color: '#2c2825',
                    letterSpacing: '-0.02em', marginBottom: '8px', position: 'relative'
                }}>
                    Создайте аккаунт
                </h1>
                <p style={{
                    fontSize: '14px', color: '#b0a8a2', maxWidth: '260px',
                    textAlign: 'center', lineHeight: '1.7', position: 'relative'
                }}>
                    Присоединяйтесь к системе мониторинга и управления безопасностью
                </p>
            </div>

            {/* Правая панель — форма */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '40px', overflow: 'auto'
            }}>
                <div className="fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '32px', color: '#2c2825' }}>
                        Регистрация
                    </h2>

                    {error && (
                        <div style={{
                            background: 'rgba(196,138,138,0.08)', color: '#a05252',
                            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                            fontSize: '13px', borderLeft: '3px solid #c48a8a'
                        }}>{error}</div>
                    )}
                    {success && (
                        <div style={{
                            background: 'rgba(138,172,142,0.1)', color: '#4a7c50',
                            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                            fontSize: '13px', borderLeft: '3px solid #8aac8e'
                        }}>{success}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '18px' }}>
                            <label style={labelStyle}>Логин</label>
                            <input type="text" name="login" value={formData.login}
                                onChange={handleChange} required placeholder="Придумайте логин"
                                style={{ width: '100%' }} />
                        </div>
                        <div style={{ marginBottom: '18px' }}>
                            <label style={labelStyle}>Email</label>
                            <input type="email" name="email" value={formData.email}
                                onChange={handleChange} required placeholder="example@mail.ru"
                                style={{ width: '100%' }} />
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={labelStyle}>Пароль</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} name="password"
                                    value={formData.password} onChange={handleChange} required
                                    placeholder="Минимум 6 символов"
                                    style={{ width: '100%', paddingRight: '48px' }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '14px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', fontSize: '16px',
                                        color: '#b0a8a2'
                                    }}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {formData.password && (
                                <div style={{ marginTop: '10px' }}>
                                    <div style={{
                                        height: '4px', borderRadius: '2px',
                                        background: 'rgba(196,149,106,0.1)', overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${ps.percent}%`, height: '100%',
                                            background: ps.color, borderRadius: '2px',
                                            transition: 'width 0.4s ease'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '11px', color: ps.color, fontWeight: '600', marginTop: '4px', display: 'block' }}>
                                        {ps.text}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '28px' }}>
                            <label style={labelStyle}>Подтвердите пароль</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                                    value={formData.confirmPassword} onChange={handleChange} required
                                    placeholder="Повторите пароль"
                                    style={{ width: '100%', paddingRight: '48px' }} />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute', right: '14px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', fontSize: '16px',
                                        color: '#b0a8a2'
                                    }}>
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {formData.confirmPassword && (
                                <span style={{
                                    fontSize: '11px', fontWeight: '600', marginTop: '6px', display: 'block',
                                    color: formData.password === formData.confirmPassword ? '#4a7c50' : '#a05252'
                                }}>
                                    {formData.password === formData.confirmPassword ? '✓ Пароли совпадают' : '✗ Пароли не совпадают'}
                                </span>
                            )}
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary"
                            style={{ width: '100%', padding: '14px', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Регистрация...' : 'Создать аккаунт'}
                        </button>
                    </form>

                    <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#b0a8a2' }}>
                        Уже есть аккаунт?{' '}
                        <a href="/" style={{ color: '#c4956a', fontWeight: '600', textDecoration: 'none' }}>Войти</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;