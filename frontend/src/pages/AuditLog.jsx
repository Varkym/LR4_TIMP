import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        action: '',
        entity: '',
        user: '',
        search: ''
    });

    const [editForm, setEditForm] = useState({
        Действие: '',
        Сущность: '',
        Старые_данные: '',
        Новые_данные: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!token || !userData || userData.role !== 'admin') {
            navigate('/dashboard');
            return;
        }
        loadLogs();
    }, [navigate]);

    useEffect(() => {
        applyFilters();
    }, [logs, filters]);

    const showMsg = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const loadLogs = async () => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            const response = await axios.get(`\${API}/api/audit`, config);
            setLogs(response.data);
        } catch (err) {
            console.error('Ошибка загрузки журнала:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...logs];
        if (filters.action) result = result.filter(l => l.Действие === filters.action);
        if (filters.entity) result = result.filter(l => l.Сущность === filters.entity);
        if (filters.user) result = result.filter(l => l.Пользователь === filters.user);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(l =>
                (l.Действие || '').toLowerCase().includes(q) ||
                (l.Сущность || '').toLowerCase().includes(q) ||
                (l.Пользователь || '').toLowerCase().includes(q)
            );
        }
        setFilteredLogs(result);
        setCurrentPage(1);
    };

    const openEdit = (log) => {
        setSelectedLog(log);
        setEditForm({
            Действие: log.Действие || '',
            Сущность: log.Сущность || '',
            Старые_данные: typeof log.Старые_данные === 'object' ? JSON.stringify(log.Старые_данные, null, 2) : (log.Старые_данные || ''),
            Новые_данные: typeof log.Новые_данные === 'object' ? JSON.stringify(log.Новые_данные, null, 2) : (log.Новые_данные || '')
        });
        setShowEditModal(true);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            let parsedOld, parsedNew;
            try { parsedOld = JSON.parse(editForm.Старые_данные); } catch { parsedOld = editForm.Старые_данные; }
            try { parsedNew = JSON.parse(editForm.Новые_данные); } catch { parsedNew = editForm.Новые_данные; }

            await axios.put(`\${API}/api/audit/${selectedLog.Идентификатор_лога}`, {
                Действие: editForm.Действие,
                Сущность: editForm.Сущность,
                Старые_данные: parsedOld,
                Новые_данные: parsedNew
            }, config);

            showMsg('Запись обновлена!', 'success');
            setShowEditModal(false);
            loadLogs();
        } catch (err) {
            showMsg('Ошибка обновления', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить эту запись аудита?')) return;
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            await axios.delete(`\${API}/api/audit/${id}`, config);
            showMsg('Запись удалена', 'success');
            loadLogs();
        } catch (err) {
            showMsg('Ошибка удаления', 'error');
        }
    };

    const formatData = (data) => {
        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) return '-';
        if (typeof data === 'string') return data;
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return String(data);
        }
    };

    const getActionStyle = (action) => {
        if (!action) return { bg: 'var(--color-bg-accent)', color: 'var(--color-text-secondary)' };
        const a = action.toLowerCase();
        if (a.includes('создан') || a.includes('добавл') || a.includes('insert') || a.includes('create'))
            return { bg: 'var(--color-success-bg)', color: '#2d6a4f' };
        if (a.includes('обновл') || a.includes('изменен') || a.includes('update') || a.includes('edit'))
            return { bg: 'var(--color-warning-bg)', color: '#b45309' };
        if (a.includes('удал') || a.includes('delete') || a.includes('блокир'))
            return { bg: 'var(--color-danger-bg)', color: '#c53030' };
        return { bg: 'var(--color-blue-light)', color: '#1e5f8c' };
    };

    const actions = [...new Set(logs.map(l => l.Действие).filter(Boolean))];
    const entities = [...new Set(logs.map(l => l.Сущность).filter(Boolean))];
    const usersList = [...new Set(logs.map(l => l.Пользователь).filter(Boolean))];

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
        <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #fef7f0 0%, #e3f2fd 50%, #f3e5f5 100%)' }}>
            {/* Navbar */}
            <nav style={{
                backgroundColor: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                padding: '14px 32px',
                borderBottom: '1px solid rgba(165,200,225,0.2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => navigate('/dashboard')} className="btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '13px' }}>
                        ← Назад
                    </button>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                        Журнал аудита
                    </h2>
                </div>
            </nav>

            {/* Toast */}
            {message.text && (
                <div className={`toast toast-${message.type}`}>{message.text}</div>
            )}

            <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '6px' }}>
                        Журнал аудита
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        Найдено: {filteredLogs.length} из {logs.length}
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
                    <select value={filters.action}
                        onChange={e => setFilters({ ...filters, action: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '150px' }}>
                        <option value="">Все действия</option>
                        {actions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select value={filters.entity}
                        onChange={e => setFilters({ ...filters, entity: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '150px' }}>
                        <option value="">Все сущности</option>
                        {entities.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select value={filters.user}
                        onChange={e => setFilters({ ...filters, user: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '150px' }}>
                        <option value="">Все пользователи</option>
                        {usersList.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input type="text" placeholder="🔍 Поиск..." value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '160px' }} />
                    {(filters.action || filters.entity || filters.user || filters.search) && (
                        <button onClick={() => setFilters({ action: '', entity: '', user: '', search: '' })}
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
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Пользователь</th>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Действие</th>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Сущность</th>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Старые данные</th>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Новые данные</th>
                                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.map(log => {
                                const as = getActionStyle(log.Действие);
                                return (
                                    <tr key={log.Идентификатор_лога}
                                        style={{
                                            borderBottom: '1px solid var(--color-border)',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-accent)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-blue)' }}>
                                            #{log.Идентификатор_лога}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                                            {new Date(log.Дата_времени).toLocaleString('ru-RU')}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                                            {log.Пользователь || '-'}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '6px',
                                                backgroundColor: as.bg, color: as.color,
                                                fontSize: '12px', fontWeight: '600'
                                            }}>
                                                {log.Действие}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                                            {log.Сущность || '-'}
                                        </td>
                                        <td style={{ padding: '12px 16px', maxWidth: '180px' }}>
                                            <div style={{
                                                overflow: 'hidden', textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap', fontSize: '11px',
                                                color: 'var(--color-text-light)',
                                                backgroundColor: 'var(--color-bg-accent)',
                                                padding: '4px 8px', borderRadius: '6px'
                                            }}>
                                                {formatData(log.Старые_данные)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', maxWidth: '180px' }}>
                                            <div style={{
                                                overflow: 'hidden', textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap', fontSize: '11px',
                                                color: 'var(--color-text-light)',
                                                backgroundColor: 'var(--color-bg-accent)',
                                                padding: '4px 8px', borderRadius: '6px'
                                            }}>
                                                {formatData(log.Новые_данные)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => openEdit(log)}
                                                    style={{
                                                        padding: '5px 10px', borderRadius: '6px',
                                                        backgroundColor: 'var(--color-blue-light)',
                                                        color: '#1e5f8c', border: 'none',
                                                        fontSize: '11px', fontWeight: '600', cursor: 'pointer'
                                                    }}>
                                                    ✏️
                                                </button>
                                                <button onClick={() => handleDelete(log.Идентификатор_лога)}
                                                    style={{
                                                        padding: '5px 10px', borderRadius: '6px',
                                                        backgroundColor: 'var(--color-danger-bg)',
                                                        color: '#c53030', border: 'none',
                                                        fontSize: '11px', fontWeight: '600', cursor: 'pointer'
                                                    }}>
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredLogs.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                            Записи не найдены
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
                                }}>←</button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button key={i + 1} onClick={() => setCurrentPage(i + 1)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '8px',
                                        border: currentPage === i + 1 ? '1px solid var(--color-blue)' : '1px solid var(--color-border)',
                                        backgroundColor: currentPage === i + 1 ? 'var(--color-blue-light)' : 'white',
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
                                }}>→</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно редактирования */}
            {showEditModal && selectedLog && (
                <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
                    <div style={modalContent}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                            Редактирование записи #{selectedLog.Идентификатор_лога}
                        </h2>
                        <form onSubmit={handleEdit}>
                            <label style={{ display: 'block', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
                                Действие
                                <input type="text" value={editForm.Действие}
                                    onChange={e => setEditForm({ ...editForm, Действие: e.target.value })}
                                    style={{ width: '100%', fontSize: '14px', marginTop: '6px' }} />
                            </label>
                            <label style={{ display: 'block', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
                                Сущность
                                <input type="text" value={editForm.Сущность}
                                    onChange={e => setEditForm({ ...editForm, Сущность: e.target.value })}
                                    style={{ width: '100%', fontSize: '14px', marginTop: '6px' }} />
                            </label>
                            <label style={{ display: 'block', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
                                Старые данные (JSON)
                                <textarea value={editForm.Старые_данные}
                                    onChange={e => setEditForm({ ...editForm, Старые_данные: e.target.value })}
                                    rows={4} style={{
                                        width: '100%', fontSize: '12px', marginTop: '6px',
                                        fontFamily: 'monospace', resize: 'vertical'
                                    }} />
                            </label>
                            <label style={{ display: 'block', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
                                Новые данные (JSON)
                                <textarea value={editForm.Новые_данные}
                                    onChange={e => setEditForm({ ...editForm, Новые_данные: e.target.value })}
                                    rows={4} style={{
                                        width: '100%', fontSize: '12px', marginTop: '6px',
                                        fontFamily: 'monospace', resize: 'vertical'
                                    }} />
                            </label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>
                                    Сохранить
                                </button>
                                <button type="button" className="btn-secondary"
                                    onClick={() => setShowEditModal(false)}
                                    style={{ flex: 1, padding: '12px' }}>
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLog;
