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

export function topK<T extends { 
  embedding_vector: number[] | null, 
  timestamp: number, 
  entry_type?: string 
}>(
  query: number[],
  items: T[],
  k: number
): T[] {
  const now = Date.now();
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

  return items
    .filter((item) => item.embedding_vector !== null)
    .map((item) => {
      const semanticSim = cosine(query, item.embedding_vector!);
      
      // Recency Factor (0 to 1): 1.0 if new, decaying over time
      const age = now - item.timestamp;
      const recencyFactor = Math.exp(-age / (ONE_WEEK * 4)); // Exp decay, ~0.37 after a month
      
      // Gravity Factor: Certain entry types are more "dense" with operational value
      let gravityFactor = 0.5;
      if (item.entry_type === 'decision' || item.entry_type === 'issue') gravityFactor = 1.0;
      else if (item.entry_type === 'solution' || item.entry_type === 'meeting_note') gravityFactor = 0.8;

      // Weighted Score
      const weightedScore = (semanticSim * 0.7) + (recencyFactor * 0.2) + (gravityFactor * 0.1);

      return { item, score: weightedScore };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ item }) => item);
}
