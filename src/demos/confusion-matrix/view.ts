import { lesson, percent } from "../learning-common/lesson";
import { field, numbers } from "../learning-common/view";
import { matrix } from "./model";
export function mountConfusion(root: HTMLElement) {
  const abort = new AbortController();
  const l = lesson(
    root,
    8,
    `<div class="lesson-grid"><section class="lesson-panel">${field("迷惑メールの割合（％）", "matrix-spam", 0, 100, 1, 1)}${field("検出率（％）", "matrix-detect", 0, 100, 1, 0)}${field("通常を迷惑とする誤検出率（％）", "matrix-false", 0, 100, 1, 0)}</section><section class="lesson-panel"><div data-matrix></div><p data-metrics></p></section></div><p>合計1000通、陽性は迷惑メールです。初期状態は通常990通・迷惑10通を、すべて通常と予測します。人数は四捨五入するため、指定した割合と実際の割合が少し異なる場合があります。</p><p>適合率＝迷惑と予測した中で実際に迷惑だった割合。再現率＝実際の迷惑メールの中で検出できた割合。誤検出と見逃しのどちらを減らしたいかで、指標の読み方も変わります。</p>`,
    () => {
      inputs.forEach((s, i) => (s.value = String([1, 0, 0][i])));
      render();
    },
    "割合を動かし、表の見逃し・誤検出と3つの指標がどう変わるか観察してください。",
    false,
  );
  const inputs = Array.from(
    l.body.querySelectorAll<HTMLInputElement>('input[type="range"]'),
  );
  function render() {
    numbers(l.body);
    const m = matrix(
      Number(inputs[0]!.value) / 100,
      Number(inputs[1]!.value) / 100,
      Number(inputs[2]!.value) / 100,
    );
    l.body.querySelector("[data-matrix]")!.innerHTML =
      `<table class="per-table"><caption>実際と予測の対応（通）</caption><thead><tr><th>実際＼予測</th><th>通常</th><th>迷惑</th></tr></thead><tbody><tr><th>通常</th><td>${m.tn} 正しく通常</td><td>${m.fp} 誤検出</td></tr><tr><th>迷惑</th><td>${m.fn} 見逃し</td><td>${m.tp} 検出</td></tr></tbody></table>`;
    l.body.querySelector("[data-metrics]")!.textContent =
      `正解率：${percent(m.accuracy)} ／ 適合率：${percent(m.precision)} ／ 再現率：${percent(m.recall)}`;
    l.status.textContent = `1000通中${m.tn + m.tp}通を正しく判定しました。迷惑メールの見逃しは${m.fn}通です。`;
  }
  l.body.addEventListener("input", render, { signal: abort.signal });
  render();
  return () => {
    abort.abort();
    l.dispose();
  };
}
