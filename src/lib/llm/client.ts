import OpenAI from 'openai';

let client: OpenAI | null = null;
let clientKey = '';

export function getClient(apiKey: string, baseUrl: string): OpenAI {
  const key = `${apiKey}::${baseUrl}`;
  if (!client || clientKey !== key) {
    client = new OpenAI({ apiKey, baseURL: baseUrl, dangerouslyAllowBrowser: true });
    clientKey = key;
  }
  return client;
}
