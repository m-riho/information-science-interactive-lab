import { lesson, spark } from "../learning-common/lesson";
import { field, numbers } from "../learning-common/view";
import { walls, best, bfs, learn, greedyRoute, type QFrame } from "./model";
export function mountQMaze(root: HTMLElement) {
  const abort = new AbortController();
  let current: QFrame | undefined;
  const l = lesson(
    root,
    1,
    `<div class="lesson-grid"><section class="lesson-panel"><label class="lesson-field">方法<select data-mode><option value="bfs">幅優先探索（BFS）</option><option value="q">Q-learning</option></select></label><label class="lesson-field">学習のコマ送り単位<select data-unit><option value="action">1行動</option><option value="episode">1エピソード</option></select></label>${field("学習率 α", "q-alpha", 0.1, 1, 0.1, 0.5)}${field("割引率 γ", "q-gamma", 0, 0.99, 0.01, 0.9)}${field("探索率 ε", "q-eps", 0, 1, 0.05, 0.25)}<label class="check"><input type="checkbox" data-policy>現在のQ値から選ぶ経路を表示</label></section><section class="lesson-panel"><div class="q-maze" data-grid></div><p data-route></p><p>壁■、出発S、ゴールG、現在●。番号はマス番号です。矢印は今のQ値で最も高い行動（同点は↑→↓←順）。</p></section></div><p data-progress></p><div data-rewards></div><details><summary>Q-learningの更新式と条件</summary><p>Q(s,a) ← Q(s,a) + α[r + γ max Q(s′,a′) − Q(s,a)]。ゴールでは次のQ値を0とします。報酬：ゴール+10、壁・盤外−2、それ以外−1。探索率の確率でランダム行動を選びます。</p><p>シード7、最大60エピソード、各80行動で打切り。終了後も再学習するにはリセットしてください。Q-learningが必ず最短経路へ収束するとは限りません。</p></details><p>この5×5迷路は比較のための教材用補足です。BFSは既知の通路を調べて最少手数の経路を求めます。Q-learningは実際の行動で得た報酬から行動価値を更新します。設定を変えると初期状態へ戻ります。</p>`,
    () => {
      mode.value = "bfs";
      unit.value = "action";
      alpha.value = ".5";
      gamma.value = ".9";
      eps.value = ".25";
      policy.checked = false;
      restart();
    },
    "方法を選び1ステップで進めます。Q-learningは1行動、または1エピソード単位に切替可能です。矢印や報酬の推移を見てください。",
  );
  const select = (s: string) => l.body.querySelector<HTMLSelectElement>(s)!,
    input = (s: string) => l.body.querySelector<HTMLInputElement>(s)!;
  const mode = select("[data-mode]"),
    unit = select("[data-unit]"),
    alpha = input("#q-alpha"),
    gamma = input("#q-gamma"),
    eps = input("#q-eps"),
    policy = input("[data-policy]");
  function draw(f: QFrame) {
    const route = policy.checked && f.q.length ? greedyRoute(f.q) : f.path;
    l.body.querySelector("[data-grid]")!.innerHTML = Array.from(
      { length: 25 },
      (_, s) =>
        `<div class="${walls.has(s) ? "q-wall" : ""} ${route.includes(s) ? "q-route" : ""} ${s === f.state ? "q-current" : ""}"><small>${s}</small><strong>${walls.has(s) ? "■" : s === f.state ? "●" : s === 0 ? "S" : s === 24 ? "G" : f.q.length && f.q[s]!.some((v) => v !== 0) ? ["↑", "→", "↓", "←"][best(f.q[s]!)] : f.visited.includes(s) ? "済" : "・"}</strong></div>`,
    ).join("");
    l.body.querySelector("[data-route]")!.textContent = route.length
      ? "経路：" +
        route.join(" → ") +
        (route.at(-1) === 24
          ? `（${route.length - 1}手でゴール）`
          : "（現在の方策はゴールに到達できません）")
      : "経路はまだ未確定です。";
    l.body.querySelector("[data-progress]")!.textContent =
      mode.value === "q"
        ? `現在のエピソード：${f.episode}、終了済み：${f.rewards.length}。最新の報酬合計：${f.rewards.at(-1) ?? "まだありません"}`
        : "訪問済み：" + f.visited.join(" → ");
    l.body.querySelector("[data-rewards]")!.innerHTML =
      mode.value === "q" ? spark(f.rewards, "各エピソードの報酬合計") : "";
    l.status.textContent = f.message;
  }
  function restart() {
    numbers(l.body);
    const q = mode.value === "q";
    for (const el of [alpha, gamma, eps, unit, policy]) el.disabled = !q;
    let fs = q
      ? learn(Number(alpha.value), Number(gamma.value), Number(eps.value))
      : bfs();
    if (q && unit.value === "episode")
      fs = fs.filter(
        (f, i) => i === 0 || f.rewards.length > fs[i - 1]!.rewards.length,
      );
    l.setFrames(fs.length, (i) => {
      current = fs[i]!;
      draw(current);
      if (i === fs.length - 1 && q)
        l.status.textContent += "60エピソードで学習終了。";
    });
  }
  for (const el of [mode, unit, alpha, gamma, eps])
    el.addEventListener("change", restart, { signal: abort.signal });
  policy.addEventListener(
    "change",
    () => {
      if (current) draw(current);
    },
    { signal: abort.signal },
  );
  l.setIntervalMs(150);
  restart();
  return () => {
    abort.abort();
    l.dispose();
  };
}
