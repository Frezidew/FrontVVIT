import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import cors from 'cors';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к MySQL с обработкой ошибок
let pool;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'movieworld',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  // Проверка подключения
  pool.getConnection()
    .then(connection => {
      console.log('✅ Подключение к БД установлено');
      connection.release();
    })
    .catch(err => {
      console.error('❌ Ошибка подключения к БД:', err.message);
      console.log('⚠️  Сервер будет работать в режиме без БД (fallback на localStorage)');
    });
} catch (err) {
  console.error('❌ Ошибка создания пула подключений:', err.message);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы из родительской директории (где находятся HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..')));

// Вспомогательная функция для выполнения запросов с обработкой ошибок
async function dbQuery(query, params = []) {
  if (!pool) {
    throw new Error('База данных не подключена');
  }
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (err) {
    console.error('Ошибка выполнения запроса:', err.message);
    throw err;
  }
}

// Регистрация
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Все поля обязательны!' });
    }

    // Проверка существующего пользователя
    const existing = await dbQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Пользователь уже существует!' });
    }

    // Хеширование пароля
    const hash = await bcrypt.hash(password, 10);
    
    // Вставка нового пользователя
    await dbQuery(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hash]
    );
    
    res.json({ message: 'Регистрация успешна!' });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    if (err.message === 'База данных не подключена') {
      return res.status(503).json({ message: 'Сервис временно недоступен. Попробуйте позже.' });
    }
    res.status(500).json({ message: 'Ошибка регистрации: ' + err.message });
  }
});

// Авторизация
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны!' });
    }

    const rows = await dbQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    res.json({ 
      message: 'Вход выполнен!', 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email 
      } 
    });
  } catch (err) {
    console.error('Ошибка входа:', err);
    if (err.message === 'База данных не подключена') {
      return res.status(503).json({ message: 'Сервис временно недоступен. Попробуйте позже.' });
    }
    res.status(500).json({ message: 'Ошибка входа: ' + err.message });
  }
});

// Отправка предложения новости
app.post('/api/news-suggest', async (req, res) => {
  try {
    const { name, email, title, text, link } = req.body;
    if (!title || !text) {
      return res.status(400).json({ message: 'Заголовок и текст обязательны!' });
    }

    await dbQuery(
      'INSERT INTO news_suggestions (name, email, title, text, link) VALUES (?, ?, ?, ?, ?)',
      [name || null, email || null, title, text, link || null]
    );

    res.json({ message: 'Спасибо! Ваша новость отправлена на рассмотрение.' });
  } catch (err) {
    console.error('Ошибка отправки новости:', err);
    if (err.message === 'База данных не подключена') {
      return res.status(503).json({ message: 'Сервис временно недоступен. Попробуйте позже.' });
    }
    res.status(500).json({ message: 'Ошибка отправки новости: ' + err.message });
  }
});

// Оформление заказа (форма покупки товара)
app.post('/api/order', async (req, res) => {
  try {
    const { 
      movieName, 
      moviePrice, 
      quantity, 
      customerName, 
      customerEmail, 
      customerPhone, 
      deliveryAddress, 
      paymentMethod 
    } = req.body;

    // Валидация обязательных полей
    if (!movieName || !moviePrice || !quantity || !customerName || !customerEmail || !customerPhone || !deliveryAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Все поля обязательны для заполнения!' });
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({ message: 'Некорректный email адрес!' });
    }

    // Валидация телефона (минимум 10 цифр)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(customerPhone) || customerPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'Некорректный номер телефона!' });
    }

    // Валидация количества
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 10) {
      return res.status(400).json({ message: 'Количество должно быть от 1 до 10!' });
    }

    // Расчет общей стоимости
    const price = parseFloat(moviePrice);
    const totalPrice = (price * qty).toFixed(2);

    // Сохранение заказа в БД
    await dbQuery(
      `INSERT INTO orders (
        movie_name, movie_price, quantity, total_price,
        customer_name, customer_email, customer_phone,
        delivery_address, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movieName, price, qty, totalPrice,
        customerName, customerEmail, customerPhone,
        deliveryAddress, paymentMethod
      ]
    );

    res.json({ 
      message: 'Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.',
      orderId: 'pending' // В реальном приложении вернули бы реальный ID
    });
  } catch (err) {
    console.error('Ошибка оформления заказа:', err);
    if (err.message === 'База данных не подключена') {
      return res.status(503).json({ message: 'Сервис временно недоступен. Попробуйте позже.' });
    }
    res.status(500).json({ message: 'Ошибка оформления заказа: ' + err.message });
  }
});

// Логаут (для совместимости с фронтендом)
app.post('/api/logout', (req, res) => {
  res.json({ message: 'Выход выполнен' });
});

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    db: pool ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📁 Статические файлы из: ${path.join(__dirname, '..')}`);
});
