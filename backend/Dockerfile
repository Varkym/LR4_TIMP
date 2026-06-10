# ─── Backend Dockerfile ───────────────────────────────────────────────────────
# Образ Node.js (LTS-версия, Alpine = лёгкий)
FROM node:20-alpine

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
# (делается отдельно, чтобы слой кешировался и npm install
#  не запускался заново при каждом изменении кода)
COPY package*.json ./
RUN npm install --omit=dev

# Копируем весь остальной код
COPY . .

# Создаём папку для загрузки фотографий
RUN mkdir -p uploads/employees

# Порт, который слушает приложение
EXPOSE 3000

# Команда запуска
CMD ["node", "src/app.js"]
