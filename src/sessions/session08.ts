import type { DemoMetadata, DemoSession } from "../components/demoLayout";
export interface Session08Demo extends DemoMetadata {
  code: string;
  slides: string;
  usage: "授業内使用" | "復習用";
}
export const session08Path = "#/sessions/08";
export const session08Title = "生成AIはなぜ自然な文章を作れるのか？";
export const session08Demos: readonly Session08Demo[] = [
  { code: "JS01", slug: "tokenizer", title: "トークナイザの動作", slides: "7–9", usage: "授業内使用", goal: "文章のトークン境界とIDを調べ、文字とトークンの違いを説明する。" },
  { code: "JS02", slug: "next-token", title: "次のトークン予測と文章生成", slides: "10–13", usage: "授業内使用", goal: "予測と追加の繰り返しによって文章が生成される過程を追う。" },
  { code: "JS03", slug: "temperature", title: "Temperatureとサンプリング", slides: "14–15", usage: "授業内使用", goal: "温度による確率分布の変化と、実際の抽選結果を比べる。" },
  { code: "JS04", slug: "embedding", title: "Embeddingと単語の関係", slides: "20–26", usage: "復習用", goal: "単語を数値ベクトルで表し、点の位置と距離の関係を調べる。" },
  { code: "JS10", slug: "vector-arithmetic", title: "単語ベクトルの加減算", slides: "24–25", usage: "授業内使用", goal: "矢印をたどり、計算の終点にどの単語が近いか確かめる。" },
  { code: "JS09", slug: "context-figure", title: "中央の記号はどう読める？", slides: "27", usage: "授業内使用", goal: "周囲の文字を切り替え、同じ記号の読み方がどう変わるか観察する。" },
  { code: "JS11", slug: "word-order", title: "語順と位置情報", slides: "28", usage: "授業内使用", goal: "二人の名前を入れ替え、同じ語の数値表現を比べる。" },
  { code: "JS05", slug: "attention", title: "Attentionの計算", slides: "29–33", usage: "授業内使用", goal: "QueryとKeyから重みを計算し、Valueを合成する過程を追う。" },
  { code: "JS06", slug: "causal-mask", title: "Causal Maskの仕組み", slides: "34", usage: "授業内使用", goal: "未来の位置を隠すことで、訓練時の正解の漏れを防ぐ仕組みを理解する。" },
  { code: "JS12", slug: "multi-head", title: "複数のAttentionヘッド", slides: "35", usage: "授業内使用", goal: "同じ入力から二つのヘッドが集める情報を見比べる。" },
  { code: "JS07", slug: "self-supervised", title: "自己教師あり学習", slides: "41–42", usage: "復習用", goal: "文章自身から次のトークン予測の入力と正解を作る。" },
  { code: "JS08", slug: "rag", title: "RAGと回答の検証", slides: "54–59", usage: "授業内使用", goal: "資料の取得から回答の根拠・日付・条件の照合までを体験する。" },
].map(demo => ({ ...demo, usage: demo.usage as Session08Demo["usage"], description: demo.goal, keywords: "生成AI・LLM", phase: 1, ready: true }));
export const session08Config: DemoSession = {
  number: "08", path: session08Path, demos: session08Demos,
  note: "数値計算・模式例・事前に用意した回答の違いを、各デモの説明で確かめてください。",
};
export function demo08(slug: string): Session08Demo {
  const demo = session08Demos.find(item => item.slug === slug);
  if (!demo) throw new Error("第8回のデモが見つかりません");
  return demo;
}
