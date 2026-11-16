export const leafValues = [
  [0.1, 0.2],
  [0.8, 0.6],
  [-0.3, 0.4],
];
export interface Stats {
  n: number;
  q: number;
}
export interface TreeFrame {
  nodes: Stats[];
  leaves: Stats[][];
  selected: number;
  leaf: number;
  iterations: number;
  message: string;
}
const choose = (
  nodes: readonly Stats[],
  priors: readonly number[],
  total: number,
) =>
  nodes.reduce((best, s, i) => {
    const score = s.q + (1.4 * priors[i]! * Math.sqrt(total + 1)) / (1 + s.n),
      b = nodes[best]!;
    return score >
      b.q + (1.4 * priors[best]! * Math.sqrt(total + 1)) / (1 + b.n)
      ? i
      : best;
  }, 0);
export function explore(pA: number) {
  const priors = [pA, (1 - pA) / 2, (1 - pA) / 2],
    nodes = priors.map(() => ({ n: 0, q: 0 })),
    leaves = priors.map(() => [
      { n: 0, q: 0 },
      { n: 0, q: 0 },
    ]);
  const fs: TreeFrame[] = [];
  const snap = (
    iterations: number,
    selected: number,
    leaf: number,
    message: string,
  ) =>
    fs.push({
      nodes: nodes.map((s) => ({ ...s })),
      leaves: leaves.map((row) => row.map((s) => ({ ...s }))),
      selected,
      leaf,
      iterations,
      message,
    });
  snap(0, -1, -1, "訪問回数は0。未評価の平均値Qは0から始めます。");
  for (let t = 0; t < 100; t++) {
    const a = choose(nodes, priors, t),
      b = choose(leaves[a]!, [0.5, 0.5], nodes[a]!.n),
      v = leafValues[a]![b]!;
    for (const s of [nodes[a]!, leaves[a]![b]!]) {
      s.n++;
      s.q += (v - s.q) / s.n;
    }
    snap(
      t + 1,
      a,
      b,
      `根→${["A", "B", "C"][a]}→${b + 1}を選択し、葉の仮想評価${v}を取得。経路の平均Qと回数Nを更新しました。`,
    );
  }
  return { priors, frames: fs };
}
