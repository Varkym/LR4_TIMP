import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const [filters, setFilters] = useState({
        department: '',
        position: '',
        search: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }
        loadEmployees();
    }, [navigate]);

    useEffect(() => {
        applyFilters();
    }, [employees, filters]);

    const showMsg = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const loadEmployees = async () => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            const response = await axios.get(`${API}/api/employees`, config);
            setEmployees(response.data);
        } catch (err) {
            console.error('Ошибка загрузки сотрудников:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...employees];
        if (filters.department) result = result.filter(e => e.Подразделение === filters.department);
        if (filters.position) result = result.filter(e => e.Должность === filters.position);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(e =>
                `${e.Фамилия} ${e.Имя} ${e.Отчество || ''}`.toLowerCase().includes(q)
            );
        }
        setFilteredEmployees(result);
    };

    const handlePhotoUpload = async (employeeId, file) => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('photo', file);

        try {
            await axios.post(
                `${API}/api/employees/${employeeId}/photo`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            showMsg('Фото загружено!', 'success');
            loadEmployees();
        } catch (err) {
            showMsg('Ошибка загрузки фото', 'error');
        }
    };

    const departments = [...new Set(employees.map(e => e.Подразделение).filter(Boolean))];
    const positions = [...new Set(employees.map(e => e.Должность).filter(Boolean))];

    // Пастельные градиенты для карточек
    const cardGradients = [
        'linear-gradient(135deg, #fce4ec, #f3e5f5)',
        'linear-gradient(135deg, #e3f2fd, #e8f5e9)',
        'linear-gradient(135deg, #fff8e1, #fce4ec)',
        'linear-gradient(135deg, #e8f5e9, #e3f2fd)',
        'linear-gradient(135deg, #f3e5f5, #fff8e1)',
        'linear-gradient(135deg, #fce4ec, #e3f2fd)',
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
        <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #fef7f0 0%, #f3e5f5 50%, #e3f2fd 100%)' }}>
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
                        Сотрудники
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
                        Список сотрудников
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        Найдено: {filteredEmployees.length} из {employees.length}
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
                    <select value={filters.department}
                        onChange={e => setFilters({ ...filters, department: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '160px' }}>
                        <option value="">Все подразделения</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={filters.position}
                        onChange={e => setFilters({ ...filters, position: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '160px' }}>
                        <option value="">Все должности</option>
                        {positions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input type="text" placeholder="🔍 Поиск по ФИО..." value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', minWidth: '180px' }} />
                    {(filters.department || filters.position || filters.search) && (
                        <button onClick={() => setFilters({ department: '', position: '', search: '' })}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                                backgroundColor: 'var(--color-danger-bg)', color: '#c53030',
                                border: 'none', cursor: 'pointer', fontWeight: '600'
                            }}>
                            Сбросить
                        </button>
                    )}
                </div>

                {/* Карточки сотрудников */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredEmployees.map((employee, index) => (
                        <div key={employee.Идентификатор_сотрудника}
                            className="card fade-in"
                            style={{
                                borderTop: `4px solid`,
                                borderImage: cardGradients[index % cardGradients.length],
                                borderImageSlice: 1,
                                overflow: 'hidden'
                            }}>
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                {/* Фото или инициалы */}
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    {employee.Фото_путь ? (
                                        <img
                                            src={`http://localhost:3000${employee.Фото_путь}`}
                                            alt={`${employee.Фамилия} ${employee.Имя}`}
                                            style={{
                                                width: '80px', height: '80px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '3px solid var(--color-pink-light)',
                                                boxShadow: '0 4px 12px rgba(244,165,192,0.2)'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '80px', height: '80px',
                                            borderRadius: '50%',
                                            background: cardGradients[index % cardGradients.length],
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '28px', fontWeight: '700',
                                            color: 'var(--color-text-secondary)',
                                            border: '3px solid rgba(255,255,255,0.8)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                                        }}>
                                            {employee.Фамилия[0]}{employee.Имя[0]}
                                        </div>
                                    )}

                                    {/* Кнопка загрузки фото (admin) */}
                                    {user && user.role === 'admin' && (
                                        <label style={{
                                            position: 'absolute', bottom: '-2px', right: '-2px',
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            backgroundColor: 'var(--color-pink)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', fontSize: '13px',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                            border: '2px solid white'
                                        }}>
                                            📷
                                            <input type="file" accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={e => {
                                                    if (e.target.files[0]) {
                                                        handlePhotoUpload(employee.Идентификатор_сотрудника, e.target.files[0]);
                                                    }
                                                }} />
                                        </label>
                                    )}
                                </div>

                                <h3 style={{
                                    fontSize: '16px', fontWeight: '600',
                                    marginTop: '12px', marginBottom: '2px'
                                }}>
                                    {employee.Фамилия} {employee.Имя}
                                </h3>
                                {employee.Отчество && (
                                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                        {employee.Отчество}
                                    </p>
                                )}
                            </div>

                            <div style={{
                                paddingTop: '14px',
                                borderTop: '1px solid var(--color-border)',
                                fontSize: '13px'
                            }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{
                                        display: 'inline-block', padding: '3px 10px',
                                        borderRadius: '6px', backgroundColor: 'var(--color-lavender-light)',
                                        fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)'
                                    }}>
                                        {employee.Должность}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    marginBottom: '6px', color: 'var(--color-text-secondary)'
                                }}>
                                    <span style={{ fontSize: '12px' }}>🏢</span>
                                    <span>{employee.Подразделение}</span>
                                </div>
                                {employee.Email && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        marginBottom: '6px', color: 'var(--color-text-secondary)', fontSize: '12px'
                                    }}>
                                        <span>✉️</span>
                                        <span>{employee.Email}</span>
                                    </div>
                                )}
                                {employee.Телефон && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        color: 'var(--color-text-secondary)', fontSize: '12px'
                                    }}>
                                        <span>📞</span>
                                        <span>{employee.Телефон}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredEmployees.length === 0 && (
                    <div style={{
                        textAlign: 'center', padding: '60px',
                        color: 'var(--color-text-secondary)'
                    }}>
                        Сотрудники не найдены
                    </div>
                )}
            </div>
        </div>
    );
};

export default Employees;