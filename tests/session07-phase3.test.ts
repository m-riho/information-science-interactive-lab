import { it, expect } from "vitest";
import { activate } from "../src/demos/activation-functions/model";
import { matrix } from "../src/demos/confusion-matrix/model";
import {
  inspectNetwork,
  initial,
  gradient,
  loss,
  training,
  output,
  xorData,
} from "../src/demos/xor-network/model";
import { samples, train, accuracy } from "../src/demos/shortcut-learning/model";
import {
  qUpdate,
  bfs,
  learn,
  greedyRoute,
  move,
  walls,
} from "../src/demos/q-maze/model";
import { explore } from "../src/demos/mcts-search/model";
it("活性化の零・符号・極端な値", () => {
  expect(activate("ステップ関数", 0)).toBe(0);
  expect(activate("ReLU", -2)).toBe(0);
  expect(activate("ReLU", 2)).toBe(2);
  expect(activate("Sigmoid", 0)).toBe(0.5);
  expect(activate("Sigmoid", -1000)).toBe(0);
  expect(activate("Sigmoid", 1000)).toBe(1);
  expect(activate("tanh", 0)).toBe(0);
});
it("初期メールの99％正解と0％再現、定義不能な分母", () => {
  expect(matrix(0.01, 0, 0)).toEqual({
    tp: 0,
    tn: 990,
    fp: 0,
    fn: 10,
    accuracy: 0.99,
    precision: null,
    recall: 0,
  });
  expect(matrix(0, 1, 0).recall).toBeNull();
  expect(matrix(1, 1, 0).precision).toBe(1);
  for (const p of [0, 0.01, 0.5, 1]) {
    const m = matrix(p, 0.8, 0.1);
    expect(m.tp + m.tn + m.fp + m.fn).toBe(1000);
  }
});
it.each([false, true])("単層/多層=%sの勾配を有限差分で検証", (multi) => {
  const w = initial(multi),
    g = gradient(w, multi),
    eps = 1e-5;
  for (let j = 0; j < w.length; j++) {
    const plus = [...w],
      minus = [...w];
    plus[j] = plus[j]! + eps;
    minus[j] = minus[j]! - eps;
    expect(g[j]).toBeCloseTo(
      (loss(plus, multi) - loss(minus, multi)) / (2 * eps),
      6,
    );
  }
});
it("固定シードで多層XORが全点学習でき、単層は4点分類できない", () => {
  const fs = training(true, 0.5),
    last = fs.at(-1)!;
  expect(last.loss).toBeLessThan(0.05);
  expect(
    xorData.map((d) => Number(output(last.w, d.x, d.y, true).p >= 0.5)),
  ).toEqual([0, 1, 1, 0]);
  expect(fs[0]!.w).toEqual(initial(true));
  const single = training(false, 0.5).at(-1)!;
  expect(
    xorData.filter(
      (d) => Number(output(single.w, d.x, d.y, false).p >= 0.5) === d.label,
    ).length,
  ).toBeLessThan(4);
});
it("ショートカット学習で背景依存が反転背景に弱い", () => {
  const data = samples(1),
    w = train(data, true).at(-1)!,
    shapeOnly = train(data, false).at(-1)!,
    test = samples(0, 100);
  expect(accuracy(data, w, true)).toBeGreaterThan(0.95);
  expect(accuracy(test, w, true)).toBeLessThan(0.2);
  expect(accuracy(test, shapeOnly, false)).toBeGreaterThan(0.6);
  expect(shapeOnly[2]).toBe(0);
  expect(samples(1)).toEqual(samples(1));
});
it("Q更新でゴールの次の価値を除外し、壁では移動しない", () => {
  expect(qUpdate(1, 10, 100, 0.5, 0.9, true)).toBe(5.5);
  expect(qUpdate(1, -1, 2, 0.5, 0.9, false)).toBeCloseTo(0.9);
  expect(move(0, 0)).toBe(0);
  expect(move(1, 2)).toBe(1);
  expect(move(22, 1)).toBe(22);
  expect(move(24, 3)).toBe(24);
  expect(walls.has(23)).toBe(true);
});
it("BFSの最短経路、Qの有限終了と再現性・スナップショット", () => {
  const path = bfs().at(-1)!.path;
  expect(path).toHaveLength(9);
  expect(path.every((n) => !walls.has(n))).toBe(true);
  const fs = learn(0.5, 0.9, 0.25),
    last = fs.at(-1)!;
  expect(last.rewards).toHaveLength(60);
  expect(fs.length).toBeLessThanOrEqual(4801);
  expect(last.q.flat().every(Number.isFinite)).toBe(true);
  expect(fs[0]!.q.flat().every((v) => v === 0)).toBe(true);
  expect(greedyRoute(last.q).at(-1)).toBe(24);
  expect(learn(0.5, 0.9, 0.25).at(-1)).toEqual(last);
});
it("MCTSの各探索で経路の回数と平均を不変更新し、事前予測と異なる手も選ぶ", () => {
  const { frames } = explore(0.7),
    last = frames.at(-1)!;
  for (const f of frames) {
    expect(f.nodes.reduce((s, n) => s + n.n, 0)).toBe(f.iterations);
    f.nodes.forEach((n, j) =>
      expect(n.n).toBe(f.leaves[j]!.reduce((s, l) => s + l.n, 0)),
    );
  }
  expect(frames[0]!.nodes.every((s) => !s.n)).toBe(true);
  expect(last.nodes[1]!.n).toBeGreaterThan(last.nodes[0]!.n);
});

it("ネットワーク図の重み・バイアスと中間値が実際の予測に一致する", () => {
  for (const multi of [false, true]) {
    const w = initial(multi);
    for (const d of xorData) {
      const n = inspectNetwork(w, d.x, d.y, multi);
      expect(n.output.value).toBe(output(w, d.x, d.y, multi).p);
      expect(n.output.value).toBeCloseTo(1 / (1 + Math.exp(-n.output.sum)), 12);
      expect(n.hidden).toHaveLength(multi ? 4 : 0);
      for (const h of n.hidden) {
        expect(h.sum).toBeCloseTo(
          h.bias + h.weights[0]! * d.x + h.weights[1]! * d.y,
          12,
        );
        expect(h.value).toBe(Math.tanh(h.sum));
      }
      expect(
        n.hidden.reduce((s, h) => s + h.weights.length + 1, 0) +
          n.output.weights.length +
          1,
      ).toBe(w.length);
    }
  }
});
