# 1. Базовий образ
FROM node:20-alpine

# 2. Робоча папка
WORKDIR /app

# 3. Копіюємо package.json та package-lock.json
COPY package*.json ./

# 4. Встановлюємо залежності
RUN npm install

# 5. Копіюємо весь проект
COPY . .

# 6. Будуємо Next.js
RUN npm run build

# 7. Відкриваємо порт всередині контейнера
EXPOSE 3000

# 8. Стартуємо production
CMD ["npm", "start"]

