#!/bin/bash
# Find your Telegram groups script

cd "$(dirname "$0")"

echo "🔍 Поиск ваших Telegram групп"
echo "=============================="
echo ""

# Check if config exists
if [ ! -f "config/local.json" ]; then
    echo "❌ Файл config/local.json не найден!"
    echo ""
    echo "Создайте файл config/local.json со следующим содержимым:"
    echo ""
    cat << 'EOF'
{
  "debug": 1,
  "telegram": {
    "apiId": 18713108,
    "apiHash": "4638ab0b5ea779cb642d78d50b316bc3",
    "phoneNumber": "+79623959707",
    "sessionName": "telegram_monitor"
  },
  "monitor": {
    "groupId": 0,
    "targetUserId": "me",
    "summaryIntervalHours": 4,
    "checkLinksEnabled": true
  },
  "openai": {
    "apiKey": "YOUR_OPENAI_KEY_HERE",
    "model": "gpt-4-turbo-preview",
    "maxTokens": 4000,
    "temperature": 0.7
  },
  "proxy": ""
}
EOF
    echo ""
    read -p "Нажмите Enter для выхода..."
    exit 1
fi

echo "📱 При первом запуске вам нужно будет:"
echo "   1. Ввести SMS код из Telegram"
echo "   2. Если есть 2FA - ввести пароль"
echo ""
echo "Запускаю поиск групп..."
echo ""

npx tsx scripts/findMyGroups.ts

echo ""
read -p "Нажмите Enter для завершения..."
