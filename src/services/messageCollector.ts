import type TelegramBot from 'node-telegram-bot-api';
import {CollectedMessage} from '../types';
import {logWithTime} from '../utils';

class MessageCollector {
  private messages: CollectedMessage[] = [];
  private groupId: number;
  private debug: number;

  constructor(groupId: number, debug = 1) {
    this.groupId = groupId;
    this.debug = debug;
  }

  collect = (msg: TelegramBot.Message) => {
    // Only collect messages from the monitored group
    if (msg.chat.id !== this.groupId) return;

    // Only collect text messages
    if (!msg.text || msg.text.trim() === '') return;

    // Extract links from message
    const links = this.extractLinks(msg.text);

    const collectedMsg: CollectedMessage = {
      id: msg.message_id,
      from: msg.from,
      text: msg.text,
      date: new Date(msg.date * 1000),
      replyTo: msg.reply_to_message?.message_id,
      hasLinks: links.length > 0,
      links: links,
    };

    this.messages.push(collectedMsg);

    if (this.debug >= 2) {
      logWithTime(
        `📝 Collected message #${msg.message_id} from ${msg.from?.first_name}`
      );
    }
  };

  private extractLinks = (text: string): string[] => {
    // Regex to match URLs
    const urlRegex =
      /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
    const matches = text.match(urlRegex);
    if (!matches) return [];

    // Normalize URLs (add https:// if missing)
    return matches.map((url) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      } else if (url.startsWith('www.')) {
        return `https://${url}`;
      } else {
        return `https://${url}`;
      }
    });
  };

  getMessages = (): CollectedMessage[] => {
    return [...this.messages];
  };

  clear = () => {
    const count = this.messages.length;
    this.messages = [];
    if (this.debug >= 1) {
      logWithTime(`🗑️  Cleared ${count} collected messages`);
    }
    return count;
  };

  getStats = () => {
    return {
      total: this.messages.length,
      withLinks: this.messages.filter((m) => m.hasLinks).length,
      uniqueUsers: new Set(this.messages.map((m) => m.from?.id)).size,
    };
  };
}

export {MessageCollector};
