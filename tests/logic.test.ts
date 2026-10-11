import { expect, it } from "vitest";
import {
  evaluateGate,
  nandCircuit,
  type Gate,
  type Bit,
} from "../src/demos/logic-gates/model";
const inputs: [Bit, Bit][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];
const tables: Record<Gate, Bit[]> = {
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
  NOT: [1, 1, 0, 0],
  NAND: [1, 1, 1, 0],
  XOR: [0, 1, 1, 0],
};
for (const gate of Object.keys(tables) as Gate[])
  it.each(inputs)(`${gate}(%i,%i)の真理値`, (a, b) =>
    expect(evaluateGate(gate, a, b)).toBe(tables[gate][a * 2 + b]),
  );
for (const gate of ["NOT", "AND", "OR"] as const)
  it.each(inputs)(`NANDで作る${gate}(%i,%i)`, (a, b) => {
    const steps = nandCircuit(gate, a, b);
    expect(steps.at(-1)?.output).toBe(evaluateGate(gate, a, b));
    for (const step of steps)
      expect(step.output).toBe(
        evaluateGate("NAND", step.inputs[0], step.inputs[1]),
      );
  });
it("NANDの段数はNOT=1、AND=2、OR=3", () => {
  expect(nandCircuit("NOT", 0, 0)).toHaveLength(1);
  expect(nandCircuit("AND", 0, 0)).toHaveLength(2);
  expect(nandCircuit("OR", 0, 0)).toHaveLength(3);
});
it("NOTはBを使わず同じAを2入力に接続", () =>
  expect(nandCircuit("NOT", 1, 0)[0]?.inputs).toEqual([1, 1]));
it("ORはAとBを個別に反転して最後のNANDへ", () => {
  const steps = nandCircuit("OR", 1, 0);
  expect(steps.map((s) => s.output)).toEqual([0, 1, 1]);
  expect(steps[2]?.inputs).toEqual([0, 1]);
});
