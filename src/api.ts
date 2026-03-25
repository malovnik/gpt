import {GoogleGenerativeAI, type ChatSession} from '@google/generative-ai';
import {GeminiAPIOptions, GeminiResponse} from './types';
import {logWithTime} from './utils';

class ChatGPT {
  debug: number;
  protected _opts: GeminiAPIOptions;
  protected _genAI: GoogleGenerativeAI;
  protected _chat: ChatSession | undefined;
  protected _timeoutMs: number | undefined;

  constructor(apiOpts: GeminiAPIOptions, debug = 1) {
    this.debug = debug;
    this._opts = apiOpts;
    this._genAI = new GoogleGenerativeAI(apiOpts.apiKey);
    this._timeoutMs = apiOpts.timeoutMs;
  }

  init = async () => {
    this._startNewChat();
    logWithTime('🔮 Gemini API has started...');
  };

  protected _startNewChat = () => {
    const model = this._genAI.getGenerativeModel({
      model: this._opts.model,
      systemInstruction: this._opts.systemMessage || undefined,
    });
    this._chat = model.startChat({history: []});
  };

  sendMessage = async (
    text: string,
    onProgress?: (res: GeminiResponse) => void
  ): Promise<GeminiResponse | undefined> => {
    if (!this._chat) return;

    if (onProgress) {
      // Streaming path
      const result = await this._chat.sendMessageStream(text);
      let fullText = '';
      for await (const chunk of result.stream) {
        fullText += chunk.text();
        onProgress({text: fullText});
      }
      return {text: fullText};
    } else {
      // Non-streaming path
      const result = await this._chat.sendMessage(text);
      return {text: result.response.text()};
    }
  };

  resetThread = async () => {
    this._startNewChat();
  };

  refreshSession = async () => {
    this._startNewChat();
  };
}

export {ChatGPT};
