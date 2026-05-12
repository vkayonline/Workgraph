import { getClient } from './client';

export interface ModelInfo {
  id: string;
  created?: number;
}

let cache: { models: ModelInfo[]; key: string; ts: number } | null = null;
const TTL = 5 * 60 * 1000;

export async function listModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
  const key = `${apiKey}::${baseUrl}`;
  if (cache && cache.key === key && Date.now() - cache.ts < TTL) {
    return cache.models;
  }

  const client = getClient(apiKey, baseUrl);
  const resp = await client.models.list();
  const models = resp.data
    .map((m) => ({ id: m.id, created: (m as { created?: number }).created }))
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0));

  cache = { models, key, ts: Date.now() };
  return models;
}
