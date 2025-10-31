import OpenAI from 'openai';
import {
  CollectedMessage,
  MessageSummary,
  InterestingMessage,
  VerifiedLink,
  OpenAIOptions,
} from '../types';
import {logWithTime} from '../utils';

class AnalyzerService {
  private client: OpenAI;
  private options: OpenAIOptions;
  private debug: number;

  constructor(options: OpenAIOptions, debug = 1) {
    this.options = options;
    this.debug = debug;
    this.client = new OpenAI({
      apiKey: options.apiKey,
    });
  }

  analyzeMessages = async (
    messages: CollectedMessage[],
    verifiedLinks: VerifiedLink[]
  ): Promise<MessageSummary> => {
    if (messages.length === 0) {
      return this.createEmptySummary();
    }

    if (this.debug >= 1) {
      logWithTime(`🤖 Analyzing ${messages.length} messages with OpenAI...`);
    }

    // Prepare messages for analysis
    const messagesText = this.formatMessagesForAnalysis(messages);

    // Analyze with OpenAI
    const analysis = await this.callOpenAI(messagesText);

    // Parse the response
    const summary = this.parseAnalysis(
      analysis,
      messages,
      verifiedLinks
    );

    if (this.debug >= 1) {
      logWithTime(
        `✅ Analysis complete: ${summary.interestingMessages.length} interesting messages found`
      );
    }

    return summary;
  };

  private formatMessagesForAnalysis = (
    messages: CollectedMessage[]
  ): string => {
    let text = `Всего сообщений: ${messages.length}\n\n`;
    text += 'Список сообщений:\n\n';

    messages.forEach((msg, index) => {
      const userName = msg.from?.first_name || 'Unknown';
      const userId = msg.from?.id || 'unknown';
      text += `[${index + 1}] ID: ${msg.id}\n`;
      text += `Автор: ${userName} (ID: ${userId})\n`;
      text += `Время: ${msg.date.toLocaleString('ru-RU')}\n`;
      text += `Текст: ${msg.text}\n`;
      if (msg.hasLinks) {
        text += `Ссылки: ${msg.links.join(', ')}\n`;
      }
      text += '\n';
    });

    return text;
  };

  private callOpenAI = async (messagesText: string): Promise<string> => {
    const systemPrompt = `Ты - умный аналитик сообщений в образовательной группе Telegram.
Твоя задача - проанализировать сообщения за последние 4 часа и выделить самое важное.

ВАЖНО: Отвечай ТОЛЬКО на русском языке!

Тебе нужно найти:
1. Ключевые выводы из дискуссий (2-3 пункта)
2. Самые интересные сообщения по категориям:
   - ВОПРОСЫ: вопросы, на которые можно ответить и быть полезным
   - ЗАПРОСЫ: просьбы о помощи, поиск чего-то
   - ПРЕДЛОЖЕНИЯ: кто-то что-то предлагает, делится, отдает
   - ВАЖНОЕ: важная информация, анонсы, ссылки на ресурсы

Для каждого интересного сообщения укажи:
- ID сообщения
- Категорию (вопрос/запрос/предложение/важное)
- Краткое описание почему это интересно (1 предложение)

Формат ответа (СТРОГО JSON):
{
  "keyDiscussions": ["вывод 1", "вывод 2", "вывод 3"],
  "interestingMessages": [
    {
      "messageId": 123,
      "category": "question",
      "reason": "Интересный вопрос про..."
    }
  ]
}

Если ничего интересного не найдено, верни пустые массивы.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.options.model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: messagesText},
        ],
        max_tokens: this.options.maxTokens,
        temperature: this.options.temperature,
        response_format: {type: 'json_object'},
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return content;
    } catch (error) {
      logWithTime('❌ Error calling OpenAI:', error);
      throw error;
    }
  };

  private parseAnalysis = (
    analysisJson: string,
    messages: CollectedMessage[],
    verifiedLinks: VerifiedLink[]
  ): MessageSummary => {
    try {
      const analysis = JSON.parse(analysisJson);

      const interestingMessages: InterestingMessage[] = (
        analysis.interestingMessages || []
      ).map((item: {messageId: number; category: string; reason: string}) => {
        const msg = messages.find((m) => m.id === item.messageId);
        return {
          messageId: item.messageId,
          from: msg?.from?.first_name || 'Unknown',
          text: msg?.text || '',
          category: this.normalizeCategory(item.category),
          reason: item.reason,
        };
      });

      return {
        totalMessages: messages.length,
        period: {
          start: messages[0]?.date || new Date(),
          end: messages[messages.length - 1]?.date || new Date(),
        },
        keyDiscussions: analysis.keyDiscussions || [],
        interestingMessages,
        verifiedLinks: verifiedLinks.filter((l) => l.isAccessible),
      };
    } catch (error) {
      logWithTime('❌ Error parsing analysis:', error);
      return this.createEmptySummary();
    }
  };

  private normalizeCategory = (
    category: string
  ): 'question' | 'request' | 'offer' | 'important' => {
    const normalized = category.toLowerCase();
    if (
      normalized.includes('вопрос') ||
      normalized.includes('question')
    ) {
      return 'question';
    }
    if (
      normalized.includes('запрос') ||
      normalized.includes('request')
    ) {
      return 'request';
    }
    if (
      normalized.includes('предложен') ||
      normalized.includes('offer')
    ) {
      return 'offer';
    }
    return 'important';
  };

  private createEmptySummary = (): MessageSummary => {
    return {
      totalMessages: 0,
      period: {
        start: new Date(),
        end: new Date(),
      },
      keyDiscussions: [],
      interestingMessages: [],
      verifiedLinks: [],
    };
  };
}

export {AnalyzerService};
