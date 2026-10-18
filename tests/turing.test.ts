import { expect, it } from "vitest";
import {
  initialMachine,
  stepMachine,
  readTape,
} from "../src/demos/turing-machine/model";
it("初期テープは111、ヘッドは最初の1、状態q0", () => {
  const s = initialMachine();
  expect(s.head).toBe(0);
  expect(s.state).toBe("q0");
  expect(s.steps).toBe(0);
  expect([-1, 0, 1, 2, 3, 4, 5].map((i) => readTape(s, i))).toEqual([
    "□",
    "1",
    "1",
    "1",
    "□",
    "□",
    "□",
  ]);
});
it("1を読み、1を書き、右へ進みq0を保つ", () => {
  const s = stepMachine(initialMachine());
  expect(s.head).toBe(1);
  expect(s.state).toBe("q0");
  expect(s.steps).toBe(1);
  expect(s.lastRule).toBe(0);
  expect(s.halted).toBe(false);
});
it("4ステップ目で右端の空白に1を書きq1で停止", () => {
  let s = initialMachine();
  for (let i = 0; i < 4; i++) s = stepMachine(s);
  expect(s.head).toBe(3);
  expect(readTape(s, 3)).toBe("1");
  expect(s.state).toBe("q1");
  expect(s.steps).toBe(4);
  expect(s.lastRule).toBe(1);
  expect(s.halted).toBe(true);
  expect(stepMachine(s)).toBe(s);
});
it("書込みは以前のテープを変更しない", () => {
  const s = { ...initialMachine(), head: 3 };
  const next = stepMachine(s);
  expect(readTape(s, 3)).toBe("□");
  expect(readTape(next, 3)).toBe("1");
});
it("表示領域の外も空白として扱い書込める", () => {
  const s = { ...initialMachine(), head: 20 };
  expect(readTape(s, -100)).toBe("□");
  const next = stepMachine(s);
  expect(readTape(next, 20)).toBe("1");
  expect(next.halted).toBe(true);
});
