import type { DemoMetadata, DemoSession } from "../components/demoLayout";
export const session06Path = "#/sessions/06";
export const session06Title =
  "コンピュータはどのように知的な問題を解いてきたのか？";
export const session06Demos = [
  {
    slug: "single-perceptron",
    title: "単層パーセプトロンと線形分離",
    description: "1本の直線で分けられる入力の組合せを調べる。",
    goal: "1本の直線で分けられる入力の組合せを調べる。",
    keywords: "重み・境界線・線形分離",
    ready: true,
    phase: 1,
  },
  {
    slug: "multilayer-xor",
    title: "多層パーセプトロンによるXOR",
    description: "2つの中間結果からXORを表せる理由を説明する。",
    goal: "2つの中間結果からXORを表せる理由を説明する。",
    keywords: "入力層・隠れ層・出力層",
    ready: true,
    phase: 1,
  },
  {
    slug: "maze",
    title: "迷路と状態空間",
    description: "迷路の移動とグラフの辺を対応づける。",
    goal: "迷路の移動とグラフの辺を対応づける。",
    keywords: "状態・操作・ゴール",
    ready: true,
    phase: 2,
  },
  {
    slug: "graph-search",
    title: "幅優先探索と深さ優先探索",
    description: "候補の取り出し方と探索順序を比べる。",
    goal: "候補の取り出し方と探索順序を比べる。",
    keywords: "キュー・スタック・最短経路",
    ready: true,
    phase: 2,
  },
  {
    slug: "river-crossing",
    title: "看守と囚人の川渡り",
    description: "両岸の安全を保つ手順を探す。",
    goal: "両岸の安全を保つ手順を探す。",
    keywords: "制約・状態・渡航",
    ready: true,
    phase: 2,
  },
  {
    slug: "search-tree",
    title: "探索木と組合せ爆発",
    description: "末端の候補数と木全体の大きさを区別する。",
    goal: "末端の候補数と木全体の大きさを区別する。",
    keywords: "分岐数・深さ",
    ready: true,
    phase: 2,
  },
  {
    slug: "if-then",
    title: "IF–THENルールによる推論",
    description: "観察した事実と規則から結論を導く。",
    goal: "観察した事実と規則から結論を導く。",
    keywords: "事実・規則・結論",
    ready: true,
    phase: 3,
  },
  {
    slug: "reasoning-direction",
    title: "前向き推論と後向き推論",
    description: "事実から進む方法と目標から調べる方法を比べる。",
    goal: "事実から進む方法と目標から調べる方法を比べる。",
    keywords: "前提・目標",
    ready: true,
    phase: 3,
  },
  {
    slug: "prolog",
    title: "Prologによる論理的推論",
    description: "親子関係への問い合わせと変数の対応を追う。",
    goal: "親子関係への問い合わせと変数の対応を追う。",
    keywords: "照合・変数束縛",
    ready: true,
    phase: 3,
  },
  {
    slug: "eliza",
    title: "ELIZA風チャットボット",
    description: "入力の一部を使って応答を組み立てる。",
    goal: "入力の一部を使って応答を組み立てる。",
    keywords: "パターン照合・ひな型",
    ready: true,
    phase: 4,
  },
] as const satisfies readonly DemoMetadata[];
const ready = session06Demos.filter((d) => d.ready).length;
export const session06Summary =
  ready +
  "件利用可能" +
  (ready < session06Demos.length
    ? " · " + (session06Demos.length - ready) + "件準備中"
    : "");
export const session06Config: DemoSession = {
  number: "06",
  path: session06Path,
  demos: session06Demos,
  note: "教育用補足：この教材では仕組みを観察できるように、入力や規則を単純化しています。",
};
