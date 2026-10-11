import { describe, expect, it } from "vitest";
import {
  patternValue,
  makeReference,
  samplePattern,
  lowPass,
  type Pattern,
} from "../src/demos/spatial-sampling/model";

describe("空間サンプリング", () => {
  it("16点の格子では15周期が1周期へ折り返す", () => {
    const actual = samplePattern({
      pattern: "stripes",
      frequency: 15,
      phase: 0,
      resolution: 16,
    });
    // セル中心で標本化するため、1周期の正弦波に対して符号が反転する。
    for (let x = 0; x < 16; x++)
      expect(actual[x]).toBeCloseTo(
        0.5 - 0.5 * Math.cos((2 * Math.PI * (x + 0.5)) / 16),
        5,
      );
  });
  it("位相を1周期動かすと元に戻る", () => {
    for (const pattern of [
      "stripes",
      "grid",
      "diagonal",
      "rings",
    ] as Pattern[]) {
      expect(patternValue(pattern, 0.23, 0.41, 12, 0.3)).toBeCloseTo(
        patternValue(pattern, 0.23, 0.41, 12, 1.3),
      );
    }
  });
  it("縞はy方向に変化しない", () =>
    expect(patternValue("stripes", 0.1, 0.2, 8, 0)).toBe(
      patternValue("stripes", 0.1, 0.8, 8, 0),
    ));
  it("同心円は中心からの距離だけで決まる", () =>
    expect(patternValue("rings", 0.7, 0.5, 8, 0)).toBeCloseTo(
      patternValue("rings", 0.5, 0.7, 8, 0),
    ));
  it("斜線はx+yが一定なら同じ明るさ", () =>
    expect(patternValue("diagonal", 0.1, 0.3, 8, 0)).toBeCloseTo(
      patternValue("diagonal", 0.2, 0.2, 8, 0),
    ));
  it("ローパスは一定の明るさを変えない（端も含む）", () => {
    const source = new Float32Array(32 * 32).fill(0.4);
    const result = lowPass(source, 32, 16);
    expect([...result].every((x) => Math.abs(x - 0.4) < 1e-6)).toBe(true);
    expect([...source].every((x) => Math.abs(x - 0.4) < 1e-6)).toBe(true);
  });
  it("標本化前ローパスが折り返した縞のコントラストを減らす", () => {
    const options = {
      pattern: "stripes" as const,
      frequency: 15,
      phase: 0,
      resolution: 16,
    };
    const source = makeReference(options, 512);
    const raw = samplePattern(options);
    const filtered = samplePattern(options, lowPass(source, 512, 16), 512);
    const contrast = (values: Float32Array) =>
      Math.max(...values.slice(4, 12)) - Math.min(...values.slice(4, 12));
    expect(contrast(filtered)).toBeLessThan(contrast(raw) * 0.15);
  });
  it.each(["stripes", "grid", "diagonal", "rings"] as Pattern[])(
    "%sの画像寸法と明るさの範囲",
    (pattern) => {
      const options = { pattern, frequency: 24, phase: 0.3, resolution: 16 };
      const values = samplePattern(options);
      expect(values.length).toBe(256);
      expect(
        [...values].every((v) => Number.isFinite(v) && v >= 0 && v <= 1),
      ).toBe(true);
      expect(makeReference(options, 64).length).toBe(4096);
    },
  );
});
