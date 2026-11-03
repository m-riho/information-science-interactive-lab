import { mountDemoLayout } from "../../components/demoLayout";
import { mountStepLesson } from "../../components/stepLesson";
import { session06Config, session06Demos } from "../../sessions/session06";
import {
  inputs,
  neuron,
  target,
  presets,
  multilayer,
  type Task,
  type Weights,
} from "./model";

const table = (headers: string[], rows: string, caption: string) =>
  `<table class="per-table"><caption>${caption}</caption><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
const svg = (content: string, title: string) =>
  `<svg viewBox="0 0 300 220" role="img" aria-label="${title}" class="per-figure">${content}</svg>`;
function plot(task: Task, weights: Weights) {
  const [u, v, b] = weights;
  const px = (x: number) => 85 + 130 * x,
    py = (y: number) => 170 - 120 * y;
  let line = "";
  if (u || v) {
    // Choose the larger divisor so vertical and horizontal boundaries are stable.
    const endpoints =
      Math.abs(v) >= Math.abs(u)
        ? [-1, 2].map((x) => [px(x), py((-b - u * x) / v)])
        : [-1, 2].map((y) => [px((-b - v * y) / u), py(y)]);
    line = `<line x1="${endpoints[0]![0]}" y1="${endpoints[0]![1]}" x2="${endpoints[1]![0]}" y2="${endpoints[1]![1]}" stroke="var(--brand)" stroke-width="3" stroke-dasharray="6 3" clip-path="url(#per-clip)"/>`;
  }
  return svg(
    `<defs><clipPath id="per-clip"><rect x="15" y="10" width="270" height="185"/></clipPath></defs><path d="M30 170H280 M85 192V15" stroke="currentColor" fill="none"/><text x="274" y="188">x₁</text><text x="60" y="23">x₂</text>${line}${inputs
      .map(([x, y]) => {
        const t = target(task, [x, y]),
          a = px(x),
          c = py(y);
        return `${t ? `<rect x="${a - 10}" y="${c - 10}" width="20" height="20" rx="2" fill="var(--brand)"/>` : `<circle cx="${a}" cy="${c}" r="10" fill="white" stroke="var(--brand)" stroke-width="2"/>`}<text x="${a + 15}" y="${c + 5}">(${x},${y})</text>`;
      })
      .join("")}`,
    "入力4点の目標値と分類境界。各点の予測は判定表に表示。",
  );
}

export function mountSingle(root: HTMLElement) {
  const abort = new AbortController();
  const layout = mountDemoLayout(
    root,
    session06Demos[0],
    { reset: () => preset("AND") },
    session06Config,
  );
  const group = layout.body;
  layout.instructions.textContent =
    "ANDは「両方が1」、ORは「少なくとも片方が1」、XORは「片方だけが1」のときに1となる課題です。課題を選び、重みとバイアスを動かして4点を分類してください。ANDとORの設定例から、同じ直線でXORを分類できるか試せます。";
  group.innerHTML = `<label class="lesson-field">分類する課題 <select id="per-task"><option>AND</option><option>OR</option><option>XOR</option></select></label><div class="transport"><button data-example="AND">ANDの設定例</button><button data-example="OR">ORの設定例</button></div><div class="lesson-grid"><section class="lesson-panel"><h2>ニューロンの設定</h2><p>z = w₁ × x₁ + w₂ × x₂ + b<br>z が0以上なら予測は1、負なら0です。</p>${["重み w₁", "重み w₂", "バイアス b"].map((name, i) => `<label class="per-slider" for="per-w${i}">${name} <output for="per-w${i}"></output><input id="per-w${i}" type="range" min="-3" max="3" step="0.5"></label>`).join("")}</section><section class="lesson-panel"><h2>4点を分ける境界</h2><div id="per-plane"></div><p>○：目標0　■：目標1<br>破線：z = 0 の位置</p><p id="per-boundary"></p></section></div><div id="per-results"></div><details><summary>XORを直線で分けられない理由</summary><p>目標1の2点を結ぶ線分と、目標0の2点を結ぶ線分は、同じ中点で交わります。z は直線的に変化するので、中点の z は両端の平均です。正しく分けるには、その中点が同時に「0以上」と「負」にならなければならず、矛盾します。</p></details>`;
  const sliders = Array.from(
    group.querySelectorAll<HTMLInputElement>('input[type="range"]'),
  );
  const select = group.querySelector<HTMLSelectElement>("select")!;
  function render() {
    const weights: Weights = [
      Number(sliders[0]!.value),
      Number(sliders[1]!.value),
      Number(sliders[2]!.value),
    ];
    group
      .querySelectorAll("output")
      .forEach((o, i) => (o.textContent = String(weights[i])));
    const task = select.value as Task;
    group.querySelector("#per-plane")!.innerHTML = plot(task, weights);
    const zs = inputs.map((input) => neuron(input, weights));
    group.querySelector("#per-boundary")!.textContent =
      weights[0] === 0 && weights[1] === 0
        ? "両方の重みが0なので境界線は定まりません。すべての点で z = b です。"
        : "直線の位置や傾きは重みとバイアスで変わります。直線が図の外にある場合もあります。";
    let score = 0;
    group.querySelector("#per-results")!.innerHTML = table(
      ["入力", "目標", "z", "予測", "判定"],
      inputs
        .map((p, i) => {
          const expected = target(task, p),
            n = zs[i]!,
            ok = n.value === expected;
          if (ok) score++;
          return `<tr><th scope="row">(${p.join(",")})</th><td>${expected}</td><td>${n.z}</td><td>${n.value}</td><td>${ok ? "正解" : "不正解"}</td></tr>`;
        })
        .join(""),
      task + "の判定表",
    );
    layout.status.textContent = `${task}：4点中${score}点が正解です。`;
  }
  function preset(task: keyof typeof presets) {
    select.value = task;
    sliders.forEach((s, i) => (s.value = String(presets[task][i])));
    render();
  }
  group.addEventListener("input", render, { signal: abort.signal });
  group
    .querySelectorAll<HTMLButtonElement>("[data-example]")
    .forEach((btn) =>
      btn.addEventListener(
        "click",
        () => preset(btn.dataset.example === "OR" ? "OR" : "AND"),
        { signal: abort.signal },
      ),
    );
  preset("AND");
  return () => {
    abort.abort();
    layout.dispose();
  };
}

export function mountMulti(root: HTMLElement) {
  const abort = new AbortController();
  const layout = mountStepLesson(
    root,
    session06Demos[1],
    () => {
      select.value = "0";
      restart();
    },
    session06Config,
  );
  layout.instructions.textContent =
    "入力を選び、「1ステップ」で隠れ層、出力層の順に計算してください。「選択中」の行が図に対応します。入力を変えると入力層から再開します。";
  layout.body.innerHTML = `<label class="lesson-field">入力 (x₁, x₂)<select>${inputs.map((p, i) => `<option value="${i}">(${p.join(", ")})</option>`).join("")}</select></label><div class="lesson-grid"><section class="lesson-panel"><h2>信号をたどる</h2><div id="per-net"></div><p>左から入力層 → 隠れ層 → 出力層。「?」はまだ計算していない値です。</p></section><section class="lesson-panel"><h2>各ニューロンの計算</h2><p>どの段も z が0以上なら1、負なら0を出します。</p><ol id="per-stages" class="lesson-trace"></ol></section></div><div id="per-truth"></div><p class="goal">隠れ層は「少なくとも片方が1」と「両方とも1」を別々に判定します。前者が1で後者が0のときだけ、出力は1になります。</p><p>ここで確かめたのは、多層にするとXORを表せることです。重みはあらかじめ設定してあり、自動で学習したものではありません。重みの学習は第7回で扱います。</p>`;
  const select = layout.body.querySelector("select")!;
  function restart() {
    const i = Number(select.value),
      p = inputs[i]!,
      { h1, h2, y } = multilayer(p);
    layout.setFrames(3, (stage) => {
      const node = (x: number, k: number, name: string, val: string) =>
        `<circle cx="${x}" cy="${k}" r="26" fill="var(--brand-light)" stroke="var(--brand)" stroke-width="2"/><text x="${x}" y="${k + 5}" text-anchor="middle">${name}:${val}</text>`;
      layout.body.querySelector("#per-net")!.innerHTML = svg(
        `<path d="M40 60L150 60 M40 60L150 160 M40 160L150 60 M40 160L150 160 M150 60L260 110 M150 160L260 110" fill="none" stroke="var(--accent)" stroke-width="2"/>${node(40, 60, "x₁", String(p[0]))}${node(40, 160, "x₂", String(p[1]))}${node(150, 60, "h₁", stage ? String(h1.value) : "?")}${node(150, 160, "h₂", stage ? String(h2.value) : "?")}${node(260, 110, "y", stage === 2 ? String(y.value) : "?")}`,
        "入力層、隠れ層、出力層の接続。値は隣の計算欄にも表示。",
      );
      const steps = [
        `入力：x₁ = ${p[0]}、x₂ = ${p[1]}`,
        stage
          ? `隠れ層：OR の z = x₁ + x₂ − 0.5 = ${h1.z} → h₁ = ${h1.value}。AND の z = x₁ + x₂ − 1.5 = ${h2.z} → h₂ = ${h2.value}。`
          : "隠れ層：未計算",
        stage === 2
          ? `出力層：z = h₁ − h₂ − 0.5 = ${y.z} → y = ${y.value}`
          : "出力層：未計算",
      ];
      layout.body.querySelector("#per-stages")!.innerHTML = steps
        .map(
          (s, j) => `<li ${j === stage ? 'aria-current="step"' : ""}>${s}</li>`,
        )
        .join("");
      layout.body.querySelector("#per-truth")!.innerHTML = table(
        ["入力", "XORの目標", "今回の出力"],
        inputs
          .map(
            (q, j) =>
              `<tr ${j === i ? 'class="per-selected"' : ""}><th scope="row">(${q.join(",")})${j === i ? " 選択中" : ""}</th><td>${target("XOR", q)}</td><td>${j === i ? (stage === 2 ? y.value : "未計算") : "—"}</td></tr>`,
          )
          .join(""),
        "XORの真理値表",
      );
      layout.status.textContent = steps[stage]!;
    });
  }
  select.addEventListener("change", restart, { signal: abort.signal });
  restart();
  return () => {
    abort.abort();
    layout.dispose();
  };
}
