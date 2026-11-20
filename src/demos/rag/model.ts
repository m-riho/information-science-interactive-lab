export type Question = "monday" | "hours" | "exam" | "parking";
export type SourceMode = "all" | "old" | "latest";
export type AnswerMode = "careful" | "misread";
export interface LibraryDocument {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly text: string;
  readonly topics: readonly Question[];
  readonly superseded: boolean;
}
/** 架空の資料。実在の大学図書館の開館情報ではない。 */
export const documents: readonly LibraryDocument[] = [
  { id: "A", title: "基本開館案内 第2版", date: "2026-04-01", text: "中央図書館は通常の平日9時から20時まで開館する。祝日・臨時休館日は別途案内する。", topics: ["hours", "exam"], superseded: false },
  { id: "B", title: "旧・休館日案内 第1版", date: "2024-04-01", text: "中央図書館は月曜日を休館日とする。この版は2026年3月31日まで適用。", topics: ["monday"], superseded: true },
  { id: "C", title: "試験期間の特別開館", date: "2026-07-01", text: "2026年7月15日〜31日の試験期間中、開館日の閉館時間を22時に延長する。期間外は通常の開館案内に従う。", topics: ["exam"], superseded: false },
  { id: "D", title: "新・休館日案内 第2版", date: "2026-04-01", text: "2026年4月1日から月曜日も9時〜20時に開館する。旧版の月曜日休館を変更する。祝日・臨時休館日は除く。", topics: ["monday"], superseded: false },
];
export const questions: Readonly<Record<Question, string>> = {
  monday: "2026年7月6日（月・通常日）は開いていますか？",
  hours: "通常の平日は何時まで開館していますか？",
  exam: "2026年7月21日（試験期間の開館日）は何時まで？",
  parking: "駐車場は何台分ありますか？",
};
export function searchDocuments(question: Question, mode: SourceMode): LibraryDocument[] {
  return documents.filter(doc => doc.topics.includes(question)
    && (mode === "all" || (mode === "latest" ? !doc.superseded : doc.id !== "D")));
}
export interface PreparedAnswer {
  text: string;
  evidence: string[];
  claim: "no-evidence" | "monday-open" | "monday-closed" | "hours20" | "exam22" | "always22";
}
/** 文章を生成するLLMではなく、条件に応じた事前作成回答を返す。 */
export function prepareAnswer(question: Question, docs: readonly LibraryDocument[], mode: AnswerMode): PreparedAnswer {
  if (docs.length === 0) return { text: "登録資料に根拠がないため、この質問には回答できません。", evidence: [], claim: "no-evidence" };
  if (question === "monday") {
    const latest = docs.some(d => d.id === "D");
    if (latest && mode === "careful") return { text: "新しい資料Dでは、通常日の月曜日も9時〜20時に開館します。祝日・臨時休館日は除きます。", evidence: ["D"], claim: "monday-open" };
    return { text: "月曜日は休館です。", evidence: [latest && mode === "misread" ? "D" : "B"], claim: "monday-closed" };
  }
  if (question === "exam") return mode === "careful"
    ? { text: "指定日は特別開館期間（7月15日〜31日）内の開館日なので、22時までです。期間外の通常の平日は20時までです。", evidence: ["C", "A"], claim: "exam22" }
    : { text: "中央図書館は一年中、毎日22時まで開館しています。", evidence: ["C"], claim: "always22" };
  return { text: "通常の平日は20時までです。祝日・臨時休館日は別途確認が必要です。", evidence: ["A"], claim: "hours20" };
}
export function verifyAnswer(question: Question, docs: readonly LibraryDocument[], answer: PreparedAnswer) {
  const conflict = question === "monday" && docs.some(d => d.id === "B") && docs.some(d => d.id === "D");
  const stale = answer.evidence.some(id => docs.find(d => d.id === id)?.superseded);
  const unsupported = docs.length === 0 || answer.evidence.length === 0 || answer.evidence.some(id => !docs.some(d => d.id === id));
  const misread = (answer.claim === "monday-closed" && answer.evidence.includes("D")) || answer.claim === "always22";
  return { conflict, stale, unsupported, misread };
}
export const ragStages = ["質問を選択", "関連資料を検索", "検索結果を確認", "資料を文脈へ追加", "事前作成の回答を表示", "回答の根拠を表示", "日付・条件・回答を照合"] as const;
export function advanceRagStage(stage: number): number { return Math.min(6, stage + 1); }
