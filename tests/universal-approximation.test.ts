import { describe, expect, it } from "vitest";
import {
  targets, construct, predict, grid, errors, samples,
  initialize, trainStep, gradients, loss, advance, MAX_STEPS,
} from "../src/demos/universal-approximation/model";

describe("ReLUによる構成的近似", () => {
  it.each(["sin", "square", "abs"] as const)("%sの節点と区間内で独立した折れ線補間に一致", (id) => {
    const t = targets[id];
    for (const n of [2, 3, 8, 31, 32]) {
      const net = construct(id, n);
      expect(net.units).toHaveLength(n);
      for (let j = 0; j < n; j++) {
        const a = t.min + (t.max - t.min) * j / n;
        const b = t.min + (t.max - t.min) * (j + 1) / n;
        for (const q of [0, .17, .5, .93, 1]) {
          expect(predict(net, a + q * (b - a)))
            .toBeCloseTo((1 - q) * t.f(a) + q * t.f(b), 11);
        }
      }
    }
  });
  it("偶数Nでは|x|を表し、奇数Nでの誤差を隠さない", () => {
    expect(errors(construct("abs", 8), grid("abs")).maxAbs).toBeLessThan(1e-12);
    expect(errors(construct("abs", 3), grid("abs")).maxAbs).toBeCloseTo(1 / 3);
  });
  it("sinの固定比較ではN=32はN=2より細かい近似になる", () => {
    expect(errors(construct("sin", 2), grid("sin")).maxAbs).toBeCloseTo(1);
    expect(errors(construct("sin", 32), grid("sin")).maxAbs).toBeLessThan(.005);
  });
  it("目標関数・MSE・最大絶対誤差を独立に確認", () => {
    expect(targets.sin.f(Math.PI / 2)).toBeCloseTo(1);
    expect(targets.square.f(-.5)).toBe(.25);
    expect(targets.abs.f(-.5)).toBe(.5);
    const result = errors({ c: 1, units: [] }, [{ x: 0, y: 2 }, { x: 1, y: 4 }]);
    expect(result).toEqual({ mse: 5, maxAbs: 3 });
    expect(grid("sin")).toHaveLength(401);
    expect(grid("square")[0]!.x).toBe(-1);
    expect(grid("square").at(-1)!.x).toBe(1);
  });
  it.each([1, 33, 2.5, NaN])("不正なN=%sを拒否", (n) => {
    expect(() => construct("sin", n)).toThrow(RangeError);
    expect(() => initialize("sin", n, 7)).toThrow(RangeError);
  });
  it("空の評価データを拒否", () => {
    expect(() => errors(construct("sin", 8), [])).toThrow(RangeError);
  });
});

describe("同じ構造のネットワークをAdamで学習", () => {
  it("訓練32点と未使用124点は重ならない", () => {
    for (const id of ["sin", "square", "abs"] as const) {
      const { train, evaluation } = samples(id);
      expect(train).toHaveLength(32);
      expect(evaluation).toHaveLength(124);
      for (const e of evaluation) {
        expect(train.every(p => Math.abs(p.x - e.x) > 1e-8)).toBe(true);
        expect(e.y).toBe(targets[id].f(e.x));
      }
    }
  });
  it("全パラメータの逆伝播を有限差分で検証", () => {
    const net = { c: .2, units: [{ w: .8, b: .3, a: -.7 }, { w: -.4, b: .6, a: .5 }] };
    const data = [{ x: -.2, y: .1 }, { x: .5, y: .4 }];
    const g = gradients(net, data), h = 1e-5;
    expect(g.c).toBeCloseTo((loss({ ...net, c: net.c + h }, data) - loss({ ...net, c: net.c - h }, data)) / (2 * h), 7);
    for (let i = 0; i < net.units.length; i++) for (const key of ["w", "b", "a"] as const) {
      const perturbed = (d: number) => ({ ...net, units: net.units.map((u, j) => j === i ? { ...u, [key]: u[key] + d } : u) });
      expect(g.units[i]![key]).toBeCloseTo((loss(perturbed(h), data) - loss(perturbed(-h), data)) / (2 * h), 7);
    }
  });
  it("固定条件は初期値・損失・出力が再現し、入力状態を変更しない", () => {
    const a = initialize("sin", 8, 7), b = initialize("sin", 8, 7);
    const before = structuredClone(a), data = samples("sin").train;
    const run = (s: typeof a) => { for (let i = 0; i < 100; i++) s = trainStep(s, data, .01); return s; };
    expect(run(a)).toEqual(run(b));
    expect(a).toEqual(before);
    expect(predict(run(a).net, .3)).toBe(predict(run(b).net, .3));
    expect(initialize("sin", 8, 8).net).not.toEqual(a.net);
  });
  it("固定例では実際の学習で損失が減る（全設定の収束保証ではない）", () => {
    let s = initialize("sin", 8, 7);
    const data = samples("sin").train, initial = loss(s.net, data);
    for (let i = 0; i < 2000; i++) s = trainStep(s, data, .01);
    expect(loss(s.net, data)).toBeLessThan(initial / 10);
  });
  it.each([2, 32])("上限学習率・N=%sで有限、指定更新上限を超えない", n => {
    let s = initialize("sin", n, 9999);
    const data = samples("sin").train;
    for (let i = 0; i < 200; i++) s = trainStep(s, data, .1);
    expect(Number.isFinite(loss(s.net, data))).toBe(true);
    const result = advance(s, data, .1, 203, 25);
    expect(result.step).toBe(203);
    expect(advance(result, data, .1, 203, 25)).toBe(result);
    expect(advance({ ...s, step: MAX_STEPS }, data, .1, MAX_STEPS, 25).step).toBe(MAX_STEPS);
  });
  it.each([0, -.1, NaN, .2])("不正な学習率%sを拒否", rate => {
    expect(() => trainStep(initialize("sin", 8, 7), samples("sin").train, rate)).toThrow(RangeError);
  });
  it.each([-1, .5, 4294967296, NaN])("不正なシード%sを拒否", seed => {
    expect(() => initialize("sin", 8, seed)).toThrow(RangeError);
  });
  it("上限を超える指定と無制限の仕事量を拒否", () => {
    const s = initialize("sin", 8, 7), p = samples("sin").train;
    expect(() => advance(s, p, .01, 5001, 25)).toThrow(RangeError);
    expect(() => advance(s, p, .01, 2000, 0)).toThrow(RangeError);
    expect(() => advance(s, p, .01, 2000, 26)).toThrow(RangeError);
  });
});
