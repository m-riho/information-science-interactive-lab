import { lesson } from "../learning-common/lesson";
import { activate, functions, type Activation } from "./model";
import { field, numbers } from "../learning-common/view";
export function mountActivation(root: HTMLElement) {
  const abort = new AbortController();
  const l = lesson(
    root,
    5,
    `<div class="lesson-grid"><section class="lesson-panel"><label class="lesson-field">関数<select data-f>${functions.map((f) => `<option>${f}</option>`).join("")}</select></label>${field("入力 x", "activation-x", -5, 5, 0.1, 1)}<label class="check"><input type="checkbox" data-all>全関数を比較</label><p data-value></p></section><section class="lesson-panel"><div data-graph></div></section></div><p>入力の範囲は−5〜5です。ステップ関数は x &gt; 0 で1、それ以外0。ReLUは負の値を0、正の値をそのまま出します。</p><p>活性化が恒等関数だけなら、アフィン変換（重み付き和とバイアス）を何層重ねても1つのアフィン変換にまとめられます。非線形性が多層化の表現力を支えます。</p>`,
    () => {
      select.value = functions[0];
      x.value = "1";
      all.checked = false;
      render();
    },
    "関数を切り替え、入力を動かして出力を比べます。全関数を重ねるときは線種と名前も参照してください。",
    false,
  );
  const select = l.body.querySelector("select")!,
    x = l.body.querySelector<HTMLInputElement>("#activation-x")!,
    all = l.body.querySelector<HTMLInputElement>("[data-all]")!;
  function render() {
    numbers(l.body);
    const xx = Number(x.value),
      active = all.checked ? [...functions] : [select.value as Activation];
    l.body.querySelector("[data-value]")!.textContent = active
      .map((f) => f + "：" + activate(f, xx).toFixed(4))
      .join(" ／ ");
    const px = (v: number) => 210 + 34 * v,
      py = (v: number) => 165 - 25 * v;
    l.body.querySelector("[data-graph]")!.innerHTML =
      `<svg class="ml-plot" viewBox="0 0 420 330" role="img" aria-label="入力xと活性化関数の出力"><path d="M35 165H390 M210 25V295" stroke="currentColor" fill="none"/><text x="370" y="185">x=5</text><text x="35" y="185">−5</text><text x="212" y="30">y=5</text>${active
        .map((f, j) => {
          const i = functions.indexOf(f);
          const path =
            f === "ステップ関数"
              ? "M40 165H210 M210 140H380"
              : Array.from({ length: 101 }, (_, k) => {
                  const v = -5 + k / 10;
                  return `${k ? "L" : "M"}${px(v)},${py(activate(f, v))}`;
                }).join(" ");
          return `<path d="${path}" fill="none" stroke="${["#4b286d", "#176f84", "#985000", "#2b773b", "#9a2857"][i]}" stroke-width="2" stroke-dasharray="${["none", "5 3", "2 2", "8 3 2 3", "10 3"][i]}"/><circle cx="${px(xx)}" cy="${py(activate(f, xx))}" r="4" fill="white" stroke="black"/><text x="10" y="${14 + j * 15}">${f}</text>`;
        })
        .join("")}</svg>`;
    l.status.textContent = `x=${xx} の出力を表示しています。`;
  }
  l.body.addEventListener("input", render, { signal: abort.signal });
  render();
  return () => {
    abort.abort();
    l.dispose();
  };
}
