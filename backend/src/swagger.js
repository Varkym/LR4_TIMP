const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SecureVault API',
            version: '1.0.0',
            description: `
## Система управления информационной безопасностью

REST API для управления инцидентами, сотрудниками, услугами, пользователями и журналом аудита.

### Аутентификация
Все защищённые эндпоинты требуют JWT-токен в заголовке:
\`Authorization: Bearer <token>\`

Получите токен через \`POST /api/auth/login\`.

### Роли пользователей
| Роль | Права |
|------|-------|
| **admin** | Полный доступ (чтение, создание, изменение, удаление) |
| **operator** | Чтение + создание/изменение инцидентов |
| **viewer** | Только чтение |
            `,
            contact: {
                name: 'SecureVault Team',
            }
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Локальный сервер разработки' }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Введите JWT-токен, полученный при входе через /api/auth/login'
                }
            },
            schemas: {
                // ── Пользователь
                User: {
                    type: 'object',
                    properties: {
                        Идентификатор_пользователя: { type: 'integer', example: 1 },
                        Логин: { type: 'string', example: 'admin' },
                        Email: { type: 'string', example: 'admin@example.com' },
                        Роль: { type: 'string', enum: ['admin', 'operator', 'viewer'], example: 'admin' },
                        Активен: { type: 'boolean', example: true },
                        Дата_регистрации: { type: 'string', format: 'date-time', example: '2024-01-01T12:00:00Z' }
                    }
                },
                // ── Инцидент
                Incident: {
                    type: 'object',
                    properties: {
                        Идентификатор_инцидента: { type: 'integer', example: 1 },
                        Тип_инцидента: { type: 'string', example: 'Утечка данных' },
                        Описание: { type: 'string', example: 'Обнаружена утечка персональных данных' },
                        Уровень_угрозы: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
                        Статус: { type: 'string', enum: ['Новый', 'В работе', 'Закрыт'], example: 'Новый' },
                        Дата_и_время_инцидента: { type: 'string', format: 'date-time' },
                        Услуга: { type: 'string', example: 'Веб-сервис' },
                        Сотрудник: { type: 'string', example: 'Иванов Иван' }
                    }
                },
                // ── Сотрудник
                Employee: {
                    type: 'object',
                    properties: {
                        Идентификатор_сотрудника: { type: 'integer', example: 1 },
                        Фамилия: { type: 'string', example: 'Иванов' },
                        Имя: { type: 'string', example: 'Иван' },
                        Отчество: { type: 'string', example: 'Иванович' },
                        Должность: { type: 'string', example: 'Инженер по безопасности' },
                        Подразделение: { type: 'string', example: 'ИБ' },
                        Email: { type: 'string', example: 'ivanov@company.ru' },
                        Телефон: { type: 'string', example: '+7-999-123-45-67' },
                        Фото_путь: { type: 'string', example: '/uploads/employees/photo.jpg' }
                    }
                },
                // ── Услуга
                Service: {
                    type: 'object',
                    properties: {
                        Идентификатор_услуги: { type: 'integer', example: 1 },
                        Название_услуги: { type: 'string', example: 'Мониторинг сети' },
                        Тип_услуги: { type: 'string', example: 'Мониторинг' },
                        Статус: { type: 'string', enum: ['Активен', 'Неактивен', 'На обслуживании'], example: 'Активен' }
                    }
                },
                // ── Запись аудита
                AuditLog: {
                    type: 'object',
                    properties: {
                        Идентификатор_лога: { type: 'integer', example: 1 },
                        Действие: { type: 'string', example: 'Создание инцидента' },
                        Сущность: { type: 'string', example: 'Инциденты' },
                        Пользователь: { type: 'string', example: 'admin' },
                        Старые_данные: { type: 'object' },
                        Новые_данные: { type: 'object' },
                        Дата_времени: { type: 'string', format: 'date-time' }
                    }
                },
                // ── Ошибка
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Описание ошибки' }
                    }
                }
            }
        },
        security: [{ BearerAuth: [] }]
    },
    // Используем __dirname для надёжного пути (работает и локально и на Vercel)
    apis: [`${__dirname}/routes/*.js`]
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
