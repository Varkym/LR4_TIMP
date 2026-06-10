import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        role: '',
        status: '',
        search: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));

        if (!token || !userData) { navigate('/'); return; }
        if (userData.role !== 'admin') { navigate('/dashboard'); return; }

        loadUsers();
    }, [navigate]);

    useEffect(() => {
        applyFilters();
    }, [users, filters]);

    const loadUsers = async () => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            const response = await axios.get(`${API}/api/users`, config);
            setUsers(response.data);
        } catch (err) {
            console.error('Ошибка загрузки пользователей:', err);
            showMsg('Ошибка загрузки пользователей', 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...users];
        if (filters.role) result = result.filter(u => u.Роль === filters.role);
        if (filters.status === 'active') result = result.filter(u => u.Активен);
        if (filters.status === 'blocked') result = result.filter(u => !u.Активен);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(u =>
                (u.Логин || '').toLowerCase().includes(q) ||
                (u.Email || '').toLowerCase().includes(q)
            );
        }
        setFilteredUsers(result);
    };

    const showMsg = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleRoleChange = async (userId, newRole) => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            await axios.put(`${API}/api/users/${userId}/role`, { role: newRole }, config);
            setUsers(users.map(u => u.Идентификатор_пользователя === userId ? { ...u, Роль: newRole } : u));
            showMsg('Роль изменена', 'success');
        } catch (err) {
            showMsg('Ошибка изменения роли', 'error');
        }
    };

    const handleActivateToggle = async (userId, currentActive) => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            await axios.put(`${API}/api/users/${userId}/activate`, { active: !currentActive }, config);
            setUsers(users.map(u => u.Идентификатор_пользователя === userId ? { ...u, Активен: !currentActive } : u));
            showMsg(!currentActive ? 'Пользователь активирован' : 'Пользователь заблокирован', 'success');
        } catch (err) {
            showMsg('Ошибка изменения статуса', 'error');
        }
    };

    const getRoleStyle = (role) => {
        switch (role) {
            case 'admin': return { bg: 'var(--color-pink-light)', color: '#b44d6c', label: 'Администратор' };
            case 'operator': return { bg: 'var(--color-blue-light)', color: '#1e5f8c', label: 'Оператор' };
            case 'viewer': return { bg: 'var(--color-mint-light)', color: '#2d6a4f', label: 'Наблюдатель' };
            default: return { bg: 'var(--color-bg-accent)', color: 'var(--color-text-secondary)', label: role };
        }
    };

    const getInitials = (login) => {
        return login ? login.substring(0, 2).toUpperCase() : '??';
    };

    const avatarColors = [
        'linear-gradient(135deg, #fce4ec, #f3e5f5)',
        'linear-gradient(135deg, #e3f2fd, #e8f5e9)',
        'linear-gradient(135deg, #fff8e1, #fce4ec)',
        'linear-gradient(135deg, #e8f5e9, #e3f2fd)',
        'linear-gradient(135deg, #f3e5f5, #fff8e1)',
    ];

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--color-bg-page)'
            }}>
                <div style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>Загрузка...</div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #fef7f0 0%, #fdf2f8 50%, #fff8e1 100%)' }}>
            {/* Navbar */}
            <nav style={{
                backgroundColor: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                padding: '14px 32px',
                borderBottom: '1px solid rgba(244,165,192,0.15)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => navigate('/dashboard')} className="btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '13px' }}>
                        ← Назад
                    </button>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                        Пользователи
                    </h2>
                </div>
            </nav>

            {/* Toast */}
            {message.text && (
                <div className={`toast toast-${message.type}`}>{message.text}</div>
            )}

            <div style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '6px' }}>
                        Управление пользователями
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        Найдено: {filteredUsers.length} из {users.length}
                    </p>
                </div>

                {/* Фильтры */}
                <div className="card fade-in" style={{
                    marginBottom: '20px', padding: '20px',
                    display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center'
                }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                        Фильтры:
                    </div>
                    <select value={filters.role}
                        onChange={e => setFilters({ ...filters, role: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '160px' }}>
                        <option value="">Все роли</option>
                        <option value="admin">Администратор</option>
                        <option value="operator">Оператор</option>
                        <option value="viewer">Наблюдатель</option>
                    </select>
                    <select value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '160px' }}>
                        <option value="">Все статусы</option>
                        <option value="active">Активен</option>
                        <option value="blocked">Заблокирован</option>
                    </select>
                    <input type="text" placeholder="🔍 Поиск по логину..." value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '180px' }} />
                    {(filters.role || filters.status || filters.search) && (
                        <button onClick={() => setFilters({ role: '', status: '', search: '' })}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                                backgroundColor: 'var(--color-danger-bg)', color: '#c53030',
                                border: 'none', cursor: 'pointer', fontWeight: '600'
                            }}>
                            Сбросить
                        </button>
                    )}
                </div>

                {/* Карточки пользователей */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredUsers.map((user, index) => {
                        const roleStyle = getRoleStyle(user.Роль);
                        return (
                            <div key={user.Идентификатор_пользователя}
                                className="card fade-in"
                                style={{ position: 'relative', overflow: 'hidden' }}>
                                {/* Статус-индикатор */}
                                <div style={{
                                    position: 'absolute', top: '16px', right: '16px',
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    backgroundColor: user.Активен ? 'var(--color-success)' : 'var(--color-danger)',
                                    boxShadow: `0 0 8px ${user.Активен ? 'rgba(165,214,183,0.5)' : 'rgba(244,165,165,0.5)'}`
                                }} />

                                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                    {/* Аватар */}
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '16px',
                                        background: avatarColors[index % avatarColors.length],
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '18px', fontWeight: '700',
                                        color: 'var(--color-text-secondary)',
                                        flexShrink: 0,
                                        border: '2px solid rgba(255,255,255,0.8)'
                                    }}>
                                        {getInitials(user.Логин)}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
                                            {user.Логин}
                                        </h3>
                                        <p style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '6px' }}>
                                            {user.Email}
                                        </p>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 10px', borderRadius: '6px',
                                            backgroundColor: roleStyle.bg,
                                            color: roleStyle.color,
                                            fontSize: '11px', fontWeight: '600'
                                        }}>
                                            {roleStyle.label}
                                        </span>
                                    </div>
                                </div>

                                <div style={{
                                    paddingTop: '14px',
                                    borderTop: '1px solid var(--color-border)',
                                    fontSize: '13px'
                                }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', marginBottom: '10px'
                                    }}>
                                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                                            📅 Регистрация: {user.Дата_регистрации
                                                ? new Date(user.Дата_регистрации).toLocaleDateString('ru-RU')
                                                : 'Н/Д'}
                                        </span>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '6px',
                                            backgroundColor: user.Активен ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                                            color: user.Активен ? '#2d6a4f' : '#c53030',
                                            fontSize: '11px', fontWeight: '600'
                                        }}>
                                            {user.Активен ? '● Активен' : '● Заблокирован'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select value={user.Роль}
                                            onChange={e => handleRoleChange(user.Идентификатор_пользователя, e.target.value)}
                                            style={{
                                                flex: 1, padding: '7px 10px', borderRadius: '8px',
                                                border: `1.5px solid ${roleStyle.bg}`,
                                                fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                            }}>
                                            <option value="admin">Администратор</option>
                                            <option value="operator">Оператор</option>
                                            <option value="viewer">Наблюдатель</option>
                                        </select>
                                        <button
                                            onClick={() => handleActivateToggle(user.Идентификатор_пользователя, user.Активен)}
                                            style={{
                                                padding: '7px 14px', borderRadius: '8px',
                                                border: 'none',
                                                backgroundColor: user.Активен ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                                                color: user.Активен ? '#c53030' : '#2d6a4f',
                                                fontWeight: '600', fontSize: '11px',
                                                cursor: 'pointer', whiteSpace: 'nowrap'
                                            }}>
                                            {user.Активен ? 'Заблокировать' : 'Активировать'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredUsers.length === 0 && (
                    <div style={{
                        textAlign: 'center', padding: '40px',
                        color: 'var(--color-text-secondary)'
                    }}>
                        Пользователи не найдены
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;