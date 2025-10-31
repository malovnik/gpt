import config from 'config';
import {Config} from './types';

function loadConfig(): Config {
  function tryGet<T>(key: string): T | undefined {
    if (!config.has(key)) {
      return undefined;
    } else {
      return config.get<T>(key);
    }
  }

  const proxy = tryGet<string>('proxy') || process.env.http_proxy;

  const cfg: Config = {
    debug: tryGet<number>('debug') || 1,
    telegram: {
      apiId: config.get<number>('telegram.apiId'),
      apiHash: config.get<string>('telegram.apiHash'),
      phoneNumber: config.get<string>('telegram.phoneNumber'),
      sessionName: tryGet<string>('telegram.sessionName') || 'telegram_monitor',
    },
    monitor: {
      groupId: config.get<number | string>('monitor.groupId'),
      targetUserId: tryGet<number | string>('monitor.targetUserId') || 'me',
      summaryIntervalHours:
        tryGet<number>('monitor.summaryIntervalHours') || 4,
      checkLinksEnabled:
        tryGet<boolean>('monitor.checkLinksEnabled') ?? true,
    },
    openai: {
      apiKey: config.get<string>('openai.apiKey'),
      model: tryGet<string>('openai.model') || 'gpt-4-turbo-preview',
      maxTokens: tryGet<number>('openai.maxTokens') || 4000,
      temperature: tryGet<number>('openai.temperature') || 0.7,
    },
    proxy: proxy,
  };

  return cfg;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logWithTime(...args: any[]) {
  console.log(new Date().toLocaleString(), ...args);
}

export {loadConfig, logWithTime};
