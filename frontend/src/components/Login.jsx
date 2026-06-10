import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({ login: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/api/auth/login', formData);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('refreshToken', response.data.refreshToken); // сохраняем refresh-токен
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    // SVG Цветочек
    const Flower = () => (
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ display: 'block', margin: '0 auto' }}>
            <defs>
                <radialGradient id="petal1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f7cad0" />
                    <stop offset="100%" stopColor="#e8a0b0" />
                </radialGradient>
                <radialGradient id="petal2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fce4ec" />
                    <stop offset="100%" stopColor="#f48fb1" />
                </radialGradient>
                <radialGradient id="center" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fff9c4" />
                    <stop offset="100%" stopColor="#f9c74f" />
                </radialGradient>
            </defs>

            {/* Лепестки — 8 штук по кругу */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const cx = 80 + Math.cos(rad) * 34;
                const cy = 80 + Math.sin(rad) * 34;
                return (
                    <ellipse
                        key={i}
                        cx={cx} cy={cy}
                        rx="18" ry="11"
                        transform={`rotate(${angle}, ${cx}, ${cy})`}
                        fill={i % 2 === 0 ? 'url(#petal1)' : 'url(#petal2)'}
                        opacity="0.92"
                    />
                );
            })}

            {/* Второй слой лепестков — поменьше, повёрнуты на 22.5° */}
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const cx = 80 + Math.cos(rad) * 26;
                const cy = 80 + Math.sin(rad) * 26;
                return (
                    <ellipse
                        key={`s${i}`}
                        cx={cx} cy={cy}
                        rx="13" ry="8"
                        transform={`rotate(${angle}, ${cx}, ${cy})`}
                        fill="url(#petal2)"
                        opacity="0.6"
                    />
                );
            })}

            {/* Листики */}
            <ellipse cx="80" cy="138" rx="6" ry="12" fill="#a8d5a2" opacity="0.8" transform="rotate(-15,80,138)"/>
            <ellipse cx="80" cy="138" rx="6" ry="12" fill="#8dc88a" opacity="0.7" transform="rotate(15,80,138)"/>
            {/* Стебелёк */}
            <line x1="80" y1="125" x2="80" y2="150" stroke="#8dc88a" strokeWidth="2.5" strokeLinecap="round"/>

            {/* Сердцевина */}
            <circle cx="80" cy="80" r="18" fill="url(#center)" />
            <circle cx="80" cy="80" r="13" fill="#f9c74f" opacity="0.6" />
            <circle cx="80" cy="80" r="7" fill="#f4a261" opacity="0.9" />

            {/* Блики на сердцевине */}
            <circle cx="75" cy="76" r="3" fill="white" opacity="0.4" />
        </svg>
    );

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            background: '#faf8f5',
            overflow: 'hidden'
        }}>
            {/* Левая панель — розовая, с цветочком и автором */}
            <div style={{
                flex: '0 0 44%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px 50px',
                background: 'linear-gradient(160deg, #fce4ec 0%, #f8bbd9 40%, #fce4ec 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Фоновые декоративные кружки */}
                <div style={{
                    position: 'absolute', top: '-60px', right: '-60px',
                    width: '220px', height: '220px', borderRadius: '50%',
                    background: 'rgba(248,187,217,0.4)', pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', bottom: '-80px', left: '-40px',
                    width: '260px', height: '260px', borderRadius: '50%',
                    background: 'rgba(244,143,177,0.2)', pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', top: '40%', left: '-30px',
                    width: '120px', height: '120px', borderRadius: '50%',
                    background: 'rgba(252,228,236,0.5)', pointerEvents: 'none'
                }} />

                {/* Цветочек SVG */}
                <div style={{ marginBottom: '32px', position: 'relative' }}>
                    <Flower />
                </div>

                {/* Название — с именем автора */}
                <h1 style={{
                    fontSize: '28px', fontWeight: '800', color: '#ad1457',
                    letterSpacing: '-0.02em', marginBottom: '6px',
                    textAlign: 'center', position: 'relative'
                }}>
                    Var<span style={{ color: '#e91e8c' }}>Secure</span>
                </h1>

                <p style={{
                    fontSize: '12px', color: '#c2185b', letterSpacing: '0.12em',
                    textTransform: 'uppercase', marginBottom: '20px',
                    fontWeight: '500', position: 'relative'
                }}>
                    Система безопасности
                </p>

                {/* Автор */}
                <div style={{
                    padding: '10px 20px', borderRadius: '20px',
                    background: 'rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    position: 'relative'
                }}>
                    <p style={{ fontSize: '12px', color: '#880e4f', textAlign: 'center', lineHeight: 1.5 }}>
                        <span style={{ opacity: 0.7 }}>автор</span><br/>
                        <span style={{ fontWeight: '700', fontSize: '14px' }}>Сапегина Варвара</span>
                    </p>
                </div>

                {/* Нижние декоративные точки */}
                <div style={{
                    position: 'absolute', bottom: '32px',
                    display: 'flex', gap: '6px', opacity: 0.4
                }}>
                    {[1,2,3,4,5].map(i => (
                        <div key={i} style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: i === 3 ? '#e91e8c' : '#f48fb1'
                        }} />
                    ))}
                </div>
            </div>

            {/* Правая панель — форма входа */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 40px',
                background: '#fff'
            }}>
                <div className="fade-in" style={{ width: '100%', maxWidth: '380px' }}>

                    {/* Мини-иконка */}
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '24px', fontSize: '22px',
                        border: '1px solid rgba(233,30,140,0.12)'
                    }}>
                        🌸
                    </div>

                    <h2 style={{
                        fontSize: '22px', fontWeight: '700', marginBottom: '6px',
                        color: '#2c2825', letterSpacing: '-0.02em'
                    }}>
                        Добро пожаловать
                    </h2>
                    <p style={{ fontSize: '14px', color: '#b0a8a2', marginBottom: '36px' }}>
                        Войдите в свой аккаунт для продолжения
                    </p>

                    {error && (
                        <div style={{
                            background: '#fce4ec', color: '#c2185b',
                            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                            fontSize: '13px', borderLeft: '3px solid #e91e8c'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Логин */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block', marginBottom: '8px',
                                color: '#7d7571', fontWeight: '500',
                                fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase'
                            }}>
                                Логин
                            </label>
                            <input
                                type="text"
                                name="login"
                                id="login-input"
                                value={formData.login}
                                onChange={handleChange}
                                required
                                placeholder="Введите логин"
                                style={{
                                    width: '100%',
                                    border: '1.5px solid rgba(233,30,140,0.15)',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    background: '#fff',
                                    color: '#2c2825'
                                }}
                                onFocus={e => e.target.style.borderColor = '#e91e8c'}
                                onBlur={e => e.target.style.borderColor = 'rgba(233,30,140,0.15)'}
                            />
                        </div>

                        {/* Пароль */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'block', marginBottom: '8px',
                                color: '#7d7571', fontWeight: '500',
                                fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase'
                            }}>
                                Пароль
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    id="password-input"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Введите пароль"
                                    style={{
                                        width: '100%',
                                        border: '1.5px solid rgba(233,30,140,0.15)',
                                        borderRadius: '10px',
                                        padding: '12px 48px 12px 16px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        background: '#fff',
                                        color: '#2c2825'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#e91e8c'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(233,30,140,0.15)'}
                                />
                                <button
                                    type="button"
                                    id="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '14px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', fontSize: '16px',
                                        color: '#b0a8a2', padding: '2px'
                                    }}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            id="login-btn"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '14px',
                                borderRadius: '10px', border: 'none',
                                background: loading
                                    ? '#f48fb1'
                                    : 'linear-gradient(135deg, #e91e8c, #c2185b)',
                                color: '#fff', fontWeight: '700',
                                fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
                                letterSpacing: '0.04em', textTransform: 'uppercase',
                                boxShadow: '0 4px 16px rgba(233,30,140,0.25)',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit'
                            }}
                            onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; }}
                        >
                            {loading ? 'Авторизация...' : 'Войти'}
                        </button>
                    </form>

                    {/* Тестовый доступ */}
                    <div style={{
                        marginTop: '24px', padding: '14px 16px', borderRadius: '10px',
                        background: '#fce4ec', fontSize: '12px', color: '#880e4f',
                        border: '1px solid rgba(233,30,140,0.1)'
                    }}>
                        <span style={{ fontWeight: '700' }}>Тестовый доступ:</span>{' '}
                        admin / password123
                    </div>

                    <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#b0a8a2' }}>
                        Нет аккаунта?{' '}
                        <a href="/register" style={{ color: '#e91e8c', fontWeight: '600', textDecoration: 'none' }}>
                            Регистрация
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;