import { mountExploration } from "../llm-common/exploration";
import { sentenceRepresentation } from "./model";
import "./style.css";

export function mountWordOrder(root: HTMLElement) {
  let swapped = false, positioned = false;
  const controller = new AbortController();
  const layout = mountExploration(root, "word-order", "二人の名前を入れ替え、誰が誰を追う文になったか読みます。次に位置情報を加え、表の「太郎」と「花子」を見比べてください。", {
    reset: () => { swapped = false; positioned = false; render(); }
  });
  layout.body.innerHTML = `<div class="llm-grid"><section class="llm-panel"><h2>もとの文</h2><p class="order-sentence">太郎が花子を追う</p></section>
    <section class="llm-panel"><h2>操作する文</h2><p class="order-sentence" data-sentence></p><button data-swap>二人の名前を入れ替える</button></section></div>
    <section><h2>同じ語どうしを比べる</h2><div class="llm-tokens" role="group" aria-label="数値の表し方"><button data-mode="word">語だけ</button><button data-mode="position">語 ＋ 位置</button></div>
    <p data-rule></p><table class="order-table"><thead><tr><th>語</th><th>もとの文</th><th>操作する文</th><th>比較</th></tr></thead><tbody></tbody></table></section>
    <p>位置は文の先頭から数えます。ここでは「語を表す数の組」に「位置を表す数の組」を足します。Transformer原論文では、各位置を複数の波で表して加えています。</p>`;
  function render() {
    const original = sentenceRepresentation(false, positioned);
    const current = sentenceRepresentation(swapped, positioned);
    layout.body.querySelector("[data-sentence]")!.textContent = current.sentence;
    for (const b of layout.body.querySelectorAll<HTMLButtonElement>("[data-mode]")) b.setAttribute("aria-pressed",String((b.dataset.mode === "position") === positioned));
    layout.body.querySelector("[data-rule]")!.textContent = positioned
      ? "教材用の計算例：太郎が3番目なら (10, 0) ＋ (0, 3) ＝ (10, 3)。"
      : "どの位置にあっても「太郎」には同じ数の組 (10, 0) を使います。";
    layout.body.querySelector("tbody")!.innerHTML = original.rows.map((row, i) => {
      const other = current.rows[i]!;
      const changed = row.vector[1] !== other.vector[1];
      return `<tr class="${changed ? "order-changed" : ""}"><th scope="row">${row.word}</th>
        <td>(${row.vector.join(", ")})</td><td>(${other.vector.join(", ")})</td><td>${changed ? "変化" : "同じ"}</td></tr>`;
    }).join("");
    layout.status.textContent = !swapped ? "二つの文は同じ並びです。" : positioned
      ? "太郎は1番目から3番目へ、花子は3番目から1番目へ移ったので、二人の数の組が変わりました。"
      : "追う人が変わりました。同じ語に注目すると、語だけの数の組は二つの文で一致します。";
  }
  layout.body.addEventListener("click", e => {
    const b = e.target instanceof Element ? e.target.closest("button") : null;
    if (!b) return;
    if (b.hasAttribute("data-swap")) swapped = !swapped;
    else positioned = b.dataset.mode === "position";
    render();
  }, { signal: controller.signal });
  render();
  return () => { controller.abort(); layout.dispose(); };
}
