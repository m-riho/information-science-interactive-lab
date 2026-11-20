import { mountLlm } from "../llm-common/view";
import { causalMatrix, causalTokens, inspectCausalRow } from "./model";

export function mountCausalMask(root: HTMLElement): () => void {
  let row = 0;
  let enabled = true;
  const abort = new AbortController();
  const layout = mountLlm(root, "causal-mask", "計算する行を選択し、Causal Maskの有効／無効を切り替えてください。1ステップでも次の行に進めます。", {
    step: () => { row = Math.min(row + 1, causalTokens.length - 1); render(); },
    reset: () => { row = 0; enabled = true; checkbox.checked = true; render(); },
  });
  layout.body.innerHTML = `<p class="llm-output">今日 ｜ は ｜ 雨 ｜ です</p><p>4つの単位に分けた模式例です。実際のトークナイザによる分割ではありません。</p>
    <section class="llm-panel"><h2>参照できる位置を調べる</h2><label><input type="checkbox" data-mask checked> Causal Maskを有効にする</label><div role="group" aria-label="計算する行を選択">${causalTokens.map((token, i) => `<button type="button" data-row="${i}" aria-pressed="${i === 0}">${i + 1}行：${token}</button>`).join("")}</div>
    <p>行＝計算する位置、列＝参照する位置。○＝参照可能、×＝参照不可。</p><div class="llm-scroll" tabindex="0" role="region" aria-label="Causal Maskの4×4行列" data-matrix></div><div data-explanation></div></section>
    <section class="llm-panel"><h2>未来を隠す理由</h2><p>学習では正解を含む文章全体を並べて扱えます。各位置から次の単位を予測するとき、未来を参照できると正解そのものが見えてしまいます。マスクは自分自身と過去への参照を許し、未来への参照を禁止します。</p><p>実際のAttentionでは、禁止する位置のスコアをSoftmaxの前に−∞にして、重みを0にします。この行列の○は参照の許可を示し、Attentionの重みの大きさを示してはいません。</p><p>この教材は文章生成型のDecoder-onlyモデルを対象とします。すべてのSelf-AttentionがCausal Maskを使うわけではありません。生成中は未来の正解がそもそもまだ与えられていません。</p></section>`;
  const checkbox = layout.body.querySelector<HTMLInputElement>("[data-mask]")!;
  const buttons = [...layout.body.querySelectorAll<HTMLButtonElement>("[data-row]")];
  const matrix = layout.body.querySelector<HTMLElement>("[data-matrix]")!;
  const explanation = layout.body.querySelector<HTMLElement>("[data-explanation]")!;
  checkbox.addEventListener("change", () => { enabled = checkbox.checked; render(); }, { signal: abort.signal });
  for (const button of buttons) button.addEventListener("click", () => { row = Number(button.dataset.row); render(); }, { signal: abort.signal });
  function render() {
    const cells = causalMatrix(enabled);
    const inspection = inspectCausalRow(row, enabled);
    buttons.forEach((button, index) => button.setAttribute("aria-pressed", String(row === index)));
    matrix.innerHTML = `<table><caption>Mask ${enabled ? "有効" : "無効"}・選択中は${row + 1}行目</caption><thead><tr><th scope="col">計算位置 ↓ ／参照先 →</th>${causalTokens.map((token, i) => `<th scope="col">${i + 1}：${token}</th>`).join("")}</tr></thead><tbody>${cells.map((columns, r) => `<tr${r === row ? ' class="selected"' : ""}><th scope="row">${r === row ? "選択中 " : ""}${r + 1}：${causalTokens[r]}</th>${columns.map(allowed => `<td>${allowed ? "○ 参照可" : "× 参照不可"}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const message = inspection.nextTarget === null
      ? "この例では「です」の次の正解を提示していません。この行について、次の正解が漏れるとは判定しません。"
      : inspection.leaksNextTarget
        ? `正解が見えています：「${causalTokens[row]}」の位置から予測する次の正解「${inspection.nextTarget}」を参照できてしまいます。`
        : `次の正解「${inspection.nextTarget}」は参照できません。自分自身と過去の情報から予測します。`;
    explanation.innerHTML = `<p class="llm-output">参照可能：${inspection.references.map(index => `${index + 1}「${causalTokens[index]}」`).join("、")}</p><p class="${inspection.leaksNextTarget ? "llm-warning" : "hint"}">${message}</p>`;
    layout.status.textContent = `${row + 1}行目「${causalTokens[row]}」、Mask ${enabled ? "有効" : "無効"}。${message}`;
    layout.controls.setCompleted(row === causalTokens.length - 1);
  }
  render();
  return () => { abort.abort(); layout.dispose(); };
}
