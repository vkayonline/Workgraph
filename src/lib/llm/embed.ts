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

export async function embedText(text: string): Promise<number[]> {
  return await embedLocally(text);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  return await embedLocally(texts);
}
