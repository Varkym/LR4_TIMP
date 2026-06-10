const express = require('express');
const pool = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/users - Получить список всех пользователей (только admin)
router.get('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query(`
  
  SELECT 
    "Идентификатор_пользователя",
    "Логин",
    "Email",
    "Роль",
    "Активен",
    "Дата_регистрации"
  FROM "Пользователи"
  ORDER BY "Идентификатор_пользователя" ASC
`);

        res.json(result.rows);
    } catch (err) {
        console.error('[GET /api/users Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при получении пользователей.' });
    }
});

// PUT /api/users/:id/role - Изменить роль пользователя (только admin)
router.put('/:id/role', verifyToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    // Проверяем, что роль валидная
    const validRoles = ['admin', 'operator', 'viewer'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Недопустимая роль.' });
    }

    try {
        const result = await pool.query(`
      UPDATE "Пользователи"
      SET "Роль" = $1
      WHERE "Идентификатор_пользователя" = $2
      RETURNING "Идентификатор_пользователя", "Логин", "Роль"
    `, [role, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден.' });
        }

        res.json({
            message: 'Роль успешно изменена',
            user: result.rows[0]
        });
    } catch (err) {
        console.error('[PUT /api/users/:id/role Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при изменении роли.' });
    }
});

// PUT /api/users/:id/activate - Активировать/деактивировать пользователя (только admin)
router.put('/:id/activate', verifyToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;

    try {
        const result = await pool.query(`
      UPDATE "Пользователи"
      SET "Активен" = $1
      WHERE "Идентификатор_пользователя" = $2
      RETURNING "Идентификатор_пользователя", "Логин", "Активен"
    `, [active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден.' });
        }

        res.json({
            message: active ? 'Пользователь активирован' : 'Пользователь деактивирован',
            user: result.rows[0]
        });
    } catch (err) {
        console.error('[PUT /api/users/:id/activate Error]', err);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

module.exports = router;