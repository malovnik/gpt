import type TelegramBot from 'node-telegram-bot-api';
import {MessageCollector} from './messageCollector';
import {LinkChecker} from './linkChecker';
import {AnalyzerService} from './analyzerService';
import {MessageSummary} from '../types';
import {logWithTime} from '../utils';
class SummaryScheduler {
  private bot: TelegramBot;
  private targetUserId: number;
  private intervalHours: number;
  private collector: MessageCollector;
  private linkChecker: LinkChecker;
  private analyzer: AnalyzerService;
  private timer: NodeJS.Timeout | null = null;
  private debug: number;

  constructor(
    bot: TelegramBot,
    targetUserId: number,
    intervalHours: number,
    collector: MessageCollector,
    linkChecker: LinkChecker,
    analyzer: AnalyzerService,
    debug = 1
  ) {
    this.bot = bot;
    this.targetUserId = targetUserId;
    this.intervalHours = intervalHours;
    this.collector = collector;
    this.linkChecker = linkChecker;
    this.analyzer = analyzer;
    this.debug = debug;
  }

  start = () => {
    const intervalMs = this.intervalHours * 60 * 60 * 1000;

    if (this.debug >= 1) {
      logWithTime(
        `⏰ Запуск планировщика: сводки каждые ${this.intervalHours} часа(ов)`
      );
    }

    // Run immediately on start (optional)
    // this.generateAndSendSummary();

    // Schedule regular summaries
    this.timer = setInterval(() => {
      this.generateAndSendSummary();
    }, intervalMs);

    logWithTime(
      `✅ Планировщик запущен. Первая сводка через ${this.intervalHours} часа(ов)`
    );
  };

  stop = () => {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logWithTime('⏹️  Планировщик остановлен');
    }
  };

  generateAndSendSummary = async () => {
    try {
      logWithTime('📊 Начинаем генерацию сводки...');

      // Get collected messages
      const messages = this.collector.getMessages();
      const stats = this.collector.getStats();

      if (messages.length === 0) {
        logWithTime('ℹ️  Нет сообщений для анализа, пропускаем сводку');
        return;
      }

      // Check links if any
      const allLinks = messages.flatMap((m) => m.links);
      const verifiedLinks =
        allLinks.length > 0
          ? await this.linkChecker.checkLinks(allLinks)
          : [];

      // Analyze messages
      const summary = await this.analyzer.analyzeMessages(
        messages,
        verifiedLinks
      );

      // Format and send summary
      const summaryText = this.formatSummary(summary, stats);
      await this.sendSummary(summaryText);

      // Clear collected messages
      this.collector.clear();

      logWithTime('✅ Сводка успешно отправлена');
    } catch (error) {
      logWithTime('❌ Ошибка при генерации сводки:', error);
    }
  };

  private formatSummary = (
    summary: MessageSummary,
    stats: {total: number; withLinks: number; uniqueUsers: number}
  ): string => {
    const startTime = summary.period.start.toLocaleString('ru-RU');
    const endTime = summary.period.end.toLocaleString('ru-RU');

    let text = `# 📊 Сводка за ${this.intervalHours} часа(ов)\n\n`;
    text += `**Период:** ${startTime} - ${endTime}\n\n`;

    // Stats
    text += `## 📈 Статистика\n`;
    text += `- Всего сообщений: **${stats.total}**\n`;
    text += `- Уникальных пользователей: **${stats.uniqueUsers}**\n`;
    text += `- Сообщений со ссылками: **${stats.withLinks}**\n\n`;

    // Key discussions
    if (summary.keyDiscussions.length > 0) {
      text += `## 💡 Ключевые выводы\n`;
      summary.keyDiscussions.forEach((discussion, index) => {
        text += `${index + 1}. ${discussion}\n`;
      });
      text += '\n';
    }

    // Interesting messages by category
    const categoryEmojis = {
      question: '❓',
      request: '🙏',
      offer: '🎁',
      important: '⭐',
    };

    const categoryNames = {
      question: 'Вопросы',
      request: 'Запросы',
      offer: 'Предложения',
      important: 'Важное',
    };

    type Category = 'question' | 'request' | 'offer' | 'important';
    const categories: Category[] = ['question', 'request', 'offer', 'important'];

    categories.forEach((category) => {
      const msgs = summary.interestingMessages.filter(
        (m) => m.category === category
      );
      if (msgs.length > 0) {
        text += `## ${categoryEmojis[category]} ${categoryNames[category]}\n`;
        msgs.forEach((msg) => {
          text += `\n**${msg.from}** (ID: ${msg.messageId}):\n`;
          text += `> ${msg.text.substring(0, 200)}${msg.text.length > 200 ? '...' : ''}\n`;
          text += `_${msg.reason}_\n`;
        });
        text += '\n';
      }
    });

    // Verified links
    if (summary.verifiedLinks.length > 0) {
      text += `## 🔗 Проверенные ссылки\n`;
      summary.verifiedLinks.forEach((link) => {
        text += `- [${link.title}](${link.url})\n`;
        if (link.description) {
          text += `  _${link.description}_\n`;
        }
      });
      text += '\n';
    }

    if (
      summary.keyDiscussions.length === 0 &&
      summary.interestingMessages.length === 0
    ) {
      text += `## ℹ️ За этот период не обнаружено особо интересных сообщений\n\n`;
      text += `Было получено ${stats.total} сообщений, но ИИ не выделил значимых дискуссий или вопросов.\n`;
    }

    return text;
  };

  private sendSummary = async (text: string) => {
    try {
      // Try sending with Markdown first
      await this.bot.sendMessage(this.targetUserId, text, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });
    } catch (error) {
      // If markdown parsing fails, send as plain text
      logWithTime('⚠️  Ошибка отправки с markdown, отправляю как текст');
      try {
        await this.bot.sendMessage(this.targetUserId, text, {
          disable_web_page_preview: true,
        });
      } catch (err) {
        logWithTime('❌ Ошибка отправки сообщения:', err);
      }
    }
  };
}

export {SummaryScheduler};
