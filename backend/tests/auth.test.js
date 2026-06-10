/**
 * Тесты для API аутентификации (auth.js)
 *
 * Запуск: npm test
 *
 * supertest — имитирует HTTP-запросы к серверу без реального порта
 * jest      — тест-фреймворк (describe/test/expect)
 */

const request = require('supertest');
const app = require('../src/app');

// ─── Тесты регистрации ──────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {

    test('400 — пустое тело запроса', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({});
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    test('400 — логин слишком короткий (меньше 4 символов)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ login: 'ab', email: 'test@test.com', password: 'password123' });
        expect(res.statusCode).toBe(400);
    });

    test('400 — некорректный email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ login: 'testuser', email: 'notanemail', password: 'password123' });
        expect(res.statusCode).toBe(400);
    });

    test('400 — пароль слишком короткий (меньше 6 символов)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ login: 'testuser', email: 'test@test.com', password: '123' });
        expect(res.statusCode).toBe(400);
    });
});

// ─── Тесты входа ────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {

    test('400 — пустое тело запроса', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});
        expect(res.statusCode).toBe(400);
    });

    test('401 — неверный логин/пароль', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ login: 'nonexistent_user_xyz', password: 'wrongpassword' });
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error');
    });
});

// ─── Тесты защищённых маршрутов ─────────────────────────────────────────────
describe('GET /api/auth/profile (защищённый маршрут)', () => {

    test('401 — запрос без токена', async () => {
        const res = await request(app).get('/api/auth/profile');
        expect(res.statusCode).toBe(401);
    });

    test('401 — неверный токен', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', 'Bearer invalid_token_here');
        expect(res.statusCode).toBe(401);
    });
});

// ─── Тесты инцидентов (без авторизации) ─────────────────────────────────────
describe('GET /api/incidents (защищённый)', () => {

    test('401 — без токена', async () => {
        const res = await request(app).get('/api/incidents');
        expect(res.statusCode).toBe(401);
    });
});

// ─── Health check ────────────────────────────────────────────────────────────
describe('GET /api/health', () => {

    test('200 — сервер работает', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'OK');
    });
});
