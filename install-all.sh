#!/bin/bash

# Скрипт автоматической установки всех зависимостей для MovieShop
# Использование: bash install-all.sh

set -e

echo "🚀 Установка зависимостей для MovieShop..."
echo ""

# Определение ОС
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ Не удалось определить операционную систему"
    exit 1
fi

echo "📋 Обнаружена ОС: $OS"
echo ""

# Функция для Ubuntu/Debian
install_ubuntu() {
    echo "📦 Обновление списка пакетов..."
    sudo apt update
    
    echo "📦 Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    
    echo "📦 Установка MySQL..."
    sudo apt install -y mysql-server
    sudo systemctl start mysql
    sudo systemctl enable mysql
    
    echo "📦 Установка Git..."
    sudo apt install -y git
    
    echo "📦 Установка PM2..."
    sudo npm install -g pm2
    
    echo "📦 Установка Nginx (опционально)..."
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
}

# Функция для CentOS/RHEL
install_centos() {
    echo "📦 Обновление системы..."
    if command -v dnf &> /dev/null; then
        sudo dnf update -y
        PKG_MGR="dnf"
    else
        sudo yum update -y
        PKG_MGR="yum"
    fi
    
    echo "📦 Установка Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo $PKG_MGR install -y nodejs
    
    echo "📦 Установка MariaDB (MySQL)..."
    sudo $PKG_MGR install -y mariadb-server mariadb
    sudo systemctl start mariadb
    sudo systemctl enable mariadb
    
    echo "📦 Установка Git..."
    sudo $PKG_MGR install -y git
    
    echo "📦 Установка PM2..."
    sudo npm install -g pm2
    
    echo "📦 Установка Nginx..."
    sudo $PKG_MGR install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
}

# Установка в зависимости от ОС
case $OS in
    ubuntu|debian)
        install_ubuntu
        ;;
    centos|rhel|rocky|fedora)
        install_centos
        ;;
    *)
        echo "❌ Неподдерживаемая ОС: $OS"
        echo "Пожалуйста, установите зависимости вручную (см. INSTALL_DEPENDENCIES.md)"
        exit 1
        ;;
esac

echo ""
echo "✅ Установка завершена!"
echo ""
echo "📋 Проверка установленных компонентов:"
echo ""

# Проверка версий
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js не установлен"
fi

if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm не установлен"
fi

if command -v mysql &> /dev/null; then
    echo "✅ MySQL: $(mysql --version | head -n1)"
else
    echo "❌ MySQL не установлен"
fi

if command -v git &> /dev/null; then
    echo "✅ Git: $(git --version)"
else
    echo "❌ Git не установлен"
fi

if command -v pm2 &> /dev/null; then
    echo "✅ PM2: $(pm2 --version)"
else
    echo "❌ PM2 не установлен"
fi

if command -v nginx &> /dev/null; then
    echo "✅ Nginx: $(nginx -v 2>&1)"
else
    echo "⚠️  Nginx не установлен (опционально)"
fi

echo ""
echo "⚠️  ВАЖНО: Теперь нужно настроить MySQL:"
echo "   1. Запустите: sudo mysql_secure_installation"
echo "   2. Установите пароль для root пользователя"
echo "   3. Затем переходите к развертыванию приложения"
echo ""
echo "📖 Следующие шаги:"
echo "   - См. QUICK_DEPLOY_HOSTVDS.md для быстрого старта"
echo "   - Или DEPLOY_HOSTVDS.md для подробной инструкции"

