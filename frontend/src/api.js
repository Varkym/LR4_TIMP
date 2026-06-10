/**
 * api.js — настроенный axios-клиент с автоматическим refresh-токеном
 *
 * Как работает:
 * 1. Каждый запрос автоматически получает Authorization: Bearer <token>
 * 2. Если сервер вернул 401 (токен истёк):
 *    a. Автоматически вызывает POST /api/auth/refresh
 *    b. Сохраняет новые токены в localStorage
 *    c. Повторяет исходный запрос с новым токеном
 * 3. Если refresh тоже провалился — выбрасывает на страницу входа
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Создаём отдельный экземпляр axios (не трогаем глобальный)
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Добавляет токен к каждому запросу автоматически
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// При 401 — пробуем обновить токен
let isRefreshing = false;
let failedQueue = []; // очередь запросов, ожидающих обновления токена

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    // Успешный ответ — возвращаем как есть
    (response) => response,

    // Ошибка — проверяем на 401
    async (error) => {
        const originalRequest = error.config;

        // Если 401 И это не повторный запрос И не запрос на refresh/login
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/login')
        ) {
            if (isRefreshing) {
                // Уже идёт обновление — ставим в очередь
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                // Нет refresh-токена — выбрасываем на вход
                processQueue(error, null);
                isRefreshing = false;
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/';
                return Promise.reject(error);
            }

            try {
                // Запрашиваем новый access-токен
                const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
                    refreshToken
                });

                const { token: newToken, refreshToken: newRefreshToken } = response.data;

                // Сохраняем новые токены
                localStorage.setItem('token', newToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                // Обновляем заголовок для текущего запроса
                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

                processQueue(null, newToken);
                isRefreshing = false;

                console.log('✅ Токен успешно обновлён');

                // Повторяем исходный запрос с новым токеном
                return api(originalRequest);

            } catch (refreshError) {
                // Refresh тоже провалился — полный выход
                processQueue(refreshError, null);
                isRefreshing = false;

                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');

                console.warn('⚠️ Refresh-токен истёк. Необходим повторный вход.');
                window.location.href = '/';

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
