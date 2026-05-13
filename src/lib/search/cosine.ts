export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    console.warn(`Vector dimension mismatch: ${a.length} vs ${b.length}. Scoring as zero.`);
    return 0;
  }
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function topK<T extends { embedding_vector: number[] | null }>(
  query: number[],
  items: T[],
  k: number
): T[] {
  return items
    .filter((item) => item.embedding_vector !== null)
    .map((item) => ({ item, score: cosine(query, item.embedding_vector!) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ item }) => item);
}
