import { expect, it } from "vitest";
import { srNext } from "../src/demos/sr-latch/model";
import { clockNext, initialClock } from "../src/demos/d-latch-flipflop/model";
it("SRはSet後、入力を戻しても1を保持する", () => {
  expect(srNext(0, 1, 0)).toBe(1);
  expect(srNext(1, 0, 0)).toBe(1);
});
it("SRはReset後、入力を戻しても0を保持する", () => {
  expect(srNext(1, 0, 1)).toBe(0);
  expect(srNext(0, 0, 0)).toBe(0);
});
it("禁止状態の解除だけでは値を確定しない", () => {
  expect(srNext(1, 1, 1)).toBe(null);
  expect(srNext(null, 0, 0)).toBe(null);
  expect(srNext(null, 1, 0)).toBe(1);
  expect(srNext(null, 0, 1)).toBe(0);
});
it("CLK=0ではラッチとFFを保持する", () => {
  expect(clockNext(initialClock(), 1, 0)).toEqual({
    d: 1,
    clk: 0,
    latch: 0,
    ff: 0,
  });
});
it("立ち上がりで両者がDを取り込む", () => {
  expect(clockNext(initialClock(), 1, 1)).toEqual({
    d: 1,
    clk: 1,
    latch: 1,
    ff: 1,
  });
});
it("CLK=1でDを変えるとラッチだけ追従する", () => {
  const s = clockNext(initialClock(), 1, 1);
  expect(clockNext(s, 0, 1)).toEqual({ d: 0, clk: 1, latch: 0, ff: 1 });
});
it("立ち下がりは取り込まず次の立ち上がりでFFが更新する", () => {
  let s = clockNext(initialClock(), 1, 1);
  s = clockNext(s, 0, 0);
  expect(s.latch).toBe(1);
  expect(s.ff).toBe(1);
  s = clockNext(s, 0, 1);
  expect(s.ff).toBe(0);
  expect(s.latch).toBe(0);
});
it("更新で以前の状態を変更しない", () => {
  const s = initialClock();
  clockNext(s, 1, 1);
  expect(s).toEqual(initialClock());
});
