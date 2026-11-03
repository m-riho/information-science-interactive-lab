import { mountDemoLayout } from "../../components/demoLayout";
import { session06Demos, session06Config } from "../../sessions/session06";
import { treeCounts } from "./model";
function diagram(b: number, d: number) {
  const { total } = treeCounts(b, d);
  if (total > 10000n)
    return "<p>大きな木なので図を省略し、数値だけを表示します。</p>";
  const depth = Math.min(d, b > 4 ? 1 : 3);
  let drawing = "";
  const x = (i: number, n: number) => 15 + ((i + 0.5) * 330) / n;
  for (let k = 0; k <= depth; k++) {
    const n = b ** k,
      y = 18 + k * 44;
    for (let i = 0; i < n; i++) {
      if (k)
        drawing += `<line x1="${x(Math.floor(i / b), n / b)}" y1="${y - 44}" x2="${x(i, n)}" y2="${y}" stroke="var(--accent)"/>`;
      drawing += `<circle cx="${x(i, n)}" cy="${y}" r="${Math.min(5, 125 / n)}" fill="var(--brand)"/>`;
    }
  }
  return `<svg class="s6-graph" viewBox="0 0 360 ${36 + 44 * depth}" role="img" aria-label="根から深さ${depth}までの探索木">${drawing}</svg><p>根（深さ0）から深さ${depth}までを表示。${depth < d ? "これより深い段は省略しています。" : ""}</p>`;
}
export function mountTree(root: HTMLElement) {
  const abort = new AbortController();
  const l = mountDemoLayout(
    root,
    session06Demos[5],
    { reset: () => set(3, 5) },
    session06Config,
  );
  l.instructions.textContent =
    "1つの点から伸びる枝の数と、根から進む手数を変えてください。最後の段だけの候補数と、途中を含めた点の数を比べましょう。";
  l.body.innerHTML = `<section class="lesson-panel"><h2>木の形を決める</h2>${[
    ["b", "分岐数 b", 1, 10],
    ["d", "深さ d", 0, 100],
  ]
    .map(
      ([id, name, min, max]) =>
        `<label class="per-slider" for="tree-${id}">${name}<output for="tree-${id}"></output><input id="tree-${id}" type="range" min="${min}" max="${max}" step="1"></label>`,
    )
    .join(
      "",
    )}<div class="transport"><button data-depth="5">3分岐・深さ5</button><button data-depth="10">3分岐・深さ10</button></div></section><div data-counts class="lesson-grid"></div><section class="lesson-panel"><h2>根から見た探索木</h2><div data-tree></div></section><p class="goal">総当たりが大変でも、高速な解法が存在しないと証明したことにはなりません。</p>`;
  const b = l.body.querySelector<HTMLInputElement>("#tree-b")!,
    d = l.body.querySelector<HTMLInputElement>("#tree-d")!;
  function render() {
    const branch = Number(b.value),
      depth = Number(d.value),
      { leaves, total } = treeCounts(branch, depth);
    l.body
      .querySelectorAll("output")
      .forEach((o, i) => (o.textContent = i ? d.value : b.value));
    l.body.querySelector("[data-counts]")!.innerHTML =
      `<section class="lesson-panel"><h2>末端候補数</h2><p>最後の段：${branch}<sup>${depth}</sup></p><strong class="lesson-value">${leaves.toLocaleString("ja-JP")}</strong></section><section class="lesson-panel"><h2>総ノード数</h2><p>根から最後の段まで：Σ（k = 0〜${depth}）${branch}<sup>k</sup></p><strong class="lesson-value">${total.toLocaleString("ja-JP")}</strong></section>`;
    l.body.querySelector("[data-tree]")!.innerHTML = diagram(branch, depth);
    l.status.textContent =
      depth === 0
        ? "根が唯一の末端で、どちらも1です。"
        : `分岐数${branch}、深さ${depth}。各段の点の数は、前の段の${branch}倍です。`;
  }
  function set(branch: number, depth: number) {
    b.value = String(branch);
    d.value = String(depth);
    render();
  }
  l.body.addEventListener("input", render, { signal: abort.signal });
  l.body
    .querySelectorAll<HTMLButtonElement>("[data-depth]")
    .forEach((btn) =>
      btn.addEventListener("click", () => set(3, Number(btn.dataset.depth)), {
        signal: abort.signal,
      }),
    );
  set(3, 5);
  return () => {
    abort.abort();
    l.dispose();
  };
}
