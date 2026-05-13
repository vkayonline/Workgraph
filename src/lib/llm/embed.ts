import { getClient } from './client';

let pipelineInstance: any = null;

async function getLocalPipeline() {
  if (pipelineInstance) return pipelineInstance;
  const { pipeline } = await import('@xenova/transformers');
  pipelineInstance = await pipeline('feature-extraction', 'Xenova/gte-small');
  return pipelineInstance;
}

async function embedLocally(text: string): Promise<number[]>;
async function embedLocally(text: string[]): Promise<number[][]>;
async function embedLocally(text: string | string[]): Promise<number[] | number[][]> {
  const pipe = await getLocalPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  const list = output.tolist();
  return Array.isArray(text) ? list : list[0];
}

export async function embedText(
  text: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  source: 'local' | 'api' = 'local'
): Promise<number[]> {
  if (source === 'local') {
    try {
      return await embedLocally(text);
    } catch (err) {
      console.warn('Local embedding failed, falling back to API:', err);
      // Fallback to API if local fails
    }
  }

  try {
    const client = getClient(apiKey, baseUrl);
    const resp = await client.embeddings.create({ model, input: text });
    return resp.data[0].embedding;
  } catch (apiErr) {
    console.error('API embedding failed:', apiErr);
    throw apiErr;
  }
}

export async function embedBatch(
  texts: string[],
  apiKey: string,
  baseUrl: string,
  model: string,
  source: 'local' | 'api' = 'local'
): Promise<number[][]> {
  if (source === 'local') {
    try {
      return await embedLocally(texts);
    } catch (err) {
      console.warn('Local embedding failed, falling back to API:', err);
      // Fallback to API if local fails
    }
  }

  try {
    const client = getClient(apiKey, baseUrl);
    const resp = await client.embeddings.create({ model, input: texts });
    return resp.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  } catch (apiErr) {
    console.error('API embedding failed:', apiErr);
    throw apiErr;
  }
}
