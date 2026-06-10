const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Вспомогательные функции для работы с токенами
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Создаёт JWT access-токен (короткоживущий — 1 час)
 * Содержит: id, login, role пользователя
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, login: user.login, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
};

/**
 * Создаёт refresh-токен (долгоживущий — 7 дней)
 * Это случайная строка, хранится в БД — можно отозвать в любой момент
 */
const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

/**
 * Сохраняет refresh-токен в БД
 */
const saveRefreshToken = async (userId, token) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // +7 дней

    await pool.query(
        `INSERT INTO "Refresh_токены" ("Идентификатор_пользователя", "Токен", "Истекает")
         VALUES ($1, $2, $3)
         ON CONFLICT ("Токен") DO NOTHING`,
        [userId, token, expiresAt]
    );
};

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Аутентификация и авторизация пользователей
 */

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login, email, password]
 *             properties:
 *               login:
 *                 type: string
 *                 minLength: 4
 *                 example: "newuser"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               role:
 *                 type: string
 *                 enum: [admin, operator, viewer]
 *                 default: viewer
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *       400:
 *         description: Ошибка валидации
 *       409:
 *         description: Логин или email уже существует
 */
router.post('/register', [
    body('login').isLength({ min: 4 }).trim().withMessage('Логин — минимум 4 символа'),
    body('email').isEmail().normalizeEmail().withMessage('Некорректный email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль — минимум 6 символов'),
    body('role').optional().isIn(['admin', 'operator', 'viewer'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { login, email, password, role } = req.body;
    try {
        const exists = await pool.query(
            'SELECT 1 FROM "Пользователи" WHERE "Логин" = $1 OR "Email" = $2',
            [login, email]
        );
        if (exists.rows.length > 0) {
            return res.status(409).json({ error: 'Пользователь с таким логином или email уже существует.' });
        }

        const hash = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            `INSERT INTO "Пользователи" ("Логин", "Email", "Хеш_пароля", "Роль")
             VALUES ($1, $2, $3, $4)
             RETURNING "Идентификатор_пользователя", "Логин", "Email", "Роль"`,
            [login, email, hash, role || 'operator']
        );

        res.status(201).json({ message: 'Пользователь успешно зарегистрирован', user: newUser.rows[0] });
    } catch (err) {
        console.error('[POST /register]', err);
        res.status(500).json({ error: 'Ошибка сервера при регистрации.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход — получение access + refresh токенов
 *     description: |
 *       Возвращает два токена:
 *       - **accessToken** (1 час) — для авторизации запросов
 *       - **refreshToken** (7 дней) — для обновления accessToken без повторного входа
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login, password]
 *             properties:
 *               login: { type: string, example: "admin" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Access JWT-токен (1 час)
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh-токен (7 дней)
 *       401:
 *         description: Неверные учётные данные
 */
router.post('/login', [
    body('login').exists().withMessage('Введите логин'),
    body('password').exists().withMessage('Введите пароль')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { login, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM "Пользователи" WHERE "Логин" = $1',
            [login]
        );

        if (result.rows.length === 0 || !result.rows[0].Активен) {
            return res.status(401).json({ error: 'Неверные учётные данные или аккаунт деактивирован.' });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.Хеш_пароля);
        if (!isValid) {
            return res.status(401).json({ error: 'Неверные учётные данные.' });
        }

        const userData = {
            id: user.Идентификатор_пользователя,
            login: user.Логин,
            role: user.Роль
        };

        // Генерируем оба токена
        const accessToken = generateAccessToken(userData);
        const refreshToken = generateRefreshToken();

        // Сохраняем refresh-токен в БД
        await saveRefreshToken(userData.id, refreshToken);

        res.json({
            message: 'Вход выполнен успешно',
            token: accessToken,          // access token (1 час)
            refreshToken: refreshToken,  // refresh token (7 дней)
            user: userData
        });
    } catch (err) {
        console.error('[POST /login]', err);
        res.status(500).json({ error: 'Ошибка сервера при входе.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить access-токен используя refresh-токен
 *     description: |
 *       Когда access-токен истёк (через 1 час), клиент автоматически
 *       вызывает этот эндпоинт с refresh-токеном и получает новый access-токен.
 *       Пользователь не замечает перелогина.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "a1b2c3d4e5..."
 *     responses:
 *       200:
 *         description: Новый access-токен выдан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string, description: "Новый access JWT-токен" }
 *       401:
 *         description: Refresh-токен недействителен или истёк
 */
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh-токен не предоставлен.' });
    }

    try {
        // Ищем токен в БД и проверяем срок действия
        const result = await pool.query(
            `SELECT rt.*, p."Логин", p."Роль", p."Активен"
             FROM "Refresh_токены" rt
             JOIN "Пользователи" p ON rt."Идентификатор_пользователя" = p."Идентификатор_пользователя"
             WHERE rt."Токен" = $1 AND rt."Истекает" > NOW()`,
            [refreshToken]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Refresh-токен недействителен или истёк. Войдите снова.' });
        }

        const tokenData = result.rows[0];

        if (!tokenData.Активен) {
            return res.status(401).json({ error: 'Аккаунт деактивирован.' });
        }

        // Генерируем новый access-токен
        const newAccessToken = generateAccessToken({
            id: tokenData.Идентификатор_пользователя,
            login: tokenData.Логин,
            role: tokenData.Роль
        });

        // Генерируем новый refresh-токен (ротация — старый удаляем)
        const newRefreshToken = generateRefreshToken();

        await pool.query('DELETE FROM "Refresh_токены" WHERE "Токен" = $1', [refreshToken]);
        await saveRefreshToken(tokenData.Идентификатор_пользователя, newRefreshToken);

        res.json({
            token: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        console.error('[POST /refresh]', err);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Выход — инвалидация refresh-токена
 *     description: Удаляет refresh-токен из БД — даже если кто-то украл токен, он больше не сработает.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Выход выполнен
 */
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    try {
        if (refreshToken) {
            await pool.query('DELETE FROM "Refresh_токены" WHERE "Токен" = $1', [refreshToken]);
        }
        res.json({ message: 'Выход выполнен успешно.' });
    } catch (err) {
        console.error('[POST /logout]', err);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Получить профиль текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Токен не предоставлен или недействителен
 */
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await pool.query(
            'SELECT "Идентификатор_пользователя", "Логин", "Email", "Роль" FROM "Пользователи" WHERE "Идентификатор_пользователя" = $1',
            [req.user.id]
        );
        if (user.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден.' });
        res.json(user.rows[0]);
    } catch (err) {
        console.error('[GET /profile]', err);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

module.exports = router;