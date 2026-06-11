const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { auditMiddleware } = require('./middleware/auditMiddleware');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const serviceRoutes = require('./routes/services');
const employeeRoutes = require('./routes/employees');
const protectionRoutes = require('./routes/protections');
const vulnerabilityRoutes = require('./routes/vulnerabilities');
const responseRoutes = require('./routes/responses');
const auditRoutes = require('./routes/audit');
const usersRoutes = require('./routes/users');

const app = express();

// Настройка CORS - разрешаем localhost и продакшн-фронтенд
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,          // URL фронтенда на Vercel/Render
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Разрешаем запросы без origin (Postman, curl) и из allowed списка
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com'))) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true
}));

// Helmet - заголовки безопасности
// contentSecurityPolicy отключён чтобы Swagger UI мог загружать свои ресурсы
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false  // Swagger UI требует CDN-ресурсы
}));

// Логирование запросов
app.use(morgan('dev'));

// Парсинг JSON
app.use(express.json());

// Статические файлы - загруженные фотографии
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rate Limiting - защита от частых запросов (для разработки лимит высокий)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 500, // максимум 500 запросов (для разработки)
    message: { error: 'Слишком много запросов. Попробуйте позже.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Не ограничиваем запросы с localhost (для разработки)
        const ip = req.ip || req.connection.remoteAddress;
        return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    }
});

app.use('/api/', limiter);

// ── Автоматическое логирование аудита (POST/PUT/DELETE) ──────────────────────────────
app.use('/api/', auditMiddleware);

// Простой роут для проверки работоспособности
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ── Swagger UI — интерактивная документация API ──────────────────────────────
// Открыть в браузере: http://localhost:3000/api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'SecureVault API Docs',
    customCss: `
        .swagger-ui .topbar { background: linear-gradient(135deg, #c4956a, #e8a0b0); }
        .swagger-ui .topbar-wrapper img { display: none; }
        .swagger-ui .topbar-wrapper::after { content: 'SecureVault API'; color: white; font-size: 20px; font-weight: 700; }
    `
}));

// Отдаём JSON-схему (для внешних инструментов)
app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Роуты аутентификации (регистрация, вход, профиль)
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/protections', protectionRoutes);
app.use('/api/vulnerabilities', vulnerabilityRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/users', usersRoutes);

// Глобальный обработчик ошибок (должен быть в самом конце)
app.use((err, req, res, next) => {
    console.error('[Global Error Handler]', err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Внутренняя ошибка сервера'
    });
});

// Запуск сервера — только локально (не на Vercel)
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на порту ${PORT}`);
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`🛡️  Защита: Helmet, CORS, Rate Limiting активны`);
    });
}

module.exports = app;