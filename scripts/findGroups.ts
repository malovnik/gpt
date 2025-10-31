import TelegramBot from 'node-telegram-bot-api';
import config from 'config';

async function findGroups() {
  const token = config.get<string>('bot.token');
  const bot = new TelegramBot(token, {polling: false});

  console.log('🔍 Поиск групп, где добавлен бот...\n');

  try {
    // Get bot info
    const botInfo = await bot.getMe();
    console.log(`✅ Бот: @${botInfo.username} (ID: ${botInfo.id})`);
    console.log(`   Имя: ${botInfo.first_name}\n`);

    // Get updates to see recent messages from groups
    console.log('📋 Получаю последние обновления...\n');
    const updates = await bot.getUpdates({limit: 100, timeout: 10});

    if (updates.length === 0) {
      console.log('⚠️  Нет доступных обновлений.');
      console.log('\nℹ️  Как получить список групп:');
      console.log('1. Напишите что-нибудь в группе, где добавлен бот');
      console.log('2. Или добавьте бота в нужную группу прямо сейчас');
      console.log('3. Запустите эту команду снова через несколько секунд\n');
      process.exit(0);
    }

    // Extract unique chats
    const chats = new Map<number, TelegramBot.Chat>();

    for (const update of updates) {
      const msg = update.message || update.channel_post;
      if (msg && msg.chat) {
        chats.set(msg.chat.id, msg.chat);
      }
    }

    console.log(`📊 Найдено уникальных чатов: ${chats.size}\n`);

    // Display all chats
    let groupNumber = 1;
    for (const [chatId, chat] of chats.entries()) {
      const type = chat.type;
      const title = chat.title || 'Без названия';
      const username = chat.username ? `@${chat.username}` : '';

      if (type === 'group' || type === 'supergroup') {
        console.log(`${groupNumber}. 📢 ГРУППА`);
        console.log(`   Название: ${title}`);
        console.log(`   ID: ${chatId}`);
        if (username) console.log(`   Username: ${username}`);
        console.log(`   Тип: ${type}`);
        console.log('');
        groupNumber++;
      } else if (type === 'private') {
        console.log(`   💬 Личный чат`);
        console.log(`   Имя: ${title}`);
        console.log(`   ID: ${chatId}`);
        console.log('');
      } else if (type === 'channel') {
        console.log(`   📣 Канал`);
        console.log(`   Название: ${title}`);
        console.log(`   ID: ${chatId}`);
        if (username) console.log(`   Username: ${username}`);
        console.log('');
      }
    }

    console.log('\n✅ Поиск завершен!');
    console.log(
      '\n💡 Скопируйте ID нужной группы и добавьте в config/local.json в поле "groupId"'
    );
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }

  process.exit(0);
}

findGroups().catch(console.error);
