import TelegramBot from 'node-telegram-bot-api';

const token = '7834071969:AAFIOjxKHkKAFtVT6VyFQNuof1VmhXGDlGM';

async function checkBot() {
  console.log('🔍 Проверка бота...\n');

  const bot = new TelegramBot(token, {
    polling: false,
  });

  try {
    console.log('1️⃣ Проверяю токен бота...');
    const botInfo = await bot.getMe();
    console.log('✅ Токен действителен!');
    console.log(`   Бот: @${botInfo.username}`);
    console.log(`   Имя: ${botInfo.first_name}`);
    console.log(`   ID: ${botInfo.id}\n`);

    console.log('2️⃣ Получаю последние обновления...');
    const updates = await bot.getUpdates({limit: 100});
    console.log(`   Получено обновлений: ${updates.length}\n`);

    if (updates.length === 0) {
      console.log('⚠️  Нет доступных обновлений');
      console.log('\n📝 Что нужно сделать:');
      console.log('1. Добавьте бота в вашу закрытую группу');
      console.log('2. Напишите что-нибудь в группе (любое сообщение)');
      console.log('3. Запустите эту команду снова:\n');
      console.log('   npx tsx scripts/simpleCheck.ts\n');
      process.exit(0);
    }

    // Collect unique chats
    const chats = new Map();
    for (const update of updates) {
      const msg = update.message || update.channel_post || update.edited_message;
      if (msg && msg.chat) {
        chats.set(msg.chat.id, msg.chat);
      }
    }

    console.log('3️⃣ Найденные чаты:\n');

    let groupCount = 0;
    for (const [chatId, chat] of chats.entries()) {
      if (chat.type === 'group' || chat.type === 'supergroup') {
        groupCount++;
        console.log(`📢 ГРУППА #${groupCount}`);
        console.log(`   Название: ${chat.title || 'Без названия'}`);
        console.log(`   Chat ID: ${chatId}`);
        console.log(`   Тип: ${chat.type}`);
        if (chat.username) console.log(`   @${chat.username}`);
        console.log('');
      } else if (chat.type === 'private') {
        console.log(`💬 Личный чат`);
        console.log(`   ${chat.first_name || ''} ${chat.last_name || ''}`);
        console.log(`   Chat ID: ${chatId}`);
        console.log('');
      }
    }

    if (groupCount === 0) {
      console.log('⚠️  Групп не найдено в последних обновлениях');
      console.log('\n📝 Что нужно сделать:');
      console.log('1. Убедитесь, что бот добавлен в группу');
      console.log('2. Напишите что-нибудь в группе');
      console.log('3. Запустите команду снова\n');
    } else {
      console.log(`✅ Найдено групп: ${groupCount}`);
      console.log('\n💡 Скопируйте "Chat ID" нужной группы');
      console.log('   и добавьте в config/local.json:');
      console.log('   "groupId": -1001234567890\n');
    }
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    if (error.response) {
      console.error('   Ответ:', error.response.body);
    }
  }

  process.exit(0);
}

checkBot();
