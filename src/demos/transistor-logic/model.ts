import type { Bit } from "../logic-gates/model";
export type TransistorMode = "mos" | "not" | "nand";
export function transistorState(mode: TransistorMode, a: Bit, b: Bit) {
  const switches =
    mode === "mos"
      ? [{ name: "N1", type: "nMOS", input: "Gate", on: a === 1 }]
      : mode === "not"
        ? [
            { name: "P1", type: "pMOS", input: "A", on: a === 0 },
            { name: "N1", type: "nMOS", input: "A", on: a === 1 },
          ]
        : [
            { name: "P1", type: "pMOS", input: "A", on: a === 0 },
            { name: "P2", type: "pMOS", input: "B", on: b === 0 },
            { name: "N1", type: "nMOS", input: "A", on: a === 1 },
            { name: "N2", type: "nMOS", input: "B", on: b === 1 },
          ];
  const high =
    mode === "not" ? a === 0 : mode === "nand" ? a === 0 || b === 0 : false;
  const low =
    mode === "not" ? a === 1 : mode === "nand" ? a === 1 && b === 1 : a === 1;
  return {
    switches,
    high,
    low,
    output: (high ? 1 : 0) as Bit,
    conducting: mode === "mos" && a === 1,
  };
}
