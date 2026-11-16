import { expect, it } from "vitest";
import {
  classify,
  update,
  learningFrames,
  mistakes,
} from "../src/demos/learning-common/model";
import { assign, recenter, frames } from "../src/demos/kmeans/model";
import { data, fit, predict, mse } from "../src/demos/overfitting/model";
it("s=0は0、講義の更新例と誤りがないときの非更新", () => {
  expect(classify({ x: 1, y: 0 }, [1, 1, -1]).prediction).toBe(0);
  expect(update([1, 1, -0.5], 2, 1)).toEqual([0, 1, -1.5]);
  expect(update([1, 1, -1.5], 3, 1)).toEqual([1, 1, -1.5]);
});
it.each([0.1, 0.5, 1])("学習率%sでANDが収束し上限以下で終了", (rate) => {
  const fs = learningFrames(rate, [2, 0, 1, 3]);
  expect(fs.length).toBeLessThanOrEqual(401);
  expect(mistakes(fs.at(-1)!.weights)).toBe(0);
  expect(fs[0]!.weights).toEqual([1, 1, -0.5]);
});
it("kmeansの同距離・平均更新・空クラスタ・不変性", () => {
  const ps = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0.5, y: 1 },
    ],
    cs = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 10, y: 10 },
    ];
  const labels = assign(ps, cs);
  expect(labels).toEqual([0, 1, 0]);
  expect(recenter(ps, labels, cs)).toEqual([
    { x: 0.25, y: 0.5 },
    { x: 1, y: 0 },
    { x: 10, y: 10 },
  ]);
  expect(cs[0]).toEqual({ x: 0, y: 0 });
  const fs = frames(ps, cs);
  expect(fs[0]!.labels).toEqual([]);
  expect(fs[1]!.phase).toContain("割り当て");
  expect(fs[2]!.phase).toContain("平均");
  expect(fs.at(-1)?.done).toBe(true);
});
it("QR近似で直線を再現し高次・少データでも有限", () => {
  const line = Array.from({ length: 10 }, (_, i) => ({
    x: i / 9,
    y: 1 + (2 * i) / 9,
  }));
  const coef = fit(line, 1);
  expect(predict(0.4, coef)).toBeCloseTo(1.8, 4);
  expect(mse(line, coef)).toBeLessThan(1e-9);
  for (const n of [6, 12, 60]) {
    const points = data(n, 0.6, 7),
      c = fit(points, 15);
    expect(c.every(Number.isFinite)).toBe(true);
    expect(Number.isFinite(mse(points, c))).toBe(true);
  }
});
it("訓練生成の再現性と固定の検証データ", () => {
  expect(data(12, 0.25, 7)).toEqual(data(12, 0.25, 7));
  expect(data(12, 0.25, 8)).not.toEqual(data(12, 0.25, 7));
});
