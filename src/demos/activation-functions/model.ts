export const functions = [
  "恒等関数",
  "ステップ関数",
  "Sigmoid",
  "tanh",
  "ReLU",
] as const;
export type Activation = (typeof functions)[number];
export function activate(name: Activation, x: number): number {
  switch (name) {
    case "恒等関数":
      return x;
    case "ステップ関数":
      return x > 0 ? 1 : 0;
    case "Sigmoid":
      return x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
    case "tanh":
      return Math.tanh(x);
    case "ReLU":
      return Math.max(0, x);
  }
}
