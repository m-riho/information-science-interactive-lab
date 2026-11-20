import { sampleIndex } from "../temperature/model";

export type GenerationMode = "greedy" | "sampling";
export interface Candidate {
  readonly label: string;
  readonly token: string;
  readonly probability: number;
  readonly next: string;
}
export interface GenerationState {
  readonly text: string;
  readonly node: string;
  readonly done: boolean;
  readonly history: readonly { context: string; label: string; token: string; probability: number }[];
}
const tree: Readonly<Record<string, readonly Candidate[]>> = {
  start: [
    { label: "持って", token: "持って", probability: 0.6, next: "held" },
    { label: "買って", token: "買って", probability: 0.25, next: "bought" },
    { label: "忘れて", token: "忘れて", probability: 0.1, next: "forgotten" },
    { label: "その他", token: "置いて", probability: 0.05, next: "left" },
  ],
  held: [
    { label: "出かけます", token: "出かけます", probability: 0.8, next: "punctuation" },
    { label: "歩きます", token: "歩きます", probability: 0.2, next: "punctuation" },
  ],
  bought: [
    { label: "帰ります", token: "帰ります", probability: 0.65, next: "punctuation" },
    { label: "出かけます", token: "出かけます", probability: 0.35, next: "punctuation" },
  ],
  forgotten: [
    { label: "困りました", token: "困りました", probability: 0.7, next: "punctuation" },
    { label: "戻りました", token: "戻りました", probability: 0.3, next: "punctuation" },
  ],
  left: [
    { label: "きました", token: "きました", probability: 0.9, next: "punctuation" },
    { label: "しまいました", token: "しまいました", probability: 0.1, next: "punctuation" },
  ],
  punctuation: [{ label: "。", token: "。", probability: 1, next: "eos" }],
  eos: [{ label: "〈終了 EOS〉", token: "", probability: 1, next: "done" }],
};
export function initialGeneration(): GenerationState {
  return { text: "今日は雨なので、傘を", node: "start", done: false, history: [] };
}
export function candidatesFor(state: GenerationState): readonly Candidate[] {
  return state.done ? [] : tree[state.node] ?? [];
}
export function selectCandidate(state: GenerationState, index: number): GenerationState {
  if (state.done) return state;
  const candidate = candidatesFor(state)[index];
  if (!candidate) throw new RangeError("候補が範囲外です。");
  return {
    text: state.text + candidate.token,
    node: candidate.next,
    done: candidate.next === "done",
    history: [...state.history, { context: state.text, label: candidate.label, token: candidate.token, probability: candidate.probability }],
  };
}
export function advanceGeneration(state: GenerationState, mode: GenerationMode, random: number): GenerationState {
  if (state.done) return state;
  const probabilities = candidatesFor(state).map(candidate => candidate.probability);
  const index = mode === "sampling" ? sampleIndex(probabilities, random) : probabilities.indexOf(Math.max(...probabilities));
  return selectCandidate(state, index);
}
