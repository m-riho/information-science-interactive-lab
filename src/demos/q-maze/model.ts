import { random } from "../learning-common/model";
export const walls = new Set([6, 7, 8, 11, 16, 18, 23]);
export const actions = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
] as const; // up right down left
export function move(s: number, a: number) {
  const [dy, dx] = actions[a]!,
    y = Math.floor(s / 5) + dy,
    x = (s % 5) + dx;
  return x < 0 || x > 4 || y < 0 || y > 4 || walls.has(y * 5 + x)
    ? s
    : y * 5 + x;
}
export function qUpdate(
  old: number,
  reward: number,
  nextMax: number,
  alpha: number,
  gamma: number,
  terminal: boolean,
) {
  return old + alpha * (reward + (terminal ? 0 : gamma * nextMax) - old);
}
export const best = (row: readonly number[]) => row.indexOf(Math.max(...row));
export interface QFrame {
  state: number;
  q: number[][];
  episode: number;
  rewards: number[];
  message: string;
  visited: number[];
  path: number[];
}
export function bfs(): QFrame[] {
  const queue = [0],
    parent = new Map<number, number>(),
    seen = new Set(queue),
    visited: number[] = [];
  const fs: QFrame[] = [
    {
      state: 0,
      q: [],
      episode: 0,
      rewards: [],
      message: "既知の迷路の入口を候補にしました。",
      visited: [],
      path: [],
    },
  ];
  while (queue.length) {
    const s = queue.shift()!;
    visited.push(s);
    const path: number[] = [];
    if (s === 24) {
      let p: number | undefined = s;
      while (p !== undefined) {
        path.unshift(p);
        p = parent.get(p);
      }
    } else
      for (let a = 0; a < 4; a++) {
        const n = move(s, a);
        if (!seen.has(n)) {
          seen.add(n);
          parent.set(n, s);
          queue.push(n);
        }
      }
    fs.push({
      state: s,
      q: [],
      episode: 0,
      rewards: [],
      message:
        s === 24
          ? "最少手数の経路が確定しました。"
          : "未訪問の隣のマスを候補へ追加しました。",
      visited: [...visited],
      path,
    });
    if (s === 24) break;
  }
  return fs;
}
export function learn(alpha: number, gamma: number, epsilon: number) {
  const r = random(7),
    q = Array.from({ length: 25 }, () => [0, 0, 0, 0]),
    rewards: number[] = [],
    fs: QFrame[] = [];
  const snapshot = (state: number, episode: number, message: string) =>
    fs.push({
      state,
      episode,
      q: q.map((row) => [...row]),
      rewards: [...rewards],
      message,
      visited: [],
      path: [],
    });
  snapshot(0, 0, "Q値はすべて0。シード7で開始します。");
  for (let episode = 1; episode <= 60; episode++) {
    let s = 0,
      total = 0;
    for (let step = 0; step < 80; step++) {
      const a = r() < epsilon ? Math.floor(r() * 4) : best(q[s]!),
        n = move(s, a),
        reward = n === 24 ? 10 : n === s ? -2 : -1,
        old = q[s]![a]!;
      q[s]![a] = qUpdate(
        old,
        reward,
        Math.max(...q[n]!),
        alpha,
        gamma,
        n === 24,
      );
      total += reward;
      const ended = n === 24 || step === 79;
      if (ended) rewards.push(total);
      snapshot(
        n,
        episode,
        `行動${["↑", "→", "↓", "←"][a]}：報酬${reward}。Q(${s},${a}) ${old.toFixed(2)} → ${q[s]![a]!.toFixed(2)}。${ended ? (n === 24 ? "ゴールでエピソード終了。" : "80行動で打切り。") : ""}`,
      );
      s = n;
      if (ended) break;
    }
  }
  return fs;
}
export function greedyRoute(q: readonly (readonly number[])[]) {
  if (!q.length) return [];
  const path = [0];
  for (let i = 0; i < 25; i++) {
    const s = path.at(-1)!,
      n = move(s, best(q[s]!));
    if (path.includes(n)) break;
    path.push(n);
    if (n === 24) break;
  }
  return path;
}
