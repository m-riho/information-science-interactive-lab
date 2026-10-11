import { describe, expect, it } from "vitest";
import { halfAdder, fullAdder, add4 } from "../src/demos/binary-adder/model";
import type { Bit } from "../src/demos/logic-gates/model";
describe("加算器", () => {
  for (const a of [0, 1] as Bit[])
    for (const b of [0, 1] as Bit[]) {
      it(`半加算 ${a}+${b}`, () => {
        const r = halfAdder(a, b);
        expect(r.sum + 2 * r.carry).toBe(a + b);
      });
      for (const c of [0, 1] as Bit[])
        it(`全加算 ${a}+${b}+${c}`, () => {
          const r = fullAdder(a, b, c);
          expect(r.sum + 2 * r.carry).toBe(a + b + c);
        });
    }
  for (let a = 0; a < 16; a++)
    for (let b = 0; b < 16; b++)
      it(`4bit ${a}+${b}`, () => {
        const r = add4(a, b);
        expect(r.total).toBe(a + b);
        expect(r.binary).toBe((a + b).toString(2).padStart(5, "0"));
        expect(r.stages).toHaveLength(4);
        r.stages.forEach((s, i) => {
          expect(s.bit).toBe(i);
          expect(s.a).toBe((a >> i) & 1);
          expect(s.b).toBe((b >> i) & 1);
          expect(s.carryIn).toBe(i === 0 ? 0 : r.stages[i - 1]?.carry);
          expect(s.sum + 2 * s.carry).toBe(s.a + s.b + s.carryIn);
        });
      });
});
