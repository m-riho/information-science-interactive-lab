import { mountStepLesson } from "../../components/stepLesson";
import { session07Config, session07Materials } from "../../sessions/session07";
import { dataset, centers, frames } from "./model";
import { svg, axes, dot, sx, sy } from "../learning-common/view";
import type { Point } from "../learning-common/model";
const colors = [
  "#4b286d",
  "#176f84",
  "#985000",
  "#2b773b",
  "#9a2857",
  "#555555",
];
export function mountKmeans(root: HTMLElement) {
  let points = dataset(),
    seed = 7,
    initial = centers(3, seed);
  const abort = new AbortController();
  const l = mountStepLesson(
    root,
    session07Materials[0],
    () => {
      points = dataset();
      seed = 7;
      k.value = "3";
      initial = centers(3, seed);
      restart();
    },
    session07Config,
  );
  l.instructions.textContent =
    "1ステップで「割当て」と「中心更新」を交互に進めます。点・中心の追加や移動は下の座標操作を使えます。グラフをクリックして座標を選ぶこともできます。データの編集で学習は停止・初期化します。";
  l.body.innerHTML = `<p>対応スライド：10–11</p><div class="lesson-grid"><section class="lesson-panel"><label class="lesson-field">クラスタ数 k<select data-k>${[2, 3, 4, 5, 6].map((k) => `<option ${k === 3 ? "selected" : ""}>${k}</option>`).join("")}</select></label><button data-init>初期中心を変える</button><p data-seed></p><label class="lesson-field">編集対象<select data-edit></select></label><label class="lesson-field">x（0〜1）<input data-x type="number" min="0" max="1" step=".01" value=".5"></label><label class="lesson-field">y（0〜1）<input data-y type="number" min="0" max="1" step=".01" value=".5"></label><button data-save>この座標を反映</button><p>新しい点は最大60個。中心に所属点がない場合はその中心を維持します。</p></section><section class="lesson-panel"><div data-chart></div><p data-count></p></section></div><p>クラスタ番号は名前であり、順序や正解を表しません。番号と色の両方を使って示しています。kや初期中心によって結果が変わることがあります。</p><p>考えてみよう：${session07Materials[0].question}</p>`;
  const sel = (s: string) => l.body.querySelector<HTMLSelectElement>(s)!;
  const k = sel("[data-k]"),
    edit = sel("[data-edit]"),
    x = l.body.querySelector<HTMLInputElement>("[data-x]")!,
    y = l.body.querySelector<HTMLInputElement>("[data-y]")!;
  function options() {
    const value = edit.value;
    edit.innerHTML =
      '<option value="new">新しい点を追加</option>' +
      points
        .map((_, i) => `<option value="p${i}">点${i + 1}を移動</option>`)
        .join("") +
      initial
        .map((_, i) => `<option value="c${i}">中心${i + 1}を移動</option>`)
        .join("");
    if ([...edit.options].some((o) => o.value === value)) edit.value = value;
    sync();
  }
  function sync() {
    const p =
      edit.value[0] === "p"
        ? points[Number(edit.value.slice(1))]
        : edit.value[0] === "c"
          ? initial[Number(edit.value.slice(1))]
          : undefined;
    if (p) {
      x.value = p.x.toFixed(2);
      y.value = p.y.toFixed(2);
    }
  }
  function restart() {
    options();
    const fs = frames(points, initial);
    l.body.querySelector("[data-seed]")!.textContent =
      "初期中心のシード：" + seed;
    l.setFrames(fs.length, (i) => {
      const f = fs[i]!;
      l.body.querySelector("[data-chart]")!.innerHTML = svg(
        axes +
          points
            .map((p, j) =>
              dot(
                p,
                `${j + 1}:${f.labels[j] === undefined ? "?" : f.labels[j]! + 1}`,
                colors[f.labels[j] ?? 0],
              ),
            )
            .join("") +
          f.centers
            .map(
              (p, j) =>
                `<g class="ml-center" style="--ml-from:translate(${sx(fs[Math.max(0, i - 1)]!.centers[j]!.x)}px,${sy(fs[Math.max(0, i - 1)]!.centers[j]!.y)}px);transform:translate(${sx(p.x)}px,${sy(p.y)}px);animation-duration:${root.querySelector<HTMLInputElement>('[type="checkbox"]')?.checked ? "0ms" : "400ms"}"><rect x="-9" y="-9" width="18" height="18" fill="white" stroke="${colors[j]}" stroke-width="3"/><text x="-4" y="5">${j + 1}</text></g>`,
            )
            .join(""),
        "点とクラスタ中心。丸が点、四角が中心。",
      );
      l.body.querySelector("[data-count]")!.textContent = f.centers
        .map(
          (_, j) =>
            `クラスタ${j + 1}：${f.labels.filter((v) => v === j).length}点`,
        )
        .join(" ／ ");
      l.status.textContent = `${i}ステップ：${f.phase}。${f.done ? "停止。" : ""}`;
    });
  }
  function save() {
    const p: Point = { x: Number(x.value), y: Number(y.value) };
    if (
      x.value === "" ||
      y.value === "" ||
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y) ||
      p.x < 0 ||
      p.x > 1 ||
      p.y < 0 ||
      p.y > 1
    ) {
      l.status.textContent = "座標は0〜1で指定してください。";
      return;
    }
    if (edit.value === "new") {
      if (points.length >= 60) {
        l.status.textContent = "点は60個までです。";
        return;
      }
      points = [...points, p];
    } else {
      const i = Number(edit.value.slice(1));
      if (edit.value[0] === "p")
        points = points.map((v, j) => (j === i ? p : v));
      else initial = initial.map((v, j) => (j === i ? p : v));
    }
    restart();
  }
  k.addEventListener(
    "change",
    () => {
      initial = centers(Number(k.value), seed);
      restart();
    },
    { signal: abort.signal },
  );
  l.body.querySelector("[data-init]")!.addEventListener(
    "click",
    () => {
      initial = centers(Number(k.value), ++seed);
      restart();
    },
    { signal: abort.signal },
  );
  edit.addEventListener("change", sync, { signal: abort.signal });
  l.body
    .querySelector("[data-save]")!
    .addEventListener("click", save, { signal: abort.signal });
  l.body.querySelector("[data-chart]")!.addEventListener(
    "click",
    (e) => {
      if (!(e instanceof MouseEvent) || !(e.target instanceof Element)) return;
      const chart = e.target.closest("svg");
      if (!chart) return;
      const r = chart.getBoundingClientRect();
      x.value = Math.max(
        0,
        Math.min(1, (((e.clientX - r.left) * 440) / r.width - 40) / 360),
      ).toFixed(2);
      y.value = Math.max(
        0,
        Math.min(1, (285 - ((e.clientY - r.top) * 330) / r.height) / 240),
      ).toFixed(2);
      l.status.textContent =
        "座標を選びました。「この座標を反映」で確定します。";
    },
    { signal: abort.signal },
  );
  restart();
  return () => {
    abort.abort();
    l.dispose();
  };
}
