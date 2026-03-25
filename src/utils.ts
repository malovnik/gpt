import config from 'config';
import {Config, GeminiAPIOptions} from './types';

function loadConfig(): Config {
  function tryGet<T>(key: string): T | undefined {
    if (!config.has(key)) {
      return undefined;
    } else {
      return config.get<T>(key);
    }
  }

  // Environment variables take priority (for Railway / Docker deployments)
  const apiCfg: GeminiAPIOptions = {
    apiKey:
      process.env.GEMINI_API_KEY ||
      tryGet<string>('api.apiKey') ||
      '',
    model:
      process.env.GEMINI_MODEL ||
      tryGet<string>('api.model') ||
      'gemini-3.1-flash-light-preview',
    systemMessage:
      process.env.GEMINI_SYSTEM_MESSAGE ||
      tryGet<string>('api.systemMessage') ||
      undefined,
    timeoutMs:
      (process.env.GEMINI_TIMEOUT_MS
        ? Number(process.env.GEMINI_TIMEOUT_MS)
        : undefined) ||
      tryGet<number>('api.timeoutMs') ||
      undefined,
  };

  const botToken =
    process.env.TELEGRAM_BOT_TOKEN ||
    tryGet<string>('bot.token') ||
    '';

  const botUserIds = process.env.TELEGRAM_USER_IDS
    ? process.env.TELEGRAM_USER_IDS.split(',').map(Number)
    : tryGet<number[]>('bot.userIds') || [];

  const botGroupIds = process.env.TELEGRAM_GROUP_IDS
    ? process.env.TELEGRAM_GROUP_IDS.split(',').map(Number)
    : tryGet<number[]>('bot.groupIds') || [];

  const cfg: Config = {
    debug: process.env.DEBUG ? Number(process.env.DEBUG) : tryGet<number>('debug') || 1,
    bot: {
      token: botToken,
      userIds: botUserIds,
      groupIds: botGroupIds,
      chatCmd: process.env.CHAT_CMD || tryGet<string>('bot.chatCmd') || '/chat',
    },
    api: apiCfg,
    proxy: process.env.HTTP_PROXY || tryGet<string>('proxy') || undefined,
  };

  return cfg;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logWithTime(...args: any[]) {
  console.log(new Date().toLocaleString(), ...args);
}

export {loadConfig, logWithTime};
