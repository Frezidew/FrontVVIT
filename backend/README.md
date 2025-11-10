# Инструкция по настройке и запуску бэкенда

## Требования
- Node.js (версия 18 или выше)
- MySQL (версия 5.7 или выше)

## Установка зависимостей

```bash
cd backend
npm install
```

## Настройка базы данных

1. Создайте базу данных MySQL:
```bash
mysql -u root -p < db.sql
```

Или выполните SQL-скрипт вручную через MySQL Workbench или другой клиент.

2. Создайте файл `.env` в папке `backend` на основе `.env.example`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=ваш_пароль
DB_NAME=movieworld
PORT=3000
```

## Запуск сервера

```bash
npm start
```

Сервер будет доступен по адресу: http://localhost:3000

## Примечания

- Если база данных не подключена, сервер все равно запустится, но будет работать в режиме fallback (фронтенд будет использовать localStorage)
- Все статические файлы (HTML, CSS, JS) раздаются из корневой директории проекта
- API endpoints:
  - `POST /api/register` - регистрация пользователя
  - `POST /api/login` - авторизация пользователя
  - `POST /api/logout` - выход из системы
  - `POST /api/news-suggest` - отправка предложения новости
  - `GET /api/health` - проверка состояния сервера

