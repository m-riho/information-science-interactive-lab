import { evaluateGate, type Bit } from "../logic-gates/model";
export function halfAdder(a: Bit, b: Bit): { sum: Bit; carry: Bit } {
  return { sum: evaluateGate("XOR", a, b), carry: evaluateGate("AND", a, b) };
}
export function fullAdder(
  a: Bit,
  b: Bit,
  carryIn: Bit,
): { sum: Bit; carry: Bit } {
  const first = halfAdder(a, b),
    second = halfAdder(first.sum, carryIn);
  return {
    sum: second.sum,
    carry: evaluateGate("OR", first.carry, second.carry),
  };
}
export function add4(a: number, b: number) {
  if (
    !Number.isInteger(a) ||
    !Number.isInteger(b) ||
    a < 0 ||
    b < 0 ||
    a > 15 ||
    b > 15
  )
    throw new RangeError("入力は0〜15の整数です");
  const stages: {
    bit: number;
    a: Bit;
    b: Bit;
    carryIn: Bit;
    sum: Bit;
    carry: Bit;
  }[] = [];
  let carry: Bit = 0;
  let total = 0;
  for (let bit = 0; bit < 4; bit++) {
    const x = ((a >> bit) & 1) as Bit,
      y = ((b >> bit) & 1) as Bit;
    const result = fullAdder(x, y, carry);
    stages.push({ bit, a: x, b: y, carryIn: carry, ...result });
    total += result.sum * 2 ** bit;
    carry = result.carry;
  }
  total += carry * 16;
  return { stages, total, binary: total.toString(2).padStart(5, "0") };
}
