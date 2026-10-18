export const session04Demos = [
  {
    slug: "sr-latch",
    title: "SRラッチ：1 bitを記憶する",
    description: "入力を戻しても残る状態から、記憶のしくみを探ろう。",
    keywords: "状態保持・フィードバック・Sequential Circuit",
    goal: "組合せ回路と順序回路の違い、1 bitの状態保持を説明できる。",
    phase: 2,
    ready: true,
  },
  {
    slug: "d-latch-flipflop",
    title: "Dラッチ vs Dフリップフロップ",
    description:
      "開いている間と、切り替わる瞬間。記憶するタイミングを比べよう。",
    keywords: "Latch・Flip-Flop・クロック",
    goal: "レベル感応とエッジ感応の違いを説明できる。",
    phase: 2,
    ready: true,
  },
  {
    slug: "cpu-cycle",
    title: "CPU命令実行シミュレータ",
    description: "命令を取り出し、解読し、実行するCPUの仕事を追おう。",
    keywords: "Fetch・Decode・Execute・Register",
    goal: "メモリ・PC・レジスタと命令実行サイクルの関係を説明できる。",
    phase: 3,
    ready: true,
  },
  {
    slug: "pc-branch",
    title: "プログラムカウンタと条件分岐",
    description: "次の命令はどこ？ ジャンプと繰り返しを追いかけよう。",
    keywords: "Program Counter・条件分岐・反復",
    goal: "PCの変化から順次実行・分岐・反復を説明できる。",
    phase: 3,
    ready: true,
  },
  {
    slug: "language-to-cpu",
    title: "高水準言語 → 機械語 → CPU",
    description: "ひとつの足し算がCPUへの命令に変わるまでを見てみよう。",
    keywords: "翻訳・アセンブリ・機械語・抽象化",
    goal: "高水準言語から機械語への翻訳と抽象化の階層を説明できる。",
    phase: 4,
    ready: true,
  },
  {
    slug: "transistor-logic",
    title: "トランジスタ → 論理ゲート",
    description: "電気で動くスイッチを組み合わせ、論理のしくみを探ろう。",
    keywords: "MOSFET・CMOS・NOT・NAND",
    goal: "トランジスタをスイッチとして捉え、論理ゲートとの関係を説明できる。",
    phase: 4,
    ready: true,
  },
  {
    slug: "turing-machine",
    title: "小さなチューリングマシン",
    description: "テープを読み書きする単純な規則から、計算を考えよう。",
    keywords: "テープ・ヘッド・状態遷移",
    goal: "規則の反復によって計算が進むことを説明できる。",
    phase: 5,
    ready: true,
  },
] as const;
export type Session04Demo = (typeof session04Demos)[number];
export const session04Path = "#/sessions/04";

export const session04ReadyCount = session04Demos.filter((d) => d.ready).length;
export const session04Summary = `${session04ReadyCount}件利用可能${session04ReadyCount < session04Demos.length ? ` · ${session04Demos.length - session04ReadyCount}件準備中` : ""}`;
