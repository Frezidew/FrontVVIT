-- Создание базы данных для MovieShop
CREATE DATABASE IF NOT EXISTS movieworld CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE movieworld;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица новостей/предложений (для формы отправки новостей)
CREATE TABLE IF NOT EXISTS news_suggestions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица заказов (для формы покупки товара)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie_name VARCHAR(255) NOT NULL,
  movie_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  delivery_address TEXT NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_email (customer_email),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

