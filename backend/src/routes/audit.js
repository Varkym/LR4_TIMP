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
// PUT /api/auth/change-password — Смена пароля
router.put('/change-password', verifyToken, async (req, res) => {
    const { newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов.' });
    }

    try {
        // 1. Получаем текущий хеш пароля из БД
        const userResult = await pool.query(
            'SELECT "Хеш_пароля" FROM "Пользователи" WHERE "Идентификатор_пользователя" = $1',
            [userId]
        );
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден.' });

        const currentHash = userResult.rows[0].Хеш_пароля;

        // 2. Проверяем, не совпадает ли новый пароль со старым
        const isSame = await bcrypt.compare(newPassword, currentHash);
        if (isSame) {
            // Вот это уведомление об ошибке, если пароль такой же!
            return res.status(400).json({ error: 'Новый пароль не должен совпадать со старым.' });
        }

        // 3. Хешируем новый пароль и обновляем в БД
        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE "Пользователи" SET "Хеш_пароля" = $1 WHERE "Идентификатор_пользователя" = $2',
            [newHash, userId]
        );

        res.json({ message: 'Пароль успешно изменён.' });
    } catch (err) {
        console.error('[PUT /change-password]', err);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

module.exports = router;