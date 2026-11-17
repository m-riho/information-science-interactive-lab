import { describe, expect, it } from "vitest";
import { derivative, descentTrace, extrema, quartic } from "../src/demos/gradient-descent/model";

describe("4次関数の勾配降下", () => {
  it("指定の4次関数を使い、左右それぞれで解析導関数と数値微分が一致する", () => {
    expect(quartic(-2)).toBe(3);
    expect(quartic(2)).toBe(7);
    for (const x of [-1.7, -0.5, 0, 1.2, 2]) {
      const h = 0.00001;
      expect(derivative(x)).toBeCloseTo((quartic(x + h) - quartic(x - h)) / (2 * h), 6);
    }
  });

  it("初期値1で負の勾配を引くと右に動く", () => {
    const trace = descentTrace(1, 0.1);
    expect(trace.points[0]).toEqual({ x: 1, value: 3, slope: -3 });
    expect(trace.points[1]?.x).toBeCloseTo(1.3);
    expect(trace.points[1]?.value).toBeCloseTo(2.3961);
  });

  it("開始点によって異なる極小点に到達する", () => {
    const left = descentTrace(-1, 0.05), right = descentTrace(1, 0.05);
    expect(left.reason).toBe("stationary");
    expect(right.reason).toBe("stationary");
    expect(left.points.at(-1)!.x).toBeCloseTo(-1.473, 3);
    expect(right.points.at(-1)!.x).toBeCloseTo(1.347, 3);
    expect(left.points.at(-1)!.value).toBeLessThan(right.points.at(-1)!.value);
  });

  it("極大点を含む3つの停留点を分類し、極大点からの探索も更新前に停止する", () => {
    expect(extrema.map(e => e.kind)).toEqual(["minimum", "maximum", "minimum"]);
    for (const e of extrema) {
      expect(Math.abs(derivative(e.x))).toBeLessThan(1e-12);
      const difference = quartic(e.x + 0.001) - quartic(e.x);
      expect(Math.sign(difference)).toBe(e.kind === "maximum" ? -1 : 1);
    }
    const trace = descentTrace(extrema[1]!.x, 0.05);
    expect(trace.reason).toBe("stationary");
    expect(trace.points).toHaveLength(1);
  });

  it("大きな学習率では左右の振動と値の増加を残し、数値が壊れる前に停止する", () => {
    const trace = descentTrace(1, 0.5);
    expect(trace.points[1]?.x).toBe(2.5);
    expect(trace.points[2]?.x).toBeLessThan(-2.5);
    expect(trace.reason).toBe("diverged");
    expect(trace.points.length).toBeLessThan(10);
    expect(trace.points.every(p => [p.x, p.value, p.slope].every(Number.isFinite))).toBe(true);
  });

  it("規定回数の更新が続く場合は上限で停止する", () => {
    const trace = descentTrace(1, 0.1, 2);
    expect(trace.reason).toBe("limit");
    expect(trace.points).toHaveLength(3);
  });

  it("計算できない初期条件を受け付けない", () => {
    for (const [x, rate] of [[NaN, 0.05], [1, Infinity], [1, 0], [1, -1]] as const) {
      expect(() => descentTrace(x, rate)).toThrow(RangeError);
    }
  });
});
