import { describe, expect, it } from "vitest";
import { BASE_PROBABILITIES, temperatureDistribution, sampleIndex, initialSampling, recordSample } from "../src/demos/temperature/model";
import { initialGeneration, candidatesFor, selectCandidate, advanceGeneration } from "../src/demos/next-token/model";

describe("Temperatureの実計算", () => {
  it.each([0.1, 0.5, 1, 2, 3])("T=%sで正規化され順位が保たれる", temperature => {
    const values = temperatureDistribution(BASE_PROBABILITIES, temperature);
    expect(values.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(values.every(p => Number.isFinite(p) && p >= 0 && p <= 1)).toBe(true);
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });
  it("T=1は元分布、低温は集中、高温は平坦化", () => {
    temperatureDistribution(BASE_PROBABILITIES, 1).forEach((p, i) => expect(p).toBeCloseTo(BASE_PROBABILITIES[i]!));
    expect(temperatureDistribution(BASE_PROBABILITIES, 0.1)[0]).toBeGreaterThan(0.99);
    expect(temperatureDistribution(BASE_PROBABILITIES, 3)[0]).toBeLessThan(0.6);
    expect(temperatureDistribution([0, 1], 0.1)).toEqual([0, 1]);
  });
  it("定義域外の温度・重み・乱数を拒否", () => {
    for (const t of [0, -1, NaN, Infinity]) expect(() => temperatureDistribution(BASE_PROBABILITIES, t)).toThrow();
    for (const ps of [[], [0, 0], [-1, 2], [NaN, 1]]) expect(() => temperatureDistribution(ps, 1)).toThrow();
    for (const r of [-0.1, 1, NaN]) expect(() => sampleIndex(BASE_PROBABILITIES, r)).toThrow();
  });
  it("累積確率の境界と確率0の候補", () => {
    expect([0, 0.599, 0.6, 0.85, 0.95, 0.999].map(r => sampleIndex(BASE_PROBABILITIES, r))).toEqual([0, 0, 1, 2, 3, 3]);
    expect(sampleIndex([0, 1, 0], 0)).toBe(1);
  });
  it("100回分の集計と最新24件の履歴を不変更新", () => {
    const start = initialSampling();
    let state = start;
    for (let i = 0; i < 100; i++) state = recordSample(state, i % 4);
    expect(state.total).toBe(100);
    expect(state.counts).toEqual([25, 25, 25, 25]);
    expect(state.history).toHaveLength(24);
    expect(state.history[0]?.draw).toBe(77);
    expect(start.total).toBe(0);
    expect(start.counts).toEqual([0, 0, 0, 0]);
  });
});

describe("自己回帰生成の模式モデル", () => {
  it("初期の架空分布と選択に依存する次の分布", () => {
    const initial = initialGeneration();
    expect(candidatesFor(initial).map(c => c.probability)).toEqual(BASE_PROBABILITIES);
    const held = selectCandidate(initial, 0);
    const bought = selectCandidate(initial, 1);
    expect(held.text).toBe("今日は雨なので、傘を持って");
    expect(bought.text).toBe("今日は雨なので、傘を買って");
    expect(candidatesFor(held)).not.toEqual(candidatesFor(bought));
    expect(held.history[0]?.context).toBe(initial.text);
    expect(initial.history).toHaveLength(0);
  });
  it("全分岐で正規化され有限回でEOSに到達、終了後は進まない", () => {
    const visit = (state: ReturnType<typeof initialGeneration>, depth: number) => {
      expect(depth).toBeLessThanOrEqual(5);
      const candidates = candidatesFor(state);
      if (state.done) {
        expect(candidates).toEqual([]);
        expect(advanceGeneration(state, "greedy", 0)).toBe(state);
        return;
      }
      expect(candidates.reduce((sum, c) => sum + c.probability, 0)).toBeCloseTo(1);
      candidates.forEach((_, index) => visit(selectCandidate(state, index), depth + 1));
    };
    visit(initialGeneration(), 0);
  });
  it("greedyとsamplingの選択および無効な選択", () => {
    expect(advanceGeneration(initialGeneration(), "greedy", 0.9).text).toContain("持って");
    expect(advanceGeneration(initialGeneration(), "sampling", 0.9).text).toContain("忘れて");
    expect(() => selectCandidate(initialGeneration(), -1)).toThrow();
  });
});
