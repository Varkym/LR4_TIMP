const express = require('express');
const pool = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /api/services - Получить все услуги
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        "Идентификатор_услуги",
        "Название_услуги",
        "Тип_услуги",
        "Статус",
        "Дата_создания",
        "Дата_изменения"
      FROM "Услуги"
      ORDER BY "Название_услуги" ASC
    `);

        res.json(result.rows);
    } catch (err) {
        console.error('[GET /api/services Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при получении услуг.' });
    }
});

// GET /api/services/:id - Получить услугу по ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      SELECT * FROM "Услуги"
      WHERE "Идентификатор_услуги" = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Услуга не найдена.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[GET /api/services/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

// POST /api/services - Создать новую услугу (только admin)
router.post('/', verifyToken, checkRole(['admin']), [
    body('Название_услуги').notEmpty().withMessage('Укажите название услуги'),
    body('Тип_услуги').notEmpty().withMessage('Укажите тип услуги'),
    body('Статус').isIn(['Активен', 'Неактивен', 'На обслуживании']).withMessage('Некорректный статус')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { Название_услуги, Тип_услуги, Статус } = req.body;

    try {
        const result = await pool.query(`
      INSERT INTO "Услуги" ("Название_услуги", "Тип_услуги", "Статус")
      VALUES ($1, $2, $3)
      RETURNING *
    `, [Название_услуги, Тип_услуги, Статус]);

        res.status(201).json({
            message: 'Услуга успешно создана',
            service: result.rows[0]
        });
    } catch (err) {
        console.error('[POST /api/services Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при создании услуги.' });
    }
});

// PUT /api/services/:id - Обновить услугу (только admin)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { Название_услуги, Тип_услуги, Статус } = req.body;

        const result = await pool.query(`
      UPDATE "Услуги"
      SET 
        "Название_услуги" = COALESCE($1, "Название_услуги"),
        "Тип_услуги" = COALESCE($2, "Тип_услуги"),
        "Статус" = COALESCE($3, "Статус"),
        "Дата_изменения" = CURRENT_TIMESTAMP
      WHERE "Идентификатор_услуги" = $4
      RETURNING *
    `, [Название_услуги, Тип_услуги, Статус, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Услуга не найдена.' });
        }

        res.json({
            message: 'Услуга успешно обновлена',
            service: result.rows[0]
        });
    } catch (err) {
        console.error('[PUT /api/services/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при обновлении.' });
    }
});

// DELETE /api/services/:id - Удалить услугу (только admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      DELETE FROM "Услуги"
      WHERE "Идентификатор_услуги" = $1
      RETURNING *
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Услуга не найдена.' });
        }

        res.json({ message: 'Услуга успешно удалена' });
    } catch (err) {
        console.error('[DELETE /api/services/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при удалении.' });
    }
});

module.exports = router;