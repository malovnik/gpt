#!/bin/bash
# Start Telegram Group Monitor

cd "$(dirname "$0")"

echo "🚀 Запуск Telegram Group Monitor"
echo "================================="
echo ""

# Check if config exists
if [ ! -f "config/local.json" ]; then
    echo "❌ Файл config/local.json не найден!"
    echo ""
    echo "Сначала запустите find-groups.command чтобы настроить конфигурацию"
    echo ""
    read -p "Нажмите Enter для выхода..."
    exit 1
fi

# Check if built
if [ ! -d "dist" ]; then
    echo "❌ Проект не скомпилирован!"
    echo ""
    echo "Сначала запустите setup.command"
    echo ""
    read -p "Нажмите Enter для выхода..."
    exit 1
fi

echo "▶️  Запуск мониторинга..."
echo ""
echo "Программа будет:"
echo "  - Собирать сообщения из вашей группы"
echo "  - Каждые 4 часа анализировать их через OpenAI"
echo "  - Отправлять вам сводку в личные сообщения"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""
echo "=========================================="
echo ""

pnpm start

echo ""
echo "Программа остановлена"
read -p "Нажмите Enter для завершения..."
