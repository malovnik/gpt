#!/bin/bash
# Setup script for Telegram Group Monitor on Mac

cd "$(dirname "$0")"

echo "🚀 Установка Telegram Group Monitor"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    echo ""
    echo "Установите Node.js с https://nodejs.org/"
    echo "Рекомендуемая версия: 18.x или новее"
    echo ""
    read -p "Нажмите Enter для выхода..."
    exit 1
fi

echo "✅ Node.js установлен: $(node --version)"

# Check if pnpm is installed, if not install it
if ! command -v pnpm &> /dev/null; then
    echo "📦 Устанавливаю pnpm..."
    npm install -g pnpm
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка установки pnpm"
        read -p "Нажмите Enter для выхода..."
        exit 1
    fi
fi

echo "✅ pnpm установлен: $(pnpm --version)"
echo ""

# Install dependencies
echo "📥 Устанавливаю зависимости..."
pnpm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Ошибка установки зависимостей"
    read -p "Нажмите Enter для выхода..."
    exit 1
fi

echo ""
echo "🔨 Компилирую TypeScript..."
pnpm build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Ошибка компиляции"
    read -p "Нажмите Enter для выхода..."
    exit 1
fi

echo ""
echo "✅ Установка завершена успешно!"
echo ""
echo "📝 Следующие шаги:"
echo "1. Создайте файл config/local.json с вашими настройками"
echo "2. Запустите find-groups.command чтобы найти ID вашей группы"
echo "3. Добавьте groupId и OpenAI ключ в config/local.json"
echo "4. Запустите start.command для запуска мониторинга"
echo ""
read -p "Нажмите Enter для завершения..."
