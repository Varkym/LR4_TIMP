const express = require('express');
const pool = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/audit - Получить журнал аудита (только admin)
router.get('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        a."Идентификатор_лога",
        a."Действие",
        a."Сущность",
        a."Старые_данные",
        a."Новые_данные",
        a."Дата_времени",
        p."Логин" as "Пользователь"
      FROM "Журнал_аудита" a
      LEFT JOIN "Пользователи" p ON a."Идентификатор_пользователя" = p."Идентификатор_пользователя"
      ORDER BY a."Дата_времени" DESC
      LIMIT 100
    `);

        res.json(result.rows);
    } catch (err) {
        console.error('[GET /api/audit Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при получении журнала аудита.' });
    }
});

// GET /api/audit/:id - Получить запись аудита по ID (только admin)
router.get('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      SELECT 
        a.*,
        p."Логин" as "Пользователь"
      FROM "Журнал_аудита" a
      LEFT JOIN "Пользователи" p ON a."Идентификатор_пользователя" = p."Идентификатор_пользователя"
      WHERE a."Идентификатор_лога" = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись аудита не найдена.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[GET /api/audit/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

// POST /api/audit - Создать запись в журнале аудита
router.post('/', verifyToken, async (req, res) => {
    const { Действие, Сущность, Старые_данные, Новые_данные } = req.body;

    try {
        const result = await pool.query(`
      INSERT INTO "Журнал_аудита" (
        "Идентификатор_пользователя", "Действие", "Сущность", 
        "Старые_данные", "Новые_данные"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
            req.user.id, Действие, Сущность,
            JSON.stringify(Старые_данные || {}),
            JSON.stringify(Новые_данные || {})
        ]);

        res.status(201).json({
            message: 'Запись в журнале аудита создана',
            log: result.rows[0]
        });
    } catch (err) {
        console.error('[POST /api/audit Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при создании записи.' });
    }
});

// PUT /api/audit/:id - Обновить запись аудита (только admin)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { Действие, Сущность, Старые_данные, Новые_данные } = req.body;

    try {
        const result = await pool.query(`
      UPDATE "Журнал_аудита"
      SET 
        "Действие" = COALESCE($1, "Действие"),
        "Сущность" = COALESCE($2, "Сущность"),
        "Старые_данные" = COALESCE($3, "Старые_данные"),
        "Новые_данные" = COALESCE($4, "Новые_данные")
      WHERE "Идентификатор_лога" = $5
      RETURNING *
    `, [
            Действие,
            Сущность,
            Старые_данные ? JSON.stringify(Старые_данные) : null,
            Новые_данные ? JSON.stringify(Новые_данные) : null,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись аудита не найдена.' });
        }

        res.json({
            message: 'Запись аудита обновлена',
            log: result.rows[0]
        });
    } catch (err) {
        console.error('[PUT /api/audit/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при обновлении записи.' });
    }
});

// DELETE /api/audit/:id - Удалить запись аудита (только admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
      DELETE FROM "Журнал_аудита"
      WHERE "Идентификатор_лога" = $1
      RETURNING *
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись аудита не найдена.' });
        }

        res.json({ message: 'Запись аудита удалена' });
    } catch (err) {
        console.error('[DELETE /api/audit/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при удалении записи.' });
    }
});

module.exports = router;