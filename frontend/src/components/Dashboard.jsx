import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LabelList
} from 'recharts';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ incidents: 0, services: 0, employees: 0, vulnerabilities: 0 });
    const [incidents, setIncidents] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [typeData, setTypeData] = useState([]);
    const [animatedStats, setAnimatedStats] = useState({ incidents: 0, services: 0, employees: 0, vulnerabilities: 0 });
    const [activeSideItem, setActiveSideItem] = useState('dashboard');
    const navigate = useNavigate();
    const animRef = useRef(false);

    // Пастельные цвета для графиков
    const COLORS = ['#e8a0b0', '#9ab8d8', '#e8b89a', '#8aac8e', '#b8a8d8'];

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!token || !userData) { navigate('/'); return; }
        setUser(userData);
        loadStats();
    }, [navigate]);

    // Анимация счётчиков
    useEffect(() => {
        if (animRef.current) return;
        const hasData = stats.incidents || stats.services || stats.employees || stats.vulnerabilities;
        if (hasData) {
            animRef.current = true;
            const duration = 1000;
            const steps = 30;
            let step = 0;
            const timer = setInterval(() => {
                step++;
                const ease = 1 - Math.pow(1 - step / steps, 3);
                setAnimatedStats({
                    incidents: Math.round(stats.incidents * ease),
                    services: Math.round(stats.services * ease),
                    employees: Math.round(stats.employees * ease),
                    vulnerabilities: Math.round(stats.vulnerabilities * ease)
                });
                if (step >= steps) clearInterval(timer);
            }, duration / steps);
        }
    }, [stats]);

    const loadStats = async () => {

        try {
            const [inc, srv, emp, vul] = await Promise.all([
                api.get('/api/incidents'),
                api.get('/api/services'),
                api.get('/api/employees'),
                api.get('/api/vulnerabilities')
            ]);
            setStats({ incidents: inc.data.length, services: srv.data.length, employees: emp.data.length, vulnerabilities: vul.data.length });
            setIncidents(inc.data.slice(0, 6));

            // Данные для графика статусов
            const statusCount = {};
            inc.data.forEach(i => { statusCount[i.Статус || 'Неизвестен'] = (statusCount[i.Статус || 'Неизвестен'] || 0) + 1; });
            setStatusData(Object.entries(statusCount).map(([name, value]) => ({ name, value })));

            // Данные для графика типов
            const typeCount = {};
            inc.data.forEach(i => { typeCount[i.Тип_инцидента || 'Другое'] = (typeCount[i.Тип_инцидента || 'Другое'] || 0) + 1; });
            setTypeData(Object.entries(typeCount).map(([name, count]) => ({ name, count })).slice(0, 5));
        } catch (err) { console.error(err); }
    };

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        try {
            // Инвалидируем refresh-токен на сервере
            await api.post('/api/auth/logout', { refreshToken });
        } catch (e) { /* игнорируем ошибки */ }
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/');
    };

    // Активность по дням (из реальных инцидентов)
    const getActivityData = () => {
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        const counts = [0, 0, 0, 0, 0, 0, 0];
        incidents.forEach(inc => {
            const d = new Date(inc.Дата_и_время_инцидента);
            const day = (d.getDay() + 6) % 7;
            counts[day]++;
        });
        return days.map((day, i) => ({ day, events: counts[i] }));
    };

    const sideItems = user ? [
        { id: 'dashboard', icon: '⊞', label: 'Обзор', path: '/dashboard' },
        { id: 'incidents', icon: '⚑', label: 'Инциденты', path: '/incidents' },
        { id: 'services', icon: '⊙', label: 'Услуги', path: '/services' },
        { id: 'employees', icon: '⊹', label: 'Сотрудники', path: '/employees' },
        ...(user.role === 'admin' ? [
            { id: 'users', icon: '⊿', label: 'Пользователи', path: '/users' },
            { id: 'audit', icon: '≡', label: 'Аудит', path: '/audit' },
        ] : [])
    ] : [];

    if (!user) return null;

    const statCards = user ? [
        { label: 'Инциденты', value: animatedStats.incidents, color: '#c4788e', bg: 'linear-gradient(135deg, #fce4ec, #fdf0f4)', border: 'rgba(232,160,176,0.25)', icon: '⚑' },
        { label: 'Услуги', value: animatedStats.services, color: '#7098be', bg: 'linear-gradient(135deg, #deedf8, #edf5fc)', border: 'rgba(154,184,216,0.25)', icon: '⊙' },
        { label: 'Сотрудники', value: animatedStats.employees, color: '#c8926e', bg: 'linear-gradient(135deg, #fdecd8, #fef5ec)', border: 'rgba(232,184,154,0.25)', icon: '⊹' },
        { label: 'Уязвимости', value: animatedStats.vulnerabilities, color: '#7a8eb0', bg: 'linear-gradient(135deg, #dde8f5, #edf3fa)', border: 'rgba(154,184,216,0.2)', icon: '⊘' },
    ] : [];

    const sidebarW = 220;

    // Пастельные цвета для сайдбара
    const sidebarPastel = {
        bg: 'linear-gradient(180deg, #fff5f8 0%, #f8f0fc 50%, #f0f5ff 100%)',
        activeBg: 'linear-gradient(135deg, rgba(232,160,176,0.14), rgba(154,184,216,0.1))',
        activeColor: '#c4788e',
        activeBorder: '#e8a0b0',
        hover: 'rgba(232,160,176,0.07)'
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: '#fff', border: '1px solid rgba(196,149,106,0.15)',
                    borderRadius: '10px', padding: '10px 14px',
                    fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                    <p style={{ fontWeight: '600', color: '#2c2825', marginBottom: '2px' }}>{label}</p>
                    <p style={{ color: '#7d7571' }}>{payload[0].name}: <b style={{ color: '#c4956a' }}>{payload[0].value}</b></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#faf8f5' }}>
            {/* Сайдбар */}
            <aside style={{
                width: `${sidebarW}px`,
                background: sidebarPastel.bg,
                borderRight: '1px solid rgba(232,160,176,0.12)',
                padding: '28px 12px', display: 'flex', flexDirection: 'column',
                position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
                boxShadow: '2px 0 16px rgba(232,160,176,0.07)'
            }}>
                {/* Логотип */}
                <div style={{ marginBottom: '36px', paddingLeft: '8px' }}>
                    <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#2c2825', letterSpacing: '-0.02em' }}>
                        Var<span style={{ background: 'linear-gradient(135deg,#e8a0b0,#9ab8d8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Secure</span>
                    </h1>
                    <div style={{
                        marginTop: '4px', fontSize: '9px', color: '#b5ada8',
                        letterSpacing: '0.15em', textTransform: 'uppercase'
                    }}>Security System</div>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {sideItems.map(item => {
                        const active = activeSideItem === item.id;
                        return (
                            <button key={item.id}
                                onClick={() => { setActiveSideItem(item.id); navigate(item.path); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px 12px', borderRadius: '10px', border: 'none',
                                    background: active ? sidebarPastel.activeBg : 'transparent',
                                    color: active ? sidebarPastel.activeColor : '#7d7571',
                                    fontWeight: active ? '600' : '400',
                                    fontSize: '13px', cursor: 'pointer', textAlign: 'left', width: '100%',
                                    borderLeft: active ? `2px solid ${sidebarPastel.activeBorder}` : '2px solid transparent',
                                    transition: 'all 0.2s'
                                }}>
                                <span style={{ fontSize: '15px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Профиль */}
                <div style={{ borderTop: '1px solid rgba(196,149,106,0.1)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #fce4ec, #deedf8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: '700', color: '#c4788e', flexShrink: 0
                        }}>
                            {user.login.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#2c2825', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.login}</div>
                            <div style={{ fontSize: '10px', color: '#b0a8a2' }}>
                                {user.role === 'admin' ? 'Администратор' : user.role === 'operator' ? 'Оператор' : 'Наблюдатель'}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{
                        width: '100%', padding: '8px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(232,160,176,0.1), rgba(154,184,216,0.1))',
                        color: '#c4788e',
                        border: '1px solid rgba(232,160,176,0.2)', fontSize: '12px',
                        fontWeight: '500', cursor: 'pointer'
                    }}>Выйти</button>
                </div>
            </aside>

            {/* Контент */}
            <main style={{ flex: 1, marginLeft: `${sidebarW}px`, padding: '36px 40px', overflowX: 'hidden' }}>
                {/* Заголовок */}
                <div className="fade-in" style={{ marginBottom: '28px' }}>
                    <p style={{ fontSize: '11px', color: '#b5ada8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Панель управления
                    </p>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2c2825' }}>
                        Добро пожаловать,{' '}
                        <span style={{ background: 'linear-gradient(135deg, #e8a0b0, #9ab8d8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {user.login}
                        </span>
                    </h2>
                </div>

                {/* Карточки статистики */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                    {statCards.map((card, i) => (
                        <div key={i} className="fade-in" style={{
                            background: card.bg,
                            borderRadius: '14px', padding: '22px 20px',
                            border: `1px solid ${card.border}`,
                            boxShadow: '0 1px 6px rgba(232,160,176,0.08)',
                            animationDelay: `${i * 0.08}s`,
                            cursor: 'default'
                        }}>
                            <div style={{
                                width: '38px', height: '38px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.7)',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '18px', color: card.color,
                                marginBottom: '14px'
                            }}>{card.icon}</div>
                            <div style={{ fontSize: '30px', fontWeight: '700', color: '#2c2825', lineHeight: 1, marginBottom: '4px' }}>
                                {card.value}
                            </div>
                            <div style={{ fontSize: '11px', color: '#b0a8a2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {card.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Графики: Статусы (Pie) + Типы инцидентов (Bar) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '16px', marginBottom: '24px' }}>
                    {/* Пирог — статусы */}
                    <div className="card fade-in" style={{ animationDelay: '0.2s', padding: '24px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#2c2825' }}>
                                Инциденты по статусу
                            </h3>
                            <p style={{ fontSize: '12px', color: '#b0a8a2', marginTop: '2px' }}>
                                Текущее распределение
                            </p>
                        </div>
                        {statusData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%"
                                            innerRadius={55} outerRadius={80}
                                            paddingAngle={4} dataKey="value">
                                            {statusData.map((entry, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{
                                            background: '#fff', border: '1px solid rgba(196,149,106,0.15)',
                                            borderRadius: '10px', fontSize: '12px'
                                        }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                    {statusData.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7d7571' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                            {item.name}: <b style={{ color: '#2c2825' }}>{item.value}</b>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#b0a8a2', fontSize: '13px' }}>
                                Нет данных об инцидентах
                            </div>
                        )}
                    </div>

                    {/* Bar — типы инцидентов */}
                    <div className="card fade-in" style={{ animationDelay: '0.3s', padding: '24px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#2c2825' }}>
                                Типы инцидентов
                            </h3>
                            <p style={{ fontSize: '12px', color: '#b0a8a2', marginTop: '2px' }}>
                                Количество по каждому типу
                            </p>
                        </div>
                        {typeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={typeData} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,149,106,0.07)" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#b0a8a2' }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#7d7571' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Кол-во" radius={[0, 6, 6, 0]} fill="url(#pastelBar)">
                                        <LabelList dataKey="count" position="right" style={{ fontSize: '12px', fill: '#7d7571', fontWeight: '600' }} />
                                    </Bar>
                                    <defs>
                                        <linearGradient id="pastelBar" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#9ab8d8" />
                                            <stop offset="100%" stopColor="#e8a0b0" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#b0a8a2', fontSize: '13px' }}>
                                Нет данных об инцидентах
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity + Timeline */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px' }}>
                    {/* Area Chart */}
                    <div className="card fade-in" style={{ animationDelay: '0.4s', padding: '24px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#2c2825' }}>
                                Активность за неделю
                            </h3>
                            <p style={{ fontSize: '12px', color: '#b0a8a2', marginTop: '2px' }}>
                                Инциденты по дням недели
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={getActivityData()}>
                                <defs>
                                    <linearGradient id="skyArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#9ab8d8" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#9ab8d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(154,184,216,0.12)" />
                                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#b5ada8' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#b5ada8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="events" name="Инциденты"
                                    stroke="#9ab8d8" fill="url(#skyArea)" strokeWidth={2.5} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Таймлайн последних инцидентов */}
                    <div className="card fade-in" style={{ animationDelay: '0.5s', padding: '24px' }}>
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#2c2825' }}>
                                    Последние инциденты
                                </h3>
                                <p style={{ fontSize: '12px', color: '#b0a8a2', marginTop: '2px' }}>
                                    Хронология событий
                                </p>
                            </div>
                            <button onClick={() => navigate('/incidents')} style={{
                                fontSize: '11px', color: '#c4956a', background: 'rgba(196,149,106,0.08)',
                                border: '1px solid rgba(196,149,106,0.15)', borderRadius: '6px',
                                padding: '4px 10px', cursor: 'pointer', fontWeight: '600'
                            }}>
                                Все →
                            </button>
                        </div>

                        <div style={{ position: 'relative', paddingLeft: '18px' }}>
                            <div style={{
                                position: 'absolute', left: '5px', top: '6px', bottom: '6px',
                                width: '1px', background: 'linear-gradient(180deg, rgba(232,160,176,0.4), rgba(196,149,106,0.15))'
                            }} />

                            {incidents.length > 0 ? incidents.map((inc, i) => {
                                const dotColor = inc.Уровень_угрозы >= 4 ? '#c48a8a' :
                                    inc.Уровень_угрозы >= 3 ? '#c4a06a' : '#8aac8e';
                                return (
                                    <div key={i} style={{ marginBottom: '16px', position: 'relative' }}>
                                        <div style={{
                                            position: 'absolute', left: '-14px', top: '4px',
                                            width: '7px', height: '7px', borderRadius: '50%',
                                            background: dotColor, border: '2px solid #faf8f5'
                                        }} />
                                        <div style={{ fontSize: '10px', color: '#b0a8a2', marginBottom: '1px' }}>
                                            {new Date(inc.Дата_и_время_инцидента).toLocaleDateString('ru-RU')}
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#2c2825', marginBottom: '3px' }}>
                                            {inc.Тип_инцидента}
                                        </div>
                                        <span style={{
                                            fontSize: '10px', padding: '1px 7px', borderRadius: '4px',
                                            background: inc.Статус === 'Новый' ? 'rgba(138,158,196,0.12)' :
                                                inc.Статус === 'В работе' ? 'rgba(196,160,106,0.12)' : 'rgba(138,172,142,0.12)',
                                            color: inc.Статус === 'Новый' ? '#8a9ec4' :
                                                inc.Статус === 'В работе' ? '#c4a06a' : '#8aac8e',
                                            fontWeight: '600'
                                        }}>
                                            {inc.Статус}
                                        </span>
                                    </div>
                                );
                            }) : (
                                <div style={{ fontSize: '13px', color: '#b0a8a2', paddingTop: '16px' }}>
                                    Нет инцидентов
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;