const express = require('express');
const pool = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /api/vulnerabilities - Получить все уязвимости
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        v."Идентификатор_уязвимости",
        v."Тип_уязвимости",
        v."Описание",
        v."Дата_обнаружения",
        v."Уровень_критичности",
        v."Статус",
        v."Дата_исправления",
        sz."Название_средства" as "Средство_защиты"
      FROM "Уязвимости" v
      LEFT JOIN "Средства_защиты" sz ON v."Идентификатор_средства" = sz."Идентификатор_средства"
      ORDER BY v."Уровень_критичности" DESC, v."Дата_обнаружения" DESC
    `);

        res.json(result.rows);
    } catch (err) {
        console.error('[GET /api/vulnerabilities Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при получении уязвимостей.' });
    }
});

// GET /api/vulnerabilities/:id - Получить уязвимость по ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      SELECT 
        v.*,
        sz."Название_средства" as "Средство_защиты"
      FROM "Уязвимости" v
      LEFT JOIN "Средства_защиты" sz ON v."Идентификатор_средства" = sz."Идентификатор_средства"
      WHERE v."Идентификатор_уязвимости" = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Уязвимость не найдена.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[GET /api/vulnerabilities/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

// POST /api/vulnerabilities - Создать новую уязвимость (только admin и operator)
router.post('/', verifyToken, checkRole(['admin', 'operator']), [
    body('Идентификатор_средства').isInt().withMessage('Укажите ID средства защиты'),
    body('Тип_уязвимости').notEmpty().withMessage('Укажите тип уязвимости'),
    body('Дата_обнаружения').isISO8601().withMessage('Укажите дату обнаружения'),
    body('Уровень_критичности').isInt({ min: 1, max: 5 }).withMessage('Уровень от 1 до 5')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        Идентификатор_средства,
        Тип_уязвимости,
        Описание,
        Дата_обнаружения,
        Уровень_критичности,
        Статус = 'Открыта',
        Дата_исправления
    } = req.body;

    try {
        const result = await pool.query(`
      INSERT INTO "Уязвимости" (
        "Идентификатор_средства", "Тип_уязвимости", "Описание", 
        "Дата_обнаружения", "Уровень_критичности", "Статус", "Дата_исправления"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
            Идентификатор_средства, Тип_уязвимости, Описание || null,
            Дата_обнаружения, Уровень_критичности, Статус, Дата_исправления || null
        ]);

        res.status(201).json({
            message: 'Уязвимость успешно добавлена',
            vulnerability: result.rows[0]
        });
    } catch (err) {
        console.error('[POST /api/vulnerabilities Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при добавлении.' });
    }
});

// PUT /api/vulnerabilities/:id - Обновить уязвимость (только admin и operator)
router.put('/:id', verifyToken, checkRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            Тип_уязвимости, Описание, Уровень_критичности,
            Статус, Дата_исправления
        } = req.body;

        const result = await pool.query(`
      UPDATE "Уязвимости"
      SET 
        "Тип_уязвимости" = COALESCE($1, "Тип_уязвимости"),
        "Описание" = COALESCE($2, "Описание"),
        "Уровень_критичности" = COALESCE($3, "Уровень_критичности"),
        "Статус" = COALESCE($4, "Статус"),
        "Дата_исправления" = COALESCE($5, "Дата_исправления"),
        "Дата_изменения" = CURRENT_TIMESTAMP
      WHERE "Идентификатор_уязвимости" = $6
      RETURNING *
    `, [Тип_уязвимости, Описание, Уровень_критичности, Статус, Дата_исправления, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Уязвимость не найдена.' });
        }

        res.json({
            message: 'Уязвимость успешно обновлена',
            vulnerability: result.rows[0]
        });
    } catch (err) {
        console.error('[PUT /api/vulnerabilities/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при обновлении.' });
    }
});

// DELETE /api/vulnerabilities/:id - Удалить уязвимость (только admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      DELETE FROM "Уязвимости"
      WHERE "Идентификатор_уязвимости" = $1
      RETURNING *
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Уязвимость не найдена.' });
        }

        res.json({ message: 'Уязвимость успешно удалена' });
    } catch (err) {
        console.error('[DELETE /api/vulnerabilities/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при удалении.' });
    }
});

module.exports = router;