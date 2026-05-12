import { getClient } from './client';

export async function embedText(
  text: string,
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<number[]> {
  const client = getClient(apiKey, baseUrl);
  const resp = await client.embeddings.create({ model, input: text });
  return resp.data[0].embedding;
}

export async function embedBatch(
  texts: string[],
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<number[][]> {
  const client = getClient(apiKey, baseUrl);
  const resp = await client.embeddings.create({ model, input: texts });
  return resp.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}
