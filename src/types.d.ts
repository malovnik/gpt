export interface TelegramOptions {
  apiId: number;
  apiHash: string;
  phoneNumber: string;
  sessionName: string;
}

export interface MonitorOptions {
  groupId: number | string;
  targetUserId: number | string;
  summaryIntervalHours: number;
  checkLinksEnabled: boolean;
}

export interface OpenAIOptions {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface Config {
  debug: number;
  telegram: TelegramOptions;
  monitor: MonitorOptions;
  openai: OpenAIOptions;
  proxy?: string;
}

export interface CollectedMessage {
  id: number;
  from: {
    id?: number;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  text: string;
  date: Date;
  replyTo?: number;
  hasLinks: boolean;
  links: string[];
}

export interface MessageSummary {
  totalMessages: number;
  period: {
    start: Date;
    end: Date;
  };
  keyDiscussions: string[];
  interestingMessages: InterestingMessage[];
  verifiedLinks: VerifiedLink[];
}

export interface InterestingMessage {
  messageId: number;
  from: string;
  text: string;
  category: 'question' | 'request' | 'offer' | 'important';
  reason: string;
}

export interface VerifiedLink {
  url: string;
  title: string;
  isAccessible: boolean;
  description?: string;
}
