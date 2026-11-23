export const DEFAULT_CORPUS = "今日 は 雨 が 降る\n今日 は 雨 が 強い\n今日 は 雨 が 降る\n今日 は 雪 が 降る";
export const DEFAULT_EXAMPLE = "今日 は 雨 が 降って います";
export const DEFAULT_START = "今日 は 雨 が";
export const MAX_WORDS = 30;
export type SelectionMode = "greedy" | "sampling";
/** nullは内部の終了記号。どのユーザー入力文字列とも衝突しない。 */
export interface Candidate { readonly word: string | null; readonly count: number; readonly probability: number }
export interface Gram { readonly words: readonly string[]; readonly count: number }
export interface ContextEntry { readonly words: readonly string[]; readonly candidates: readonly Candidate[] }
export interface NgramModel { readonly n: number; readonly sentenceCount: number; readonly contexts: readonly ContextEntry[] }
export type PredictionStatus = "ready" | "unknown" | "short-context" | "empty-corpus";
export interface Prediction { readonly context: readonly string[]; readonly candidates: readonly Candidate[]; readonly status: PredictionStatus }
export type StopReason = Exclude<PredictionStatus, "ready"> | "eos" | "limit" | "start-too-long" | null;
export interface GenerationStep { readonly context: readonly string[]; readonly candidate: Candidate }
export interface GenerationState { readonly words: readonly string[]; readonly history: readonly GenerationStep[]; readonly reason: StopReason }

function validateN(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new RangeError("nは1〜5の整数です");
}
export function splitWords(text: string): string[] { return text.trim().split(/\s+/u).filter(Boolean); }
export function parseSentences(text: string): string[][] {
  return text.split(/\r\n|\r|\n/u).map(splitWords).filter(words => words.length > 0);
}
export function extractNgrams(sentences: readonly (readonly string[])[], n: number): Gram[] {
  validateN(n);
  const counts = new Map<string, Gram>();
  for (const sentence of sentences) {
    for (let i = 0; i + n <= sentence.length; i++) {
      const words = sentence.slice(i, i + n);
      const key = JSON.stringify(words);
      counts.set(key, { words, count: (counts.get(key)?.count ?? 0) + 1 });
    }
  }
  return [...counts.values()];
}
export function trainNgram(text: string, n: number): NgramModel {
  validateN(n);
  const sentences = parseSentences(text);
  const entries = new Map<string, { words: readonly string[]; counts: Map<string | null, number> }>();
  for (const sentence of sentences) {
    // 開始記号や短い文脈へのバックオフは追加しない。末尾の予測先だけEOS。
    for (let i = n - 1; i <= sentence.length; i++) {
      const words = sentence.slice(i - (n - 1), i);
      const key = JSON.stringify(words);
      const entry = entries.get(key) ?? { words, counts: new Map<string | null, number>() };
      const next = sentence[i] ?? null;
      entry.counts.set(next, (entry.counts.get(next) ?? 0) + 1);
      entries.set(key, entry);
    }
  }
  return {
    n, sentenceCount: sentences.length,
    contexts: [...entries.values()].map(entry => {
      const total = [...entry.counts.values()].reduce((sum, count) => sum + count, 0);
      return { words: entry.words, candidates: [...entry.counts].map(([word, count]) => ({ word, count, probability: count / total })) };
    }),
  };
}
export function predict(model: NgramModel, words: readonly string[]): Prediction {
  const context = model.n === 1 ? [] : words.slice(-(model.n - 1));
  if (!model.sentenceCount) return { context, candidates: [], status: "empty-corpus" };
  if (context.length < model.n - 1) return { context, candidates: [], status: "short-context" };
  const entry = model.contexts.find(item => item.words.length === context.length && item.words.every((word, i) => word === context[i]));
  return { context, candidates: entry?.candidates ?? [], status: entry ? "ready" : "unknown" };
}
export function chooseCandidate(candidates: readonly Candidate[], mode: SelectionMode, random: number): Candidate | undefined {
  if (mode === "greedy") return candidates.reduce<Candidate | undefined>((best, candidate) => !best || candidate.probability > best.probability ? candidate : best, undefined);
  if (!Number.isFinite(random) || random < 0 || random >= 1) throw new RangeError("乱数は0以上1未満です");
  let cumulative = 0;
  for (const candidate of candidates) {
    cumulative += candidate.probability;
    if (random < cumulative) return candidate;
  }
  return candidates.at(-1);
}
function reasonFor(words: readonly string[], model: NgramModel): StopReason {
  if (words.length > MAX_WORDS) return "start-too-long";
  if (words.length === MAX_WORDS) return "limit";
  const prediction = predict(model, words);
  return prediction.status === "ready" ? null : prediction.status;
}
export function initialGeneration(start: string, model: NgramModel): GenerationState {
  const words = splitWords(start);
  return { words, history: [], reason: reasonFor(words, model) };
}
export function advanceGeneration(state: GenerationState, model: NgramModel, mode: SelectionMode, random: number): GenerationState {
  if (state.reason) return state;
  const prediction = predict(model, state.words);
  if (prediction.status !== "ready") return { ...state, reason: prediction.status };
  const candidate = chooseCandidate(prediction.candidates, mode, random);
  if (!candidate) return { ...state, reason: "unknown" };
  const words = candidate.word === null ? state.words : [...state.words, candidate.word];
  return {
    words, history: [...state.history, { context: prediction.context, candidate }],
    reason: candidate.word === null ? "eos" : reasonFor(words, model),
  };
}
