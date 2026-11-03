import { mountStepLesson } from "../../components/stepLesson";
import { session06Config, session06Demos } from "../../sessions/session06";
import {
  grid,
  neighbors,
  places,
  search,
  type SearchFrame,
  type Method,
  type Place,
} from "./model";
const coords: Record<Place, [number, number]> = {
  A: [30, 70],
  B: [85, 48],
  C: [140, 48],
  D: [85, 115],
  E: [195, 48],
  F: [250, 48],
  G: [305, 48],
};
function graph(
  current: Place | null,
  visited: readonly Place[],
  path: readonly Place[],
) {
  const edges = places.flatMap((p) =>
    neighbors(p)
      .filter((q) => q > p)
      .map((q) => {
        const [x, y] = coords[p],
          [x2, y2] = coords[q];
        return `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="var(--brand)" stroke-width="${path.some((n, i) => i > 0 && ((n === p && path[i - 1] === q) || (n === q && path[i - 1] === p))) ? 5 : 2}"/>`;
      }),
  );
  return `<svg class="s6-graph" viewBox="0 0 340 145" role="img" aria-label="状態空間グラフ。通路はA–B–C–E–F–G、枝道はA–D。現在位置：${current ?? "探索前"}">${edges.join("")}${places
    .map((p) => {
      const [x, y] = coords[p];
      return `<circle cx="${x}" cy="${y}" r="17" stroke="var(--brand)" stroke-width="${p === current ? 4 : 1}" fill="${visited.includes(p) ? "var(--brand-light)" : "white"}"/><text x="${x}" y="${y + 5}" text-anchor="middle">${p}</text>${p === current ? `<text x="${x}" y="${y - 23}" text-anchor="middle">現在</text>` : ""}`;
    })
    .join("")}</svg>`;
}
function mazeMap(current: Place | null, frame?: SearchFrame) {
  return grid
    .flat()
    .map((p) => {
      if (!p) return '<span class="s6-wall">■</span>';
      const role = p === "A" ? "出発" : p === "G" ? "ゴール" : "";
      const index = frame?.visited.indexOf(p) ?? -1;
      const state =
        p === current
          ? "現在"
          : index >= 0
            ? "訪問済"
            : frame?.queue.includes(p)
              ? "候補"
              : "";
      return `<span class="${p === current ? "s6-current" : ""}">${p}<small>${[role, state].filter(Boolean).join("・")}</small></span>`;
    })
    .join("");
}
export function mountMaze(root: HTMLElement) {
  let history: Place[] = ["A"];
  const abort = new AbortController();
  const l = mountStepLesson(
    root,
    session06Demos[2],
    () => {
      history = ["A"];
      planFromHere();
    },
    session06Config,
  );
  l.instructions.textContent =
    "Aから通路を1マスずつ進み、Gを目指します。移動先のボタンを選び、迷路のマスとグラフの点を見比べてください。「1ステップ」は現在地からゴールへの最短経路を1マス進みます。「自動実行」は同じ経路を進み、Gで停止します。途中で移動先を選ぶと手動操作に戻ります。";
  l.body.innerHTML = `<div class="lesson-grid"><section class="lesson-panel"><h2>迷路</h2><div class="s6-maze"></div><p>■ は壁です。斜めには移動できません。</p></section><section class="lesson-panel"><h2>状態空間グラフ</h2><div data-map></div><p>点は現在位置になれる場所、線は1回で移動できる通路です。</p></section></div><h2>次の移動先</h2><div class="transport" data-moves>${places.map((p) => `<button data-to="${p}">${p}へ</button>`).join("")}</div><p data-history class="lesson-value"></p>`;
  function render() {
    const p = history.at(-1)!,
      ns = neighbors(p);
    l.body.querySelector(".s6-maze")!.innerHTML = mazeMap(p);
    l.body.querySelector("[data-map]")!.innerHTML = graph(p, history, history);
    for (const b of l.body.querySelectorAll<HTMLButtonElement>("[data-to]"))
      b.hidden = p === "G" || !ns.includes(b.dataset.to as Place);
    l.body.querySelector("[data-history]")!.textContent =
      "移動履歴：" + history.join(" → ");
    l.status.textContent =
      p === "G"
        ? "Gに到着しました。出発点から" + (history.length - 1) + "手です。"
        : `現在は${p}。${p === "D" ? "行き止まりです。" : ""}移動できる先：${ns.join("・")}。`;
  }
  function planFromHere() {
    const path = search("BFS", history.at(-1)!).at(-1)!.path;
    l.setFrames(path.length, (index) => {
      // Frame zero already belongs to the manual history.
      if (index > 0) history.push(path[index]!);
      render();
    });
  }
  l.body.addEventListener(
    "click",
    (e) => {
      if (!(e.target instanceof HTMLButtonElement)) return;
      const q = e.target.dataset.to as Place;
      if (history.at(-1) !== "G" && neighbors(history.at(-1)!).includes(q)) {
        history.push(q);
        planFromHere();
        (
          l.body.querySelector<HTMLButtonElement>("[data-to]:not([hidden])") ??
          root.querySelector<HTMLButtonElement>('[data-action="reset"]')
        )?.focus();
      }
    },
    { signal: abort.signal },
  );
  planFromHere();
  return () => {
    abort.abort();
    l.dispose();
  };
}
function searchTree(frame: SearchFrame) {
  function branch(p: Place): string {
    const visit = frame.visited.indexOf(p);
    const state =
      p === frame.current ? "現在" : visit >= 0 ? "訪問済み" : "候補";
    const children = [...frame.parents].filter(([, parent]) => parent === p);
    const onPath = frame.path.includes(p);
    return `<li class="${onPath ? "on-route" : ""}"><span class="s6-tree-node ${visit < 0 ? "waiting" : ""} ${p === frame.current ? "current" : ""}"><strong>${p}</strong><small>${state}${visit >= 0 ? " · " + (visit + 1) + "番" : ""}</small></span>${children.length ? `<ul>${children.map(([child]) => branch(child)).join("")}</ul>` : ""}</li>`;
  }
  return `<ul class="s6-search-tree" aria-label="Aを根とする探索木">${branch("A")}</ul>`;
}
export function mountSearch(root: HTMLElement) {
  const abort = new AbortController();
  const l = mountStepLesson(
    root,
    session06Demos[3],
    () => {
      mode.value = "BFS";
      speed.value = "900";
      l.setIntervalMs(900);
      restart();
    },
    session06Config,
  );
  l.instructions.textContent =
    "探索法を選び、1ステップで候補を1つ取り出します。自動実行では停止・再開や速度変更もできます。訪問順と、最後に復元する経路を比べましょう。";
  l.body.innerHTML = `<div class="transport"><label class="lesson-field">探索法<select data-mode><option value="BFS">幅優先探索（BFS）</option><option value="DFS">深さ優先探索（DFS）</option></select></label><label class="lesson-field">再生速度<select data-speed><option value="1500">ゆっくり</option><option value="900" selected>標準</option><option value="400">速い</option></select></label></div><div class="lesson-grid"><section class="lesson-panel"><h2>元の迷路</h2><p>Aが出発、Gがゴール、■は壁です。上下左右に隣り合う通路だけを移動できます。</p><div class="s6-maze" data-maze></div><h3>移動できる場所のつながり</h3><div data-map></div></section><section class="lesson-panel"><h2>探索木（発見した親子関係）</h2><p>Aが根です。新しい点を候補に入れると、発見元の下に枝が伸びます。数字は訪問順です。</p><div data-search-tree></div></section></div><section class="lesson-panel"><h2>探索の記録</h2><div data-record></div></section><p>隣接する未発見の点はアルファベット順に優先します。同じ点は候補に二度入れません。訪問順には枝道も含まれますが、経路はゴールから親をたどって復元します。到着後は、その経路の枝を太線で示します。</p><p class="goal">幅優先は、各辺のコストが等しいときに最少手数を保証します。深さ優先にはその保証がありません。この迷路の通路には輪がなく、元のグラフ自体が木です。そのため親子のつながりはどちらの探索でも同じです。違うのは点を訪問する順番です。たとえば3番目は、幅優先ではD、深さ優先ではCです。</p>`;
  const mode = l.body.querySelector<HTMLSelectElement>("[data-mode]")!,
    speed = l.body.querySelector<HTMLSelectElement>("[data-speed]")!;
  function restart() {
    const method = mode.value as Method,
      frames = search(method);
    l.setFrames(frames.length, (i) => {
      const f = frames[i]!;
      l.body.querySelector("[data-maze]")!.innerHTML = mazeMap(f.current, f);
      l.body.querySelector("[data-search-tree]")!.innerHTML = searchTree(f);
      l.body.querySelector("[data-map]")!.innerHTML = graph(
        f.current,
        f.visited,
        f.path,
      );
      l.body.querySelector("[data-record]")!.innerHTML =
        `<p>現在：<strong>${f.current ?? "探索前"}</strong></p><p>${method === "BFS" ? "キュー（新しい候補は後ろへ）" : "スタック（新しい候補は先頭へ）"}<br>先頭から：${f.queue.join(" → ") || "なし"}</p><p>訪問済み（訪問順）：${f.visited.join(" → ") || "なし"}</p><p>ゴールへの経路：${f.path.join(" → ") || "未確定"}</p>`;
      l.status.textContent = f.path.length
        ? `Gに到着。経路は${f.path.length - 1}手です。`
        : f.current
          ? `${f.current}を訪問。次に取り出す候補は${f.queue[0]}です。`
          : "候補に出発点Aを入れました。";
    });
  }
  mode.addEventListener("change", restart, { signal: abort.signal });
  speed.addEventListener("change", () => l.setIntervalMs(Number(speed.value)), {
    signal: abort.signal,
  });
  restart();
  return () => {
    abort.abort();
    l.dispose();
  };
}
