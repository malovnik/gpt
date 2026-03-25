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

  const apiCfg: GeminiAPIOptions = {
    apiKey: config.get<string>('api.apiKey'),
    model: tryGet<string>('api.model') || 'gemini-3.1-flash-light-preview',
    systemMessage: tryGet<string>('api.systemMessage') || undefined,
    timeoutMs: tryGet<number>('api.timeoutMs') || undefined,
  };

  const cfg: Config = {
    debug: tryGet<number>('debug') || 1,
    bot: {
      token: config.get<string>('bot.token'),
      userIds: tryGet<number[]>('bot.userIds') || [],
      groupIds: tryGet<number[]>('bot.groupIds') || [],
      chatCmd: tryGet<string>('bot.chatCmd') || '/chat',
    },
    api: apiCfg,
    proxy: tryGet<string>('proxy') || undefined,
  };

  return cfg;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logWithTime(...args: any[]) {
  console.log(new Date().toLocaleString(), ...args);
}

export {loadConfig, logWithTime};
