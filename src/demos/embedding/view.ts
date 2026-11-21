import { escapeHtml, mountLlm } from "../llm-common/view";
import { distance, initialPoints, movePoint } from "./model";
import "./style.css";

export function mountEmbedding(root: HTMLElement): () => void {
  let points = initialPoints();
  let selected = "cat";
  let dragging: { id: string; pointerId: number } | undefined;
  const controller = new AbortController();
  const { signal } = controller;
  const layout = mountLlm(root, "embedding", "単語のボタンや図の点を選ぶとベクトルを表示します。点のドラッグ、座標の入力、矢印キーで位置を動かし、距離がどう変わるか確かめてください。", {
    reset: () => { releaseDrag(); points = initialPoints(); selected = "cat"; render(); },
  });
  layout.body.innerHTML = `<p class="llm-warning">説明用に配置した2次元の模式図です。Embeddingモデルで測定したベクトルではありません。軸に「動物らしさ」などの意味は割り当てていません。</p>
    <div class="llm-grid"><section class="llm-panel"><h2>単語を数値ベクトルで表す</h2><div class="llm-tokens">${points.map(point => `<button type="button" data-word="${point.id}" aria-pressed="false">${point.label}</button>`).join("")}</div>
    <div class="llm-scroll" tabindex="0" role="region" aria-label="模式ベクトルの座標図"><svg class="embedding-plot" viewBox="0 0 400 400" role="group" aria-label="第1成分x・第2成分y、0から10の模式図">
      ${Array.from({ length: 6 }, (_, index) => { const value = index * 2; return `<path d="M ${40 + value * 32} 40 V 360 M 40 ${360 - value * 32} H 360" stroke="#d9d1df" fill="none"/><text x="${40 + value * 32}" y="379" text-anchor="middle">${value}</text><text x="27" y="${365 - value * 32}" text-anchor="middle">${value}</text>`; }).join("")}
      <path d="M 40 40 V 360 H 360" stroke="currentColor" fill="none"/><text x="360" y="397" text-anchor="end">第1成分 x</text><text x="40" y="22">第2成分 y</text>
      ${points.map(point => `<g data-point="${point.id}" tabindex="0" role="button" aria-label="${point.label}の座標" aria-pressed="false"><circle class="embedding-hit" r="28" fill="transparent"/><circle class="embedding-dot" r="13"/><text class="embedding-label" y="-19" text-anchor="middle">${point.label}</text></g>`).join("")}</svg></div>
      <p class="hint">選択した図の点で矢印キー：0.1ずつ移動。Shift＋矢印キー：1ずつ移動。</p></section>
    <section class="llm-panel"><h2>選択したベクトル</h2><p data-vector class="llm-output"></p>
      <label>第1成分 x <input data-coordinate="x" type="number" min="0" max="10" step="0.1" inputmode="decimal"></label>
      <label>第2成分 y <input data-coordinate="y" type="number" min="0" max="10" step="0.1" inputmode="decimal"></label>
      <p>座標は0〜10。変更後、Enterまたは別の欄への移動で反映します。</p><h3>他の単語までの距離</h3><div data-distances></div><p>ユークリッド距離<br>d = √((x₁ − x₂)² + (y₁ − y₂)²)</p><p>この距離は表示した座標から実際に計算しています。点の配置は架空です。</p></section></div>
      <p>実際のEmbeddingは学習された多次元の数値表現です。この図の距離だけで単語の意味のすべてを表せるわけではありません。点を動かす操作もモデルの学習ではありません。</p><p><a href="#/sessions/08/vector-arithmetic">単語ベクトルの加減算を試す</a></p>`;
  const svg = layout.body.querySelector<SVGSVGElement>("svg")!;
  const vector = layout.body.querySelector<HTMLElement>("[data-vector]")!;
  const distances = layout.body.querySelector<HTMLElement>("[data-distances]")!;
  const xInput = layout.body.querySelector<HTMLInputElement>('[data-coordinate="x"]')!;
  const yInput = layout.body.querySelector<HTMLInputElement>('[data-coordinate="y"]')!;
  function releaseDrag() {
    if (dragging && svg.hasPointerCapture(dragging.pointerId)) svg.releasePointerCapture(dragging.pointerId);
    dragging = undefined;
  }
  function render() {
    const current = points.find(point => point.id === selected)!;
    vector.textContent = `${current.label} = (${current.x.toFixed(1)}, ${current.y.toFixed(1)})`;
    xInput.value = String(current.x); yInput.value = String(current.y);
    xInput.setAttribute("aria-label", `${current.label}の第1成分 x`);
    yInput.setAttribute("aria-label", `${current.label}の第2成分 y`);
    for (const point of points) {
      const group = svg.querySelector<SVGGElement>(`[data-point="${point.id}"]`)!;
      group.setAttribute("transform", `translate(${40 + point.x * 32} ${360 - point.y * 32})`);
      group.setAttribute("aria-pressed", String(point.id === selected));
      group.setAttribute("aria-label", `${point.label}、ベクトル(${point.x.toFixed(1)}, ${point.y.toFixed(1)})。矢印キーで移動`);
      layout.body.querySelector(`[data-word="${point.id}"]`)!.setAttribute("aria-pressed", String(point.id === selected));
    }
    distances.innerHTML = `<table><thead><tr><th>単語の組</th><th>距離</th></tr></thead><tbody>${points.filter(point => point.id !== selected).map(point => `<tr><td>${escapeHtml(current.label)} ↔ ${escapeHtml(point.label)}</td><td>${distance(current, point).toFixed(3)}</td></tr>`).join("")}</tbody></table>`;
    layout.status.textContent = `${current.label}を選択中。ベクトル(${current.x.toFixed(1)}, ${current.y.toFixed(1)})から、他の3点までの距離を再計算しました。`;
  }
  function setPosition(x: number, y: number) { points = movePoint(points, selected, x, y); render(); }
  function moveFromPointer(event: PointerEvent) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const cursor = svg.createSVGPoint(); cursor.x = event.clientX; cursor.y = event.clientY;
    const local = cursor.matrixTransform(matrix.inverse());
    setPosition((local.x - 40) / 32, (360 - local.y) / 32);
  }
  layout.body.addEventListener("click", event => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-word]") : null;
    if (button?.dataset.word) { selected = button.dataset.word; render(); }
  }, { signal });
  for (const input of [xInput, yInput]) input.addEventListener("change", () => {
    const x = xInput.valueAsNumber, y = yInput.valueAsNumber;
    setPosition(x, y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) layout.status.textContent = "0〜10の数値を入力してください。座標は直前の値を維持しました。";
  }, { signal });
  svg.addEventListener("pointerdown", event => {
    const target = event.target instanceof Element ? event.target.closest<SVGGElement>("[data-point]") : null;
    if (!target?.dataset.point || event.button !== 0) return;
    selected = target.dataset.point;
    dragging = { id: selected, pointerId: event.pointerId };
    target.focus();
    svg.setPointerCapture(event.pointerId);
    event.preventDefault(); render();
  }, { signal });
  svg.addEventListener("pointermove", event => { if (dragging?.pointerId === event.pointerId) { selected = dragging.id; moveFromPointer(event); } }, { signal });
  svg.addEventListener("pointerup", releaseDrag, { signal });
  svg.addEventListener("pointercancel", releaseDrag, { signal });
  svg.addEventListener("lostpointercapture", () => { dragging = undefined; }, { signal });
  svg.addEventListener("keydown", event => {
    const target = event.target instanceof Element ? event.target.closest<SVGGElement>("[data-point]") : null;
    if (!target?.dataset.point) return;
    const increment = event.shiftKey ? 1 : 0.1;
    const directions: Record<string, readonly [number, number]> = { ArrowLeft: [-increment, 0], ArrowRight: [increment, 0], ArrowDown: [0, -increment], ArrowUp: [0, increment] };
    const delta = directions[event.key];
    if (!delta && event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault(); selected = target.dataset.point;
    if (delta) { const current = points.find(point => point.id === selected)!; setPosition(current.x + delta[0], current.y + delta[1]); } else render();
  }, { signal });
  render();
  return () => { releaseDrag(); controller.abort(); layout.dispose(); };
}
