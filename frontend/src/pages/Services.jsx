import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Services = () => {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        status: '',
        type: '',
        search: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }
        loadServices();
    }, [navigate]);

    useEffect(() => {
        applyFilters();
    }, [services, filters]);

    const loadServices = async () => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            const response = await axios.get('http://localhost:3000/api/services', config);
            setServices(response.data);
        } catch (err) {
            console.error('Ошибка загрузки услуг:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...services];
        if (filters.status) result = result.filter(s => s.Статус === filters.status);
        if (filters.type) result = result.filter(s => s.Тип_услуги === filters.type);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(s =>
                (s.Название_услуги || '').toLowerCase().includes(q)
            );
        }
        setFilteredServices(result);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Активен': return { bg: 'var(--color-success-bg)', color: '#2d6a4f', border: 'var(--color-success)' };
            case 'Неактивен': return { bg: 'var(--color-danger-bg)', color: '#c53030', border: 'var(--color-danger)' };
            case 'На обслуживании': return { bg: 'var(--color-warning-bg)', color: '#b45309', border: 'var(--color-warning)' };
            default: return { bg: 'var(--color-bg-accent)', color: 'var(--color-text-secondary)', border: 'var(--color-border)' };
        }
    };

    const serviceIcons = {
        'Мониторинг': '📊',
        'Защита': '🛡️',
        'Аналитика': '📈',
        'Обслуживание': '🔧',
        'default': '⚙️'
    };

    const getServiceIcon = (type) => serviceIcons[type] || serviceIcons.default;

    const types = [...new Set(services.map(s => s.Тип_услуги).filter(Boolean))];

    const pastelBgs = [
        'var(--color-pink-light)',
        'var(--color-blue-light)',
        'var(--color-mint-light)',
        'var(--color-peach-light)',
        'var(--color-yellow-light)',
        'var(--color-lavender-light)',
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
        <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #fef7f0 0%, #e8f5e9 50%, #e3f2fd 100%)' }}>
            {/* Navbar */}
            <nav style={{
                backgroundColor: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                padding: '14px 32px',
                borderBottom: '1px solid rgba(165,214,183,0.2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => navigate('/dashboard')} className="btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '13px' }}>
                        ← Назад
                    </button>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                        Услуги
                    </h2>
                </div>
            </nav>

            <div style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '6px' }}>
                        Доступные услуги
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        Найдено: {filteredServices.length} из {services.length}
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
                    <select value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '160px' }}>
                        <option value="">Все статусы</option>
                        <option value="Активен">Активен</option>
                        <option value="Неактивен">Неактивен</option>
                        <option value="На обслуживании">На обслуживании</option>
                    </select>
                    <select value={filters.type}
                        onChange={e => setFilters({ ...filters, type: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '160px' }}>
                        <option value="">Все типы</option>
                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="text" placeholder="🔍 Поиск по названию..." value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '180px' }} />
                    {(filters.status || filters.type || filters.search) && (
                        <button onClick={() => setFilters({ status: '', type: '', search: '' })}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                                backgroundColor: 'var(--color-danger-bg)', color: '#c53030',
                                border: 'none', cursor: 'pointer', fontWeight: '600'
                            }}>
                            Сбросить
                        </button>
                    )}
                </div>

                {/* Карточки услуг */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredServices.map((service, index) => {
                        const st = getStatusStyle(service.Статус);
                        return (
                            <div key={service.Идентификатор_услуги}
                                className="card fade-in"
                                style={{ cursor: 'default', position: 'relative', overflow: 'hidden' }}>
                                {/* Декоративная полоска сверху */}
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0,
                                    height: '4px',
                                    background: `linear-gradient(90deg, var(--color-pink), var(--color-blue), var(--color-mint))`
                                }} />

                                <div style={{ marginBottom: '14px', paddingTop: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <div style={{
                                            width: '42px', height: '42px', borderRadius: '12px',
                                            backgroundColor: pastelBgs[index % pastelBgs.length],
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '20px'
                                        }}>
                                            {getServiceIcon(service.Тип_услуги)}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>
                                                {service.Название_услуги}
                                            </h3>
                                            <p style={{ color: 'var(--color-text-light)', fontSize: '12px' }}>
                                                {service.Тип_услуги}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    paddingTop: '14px', borderTop: '1px solid var(--color-border)'
                                }}>
                                    <span style={{
                                        padding: '4px 12px', borderRadius: '8px',
                                        backgroundColor: st.bg, color: st.color,
                                        fontWeight: '600', fontSize: '12px',
                                        borderLeft: `3px solid ${st.border}`
                                    }}>
                                        {service.Статус}
                                    </span>
                                    <span style={{
                                        fontSize: '11px', color: 'var(--color-text-light)',
                                        backgroundColor: 'var(--color-bg-accent)',
                                        padding: '3px 8px', borderRadius: '6px'
                                    }}>
                                        ID: {service.Идентификатор_услуги}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredServices.length === 0 && (
                    <div style={{
                        textAlign: 'center', padding: '60px',
                        color: 'var(--color-text-secondary)'
                    }}>
                        Услуги не найдены
                    </div>
                )}
            </div>
        </div>
    );
};

export default Services;