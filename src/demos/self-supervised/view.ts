import { escapeHtml, mountLlm } from "../llm-common/view";
import { allTrainingPairs, teachingUnits, trainingPair } from "./model";

export function mountSelfSupervised(root: HTMLElement): () => void {
  let position = 4;
  let showAll = false;
  const layout = mountLlm(root, "self-supervised", "正解にしたい単位を選びます。その手前までが入力、その1単位が正解です。「全位置から学習例を作る」で組を比較してください。", {
    step: () => { position = Math.min(position + 1, teachingUnits.length - 1); render(); },
    reset: () => { position = 4; showAll = false; render(); },
  });
  layout.body.innerHTML = `<p class="llm-warning">単語・語句による模式例です。実際のトークナイザは使っていません。実際のLLMはトークン単位で予測します。この画面は学習例を作るだけで、パラメータの学習は行いません。</p>
    <section class="llm-panel"><h2>元の文章</h2><p class="llm-output">${escapeHtml(teachingUnits.join(""))}</p><h3>次に予測する正解を選ぶ</h3><div class="llm-tokens">${teachingUnits.map((unit, index) => index === 0 ? `<span class="llm-token">${unit}<small>最初の入力</small></span>` : `<button type="button" data-position="${index}" aria-pressed="false">${escapeHtml(unit)}<small>（${index + 1}番目）</small></button>`).join("")}</div><p class="hint">文頭の特殊記号は省略し、入力が1単位以上ある全9境界を扱います。</p></section>
    <div data-pair class="llm-grid"></div><p>正解とそれ以後の単位は、入力には含めません。文章には続きがあっても、次の1単位を当てる組に分けます。</p>
    <button type="button" data-all aria-expanded="false">全位置から学習例を作る</button><div data-examples class="llm-scroll" tabindex="0" role="region" aria-label="全位置の学習例" hidden></div>
    <p><strong>自己教師あり学習にも正解があります。</strong>人が各例へ正解ラベルを付けなくても、文章自身の続きから正解を作れます。モデルの予測と正解を比較して学習します。</p>`;
  const pair = layout.body.querySelector<HTMLElement>("[data-pair]")!;
  const examples = layout.body.querySelector<HTMLElement>("[data-examples]")!;
  const allButton = layout.body.querySelector<HTMLButtonElement>("[data-all]")!;
  const buttons = [...layout.body.querySelectorAll<HTMLButtonElement>("[data-position]")];
  examples.innerHTML = `<table><thead><tr><th>予測する位置</th><th>入力（手前まで）</th><th>正解（次の1単位）</th></tr></thead><tbody>${allTrainingPairs(teachingUnits).map(example => `<tr data-row="${example.position}"><td>${example.position + 1}番目</td><td>${escapeHtml(example.input.join(""))}</td><td>${escapeHtml(example.target)}</td></tr>`).join("")}</tbody></table>`;
  function render() {
    const example = trainingPair(teachingUnits, position);
    pair.innerHTML = `<section class="llm-panel"><h2>入力：${position}単位</h2><p class="llm-output">${escapeHtml(example.input.join(""))}</p></section><section class="llm-panel"><h2>正解：次の1単位</h2><p class="llm-output">${escapeHtml(example.target)}</p></section>`;
    buttons.forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.position) === position)));
    examples.querySelectorAll<HTMLElement>("[data-row]").forEach(row => row.classList.toggle("selected", Number(row.dataset.row) === position));
    examples.hidden = !showAll;
    allButton.setAttribute("aria-expanded", String(showAll));
    allButton.textContent = showAll ? "全位置の学習例を隠す" : "全位置から学習例を作る";
    layout.controls.setCompleted(position === teachingUnits.length - 1);
    layout.status.textContent = `入力「${example.input.join("")}」から、次の正解「${example.target}」を予測する学習例です。${showAll ? "全9組を表示しています。" : ""}`;
  }
  const click = (event: Event) => { const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button[data-position], button[data-all]") : null; if (!target) return; if (target.hasAttribute("data-all")) showAll = !showAll; else position = Number(target.dataset.position); render(); };
  layout.body.addEventListener("click", click);
  render();
  return () => { layout.body.removeEventListener("click", click); layout.dispose(); };
}
