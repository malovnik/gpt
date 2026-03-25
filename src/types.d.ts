export interface BotOptions {
  token: string;
  userIds: number[];
  groupIds: number[];
  chatCmd: string;
}

export interface GeminiAPIOptions {
  apiKey: string;
  model: string;
  systemMessage?: string;
  timeoutMs?: number;
}

export interface GeminiResponse {
  text: string;
}

export interface APIOptions {
  type: 'gemini';
  gemini: GeminiAPIOptions;
}

export interface Config {
  debug: number;
  bot: BotOptions;
  api: GeminiAPIOptions;
  proxy?: string;
}
