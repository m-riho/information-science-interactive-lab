import { describe, expect, it } from "vitest";
import {
  apparentRps,
  angleAt,
  sampleTime,
  nextFrameTime,
} from "../src/demos/wheel-aliasing/model";
describe("1回転で同じ姿に戻るマークの標本化", () => {
  it.each([
    [1, 12, 1],
    [12, 12, 0],
    [11, 12, -1],
    [-11, 12, 1],
    [-12, 12, 0],
    [0, 60, 0],
    [25, 12, 1],
  ])("%s rps / %s fps → %s rps", (r, f, expected) =>
    expect(apparentRps(r, f)).toBeCloseTo(expected),
  );
  it("半撮影周波数の境界を負側に統一する", () => {
    expect(apparentRps(6, 12)).toBe(-6);
    expect(apparentRps(-6, 12)).toBe(-6);
  });
  it("撮影間では姿勢を保持する", () => {
    expect(sampleTime(0.19, 10)).toBeCloseTo(0.1);
    expect(sampleTime(0.2, 10)).toBeCloseTo(0.2);
  });
  it("描画周期によらず同じ撮影時刻になる", () => {
    expect(sampleTime(1.234, 12)).toBeCloseTo(14 / 12);
  });
  it("負の回転も0〜2πに正規化する", () =>
    expect(angleAt(-1, 0.25)).toBeCloseTo(Math.PI * 1.5));
  it("コマ送りは次の撮影時刻へ進む", () => {
    expect(nextFrameTime(0.15, 10)).toBeCloseTo(0.2);
    expect(nextFrameTime(0.2, 10)).toBeCloseTo(0.3);
  });
});
