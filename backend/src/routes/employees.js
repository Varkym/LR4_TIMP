const express = require('express');
const pool = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Настройка multer для загрузки фотографий
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'employees');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `employee_${req.params.id}_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Допустимы только изображения (JPEG, PNG, GIF, WebP)'));
        }
    }
});

// GET /api/employees - Получить всех сотрудников
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        "Идентификатор_сотрудника",
        "Фамилия",
        "Имя",
        "Отчество",
        "Должность",
        "Подразделение",
        "Email",
        "Телефон",
        "Активен",
        "Фото_путь"
      FROM "Сотрудники"
      WHERE "Активен" = TRUE
      ORDER BY "Фамилия" ASC
    `);

        res.json(result.rows);
    } catch (err) {
        // Если столбец Фото_путь не существует, повторяем без него
        if (err.message && err.message.includes('Фото_путь')) {
            try {
                const result = await pool.query(`
          SELECT 
            "Идентификатор_сотрудника",
            "Фамилия",
            "Имя",
            "Отчество",
            "Должность",
            "Подразделение",
            "Email",
            "Телефон",
            "Активен"
          FROM "Сотрудники"
          WHERE "Активен" = TRUE
          ORDER BY "Фамилия" ASC
        `);
                res.json(result.rows);
            } catch (err2) {
                console.error('[GET /api/employees Error]', err2);
                res.status(500).json({ error: 'Ошибка сервера при получении сотрудников.' });
            }
        } else {
            console.error('[GET /api/employees Error]', err);
            res.status(500).json({ error: 'Ошибка сервера при получении сотрудников.' });
        }
    }
});

// GET /api/employees/:id - Получить сотрудника по ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      SELECT * FROM "Сотрудники"
      WHERE "Идентификатор_сотрудника" = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Сотрудник не найден.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[GET /api/employees/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

// POST /api/employees/:id/photo - Загрузка фотографии сотрудника (только admin)
router.post('/:id/photo', verifyToken, checkRole(['admin']), upload.single('photo'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'Файл не предоставлен.' });
        }

        const photoPath = `/uploads/employees/${req.file.filename}`;

        // Пробуем обновить поле Фото_путь
        try {
            await pool.query(`
        UPDATE "Сотрудники"
        SET "Фото_путь" = $1
        WHERE "Идентификатор_сотрудника" = $2
      `, [photoPath, id]);
        } catch (dbErr) {
            // Если столбец не существует, добавляем его
            if (dbErr.message && dbErr.message.includes('Фото_путь')) {
                await pool.query(`ALTER TABLE "Сотрудники" ADD COLUMN IF NOT EXISTS "Фото_путь" VARCHAR(500)`);
                await pool.query(`
          UPDATE "Сотрудники"
          SET "Фото_путь" = $1
          WHERE "Идентификатор_сотрудника" = $2
        `, [photoPath, id]);
            } else {
                throw dbErr;
            }
        }

        res.json({
            message: 'Фотография успешно загружена',
            photoPath
        });
    } catch (err) {
        console.error('[POST /api/employees/:id/photo Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при загрузке фотографии.' });
    }
});

// POST /api/employees - Создать нового сотрудника (только admin)
router.post('/', verifyToken, checkRole(['admin']), [
    body('Фамилия').notEmpty().withMessage('Укажите фамилию'),
    body('Имя').notEmpty().withMessage('Укажите имя'),
    body('Должность').notEmpty().withMessage('Укажите должность'),
    body('Подразделение').notEmpty().withMessage('Укажите подразделение')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { Фамилия, Имя, Отчество, Должность, Подразделение, Email, Телефон } = req.body;

    try {
        const result = await pool.query(`
      INSERT INTO "Сотрудники" ("Фамилия", "Имя", "Отчество", "Должность", "Подразделение", "Email", "Телефон")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [Фамилия, Имя, Отчество || null, Должность, Подразделение, Email || null, Телефон || null]);

        res.status(201).json({
            message: 'Сотрудник успешно добавлен',
            employee: result.rows[0]
        });
    } catch (err) {
        console.error('[POST /api/employees Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при добавлении сотрудника.' });
    }
});

// PUT /api/employees/:id - Обновить сотрудника (только admin)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { Фамилия, Имя, Отчество, Должность, Подразделение, Email, Телефон, Активен } = req.body;

        const result = await pool.query(`
      UPDATE "Сотрудники"
      SET 
        "Фамилия" = COALESCE($1, "Фамилия"),
        "Имя" = COALESCE($2, "Имя"),
        "Отчество" = COALESCE($3, "Отчество"),
        "Должность" = COALESCE($4, "Должность"),
        "Подразделение" = COALESCE($5, "Подразделение"),
        "Email" = COALESCE($6, "Email"),
        "Телефон" = COALESCE($7, "Телефон"),
        "Активен" = COALESCE($8, "Активен")
      WHERE "Идентификатор_сотрудника" = $9
      RETURNING *
    `, [Фамилия, Имя, Отчество, Должность, Подразделение, Email, Телефон, Активен, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Сотрудник не найден.' });
        }

        res.json({
            message: 'Сотрудник успешно обновлён',
            employee: result.rows[0]
        });
    } catch (err) {
        console.error('[PUT /api/employees/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при обновлении.' });
    }
});

// DELETE /api/employees/:id - Удалить сотрудника (только admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      DELETE FROM "Сотрудники"
      WHERE "Идентификатор_сотрудника" = $1
      RETURNING *
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Сотрудник не найден.' });
        }

        res.json({ message: 'Сотрудник успешно удалён' });
    } catch (err) {
        console.error('[DELETE /api/employees/:id Error]', err);
        res.status(500).json({ error: 'Ошибка сервера при удалении.' });
    }
});

module.exports = router;