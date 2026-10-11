import { expect, it } from "vitest";
import {
  modelCount,
  axisPosition,
  axisMaximum,
} from "../src/demos/moores-law/model";
it.each([12, 18, 24])("%sか月モデルは1971年に2300個", (months) =>
  expect(modelCount(1971, months)).toBe(2300),
);
it.each([12, 18, 24])("%sか月後に2倍になる", (months) =>
  expect(modelCount(1971 + months / 12, months)).toBeCloseTo(4600),
);
it("24か月モデルは4年で4倍", () => expect(modelCount(1975, 24)).toBe(9200));
it("同じ年では短い倍増期間ほど大きい", () => {
  expect(modelCount(2000, 12)).toBeGreaterThan(modelCount(2000, 18));
  expect(modelCount(2000, 18)).toBeGreaterThan(modelCount(2000, 24));
});
it("対数軸では等しい倍率が等間隔", () => {
  const a = axisPosition(1e3, "log", 1e9),
    b = axisPosition(1e4, "log", 1e9),
    c = axisPosition(1e5, "log", 1e9);
  expect(b - a).toBeCloseTo(c - b);
});
it("通常軸では等しい差が等間隔", () =>
  expect(
    axisPosition(200, "linear", 1000) - axisPosition(100, "linear", 1000),
  ).toBeCloseTo(0.1));
it("最大値は表示対象モデルと代表値を包含", () => {
  for (const months of [12, 18, 24])
    expect(axisMaximum([months])).toBeGreaterThanOrEqual(
      Math.max(134e9, modelCount(2050, months)),
    );
});
it("期間全体で数値が有限", () => {
  for (let year = 1971; year <= 2050; year++)
    for (const months of [12, 18, 24])
      expect(Number.isFinite(modelCount(year, months))).toBe(true);
});
