const express = require('express');
const pool = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /api/protections - Получить все средства защиты
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        "Идентификатор_средства",
        "Название_средства",
        "Тип_средства",
        "Производитель",
        "Версия",
        "Дата_установки",
        "Статус",
        "Описание"
      FROM "Средства_защиты"
      ORDER BY "Название_средства" ASC
    `);

        res.json(result.rows);
    } catch (err) {
        console.error('[GET /api/protections Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при получении средств защиты.' });
    }
});

// GET /api/protections/:id - Получить средство защиты по ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      SELECT * FROM "Средства_защиты"
      WHERE "Идентификатор_средства" = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Средство защиты не найдено.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[GET /api/protections/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

// POST /api/protections - Создать новое средство защиты (только admin)
router.post('/', verifyToken, checkRole(['admin']), [
    body('Название_средства').notEmpty().withMessage('Укажите название'),
    body('Тип_средства').notEmpty().withMessage('Укажите тип средства')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        Название_средства,
        Тип_средства,
        Производитель,
        Версия,
        Дата_установки,
        Статус = 'Активен',
        Описание
    } = req.body;

    try {
        const result = await pool.query(`
      INSERT INTO "Средства_защиты" (
        "Название_средства", "Тип_средства", "Производитель", 
        "Версия", "Дата_установки", "Статус", "Описание"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
            Название_средства, Тип_средства, Производитель || null,
            Версия || null, Дата_установки || null, Статус, Описание || null
        ]);

        res.status(201).json({
            message: 'Средство защиты успешно добавлено',
            protection: result.rows[0]
        });
    } catch (err) {
        console.error('[POST /api/protections Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при добавлении.' });
    }
});

// PUT /api/protections/:id - Обновить средство защиты (только admin)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            Название_средства, Тип_средства, Производитель,
            Версия, Дата_установки, Статус, Описание
        } = req.body;

        const result = await pool.query(`
      UPDATE "Средства_защиты"
      SET 
        "Название_средства" = COALESCE($1, "Название_средства"),
        "Тип_средства" = COALESCE($2, "Тип_средства"),
        "Производитель" = COALESCE($3, "Производитель"),
        "Версия" = COALESCE($4, "Версия"),
        "Дата_установки" = COALESCE($5, "Дата_установки"),
        "Статус" = COALESCE($6, "Статус"),
        "Описание" = COALESCE($7, "Описание")
      WHERE "Идентификатор_средства" = $8
      RETURNING *
    `, [
            Название_средства, Тип_средства, Производитель,
            Версия, Дата_установки, Статус, Описание, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Средство защиты не найдено.' });
        }

        res.json({
            message: 'Средство защиты успешно обновлено',
            protection: result.rows[0]
        });
    } catch (err) {
        console.error('[PUT /api/protections/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при обновлении.' });
    }
});

// DELETE /api/protections/:id - Удалить средство защиты (только admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      DELETE FROM "Средства_защиты"
      WHERE "Идентификатор_средства" = $1
      RETURNING *
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Средство защиты не найдено.' });
        }

        res.json({ message: 'Средство защиты успешно удалено' });
    } catch (err) {
        console.error('[DELETE /api/protections/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при удалении.' });
    }
});

module.exports = router;