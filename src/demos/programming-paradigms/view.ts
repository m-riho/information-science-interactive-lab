import { mountStepLesson } from "../../components/stepLesson";
import { session05Demos } from "../../sessions/session05";
import { sumSteps } from "./model";
import { inferGrandparent } from "../prolog-inference/model";
export function mountParadigms(root: HTMLElement): () => void {
  let n = 5;
  const abort = new AbortController();
  const layout = mountStepLesson(root, session05Demos[0], () => {
    n = 5;
    select.value = "5";
    restart();
  });
  layout.instructions.textContent =
    "Nを選び、1ステップずつtotalの変化を追ってください。関数型には同じ合計の完成値を示します。論理型は別の題材で、事実と規則による計算を比較します。";
  layout.body.innerHTML = `<label class="lesson-field">合計する範囲 N <select id="sum-n">${Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}" ${i === 4 ? "selected" : ""}>${i + 1}</option>`).join("")}</select></label><div class="lesson-grid"><section class="lesson-panel"><h2>命令型：状態を更新する</h2><pre>total = 0
for i in range(1, N + 1):
    total = total + i</pre><p class="hint">Python風の例：順番に命令を実行します。</p><p id="sum-current" class="storage-result"></p><ol id="sum-history" class="lesson-trace"></ol></section><section class="lesson-panel"><h2>関数型：値に関数を適用する</h2><pre>sum [1..N]</pre><p class="hint">Haskellの例。文法の暗記は不要です。</p><p id="sum-functional" class="lesson-value"></p><p>これは完成した計算結果です。左のコマ送りとは独立した比較表示です。値の関係として表し、変数totalの書換えを指示しません。</p></section></div><section class="lesson-panel"><h2>論理型：事実と規則から導く</h2><p>ここでは足し算ではなく、親子関係を題材にします。</p><p class="family-line">太郎 ─親→ 花子 ─親→ 次郎</p><pre>parent(taro, hanako).
parent(hanako, jiro).
grandparent(X,Z) :-
    parent(X,Y), parent(Y,Z).</pre><p>「Xの子Yの子がZなら、XはZの祖父母」という規則です。</p><p>問い合わせ：太郎は次郎の祖父母？ → <strong>${inferGrandparent("taro", "jiro").at(-1)?.result ? "true（成立）" : "false"}</strong></p><a href="#/sessions/05/prolog-inference">推論を1ステップずつ見る →</a></section><p class="hint">実際の言語は複数の考え方を利用できる場合があります。この分類は言語の優劣ではなく、計算をどう表すかの違いです。</p>`;
  const select = root.querySelector<HTMLSelectElement>("#sum-n")!;
  function restart() {
    const frames = sumSteps(n);
    root.querySelector("#sum-functional")!.textContent =
      `[${Array.from({ length: n }, (_, i) => i + 1).join(", ")}] → sum → ${frames.at(-1)!.total}`;
    layout.setFrames(frames.length, (index) => {
      const f = frames[index]!;
      root.querySelector("#sum-current")!.textContent =
        `${index === 0 ? "初期状態" : `${index} / ${n} 回目`}：total = ${f.total}${index === n ? "（完了）" : ""}`;
      root.querySelector("#sum-history")!.innerHTML = frames
        .slice(0, index + 1)
        .map(
          (step, i) =>
            `<li ${i === index ? 'aria-current="step"' : ""}>${i === 0 ? "total = 0" : `${step.before} + ${step.addend} → ${step.total}`}</li>`,
        )
        .join("");
      layout.status.textContent =
        index === 0
          ? "まずtotalを0にします。次は1を足します。"
          : `${f.before}に${f.addend}を足し、totalを${f.total}へ更新しました。${index === n ? "関数型の完成値と同じ結果になりました。" : `次は${f.addend + 1}を足します。`}`;
    });
  }
  select.addEventListener(
    "change",
    () => {
      n = Number(select.value);
      restart();
    },
    { signal: abort.signal },
  );
  restart();
  return () => {
    abort.abort();
    layout.dispose();
  };
}
