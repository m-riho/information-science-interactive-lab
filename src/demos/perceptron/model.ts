export type Bit = 0 | 1;
export type Input = readonly [Bit, Bit];
export type Weights = readonly [number, number, number];
export type Task = "AND" | "OR" | "XOR";
export const inputs: readonly Input[] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];
export const presets = { AND: [1, 1, -1.5], OR: [1, 1, -0.5] } as const;
export function neuron([a, b]: Input, [w1, w2, bias]: Weights) {
  const z = w1 * a + w2 * b + bias;
  return { z, value: (z >= 0 ? 1 : 0) as Bit };
}
export function target(task: Task, [a, b]: Input): Bit {
  return task === "AND" ? a && b : task === "OR" ? a || b : a === b ? 0 : 1;
}
export function multilayer(input: Input) {
  const h1 = neuron(input, presets.OR),
    h2 = neuron(input, presets.AND);
  return { h1, h2, y: neuron([h1.value, h2.value], [1, -1, -0.5]) };
}
