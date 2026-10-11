export type Bit = 0 | 1;
export type Gate = "AND" | "OR" | "NOT" | "NAND" | "XOR";
export type NandTarget = "NOT" | "AND" | "OR";
export function evaluateGate(gate: Gate, a: Bit, b: Bit): Bit {
  switch (gate) {
    case "AND":
      return a === 1 && b === 1 ? 1 : 0;
    case "OR":
      return a === 1 || b === 1 ? 1 : 0;
    case "NOT":
      return a === 0 ? 1 : 0;
    case "NAND":
      return a === 1 && b === 1 ? 0 : 1;
    case "XOR":
      return a !== b ? 1 : 0;
  }
}
export interface NandStep {
  label: string;
  inputs: [Bit, Bit];
  output: Bit;
}
export function nandCircuit(target: NandTarget, a: Bit, b: Bit): NandStep[] {
  const step = (label: string, x: Bit, y: Bit): NandStep => ({
    label,
    inputs: [x, y],
    output: evaluateGate("NAND", x, y),
  });
  if (target === "NOT") return [step("N1 = NAND(A, A)", a, a)];
  if (target === "AND") {
    const first = step("N1 = NAND(A, B)", a, b);
    return [first, step("N2 = NAND(N1, N1)", first.output, first.output)];
  }
  const first = step("N1 = NAND(A, A)", a, a),
    second = step("N2 = NAND(B, B)", b, b);
  return [
    first,
    second,
    step("N3 = NAND(N1, N2)", first.output, second.output),
  ];
}
export const explanations: Record<Gate, string> = {
  AND: "AとBが両方1なら、出力は1。",
  OR: "AとBの少なくとも一方が1なら、出力は1。",
  NOT: "Aを反転します。0なら1、1なら0。Bは使いません。",
  NAND: "ANDの出力を反転します。両方1のときだけ0。",
  XOR: "AとBが異なるときだけ1。同じなら0。",
};
