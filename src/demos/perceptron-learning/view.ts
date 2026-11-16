import { mountDemoLayout } from "../../components/demoLayout";
import { mountStepLesson } from "../../components/stepLesson";
import { session07Materials, session07Config } from "../../sessions/session07";
import {
  andPoints,
  classify,
  mistakes,
  learningFrames,
  type Weights,
} from "../learning-common/model";
import {
  axes,
  sx,
  sy,
  svg,
  field,
  numbers,
  dot,
} from "../learning-common/view";
function boundary(w: Weights) {
  const [u, v, b] = w;
  if (!u && !v) return "";
  const pair =
    Math.abs(v) >= Math.abs(u)
      ? [-0.1, 1.1].map((x) => ({ x, y: (-b - u * x) / v }))
      : [-0.1, 1.1].map((y) => ({ x: (-b - v * y) / u, y }));
  return `<defs><clipPath id="ml-bound"><rect x="40" y="30" width="360" height="255"/></clipPath></defs><line x1="${sx(pair[0]!.x)}" y1="${sy(pair[0]!.y)}" x2="${sx(pair[1]!.x)}" y2="${sy(pair[1]!.y)}" stroke="var(--brand)" stroke-width="3" stroke-dasharray="6 3" clip-path="url(#ml-bound)"/>`;
}
function show(host: HTMLElement, w: Weights, selected: number) {
  host.querySelector("[data-chart]")!.innerHTML = svg(
    axes +
      boundary(w) +
      andPoints
        .map((p, i) =>
          dot(
            p,
            `(${p.x},${p.y}) ${i === selected ? "選択" : ""}`,
            p.label ? "var(--brand)" : "var(--accent)",
          ),
        )
        .join(""),
    "ANDの4点と判定境界",
  );
  host.querySelector("[data-table]")!.innerHTML =
    `<table class="per-table"><caption>ANDの4点：得点sは確率ではありません</caption><thead><tr><th>入力</th><th>正解</th><th>得点 s</th><th>予測</th></tr></thead><tbody>${andPoints.map((p, i) => `<tr ${i === selected ? 'class="per-selected"' : ""}><th>(${p.x},${p.y})</th><td>${p.label}</td><td>${classify(p, w).score.toFixed(3)}</td><td>${classify(p, w).prediction}</td></tr>`).join("")}</tbody></table>`;
}
const selectInput = `<label class="lesson-field">入力点<select data-point>${andPoints.map((p, i) => `<option value="${i}" ${i === 2 ? "selected" : ""}>(${p.x}, ${p.y})</option>`).join("")}</select></label>`;
const chart = "<div data-chart></div><div data-table></div>";
export function mountWeighted(root: HTMLElement) {
  const abort = new AbortController();
  const l = mountDemoLayout(
    root,
    session07Materials[3],
    {
      reset: () => {
        inputs.forEach((s, i) => (s.value = String([1, 1, -1.5][i])));
        point.value = "2";
        render();
      },
    },
    session07Config,
  );
  l.instructions.textContent =
    "入力点を選び、重みとバイアスを変更してください。重みは直線の傾き、バイアスは位置に影響します。スライダーは矢印キーでも動かせます。";
  l.body.innerHTML = `<p>対応スライド：26–30</p><p class="goal">s = w₁x₁ + w₂x₂ + b。s &gt; 0 なら1、s ≤ 0 なら0。</p><div class="lesson-grid"><section class="lesson-panel">${field("重み w₁", "ml-w0", -3, 3, 0.1, 1)}${field("重み w₂", "ml-w1", -3, 3, 0.1, 1)}${field("バイアス b", "ml-w2", -3, 3, 0.1, -1.5)}${selectInput}<p data-calc></p></section><section class="lesson-panel">${chart}</section></div><p>重みが両方0のとき、境界線は定まりません。全点がバイアスだけで判定されます。第6回とは、境界上の判定の約束が異なります。</p><p>考えてみよう：${session07Materials[3].question}</p>`;
  const inputs = Array.from(
      l.body.querySelectorAll<HTMLInputElement>('input[type="range"]'),
    ),
    point = l.body.querySelector<HTMLSelectElement>("[data-point]")!;
  function render() {
    const w: Weights = [
        Number(inputs[0]!.value),
        Number(inputs[1]!.value),
        Number(inputs[2]!.value),
      ],
      i = Number(point.value),
      p = andPoints[i]!;
    numbers(l.body);
    show(l.body, w, i);
    l.body.querySelector("[data-calc]")!.textContent =
      `${w[0]} × ${p.x} + ${w[1]} × ${p.y} + (${w[2]}) = ${classify(p, w).score.toFixed(3)}`;
    l.status.textContent = `4点中${4 - mistakes(w)}点正解。${!w[0] && !w[1] ? "境界線は定まりません。" : ""}`;
  }
  l.body.addEventListener("input", render, { signal: abort.signal });
  render();
  return () => {
    abort.abort();
    l.dispose();
  };
}
export function mountLearning(root: HTMLElement) {
  const abort = new AbortController();
  const l = mountStepLesson(
    root,
    session07Materials[4],
    () => {
      mode.value = "learn";
      rate.value = "1";
      order.value = "2,0,1,3";
      weights.forEach((s, i) => (s.value = String([1, 1, -0.5][i])));
      restart();
    },
    session07Config,
  );
  l.instructions.textContent =
    "手動モードでは重みを操作できます。学習モードでは1ステップで1データを確認し、間違えたときだけ更新します。初期順序の最初は(1,0)です。";
  l.body.innerHTML = `<p>対応スライド：30–31</p><p class="goal">wᵢ ← wᵢ + η(y − ŷ)xᵢ　／　b ← b + η(y − ŷ)</p><div class="lesson-grid"><section class="lesson-panel"><label class="lesson-field">モード<select data-mode><option value="learn">自動学習・コマ送り</option><option value="manual">手動で重みを調整</option></select></label><label class="lesson-field">学習率 η<select data-rate><option>0.1</option><option>0.5</option><option selected>1</option></select></label><label class="lesson-field">学習データの順番<select data-order><option value="2,0,1,3">(1,0) → (0,0) → (0,1) → (1,1)</option><option value="0,1,2,3">(0,0) → (0,1) → (1,0) → (1,1)</option><option value="3,2,1,0">逆順</option></select></label><div data-manual>${field("w₁", "learn-w0", -3, 3, 0.1, 1)}${field("w₂", "learn-w1", -3, 3, 0.1, 1)}${field("b", "learn-w2", -3, 3, 0.1, -0.5)}</div><p data-stats></p></section><section class="lesson-panel">${chart}</section></div><h2>学習履歴（最新12回）</h2><ol data-history class="lesson-trace"></ol><p>全4点を正しく分類できた時点、または400回の確認で停止します。自動学習の初期値は(1,1,−0.5)です。モード・設定変更で停止し学習を最初からやり直します。</p><p>考えてみよう：${session07Materials[4].question}</p>`;
  const sel = (s: string) => l.body.querySelector<HTMLSelectElement>(s)!;
  const mode = sel("[data-mode]"),
    rate = sel("[data-rate]"),
    order = sel("[data-order]"),
    weights = Array.from(
      l.body.querySelectorAll<HTMLInputElement>('input[type="range"]'),
    );
  function restart() {
    const manual = mode.value === "manual";
    l.body.querySelector<HTMLElement>("[data-manual]")!.hidden = !manual;
    const w: Weights = [
      Number(weights[0]!.value),
      Number(weights[1]!.value),
      Number(weights[2]!.value),
    ];
    const fs = learningFrames(
      Number(rate.value),
      order.value.split(",").map(Number),
    );
    numbers(l.body);
    l.setFrames(manual ? 1 : fs.length, (i) => {
      const f = fs[i]!,
        current = manual ? w : f.weights;
      show(l.body, current, f.index);
      const text = `w₁=${current[0].toFixed(3)}、w₂=${current[1].toFixed(3)}、b=${current[2].toFixed(3)}。誤分類${mistakes(current)}件。`;
      l.body.querySelector("[data-stats]")!.textContent =
        text + (manual ? "" : `確認${f.attempt}回／重み更新${f.updates}回。`);
      l.body.querySelector("[data-history]")!.innerHTML = manual
        ? ""
        : fs
            .slice(Math.max(1, i - 11), i + 1)
            .map(
              (v) =>
                `<li>(${andPoints[v.index]!.x},${andPoints[v.index]!.y})：更新前(${v.before.join(", ")}) → 更新後(${v.weights.join(", ")})</li>`,
            )
            .join("");
      l.status.textContent = manual
        ? text
        : i === 0
          ? "最初に選択した順序の先頭の入力を確認します。"
          : text +
            (mistakes(current) === 0
              ? "全4点を正しく判定できました。"
              : i === fs.length - 1
                ? "確認上限で停止しました。"
                : "");
    });
  }
  l.body.addEventListener("input", restart, { signal: abort.signal });
  restart();
  return () => {
    abort.abort();
    l.dispose();
  };
}
