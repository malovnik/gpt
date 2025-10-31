import TelegramBot from 'node-telegram-bot-api';
import {MessageCollector} from './services/messageCollector';
import {LinkChecker} from './services/linkChecker';
import {AnalyzerService} from './services/analyzerService';
import {SummaryScheduler} from './services/summaryScheduler';
import {loadConfig, logWithTime} from './utils';

async function main() {
  const opts = loadConfig();

  logWithTime('🚀 Запуск Telegram Group Monitor...');

  // Validate configuration
  if (opts.monitor.groupId === 0) {
    throw new Error(
      'Ошибка: monitor.groupId не настроен в config/local.json'
    );
  }
  if (opts.monitor.targetUserId === 0) {
    throw new Error(
      'Ошибка: monitor.targetUserId не настроен в config/local.json'
    );
  }

  // Initialize Telegram Bot
  const bot = new TelegramBot(opts.bot.token, {
    polling: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: {proxy: opts.proxy} as any,
  });

  const botInfo = await bot.getMe();
  logWithTime(`🤖 Бот @${botInfo.username} успешно запущен`);
  logWithTime(`👁️  Мониторинг группы: ${opts.monitor.groupId}`);
  logWithTime(`📬 Сводки будут отправляться пользователю: ${opts.monitor.targetUserId}`);
  logWithTime(`⏰ Интервал сводок: ${opts.monitor.summaryIntervalHours} час(а)`);

  // Initialize services
  const messageCollector = new MessageCollector(
    opts.monitor.groupId,
    opts.debug
  );
  const linkChecker = new LinkChecker(opts.debug);
  const analyzerService = new AnalyzerService(opts.openai, opts.debug);

  // Initialize scheduler
  const scheduler = new SummaryScheduler(
    bot,
    opts.monitor.targetUserId,
    opts.monitor.summaryIntervalHours,
    messageCollector,
    linkChecker,
    analyzerService,
    opts.debug
  );

  // Start collecting messages
  bot.on('message', (msg) => {
    messageCollector.collect(msg);
  });

  // Start scheduler
  scheduler.start();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logWithTime('🛑 Получен сигнал остановки...');
    scheduler.stop();
    bot.stopPolling();
    logWithTime('👋 Бот остановлен');
    process.exit(0);
  });

  logWithTime('✅ Все сервисы запущены и работают');
}

main().catch((err) => {
  console.error('❌ Критическая ошибка:', err);
  process.exit(1);
});
