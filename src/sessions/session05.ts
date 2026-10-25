import type { DemoMetadata, DemoSession } from "../components/demoLayout";
export const session05Demos = [
  {
    slug: "programming-paradigms",
    title: "同じ計算を3つのパラダイムで表す",
    description: "計算の表し方を、命令型・関数型・論理型で比べよう。",
    keywords: "状態変化・関数・事実と規則",
    goal: "3つの考え方の違いを説明できる。",
    phase: 2,
    ready: true,
  },
  {
    slug: "function-pipeline",
    title: "関数を組み合わせて計算する",
    description: "処理の順序を変えて、結果の違いを確かめよう。",
    keywords: "関数合成・不変性・処理順序",
    goal: "関数の組合せと順序が結果に与える影響を説明できる。",
    phase: 2,
    ready: true,
  },
  {
    slug: "prolog-inference",
    title: "Prolog推論シミュレータ",
    description: "家族の関係から、事実と規則による推論を追おう。",
    keywords: "事実・規則・問い合わせ",
    goal: "規則と事実を照合する推論の流れを説明できる。",
    phase: 2,
    ready: true,
  },
  {
    slug: "web-request-php",
    title: "WebリクエストとPHP",
    description: "図書検索の裏で、ブラウザとサーバが何をするか見てみよう。",
    keywords: "HTTP・PHP処理系・データベース",
    goal: "言語と処理系の違い、Web検索の流れを説明できる。",
    phase: 3,
    ready: true,
  },
  {
    slug: "halting-problem",
    title: "停止性問題シミュレータ",
    description: "あらゆるプログラムの停止を判定できるか考えよう。",
    keywords: "停止性・自己参照・計算可能性",
    goal: "万能な停止判定器を仮定したときの矛盾を説明できる。",
    phase: 4,
    ready: true,
  },
  {
    slug: "traveling-salesperson",
    title: "巡回セールスマン問題",
    description: "都市を巡る道を作り、候補の増え方を確かめよう。",
    keywords: "巡回路・距離・組合せ爆発",
    goal: "巡回路の妥当性と全探索の候補数を説明できる。",
    phase: 5,
    ready: true,
  },
  {
    slug: "p-vs-np",
    title: "PとNP：「探す」と「確認する」",
    description: "候補を探すことと、答えを確かめることを比べよう。",
    keywords: "判定問題・証拠・PとNP",
    goal: "効率的な判定とYESの証拠の確認を区別できる。",
    phase: 5,
    ready: true,
  },
] as const satisfies readonly DemoMetadata[];
export const session05Path = "#/sessions/05";
export const session05ReadyCount = session05Demos.filter((d) => d.ready).length;
export const session05Summary = `${session05ReadyCount}件利用可能${session05ReadyCount < session05Demos.length ? ` · ${session05Demos.length - session05ReadyCount}件準備中` : ""}`;
export const session05Config: DemoSession = {
  number: "05",
  path: session05Path,
  demos: session05Demos,
  note: "このデモは概念を理解するために単純化しています。完全な言語処理系・Webサーバ・形式証明器を再現するものではありません。",
};
