# ─── Frontend Dockerfile ──────────────────────────────────────────────────────
# Стадия 1: Build (сборка React-приложения)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite собирает статику в папку dist/
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Стадия 2: Serve (раздача через nginx)
FROM nginx:stable-alpine

# Копируем собранные файлы из стадии builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Конфигурация nginx для React SPA (перенаправление всех путей на index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
