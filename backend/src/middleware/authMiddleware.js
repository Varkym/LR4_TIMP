const jwt = require('jsonwebtoken');

// Middleware для проверки JWT-токена
const verifyToken = (req, res, next) => {
    // Получаем токен из заголовка Authorization
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Доступ запрещен. Токен не предоставлен.' });
    }

    try {
        // Проверяем токен с помощью секретного ключа
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Сохраняем данные пользователя в запросе
        next(); // Переходим к следующему обработчику
    } catch (err) {
        return res.status(401).json({ error: 'Недействительный или истекший токен.' });
    }
};

// Middleware для проверки ролей (admin, operator, viewer)
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Пользователь не авторизован.' });
        }
        // Если роли пользователя нет в списке разрешенных
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Недостаточно прав для выполнения действия.' });
        }
        next();
    };
};

module.exports = { verifyToken, checkRole };