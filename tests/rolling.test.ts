import { expect, it } from "vitest";
import {
  rowTime,
  renderPropeller,
  frameTime,
  type CameraSettings,
} from "../src/demos/rolling-shutter/model";
const camera: CameraSettings = {
  mode: "rolling",
  rps: 3,
  readout: 0.06,
  exposure: 0,
  direction: "down",
};
it("Globalでは全行同時刻", () => {
  expect(rowTime(2, 0, 100, { ...camera, mode: "global" })).toBe(2);
  expect(rowTime(2, 99, 100, { ...camera, mode: "global" })).toBe(2);
});
it("Rollingは行番号/高さに比例して遅れる", () => {
  expect(rowTime(2, 0, 100, camera)).toBe(2);
  expect(rowTime(2, 50, 100, camera)).toBeCloseTo(2.03);
  expect(rowTime(2, 99, 100, camera)).toBeCloseTo(2.0594);
});
it("逆走査では下の行から読み取る", () => {
  expect(rowTime(2, 99, 100, { ...camera, direction: "up" })).toBe(2);
  expect(rowTime(2, 0, 100, { ...camera, direction: "up" })).toBeCloseTo(
    2.0594,
  );
});
it("読み出し0ならGlobalとRollingは同一画像", () =>
  expect(renderPropeller(48, 0.1, { ...camera, readout: 0 })).toEqual(
    renderPropeller(48, 0.1, { ...camera, mode: "global" }),
  ));
it("静止したプロペラは走査方式に依存しない", () =>
  expect(renderPropeller(48, 0.1, { ...camera, rps: 0 })).toEqual(
    renderPropeller(48, 0.1, { ...camera, rps: 0, mode: "global" }),
  ));
it("回転中はRollingとGlobalの画像が異なる", () =>
  expect(renderPropeller(48, 0, camera)).not.toEqual(
    renderPropeller(48, 0, { ...camera, mode: "global" }),
  ));
it("露光平均は中間の明るさを生む", () => {
  const pixels = renderPropeller(48, 0, { ...camera, exposure: 0.03 });
  expect([...pixels].some((v) => v > 0.25 && v < 0.95)).toBe(true);
  expect([...pixels].every((v) => v >= 0 && v <= 1)).toBe(true);
});
it("撮影画像は指定fpsの間隔で保持する", () => {
  expect(frameTime(0.19, 10)).toBe(0.1);
  expect(frameTime(0.2, 10)).toBe(0.2);
});
it("負回転も有限の画像を生成する", () => {
  const pixels = renderPropeller(32, 0.1, {
    ...camera,
    rps: -12,
    exposure: 0.03,
    direction: "up",
  });
  expect(pixels.length).toBe(1024);
  expect([...pixels].every(Number.isFinite)).toBe(true);
});
