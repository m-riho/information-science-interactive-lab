import { mountDemoLayout } from "../../components/demoLayout";
import { session05Config, session05Demos } from "../../sessions/session05";
import {
  initialHalting,
  transition,
  lastStep,
  exampleFrames,
  opposite,
  type HaltingAction,
  type Example,
} from "./model";
const titles = [
  "具体例を動かす",
  "万能判定器Hを仮定する",
  "反対に動くDを作る",
  "D自身を入力する",
];
const code: Record<Example, string> = {
  A: "3回くり返す:\n    処理する\nSTOP",
  B: "ずっとくり返す:\n    同じ処理をする\n# 終了条件も脱出命令もない",
  C: "n = 7\nwhile n > 1:\n    if n が偶数: n = n / 2\n    else: n = n + 1\nSTOP",
};
export function mountHalting(root: HTMLElement): () => void {
  let state = initialHalting();
  const events = new AbortController();
  const dispatch = (action: HaltingAction) => {
    state = transition(state, action);
    render();
  };
  const layout = mountDemoLayout(
    root,
    session05Demos[4],
    {
      step: () => dispatch({ type: "step" }),
      reset: () => dispatch({ type: "reset" }),
    },
    session05Config,
  );
  root.querySelector(".lab")!.classList.add("halting-demo");
  root.querySelector<HTMLButtonElement>('[data-action="reset"]')!.textContent =
    "最初から";
  // このデモは自分のペースで読む説明なので、自動再生は提供しない。
  for (const action of ["start", "stop"])
    root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!.hidden =
      true;
  layout.instructions.textContent =
    "「1ステップ」で現在のPartを進めます。「次へ」「前へ」で4つのPartを移動できます。後半では、仮定したHの答えをSTOP／LOOPから選び、どちらも矛盾することを確かめてください。「最初から」は例A・Part 1へ戻ります。";
  layout.body.innerHTML = `<ol id="halting-parts" class="web-flow"></ol><div class="transport"><button id="halting-prev">前へ</button><button id="halting-next">次へ</button></div><h2 id="halting-title"></h2><label id="halting-example-field" class="lesson-field">プログラム例<select id="halting-example"><option value="A">A：3回処理してSTOP</option><option value="B">B：終了条件のない繰り返し</option><option value="C">C：nを変化させる例</option></select></label><div id="halting-prediction" class="lesson-panel"><p>仮定したHが返す答えを選ぶ（実際の判定器ではありません）</p><div class="transport"><button id="halting-stop" aria-pressed="true">HはSTOPと答える</button><button id="halting-loop" aria-pressed="false">HはLOOPと答える</button></div></div><p id="halting-progress" class="storage-result"></p><section id="halting-content" class="lesson-panel"></section><p class="goal">長時間止まらないことだけで、「永遠に停止しない」とは判断できません。</p><details><summary>すべてのプログラムについて何も分からないということ？</summary><p>違います。特定のプログラムの停止を調べたり、限られた種類を判定したりすることはできます。否定しているのは、すべてのプログラムと入力に対して、必ず終了して正しい答えを返す万能な判定器です。</p></details><p class="hint">自己参照の議論を視覚化した教材です。実際の万能判定器や形式証明器を実装しているわけではありません。例Bの無限ループもブラウザ上では実行しません。</p>`;
  const get = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  function render() {
    const { part, step, prediction } = state;
    get("halting-parts").innerHTML = titles
      .map(
        (title, i) =>
          `<li ${i === part ? 'aria-current="step"' : ""}>Part ${i + 1}<br>${title}${i === part ? "<strong>現在</strong>" : ""}</li>`,
      )
      .join("");
    get("halting-title").textContent = `Part ${part + 1}：${titles[part]}`;
    (get("halting-prev") as HTMLButtonElement).disabled = part === 0;
    (get("halting-next") as HTMLButtonElement).disabled = part === 3;
    get("halting-example-field").hidden = part !== 0;
    (get("halting-example") as HTMLSelectElement).value = state.example;
    get("halting-prediction").hidden = part < 2;
    get("halting-stop").setAttribute(
      "aria-pressed",
      String(prediction === "STOP"),
    );
    get("halting-loop").setAttribute(
      "aria-pressed",
      String(prediction === "LOOP"),
    );
    layout.controls.setCompleted(step === lastStep(state));
    get("halting-progress").textContent =
      `Part ${part + 1} ／ ${step} / ${lastStep(state)} ステップ${step === lastStep(state) ? "（このPartの説明は終了）" : ""}`;
    const content = get("halting-content");
    if (part === 0) {
      const frames = exampleFrames(state.example),
        frame = frames[step]!;
      content.innerHTML = `<pre id="halting-code"></pre><p class="lesson-value">${state.example === "C" ? "n" : "処理回数"} = ${frame.value}</p><p>${frame.outcome === "STOP" ? "STOP：プログラムが停止" : frame.outcome === "observation-limit" ? "観察上限：表示を打ち切り（STOPではない）" : "処理の途中"}</p><ol class="lesson-trace">${frames
        .slice(0, step + 1)
        .map(
          (f, i) =>
            `<li ${i === step ? 'aria-current="step"' : ""}>${f.message}</li>`,
        )
        .join(
          "",
        )}</ol>${state.example === "B" ? "<p>この例は終了条件がないという構造からLOOPだと分かります。「6回で止まらなかったから」と判断しているのではありません。</p>" : ""}`;
      get("halting-code").textContent = code[state.example];
      layout.status.textContent = frame.message;
    } else if (part === 1) {
      const messages = [
        "仮に、あらゆるプログラムPと入力xを調べる判定器Hがあるとします。",
        "Hは必ず判定を終え、P(x)が停止するならSTOP、停止しないならLOOPと正しく答えると仮定します。",
        "これは仮定です。以後、このHが存在すると矛盾が生じることを示します。",
      ];
      content.innerHTML = `<p class="halting-equation">Program P ＋ Input x → H → ${step >= 1 ? "STOP または LOOP" : "？"}</p><p>HがLOOPと答えることと、H自身が止まらないことは違います。仮定したH自身は、どんな入力でも必ず答えを返して停止します。</p>${step >= 2 ? '<p class="goal">このHが存在する、と仮定して次のPartへ。</p>' : ""}`;
      layout.status.textContent = messages[step]!;
    } else if (part === 2) {
      const actual = opposite(prediction);
      content.innerHTML = `<pre>D(p):\n    if H(p, p) == STOP:\n        永遠に繰り返す\n    else:\n        STOP</pre><p>プログラムを入力データとしても扱います。H(p,p)は「pにp自身の記述を入力すると停止するか」を調べるものとします。</p><p class="halting-equation">H(p,p) = ${step >= 1 ? prediction : "？"} → D(p) は ${step >= 2 ? actual : "？"}</p><p>STOP → LOOP ／ LOOP → STOP</p>`;
      layout.status.textContent =
        step === 0
          ? "Dは、Hの答えと反対の動きをするように作ります。"
          : step === 1
            ? `H(p,p)が${prediction}と答えたと仮定します。`
            : `D(p)は${actual}になります。次はpとしてD自身を渡します。`;
    } else {
      const actual = opposite(prediction);
      content.innerHTML = `<p>pにD自身の記述を渡します。同じD(D)について、Hの予測とDの定義による動きを比べます。</p><p class="halting-equation">H(D,D) = ${step >= 1 ? prediction : "？"}<br>↓ Dは反対に動く<br>D(D) = ${step >= 2 ? actual : "？"}</p>${step >= 3 ? `<p class="goal">矛盾：Hは${prediction}と答えたのに、D(D)は${actual}。</p>` : ""}${step >= 4 ? '<p class="storage-result">すべてのプログラムと入力について必ず正しく停止判定するHは存在しない。</p><p>どちらの答えを選んでも矛盾します。Hが存在するという最初の仮定を取り下げる必要があります。</p><a href="#/sessions/05/traveling-salesperson">次の話題：手順はあるが候補が急増する問題へ →</a>' : ""}`;
      layout.status.textContent =
        step === 0
          ? "DにD自身を入力します。"
          : step === 1
            ? `H(D,D)は${prediction}と答えたと仮定します。`
            : step === 2
              ? `Dの定義によってD(D)は${actual}になります。`
              : step === 3
                ? "同じ実行について予測と実際の動きが食い違い、万能判定器の仮定に矛盾します。"
                : "Hの答えをもう一方に切り替えても、同じように矛盾します。計算時間の長短ではなく、万能な解法の存在に関する限界です。";
    }
  }
  const on = (id: string, action: () => HaltingAction) =>
    get(id).addEventListener("click", () => dispatch(action()), {
      signal: events.signal,
    });
  on("halting-prev", () => ({ type: "previous" }));
  on("halting-next", () => ({ type: "next" }));
  on("halting-stop", () => ({ type: "prediction", prediction: "STOP" }));
  on("halting-loop", () => ({ type: "prediction", prediction: "LOOP" }));
  get("halting-example").addEventListener(
    "change",
    () => {
      const value = (get("halting-example") as HTMLSelectElement).value;
      if (value === "A" || value === "B" || value === "C")
        dispatch({ type: "example", example: value });
    },
    { signal: events.signal },
  );
  render();
  return () => {
    events.abort();
    layout.dispose();
  };
}
