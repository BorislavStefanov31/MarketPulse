export function extractSentiment(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes("bullish")) return "bullish";
  if (lower.includes("bearish")) return "bearish";
  return "neutral";
}

export function extractSummary(content: string): string {
  const sentences = content.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, 3).join(" ");
}
