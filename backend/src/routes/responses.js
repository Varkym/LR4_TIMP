const express = require('express');
const pool = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /api/responses - Получить все меры реагирования
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        m."Идентификатор_меры",
        m."Название_меры",
        m."Описание_меры",
        m."Дата_выполнения",
        m."Результат",
        i."Тип_инцидента" as "Инцидент",
        s."Фамилия" || ' ' || s."Имя" as "Исполнитель"
      FROM "Меры_реагирования" m
      LEFT JOIN "Инциденты" i ON m."Идентификатор_инцидента" = i."Идентификатор_инцидента"
      LEFT JOIN "Сотрудники" s ON m."Идентификатор_исполнителя" = s."Идентификатор_сотрудника"
      ORDER BY m."Дата_выполнения" DESC
    `);

        res.json(result.rows);
    } catch (err) {
        console.error('[GET /api/responses Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при получении мер реагирования.' });
    }
});

// GET /api/responses/:id - Получить меру реагирования по ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      SELECT 
        m.*,
        i."Тип_инцидента" as "Инцидент",
        s."Фамилия" || ' ' || s."Имя" || ' ' || COALESCE(s."Отчество", '') as "Исполнитель"
      FROM "Меры_реагирования" m
      LEFT JOIN "Инциденты" i ON m."Идентификатор_инцидента" = i."Идентификатор_инцидента"
      LEFT JOIN "Сотрудники" s ON m."Идентификатор_исполнителя" = s."Идентификатор_сотрудника"
      WHERE m."Идентификатор_меры" = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Мера реагирования не найдена.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[GET /api/responses/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

// POST /api/responses - Создать новую меру реагирования (только admin и operator)
router.post('/', verifyToken, checkRole(['admin', 'operator']), [
    body('Идентификатор_инцидента').isInt().withMessage('Укажите ID инцидента'),
    body('Название_меры').notEmpty().withMessage('Укажите название меры'),
    body('Дата_выполнения').isISO8601().withMessage('Укажите дату выполнения'),
    body('Идентификатор_исполнителя').isInt().withMessage('Укажите ID исполнителя')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        Идентификатор_инцидента,
        Название_меры,
        Описание_меры,
        Дата_выполнения,
        Идентификатор_исполнителя,
        Результат = 'Ожидание'
    } = req.body;

    try {
        const result = await pool.query(`
      INSERT INTO "Меры_реагирования" (
        "Идентификатор_инцидента", "Название_меры", "Описание_меры", 
        "Дата_выполнения", "Идентификатор_исполнителя", "Результат"
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
            Идентификатор_инцидента, Название_меры, Описание_меры || null,
            Дата_выполнения, Идентификатор_исполнителя, Результат
        ]);

        res.status(201).json({
            message: 'Мера реагирования успешно добавлена',
            response: result.rows[0]
        });
    } catch (err) {
        console.error('[POST /api/responses Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при добавлении.' });
    }
});

// PUT /api/responses/:id - Обновить меру реагирования (только admin и operator)
router.put('/:id', verifyToken, checkRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            Название_меры, Описание_меры, Дата_выполнения, Результат
        } = req.body;

        const result = await pool.query(`
      UPDATE "Меры_реагирования"
      SET 
        "Название_меры" = COALESCE($1, "Название_меры"),
        "Описание_меры" = COALESCE($2, "Описание_меры"),
        "Дата_выполнения" = COALESCE($3, "Дата_выполнения"),
        "Результат" = COALESCE($4, "Результат")
      WHERE "Идентификатор_меры" = $5
      RETURNING *
    `, [Название_меры, Описание_меры, Дата_выполнения, Результат, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Мера реагирования не найдена.' });
        }

        res.json({
            message: 'Мера реагирования успешно обновлена',
            response: result.rows[0]
        });
    } catch (err) {
        console.error('[PUT /api/responses/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при обновлении.' });
    }
});

// DELETE /api/responses/:id - Удалить меру реагирования (только admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      DELETE FROM "Меры_реагирования"
      WHERE "Идентификатор_меры" = $1
      RETURNING *
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Мера реагирования не найдена.' });
        }

        res.json({ message: 'Мера реагирования успешно удалена' });
    } catch (err) {
        console.error('[DELETE /api/responses/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при удалении.' });
    }
});

module.exports = router;