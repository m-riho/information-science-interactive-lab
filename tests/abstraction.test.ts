import { expect, it } from "vitest";
import {
  machineWords,
  decodeWord,
  loadTranslation,
} from "../src/demos/language-to-cpu/model";
import { runInstruction } from "../src/demos/cpu-cycle/model";
import { transistorState } from "../src/demos/transistor-logic/model";
import type { Bit } from "../src/demos/logic-gates/model";
it("固定式をLOAD/ADD/STORE/HALTの8bitに変換する", () => {
  expect(machineWords()).toEqual([0x11, 0x22, 0x33, 0]);
  expect(machineWords().map(decodeWord)).toEqual([
    { op: "LOAD", addr: 1 },
    { op: "ADD", addr: 2 },
    { op: "STORE", addr: 3 },
    { op: "HALT" },
  ]);
});
it("不正な機械語を拒否する", () => {
  expect(() => decodeWord(256)).toThrow();
  expect(() => decodeWord(0xf1)).toThrow();
  expect(() => decodeWord(1)).toThrow();
});
for (const [a, b] of [
  [5, 8],
  [0, 0],
  [15, 15],
])
  it(`機械語を復号して${a}+${b}を実行`, () => {
    let s = loadTranslation(a!, b!);
    expect(s.pc).toBe(8);
    for (let i = 0; i < 4; i++) s = runInstruction(s);
    expect(s.memory[3]).toBe(a! + b!);
    expect(s.reason).toBe("halt");
  });
for (const a of [0, 1] as Bit[])
  for (const b of [0, 1] as Bit[])
    it(`CMOS NAND ${a}${b}`, () => {
      const s = transistorState("nand", a, b);
      expect(s.high).toBe(a === 0 || b === 0);
      expect(s.low).toBe(a === 1 && b === 1);
      expect(s.output).toBe(a === 1 && b === 1 ? 0 : 1);
      expect(s.high && s.low).toBe(false);
      expect(s.switches.map((t) => t.on)).toEqual([
        a === 0,
        b === 0,
        a === 1,
        b === 1,
      ]);
    });
for (const a of [0, 1] as Bit[])
  it(`nMOSとCMOS NOT ${a}`, () => {
    expect(transistorState("mos", a, 0).conducting).toBe(a === 1);
    const s = transistorState("not", a, 0);
    expect(s.output).toBe(1 - a);
    expect(s.switches.map((t) => t.on)).toEqual([a === 0, a === 1]);
  });
