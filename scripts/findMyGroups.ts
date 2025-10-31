import {TelegramClient} from 'telegram';
import {StringSession} from 'telegram/sessions';
import config from 'config';
import input from 'input';

async function findMyGroups() {
  console.log('🔍 Поиск ваших групп через Telegram Client API...\n');

  const apiId = config.get<number>('telegram.apiId');
  const apiHash = config.get<string>('telegram.apiHash');
  const phoneNumber = config.get<string>('telegram.phoneNumber');
  const sessionName = config.get<string>('telegram.sessionName');

  console.log(`📱 Телефон: ${phoneNumber}`);
  console.log(`🔑 API ID: ${apiId}\n`);

  const stringSession = new StringSession('');

  // Try to use proxy if available
  const proxyConfig = config.has('proxy') && config.get<string>('proxy')
    ? {
        socksType: 5,
        ip: '127.0.0.1', // Will be parsed from proxy string
        port: 1080,
        username: undefined,
        password: undefined,
      }
    : undefined;

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
    useWSS: false, // Try without WebSocket
    proxy: proxyConfig,
    timeout: 30000,
  });

  try {
    console.log('🔐 Подключаюсь к Telegram...');
    await client.start({
      phoneNumber: async () => phoneNumber,
      password: async () => await input.text('Введите пароль 2FA (если есть): '),
      phoneCode: async () =>
        await input.text('Введите код из SMS: '),
      onError: (err) => console.log('❌ Ошибка:', err),
    });

    console.log('✅ Успешно подключились!\n');

    // Save session for future use
    console.log('💾 Сохраняю сессию...');
    const sessionString = client.session.save() as unknown as string;
    console.log('\n📝 Session string (сохраните в local.json):');
    console.log(sessionString);
    console.log('');

    // Get dialogs (chats)
    console.log('📋 Получаю список ваших чатов...\n');
    const dialogs = await client.getDialogs({limit: 100});

    let groupCount = 0;
    const groups: Array<{title: string; id: string; type: string}> = [];

    for (const dialog of dialogs) {
      const entity = dialog.entity;

      // Check if it's a group or channel
      if (entity.className === 'Channel' || entity.className === 'Chat') {
        groupCount++;
        const title = dialog.title || 'Без названия';
        const id = entity.id?.toString() || 'unknown';
        const type = entity.className === 'Channel' ? 'Канал/Супергруппа' : 'Группа';

        groups.push({title, id, type});
      }
    }

    console.log(`\n✅ Найдено групп и каналов: ${groupCount}\n`);
    console.log('=' .repeat(60));

    groups.forEach((group, index) => {
      console.log(`\n${index + 1}. ${group.type}: ${group.title}`);
      console.log(`   ID: -100${group.id}`);
      console.log(`   (или просто: ${group.id})`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 Инструкция:');
    console.log('1. Найдите вашу группу в списке выше');
    console.log('2. Скопируйте ID группы (с минусом!)');
    console.log('3. Добавьте в config/local.json:');
    console.log('   "groupId": -1001234567890\n');
    console.log('4. Скопируйте Session string выше и добавьте в config/local.json:');
    console.log('   "sessionString": "ваша_сессия"\n');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.disconnect();
    process.exit(0);
  }
}

findMyGroups().catch(console.error);
