#!/bin/bash

# Скрипт для быстрого развертывания на HostVDS
# Использование: bash deploy.sh

set -e  # Остановка при ошибке

echo "🚀 Начало развертывания MovieShop..."

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js сначала."
    exit 1
fi

echo "✅ Node.js найден: $(node --version)"

# Проверка MySQL
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL не установлен. Установите MySQL сначала."
    exit 1
fi

echo "✅ MySQL найден"

# Переход в директорию backend
cd backend

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "⚠️  Файл .env не найден. Создаю шаблон..."
    cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=movieworld
PORT=3000
NODE_ENV=production
EOF
    echo "📝 Пожалуйста, отредактируйте файл backend/.env с правильными данными БД"
    echo "   Затем запустите: mysql -u root -p < db.sql"
    echo "   И затем: pm2 start server.js --name movieworld"
else
    echo "✅ Файл .env найден"
fi

# Проверка PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Установка PM2..."
    npm install -g pm2
else
    echo "✅ PM2 найден"
fi

# Запуск через PM2
echo "🚀 Запуск приложения через PM2..."
pm2 start server.js --name movieworld || pm2 restart movieworld

echo ""
echo "✅ Развертывание завершено!"
echo ""
echo "Полезные команды:"
echo "  pm2 status              - Статус приложения"
echo "  pm2 logs movieworld      - Просмотр логов"
echo "  pm2 restart movieworld   - Перезапуск"
echo "  pm2 stop movieworld      - Остановка"
echo ""
echo "⚠️  Не забудьте:"
echo "  1. Настроить базу данных: mysql -u root -p < db.sql"
echo "  2. Настроить .env файл с правильными данными БД"
echo "  3. Настроить Nginx (см. DEPLOY_HOSTVDS.md)"
echo "  4. Настроить автозапуск: pm2 startup && pm2 save"




