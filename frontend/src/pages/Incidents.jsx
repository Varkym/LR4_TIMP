import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Incidents = () => {
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [services, setServices] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [confirmDelete, setConfirmDelete] = useState(null); // id инцидента для удаления
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Фильтры
    const [filters, setFilters] = useState({
        status: '',
        severity: '',
        type: '',
        search: ''
    });

    // Форма
    const [formData, setFormData] = useState({
        Тип_инцидента: '',
        Описание: '',
        Уровень_угрозы: 3,
        Статус: 'Новый',
        Идентификатор_услуги: '',
        Идентификатор_сотрудника: ''
    });

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const canEdit = user && (user.role === 'admin' || user.role === 'operator');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }
        loadData();
    }, [navigate]);

    useEffect(() => {
        applyFilters();
    }, [incidents, filters]);

    const showMsg = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const loadData = async () => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            const [incRes, srvRes, empRes] = await Promise.all([
                axios.get(`${API}/api/incidents`, config),
                axios.get(`${API}/api/services`, config),
                axios.get(`${API}/api/employees`, config)
            ]);
            setIncidents(incRes.data);
            setServices(srvRes.data);
            setEmployees(empRes.data);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...incidents];
        if (filters.status) result = result.filter(i => i.Статус === filters.status);
        if (filters.severity) result = result.filter(i => i.Уровень_угрозы === parseInt(filters.severity));
        if (filters.type) result = result.filter(i => i.Тип_инцидента === filters.type);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(i =>
                (i.Описание || '').toLowerCase().includes(q) ||
                (i.Тип_инцидента || '').toLowerCase().includes(q)
            );
        }
        setFilteredIncidents(result);
        setCurrentPage(1);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            await axios.post(`${API}/api/incidents`, formData, config);
            showMsg('Инцидент создан!', 'success');
            setShowCreateModal(false);
            resetForm();
            loadData();
        } catch (err) {
            showMsg(err.response?.data?.error || 'Ошибка создания', 'error');
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            await axios.put(`${API}/api/incidents/${selectedIncident.Идентификатор_инцидента}`, formData, config);
            showMsg('Инцидент обновлён!', 'success');
            setShowEditModal(false);
            loadData();
        } catch (err) {
            showMsg(err.response?.data?.error || 'Ошибка обновления', 'error');
        }
    };

    const handleDelete = (id) => {
        setConfirmDelete(id); // Показываем кастомный модал
    };

    const confirmDeleteAction = async () => {
        const id = confirmDelete;
        setConfirmDelete(null);
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.delete(`${API}/api/incidents/${id}`, config);
            showMsg('Инцидент удалён', 'success');
            loadData();
        } catch (err) {
            showMsg('Ошибка удаления', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            Тип_инцидента: '', Описание: '', Уровень_угрозы: 3,
            Статус: 'Новый', Идентификатор_услуги: '', Идентификатор_сотрудника: ''
        });
    };

    const openEdit = (incident) => {
        setSelectedIncident(incident);
        setFormData({
            Тип_инцидента: incident.Тип_инцидента || '',
            Описание: incident.Описание || '',
            Уровень_угрозы: incident.Уровень_угрозы || 3,
            Статус: incident.Статус || 'Новый',
            Идентификатор_услуги: incident.Идентификатор_услуги || '',
            Идентификатор_сотрудника: incident.Идентификатор_сотрудника || ''
        });
        setShowEditModal(true);
    };

    const openDetail = (incident) => {
        setSelectedIncident(incident);
        setShowDetailModal(true);
    };

    const getSeverityColor = (level) => {
        if (level >= 4) return { bg: 'var(--color-danger-bg)', text: '#c53030', border: 'var(--color-danger)' };
        if (level === 3) return { bg: 'var(--color-warning-bg)', text: '#b45309', border: 'var(--color-warning)' };
        return { bg: 'var(--color-success-bg)', text: '#2d6a4f', border: 'var(--color-success)' };
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Новый': return { bg: 'var(--color-blue-light)', text: '#1e5f8c' };
            case 'В работе': return { bg: 'var(--color-warning-bg)', text: '#b45309' };
            case 'Закрыт': return { bg: 'var(--color-success-bg)', text: '#2d6a4f' };
            default: return { bg: 'var(--color-bg-accent)', text: 'var(--color-text-secondary)' };
        }
    };

    const incidentTypes = [...new Set(incidents.map(i => i.Тип_инцидента).filter(Boolean))];

    // Пагинация
    const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
    const paginatedIncidents = filteredIncidents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Стили
    const modalOverlay = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px'
    };

    const modalContent = {
        backgroundColor: 'white', borderRadius: '20px',
        padding: '32px', width: '100%', maxWidth: '560px',
        maxHeight: '85vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        animation: 'fadeIn 0.3s ease-out'
    };

    const inputStyle = { width: '100%', fontSize: '14px', marginTop: '6px' };
    const labelStyle = {
        display: 'block', marginBottom: '16px', fontSize: '13px',
        fontWeight: '600', color: 'var(--color-text-primary)'
    };

    const IncidentForm = ({ onSubmit, title }) => (
        <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) { setShowCreateModal(false); setShowEditModal(false); } }}>
            <div style={modalContent}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>{title}</h2>
                <form onSubmit={onSubmit}>
                    <label style={labelStyle}>
                        Тип инцидента
                        <select value={formData.Тип_инцидента}
                            onChange={e => setFormData({ ...formData, Тип_инцидента: e.target.value })}
                            required style={inputStyle}>
                            <option value="">Выберите тип</option>
                            <option value="Утечка данных">Утечка данных</option>
                            <option value="DDoS-атака">DDoS-атака</option>
                            <option value="Фишинг">Фишинг</option>
                            <option value="Вредоносное ПО">Вредоносное ПО</option>
                            <option value="Несанкционированный доступ">Несанкционированный доступ</option>
                            <option value="Другое">Другое</option>
                        </select>
                    </label>

                    <label style={labelStyle}>
                        Описание
                        <textarea value={formData.Описание}
                            onChange={e => setFormData({ ...formData, Описание: e.target.value })}
                            required rows={3}
                            placeholder="Опишите инцидент..."
                            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} />
                    </label>

                    <label style={labelStyle}>
                        Уровень угрозы: {formData.Уровень_угрозы}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            {[1, 2, 3, 4, 5].map(level => {
                                const sc = getSeverityColor(level);
                                return (
                                    <button type="button" key={level}
                                        onClick={() => setFormData({ ...formData, Уровень_угрозы: level })}
                                        style={{
                                            width: '44px', height: '44px', borderRadius: '12px',
                                            border: formData.Уровень_угрозы === level ? `2px solid ${sc.border}` : '2px solid var(--color-border)',
                                            backgroundColor: formData.Уровень_угрозы === level ? sc.bg : 'white',
                                            color: sc.text, fontWeight: '700', fontSize: '16px',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}>
                                        {level}
                                    </button>
                                );
                            })}
                        </div>
                    </label>

                    <label style={labelStyle}>
                        Статус
                        <select value={formData.Статус}
                            onChange={e => setFormData({ ...formData, Статус: e.target.value })}
                            style={inputStyle}>
                            <option value="Новый">Новый</option>
                            <option value="В работе">В работе</option>
                            <option value="Закрыт">Закрыт</option>
                        </select>
                    </label>

                    <label style={labelStyle}>
                        Услуга
                        <select value={formData.Идентификатор_услуги}
                            onChange={e => setFormData({ ...formData, Идентификатор_услуги: e.target.value })}
                            style={inputStyle}>
                            <option value="">Не выбрана</option>
                            {services.map(s => (
                                <option key={s.Идентификатор_услуги} value={s.Идентификатор_услуги}>
                                    {s.Название_услуги}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label style={labelStyle}>
                        Ответственный сотрудник
                        <select value={formData.Идентификатор_сотрудника}
                            onChange={e => setFormData({ ...formData, Идентификатор_сотрудника: e.target.value })}
                            style={inputStyle}>
                            <option value="">Не выбран</option>
                            {employees.map(e => (
                                <option key={e.Идентификатор_сотрудника} value={e.Идентификатор_сотрудника}>
                                    {e.Фамилия} {e.Имя}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>
                            {showEditModal ? 'Сохранить' : 'Создать'}
                        </button>
                        <button type="button" className="btn-secondary"
                            onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                            style={{ flex: 1, padding: '12px' }}>
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

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
        <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #fef7f0 0%, #fdf2f8 50%, #f0f4ff 100%)' }}>

            {/* Модал подтверждения удаления */}
            {confirmDelete && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '20px', padding: '32px',
                        maxWidth: '380px', width: '90%', textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(244,165,192,0.3)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗑️</div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#333' }}>
                            Удалить инцидент?
                        </h3>
                        <p style={{ margin: '0 0 24px', color: '#888', fontSize: '14px' }}>
                            Это действие нельзя отменить
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={() => setConfirmDelete(null)} style={{
                                padding: '10px 24px', borderRadius: '10px', border: '2px solid #e0e0e0',
                                background: '#fff', color: '#555', fontSize: '14px', fontWeight: '600',
                                cursor: 'pointer'
                            }}>Отмена</button>
                            <button onClick={confirmDeleteAction} style={{
                                padding: '10px 24px', borderRadius: '10px', border: 'none',
                                background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                                color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                            }}>Удалить</button>
                        </div>
                    </div>
                </div>
            )}

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
                        Инциденты безопасности
                    </h2>
                </div>
                {canEdit && (
                    <button className="btn-primary"
                        onClick={() => { resetForm(); setShowCreateModal(true); }}
                        style={{ padding: '10px 20px', fontSize: '13px' }}>
                        + Добавить инцидент
                    </button>
                )}
            </nav>

            {/* Toast */}
            {message.text && (
                <div className={`toast toast-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '6px' }}>
                        Все инциденты
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        Найдено: {filteredIncidents.length} из {incidents.length}
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
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '140px' }}>
                        <option value="">Все статусы</option>
                        <option value="Новый">Новый</option>
                        <option value="В работе">В работе</option>
                        <option value="Закрыт">Закрыт</option>
                    </select>
                    <select value={filters.severity}
                        onChange={e => setFilters({ ...filters, severity: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '150px' }}>
                        <option value="">Все уровни</option>
                        {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>Уровень {l}</option>)}
                    </select>
                    <select value={filters.type}
                        onChange={e => setFilters({ ...filters, type: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '160px' }}>
                        <option value="">Все типы</option>
                        {incidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="text" placeholder="🔍 Поиск..." value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '180px' }} />
                    {(filters.status || filters.severity || filters.type || filters.search) && (
                        <button onClick={() => setFilters({ status: '', severity: '', type: '', search: '' })}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                                backgroundColor: 'var(--color-danger-bg)', color: '#c53030',
                                border: 'none', cursor: 'pointer', fontWeight: '600'
                            }}>
                            Сбросить
                        </button>
                    )}
                </div>

                {/* Таблица */}
                <div className="card fade-in" style={{ overflow: 'auto', padding: '0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{
                                borderBottom: '2px solid var(--color-border)',
                                textAlign: 'left',
                                backgroundColor: 'var(--color-bg-accent)'
                            }}>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>ID</th>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Дата</th>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Тип</th>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Угроза</th>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Статус</th>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Услуга</th>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Сотрудник</th>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Описание</th>
                                {canEdit && <th style={{ padding: '14px 16px', fontWeight: '600' }}>Действия</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedIncidents.map((inc) => {
                                const sc = getSeverityColor(inc.Уровень_угрозы);
                                const stc = getStatusColor(inc.Статус);
                                return (
                                    <tr key={inc.Идентификатор_инцидента}
                                        style={{
                                            borderBottom: '1px solid var(--color-border)',
                                            transition: 'background-color 0.2s', cursor: 'pointer'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-accent)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        onClick={() => openDetail(inc)}
                                    >
                                        <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-pink)' }}>
                                            #{inc.Идентификатор_инцидента}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                                            {new Date(inc.Дата_и_время_инцидента).toLocaleString('ru-RU')}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>{inc.Тип_инцидента}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '8px',
                                                backgroundColor: sc.bg, color: sc.text,
                                                fontWeight: '600', fontSize: '12px'
                                            }}>
                                                {inc.Уровень_угрозы}/5
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '8px',
                                                backgroundColor: stc.bg, color: stc.text,
                                                fontWeight: '600', fontSize: '12px'
                                            }}>
                                                {inc.Статус}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '12px' }}>{inc.Услуга || '-'}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '12px' }}>{inc.Сотрудник || '-'}</td>
                                        <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>
                                                {inc.Описание}
                                            </div>
                                        </td>
                                        {canEdit && (
                                            <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => openEdit(inc)}
                                                        style={{
                                                            padding: '5px 10px', borderRadius: '6px',
                                                            backgroundColor: 'var(--color-blue-light)',
                                                            color: '#1e5f8c', border: 'none',
                                                            fontSize: '11px', fontWeight: '600', cursor: 'pointer'
                                                        }}>
                                                        ✏️
                                                    </button>
                                                    {user.role === 'admin' && (
                                                        <button onClick={() => handleDelete(inc.Идентификатор_инцидента)}
                                                            style={{
                                                                padding: '5px 10px', borderRadius: '6px',
                                                                backgroundColor: 'var(--color-danger-bg)',
                                                                color: '#c53030', border: 'none',
                                                                fontSize: '11px', fontWeight: '600', cursor: 'pointer'
                                                            }}>
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredIncidents.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                            Инциденты не найдены
                        </div>
                    )}

                    {/* Пагинация */}
                    {totalPages > 1 && (
                        <div style={{
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            gap: '8px', padding: '16px', borderTop: '1px solid var(--color-border)'
                        }}>
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '6px 12px', borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'white', cursor: currentPage === 1 ? 'default' : 'pointer',
                                    opacity: currentPage === 1 ? 0.5 : 1, fontSize: '13px'
                                }}>
                                ←
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button key={i + 1} onClick={() => setCurrentPage(i + 1)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '8px',
                                        border: currentPage === i + 1 ? '1px solid var(--color-pink)' : '1px solid var(--color-border)',
                                        backgroundColor: currentPage === i + 1 ? 'var(--color-pink-light)' : 'white',
                                        fontWeight: currentPage === i + 1 ? '700' : '400',
                                        cursor: 'pointer', fontSize: '13px'
                                    }}>
                                    {i + 1}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '6px 12px', borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'white', cursor: currentPage === totalPages ? 'default' : 'pointer',
                                    opacity: currentPage === totalPages ? 0.5 : 1, fontSize: '13px'
                                }}>
                                →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Модальные окна */}
            {showCreateModal && <IncidentForm onSubmit={handleCreate} title="Новый инцидент" />}
            {showEditModal && <IncidentForm onSubmit={handleEdit} title="Редактирование инцидента" />}

            {/* Детали инцидента */}
            {showDetailModal && selectedIncident && (
                <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowDetailModal(false); }}>
                    <div style={{ ...modalContent, maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>
                                Инцидент #{selectedIncident.Идентификатор_инцидента}
                            </h2>
                            <button onClick={() => setShowDetailModal(false)}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    border: 'none', backgroundColor: 'var(--color-bg-accent)',
                                    cursor: 'pointer', fontSize: '16px'
                                }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {[
                                { label: 'Тип', value: selectedIncident.Тип_инцидента },
                                { label: 'Дата', value: new Date(selectedIncident.Дата_и_время_инцидента).toLocaleString('ru-RU') },
                                { label: 'Услуга', value: selectedIncident.Услуга || '-' },
                                { label: 'Сотрудник', value: selectedIncident.Сотрудник || '-' },
                            ].map(({ label, value }) => (
                                <div key={label} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    padding: '10px 14px', borderRadius: '10px',
                                    backgroundColor: 'var(--color-bg-accent)', fontSize: '14px'
                                }}>
                                    <span style={{ fontWeight: '600', color: 'var(--color-text-secondary)' }}>{label}</span>
                                    <span>{value}</span>
                                </div>
                            ))}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: '10px 14px', borderRadius: '10px',
                                backgroundColor: 'var(--color-bg-accent)', fontSize: '14px'
                            }}>
                                <span style={{ fontWeight: '600', color: 'var(--color-text-secondary)' }}>Уровень угрозы</span>
                                <span style={{
                                    padding: '2px 10px', borderRadius: '6px',
                                    backgroundColor: getSeverityColor(selectedIncident.Уровень_угрозы).bg,
                                    color: getSeverityColor(selectedIncident.Уровень_угрозы).text,
                                    fontWeight: '600', fontSize: '13px'
                                }}>
                                    {selectedIncident.Уровень_угрозы}/5
                                </span>
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: '10px 14px', borderRadius: '10px',
                                backgroundColor: 'var(--color-bg-accent)', fontSize: '14px'
                            }}>
                                <span style={{ fontWeight: '600', color: 'var(--color-text-secondary)' }}>Статус</span>
                                <span style={{
                                    padding: '2px 10px', borderRadius: '6px',
                                    backgroundColor: getStatusColor(selectedIncident.Статус).bg,
                                    color: getStatusColor(selectedIncident.Статус).text,
                                    fontWeight: '600', fontSize: '13px'
                                }}>
                                    {selectedIncident.Статус}
                                </span>
                            </div>
                            <div style={{
                                padding: '14px', borderRadius: '10px',
                                backgroundColor: 'var(--color-bg-accent)', fontSize: '14px'
                            }}>
                                <div style={{ fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Описание</div>
                                <div style={{ lineHeight: '1.6' }}>{selectedIncident.Описание}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Incidents;