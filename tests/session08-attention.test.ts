import { describe, expect, it } from "vitest";
import { calculateAttention, stableSoftmax, type Vector2 } from "../src/demos/attention/model";
import { causalMatrix, inspectCausalRow } from "../src/demos/causal-mask/model";

describe("Attentionの実計算", () => {
  const keys: Vector2[] = [[0, 1], [1, 0], [0.5, 0.5]];
  const values: Vector2[] = [[1, 0], [0, 1], [1, 1]];
  it("内積を√2で割り、softmaxとValueの重み付き和を計算する", () => {
    const result = calculateAttention([1, 0], keys, values);
    expect(result.dots).toEqual([0, 1, 0.5]);
    expect(result.scores[1]).toBeCloseTo(0.7071067812);
    expect(result.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 14);
    expect(result.weights[0]).toBeCloseTo(0.22460634, 6);
    expect(result.weights[1]).toBeCloseTo(0.45552748, 6);
    expect(result.output[0]).toBeCloseTo(0.54447252, 6);
    expect(result.output[1]).toBeCloseTo(0.77539366, 6);
    expect(result.contributions[1]).toEqual([0, result.weights[1]]);
  });
  it("大きな正負スコアでも有限の確率を保つ", () => {
    expect(stableSoftmax([10000, 10000])).toEqual([0.5, 0.5]);
    expect(stableSoftmax([-10000, -10000])).toEqual([0.5, 0.5]);
    expect(stableSoftmax([10000, -10000])).toEqual([1, 0]);
  });
  it("参照禁止の重みを0にし、残りで正規化する", () => {
    const result = calculateAttention([1, 0], keys, values, [true, false, false]);
    expect(result.weights).toEqual([1, 0, 0]);
    expect(result.output).toEqual([1, 0]);
  });
  it("全マスク時は分布がないことを明示してゼロを返す", () => {
    const result = calculateAttention([1, 0], keys, values, [false, false, false]);
    expect(result.allMasked).toBe(true);
    expect(result.weights).toEqual([0, 0, 0]);
    expect(result.output).toEqual([0, 0]);
    expect(stableSoftmax([-Infinity, -Infinity])).toEqual([0, 0]);
  });
  it("Query変更で重みが変わり、元データを変更しない", () => {
    const before = structuredClone(keys);
    const result = calculateAttention([0, 1], keys, values);
    expect(result.weights[0]).toBeGreaterThan(result.weights[1]!);
    expect(keys).toEqual(before);
  });
  it("不正値と対応しない長さを拒否する", () => {
    expect(() => stableSoftmax([NaN])).toThrow();
    expect(() => stableSoftmax([Infinity])).toThrow();
    expect(() => calculateAttention([NaN, 0], keys, values)).toThrow();
    expect(() => calculateAttention([1, 0], keys, [])).toThrow();
    expect(() => calculateAttention([1, 0], keys, values, [true])).toThrow();
  });
});

describe("Causal Mask", () => {
  it("自身と過去だけを参照する下三角行列", () => {
    expect(causalMatrix(true)).toEqual([
      [true, false, false, false], [true, true, false, false],
      [true, true, true, false], [true, true, true, true],
    ]);
    expect(causalMatrix(false).flat()).toEqual(Array(16).fill(true));
  });
  it("次位置の正解漏れと最終行の正解未提示を区別する", () => {
    expect(inspectCausalRow(0, true)).toMatchObject({ references: [0], nextTarget: "は", leaksNextTarget: false });
    expect(inspectCausalRow(1, false)).toMatchObject({ references: [0, 1, 2, 3], nextTarget: "雨", leaksNextTarget: true });
    expect(inspectCausalRow(3, false)).toMatchObject({ nextTarget: null, leaksNextTarget: false });
  });
  it.each([-1, 4, 1.5, NaN])("範囲外の行 %s を拒否", (row) => {
    expect(() => inspectCausalRow(row, true)).toThrow();
  });
});
