# Установка зависимостей на HostVDS

## Определение операционной системы

Сначала определите, какая ОС установлена на вашем сервере:

```bash
cat /etc/os-release
```

Или:
```bash
lsb_release -a
```

Это поможет выбрать правильные команды установки.

---

## Вариант 1: Ubuntu/Debian

### Шаг 1: Обновление системы

```bash
sudo apt update
sudo apt upgrade -y
```

### Шаг 2: Установка Node.js и npm

#### Способ А: Через NodeSource (рекомендуется, последняя версия)

```bash
# Установка Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка
node --version
npm --version
```

#### Способ Б: Через пакетный менеджер (проще, но может быть старая версия)

```bash
sudo apt install -y nodejs npm
```

### Шаг 3: Установка MySQL

```bash
# Установка MySQL Server
sudo apt install -y mysql-server

# Запуск и автозапуск MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Настройка безопасности MySQL
sudo mysql_secure_installation
```

**При настройке безопасности:**
- Установите пароль для root (запомните его!)
- Удалите анонимных пользователей: `Y`
- Запретите удаленный вход root: `Y`
- Удалите тестовую БД: `Y`
- Перезагрузите таблицы привилегий: `Y`

### Шаг 4: Установка Git (если еще не установлен)

```bash
sudo apt install -y git
git --version
```

### Шаг 5: Установка PM2 (менеджер процессов Node.js)

```bash
sudo npm install -g pm2
pm2 --version
```

### Шаг 6: Установка Nginx (опционально, но рекомендуется)

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Вариант 2: CentOS/RHEL/Rocky Linux

### Шаг 1: Обновление системы

```bash
sudo yum update -y
# или для новых версий:
sudo dnf update -y
```

### Шаг 2: Установка Node.js и npm

```bash
# Установка Node.js 20.x через NodeSource
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
# или для новых версий:
sudo dnf install -y nodejs

# Проверка
node --version
npm --version
```

### Шаг 3: Установка MySQL (MariaDB)

```bash
# Установка MariaDB (совместима с MySQL)
sudo yum install -y mariadb-server mariadb
# или для новых версий:
sudo dnf install -y mariadb-server mariadb

# Запуск и автозапуск
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Настройка безопасности
sudo mysql_secure_installation
```

### Шаг 4: Установка Git

```bash
sudo yum install -y git
# или
sudo dnf install -y git
```

### Шаг 5: Установка PM2

```bash
sudo npm install -g pm2
```

### Шаг 6: Установка Nginx

```bash
sudo yum install -y nginx
# или
sudo dnf install -y nginx

sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Проверка установки

После установки проверьте все компоненты:

```bash
# Node.js и npm
node --version    # Должно быть v18.x или выше
npm --version     # Должно быть 9.x или выше

# MySQL
mysql --version
sudo systemctl status mysql
# или для CentOS:
sudo systemctl status mariadb

# Git
git --version

# PM2
pm2 --version

# Nginx (если установлен)
nginx -v
sudo systemctl status nginx
```

---

## Настройка MySQL после установки

### 1. Подключение к MySQL

```bash
sudo mysql -u root -p
```

Введите пароль, который вы установили при `mysql_secure_installation`.

### 2. Создание пользователя для приложения (рекомендуется)

В MySQL консоли:

```sql
-- Создание пользователя
CREATE USER 'movieworld_user'@'localhost' IDENTIFIED BY 'надежный_пароль_здесь';

-- Предоставление всех привилегий на базу данных movieworld
GRANT ALL PRIVILEGES ON movieworld.* TO 'movieworld_user'@'localhost';

-- Применение изменений
FLUSH PRIVILEGES;

-- Выход
EXIT;
```

**Запомните пароль** - он понадобится для файла `.env`!

---

## Решение проблем

### Проблема: "Command not found: node"

**Решение:**
```bash
# Проверьте, установлен ли Node.js
which node

# Если не установлен, используйте способ А из раздела выше
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Проблема: "E: Unable to locate package mysql-server"

**Решение:**
```bash
# Обновите список пакетов
sudo apt update

# Попробуйте установить снова
sudo apt install -y mysql-server
```

### Проблема: MySQL не запускается

**Решение:**
```bash
# Проверьте статус
sudo systemctl status mysql

# Попробуйте запустить
sudo systemctl start mysql

# Проверьте логи
sudo journalctl -u mysql -n 50
```

### Проблема: "Permission denied" при установке npm пакетов глобально

**Решение:**
```bash
# Используйте sudo для глобальной установки
sudo npm install -g pm2

# Или настройте npm для работы без sudo (рекомендуется)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Проблема: Старая версия Node.js

**Решение:**
```bash
# Удалите старую версию
sudo apt remove nodejs npm
# или
sudo yum remove nodejs npm

# Установите через NodeSource (см. выше)
```

---

## Минимальная версия для работы

- **Node.js**: версия 18.0.0 или выше
- **npm**: версия 9.0.0 или выше
- **MySQL**: версия 5.7 или выше (или MariaDB 10.3+)

---

## После установки всех зависимостей

Переходите к инструкции по развертыванию:
- `QUICK_DEPLOY_HOSTVDS.md` - быстрый старт
- `DEPLOY_HOSTVDS.md` - подробная инструкция

---

## Быстрая команда для Ubuntu/Debian (все сразу)

```bash
# Обновление
sudo apt update && sudo apt upgrade -y

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation

# Git
sudo apt install -y git

# PM2
sudo npm install -g pm2

# Nginx (опционально)
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Проверка
node --version
npm --version
mysql --version
git --version
pm2 --version
```

---

**Готово! Теперь у вас установлены все необходимые компоненты.** ✅




