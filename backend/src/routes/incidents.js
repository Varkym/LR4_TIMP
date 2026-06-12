const express = require('express');
const pool = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Incidents
 *   description: Управление инцидентами безопасности
 */

/**
 * @swagger
 * /api/incidents:
 *   get:
 *     summary: Получить все инциденты
 *     tags: [Incidents]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Список инцидентов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Incident' }
 *       401:
 *         description: Не авторизован
 *   post:
 *     summary: Создать новый инцидент (admin, operator)
 *     tags: [Incidents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [Тип_инцидента, Описание]
 *             properties:
 *               Тип_инцидента:
 *                 type: string
 *                 enum: [Утечка данных, DDoS-атака, Фишинг, Вредоносное ПО, Несанкционированный доступ, Другое]
 *               Описание:
 *                 type: string
 *               Уровень_угрозы:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 3
 *               Статус:
 *                 type: string
 *                 enum: [Новый, В работе, Закрыт]
 *                 default: Новый
 *               Идентификатор_услуги:
 *                 type: integer
 *               Идентификатор_сотрудника:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Инцидент создан
 *       400:
 *         description: Ошибка валидации
 *       403:
 *         description: Недостаточно прав (нужна роль admin или operator)
 */

/**
 * @swagger
 * /api/incidents/{id}:
 *   get:
 *     summary: Получить инцидент по ID
 *     tags: [Incidents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Инцидент найден
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Incident' }
 *       404:
 *         description: Инцидент не найден
 *   put:
 *     summary: Обновить инцидент (admin, operator)
 *     tags: [Incidents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Тип_инцидента: { type: string }
 *               Уровень_угрозы: { type: integer }
 *               Статус: { type: string, enum: [Новый, В работе, Закрыт] }
 *               Описание: { type: string }
 *     responses:
 *       200:
 *         description: Инцидент обновлён
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Инцидент не найден
 *   delete:
 *     summary: Удалить инцидент (только admin)
 *     tags: [Incidents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Инцидент удалён
 *       403:
 *         description: Недостаточно прав (нужна роль admin)
 *       404:
 *         description: Инцидент не найден
 */

// GET /api/incidents - Получить все инциденты (только для авторизованных)
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        i."Идентификатор_инцидента",
        i."Дата_и_время_инцидента",
        i."Тип_инцидента",
        i."Уровень_угрозы",
        i."Статус",
        i."Описание",
        u."Название_услуги" as "Услуга",
        s."Фамилия" || ' ' || s."Имя" as "Сотрудник"
      FROM "Инциденты" i
      LEFT JOIN "Услуги" u ON i."Идентификатор_услуги" = u."Идентификатор_услуги"
      LEFT JOIN "Сотрудники" s ON i."Идентификатор_сотрудника" = s."Идентификатор_сотрудника"
      ORDER BY i."Дата_и_время_инцидента" DESC
    `);

        res.json(result.rows);
    } catch (err) {
        console.error('[GET /api/incidents Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при получении инцидентов.' });
    }
});

// GET /api/incidents/:id - Получить инцидент по ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      SELECT 
        i.*,
        u."Название_услуги" as "Услуга",
        s."Фамилия" || ' ' || s."Имя" || ' ' || COALESCE(s."Отчество", '') as "Сотрудник",
        sz."Название_средства" as "Средство_защиты"
      FROM "Инциденты" i
      LEFT JOIN "Услуги" u ON i."Идентификатор_услуги" = u."Идентификатор_услуги"
      LEFT JOIN "Сотрудники" s ON i."Идентификатор_сотрудника" = s."Идентификатор_сотрудника"
      LEFT JOIN "Средства_защиты" sz ON i."Идентификатор_средства" = sz."Идентификатор_средства"
      WHERE i."Идентификатор_инцидента" = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Инцидент не найден.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[GET /api/incidents/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});
// POST /api/incidents - Создать новый инцидент (только admin и operator)
router.post('/', verifyToken, checkRole(['admin', 'operator']), async (req, res) => {
    const {
        Тип_инцидента,
        Описание,
        Уровень_угрозы,
        Статус = 'Новый',
        Идентификатор_услуги,
        Идентификатор_сотрудника
    } = req.body;

    // Валидация обязательных полей
    if (!Тип_инцидента || !Описание) {
        return res.status(400).json({ error: 'Заполните тип инцидента и описание.' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO "Инциденты" (
                "Тип_инцидента",
                "Описание",
                "Уровень_угрозы",
                "Статус",
                "Идентификатор_услуги",
                "Идентификатор_сотрудника",
                "Дата_и_время_инцидента"
            )
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            Тип_инцидента,
            Описание,
            Уровень_угрозы || 3,
            Статус,
            Идентификатор_услуги || null,
            Идентификатор_сотрудника || null
        ]);

        res.status(201).json({
            message: 'Инцидент успешно создан',
            incident: result.rows[0]
        });
    } catch (err) {
        console.error('[POST /api/incidents Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при создании инцидента.' });
    }
});
// PUT /api/incidents/:id - Обновить инцидент (только admin и operator)
router.put('/:id', verifyToken, checkRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            Тип_инцидента,
            Уровень_угрозы,
            Статус,
            Описание,
            Дата_разрешения,
            Идентификатор_услуги,
            Идентификатор_сотрудника
        } = req.body;

        // Конвертируем пустые строки в NULL для корректной работы COALESCE
        const услуга = Идентификатор_услуги === '' ? null : Идентификатор_услуги;
        const сотрудник = Идентификатор_сотрудника === '' ? null : Идентификатор_сотрудника;

        const result = await pool.query(`
            UPDATE "Инциденты"
            SET 
                "Тип_инцидента" = COALESCE($1, "Тип_инцидента"),
                "Уровень_угрозы" = COALESCE($2, "Уровень_угрозы"),
                "Статус" = COALESCE($3, "Статус"),
                "Описание" = COALESCE($4, "Описание"),
                "Дата_разрешения" = COALESCE($5, "Дата_разрешения"),
                "Идентификатор_услуги" = COALESCE($6, "Идентификатор_услуги"),
                "Идентификатор_сотрудника" = COALESCE($7, "Идентификатор_сотрудника"),
                "Дата_изменения" = CURRENT_TIMESTAMP
            WHERE "Идентификатор_инцидента" = $8
            RETURNING *
        `, [
            Тип_инцидента,
            Уровень_угрозы,
            Статус,
            Описание,
            Дата_разрешения,
            услуга,
            сотрудник,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Инцидент не найден.' });
        }

        res.json({
            message: 'Инцидент успешно обновлён',
            incident: result.rows[0]
        });
    } catch (err) {
        console.error('[PUT /api/incidents/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при обновлении.' });
    }
});

// DELETE /api/incidents/:id - Удалить инцидент (только admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      DELETE FROM "Инциденты"
      WHERE "Идентификатор_инцидента" = $1
      RETURNING *
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Инцидент не найден.' });
        }

        res.json({ message: 'Инцидент успешно удалён' });
    } catch (err) {
        console.error('[DELETE /api/incidents/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при удалении.' });
    }
});

module.exports = router;





