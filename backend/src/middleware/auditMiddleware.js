/**
 * auditMiddleware.js
 *
 * Автоматически логирует все изменяющие запросы (POST, PUT, DELETE)
 * в таблицу "Журнал_аудита" после их выполнения.
 *
 * Работает как middleware — перехватывает res.json() и пишет в БД.
 */

const pool = require('../db');

// Маппинг URL → читаемое название сущности
const ENTITY_MAP = {
    '/api/incidents':      'Инциденты',
    '/api/employees':      'Сотрудники',
    '/api/services':       'Услуги',
    '/api/vulnerabilities': 'Уязвимости',
    '/api/protections':    'Средства_защиты',
    '/api/responses':      'Меры_реагирования',
    '/api/audit':          'Журнал_аудита',
    '/api/users':          'Пользователи',
    '/api/auth':           'Аутентификация',
};

// Маппинг HTTP-метода → действие
const ACTION_MAP = {
    POST:   'Создание',
    PUT:    'Изменение',
    PATCH:  'Изменение',
    DELETE: 'Удаление',
};

/**
 * Определяет сущность по URL запроса
 */
const getEntity = (url) => {
    for (const [prefix, name] of Object.entries(ENTITY_MAP)) {
        if (url.startsWith(prefix)) return name;
    }
    return 'Неизвестно';
};

/**
 * Записывает событие в журнал аудита
 */
const writeAuditLog = async (userId, action, entity, oldData, newData) => {
    try {
        await pool.query(
            `INSERT INTO "Журнал_аудита" 
             ("Идентификатор_пользователя", "Действие", "Сущность", "Старые_данные", "Новые_данные")
             VALUES ($1, $2, $3, $4, $5)`,
            [
                userId || null,
                action,
                entity,
                JSON.stringify(oldData || {}),
                JSON.stringify(newData || {})
            ]
        );
    } catch (err) {
        // Ошибка аудита НЕ должна ломать основной запрос
        console.error('[Audit Log Error]', err.message);
    }
};

/**
 * Основной middleware — перехватывает ответ и пишет в аудит
 */
const auditMiddleware = (req, res, next) => {
    // Логируем только изменяющие методы
    const method = req.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return next();
    }

    // Пропускаем служебные маршруты
    const skipRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout', '/api/health'];
    if (skipRoutes.some(r => req.path === r || req.originalUrl === r)) {
        return next();
    }

    const entity = getEntity(req.originalUrl);
    const action = ACTION_MAP[method] || method;
    const requestBody = { ...req.body };

    // Убираем пароль из логов (безопасность!)
    if (requestBody.password) requestBody.password = '[СКРЫТО]';
    if (requestBody.Хеш_пароля) requestBody.Хеш_пароля = '[СКРЫТО]';

    // Перехватываем res.json чтобы получить ответ
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        // Восстанавливаем оригинальный метод
        res.json = originalJson;

        // Пишем в аудит только успешные операции (2xx)
        const statusCode = res.statusCode;
        if (statusCode >= 200 && statusCode < 300) {
            const userId = req.user?.id || null;

            // Для DELETE старые данные = параметр из URL
            const oldData = method === 'DELETE'
                ? { id: req.params?.id }
                : {};

            // Новые данные = тело запроса (без пароля)
            const newData = method === 'DELETE'
                ? {}
                : requestBody;

            const fullAction = `${action} записи в "${entity}"`;

            // Асинхронно пишем, не блокируем ответ
            writeAuditLog(userId, fullAction, entity, oldData, newData);
        }

        return originalJson(body);
    };

    next();
};

module.exports = { auditMiddleware, writeAuditLog };
