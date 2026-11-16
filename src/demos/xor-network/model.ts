import { random } from "../learning-common/model";
export const xorData = [
  { x: 0, y: 0, label: 0 },
  { x: 0, y: 1, label: 1 },
  { x: 1, y: 0, label: 1 },
  { x: 1, y: 1, label: 0 },
];
export function initial(multi: boolean) {
  const r = random(7);
  return Array.from({ length: multi ? 17 : 3 }, () => 2 * r() - 1);
}
export function output(
  w: readonly number[],
  x: number,
  y: number,
  multi: boolean,
) {
  const hidden = multi
    ? Array.from({ length: 4 }, (_, j) =>
        Math.tanh(w[j * 3]! + w[j * 3 + 1]! * x + w[j * 3 + 2]! * y),
      )
    : [];
  const z = multi
    ? w[16]! + hidden.reduce((s, h, j) => s + w[12 + j]! * h, 0)
    : w[0]! + w[1]! * x + w[2]! * y;
  return { p: 1 / (1 + Math.exp(-z)), hidden };
}
export function gradient(w: readonly number[], multi: boolean) {
  const g = Array<number>(w.length).fill(0);
  for (const d of xorData) {
    const { p, hidden } = output(w, d.x, d.y, multi),
      err = (p - d.label) / 4;
    if (multi) {
      g[16] = g[16]! + err;
      for (let j = 0; j < 4; j++) {
        g[12 + j] = g[12 + j]! + err * hidden[j]!;
        const t = err * w[12 + j]! * (1 - hidden[j]! ** 2);
        g[j * 3] = g[j * 3]! + t;
        g[j * 3 + 1] = g[j * 3 + 1]! + t * d.x;
        g[j * 3 + 2] = g[j * 3 + 2]! + t * d.y;
      }
    } else {
      g[0] = g[0]! + err;
      g[1] = g[1]! + err * d.x;
      g[2] = g[2]! + err * d.y;
    }
  }
  return g;
}
export const loss = (w: readonly number[], multi: boolean) =>
  -xorData.reduce((s, d) => {
    const p = output(w, d.x, d.y, multi).p;
    return (
      s +
      d.label * Math.log(Math.max(1e-12, p)) +
      (1 - d.label) * Math.log(Math.max(1e-12, 1 - p))
    );
  }, 0) / 4;
export function training(multi: boolean, rate: number) {
  let w = initial(multi);
  const fs = [{ w, epoch: 0, loss: loss(w, multi) }];
  for (let epoch = 1; epoch <= 5000; epoch++) {
    const g = gradient(w, multi);
    w = w.map((v, j) => v - rate * g[j]!);
    if (epoch % 50 === 0) fs.push({ w, epoch, loss: loss(w, multi) });
  }
  return fs;
}

/** Inspect exactly the same parameters and activations as the prediction model. */
export function inspectNetwork(
  w: readonly number[],
  x: number,
  y: number,
  multi: boolean,
) {
  const result = output(w, x, y, multi);
  const hidden = multi
    ? Array.from({ length: 4 }, (_, j) => ({
        name: "h" + (j + 1),
        weights: [w[j * 3 + 1]!, w[j * 3 + 2]!],
        bias: w[j * 3]!,
        sum: w[j * 3]! + w[j * 3 + 1]! * x + w[j * 3 + 2]! * y,
        value: result.hidden[j]!,
      }))
    : [];
  const weights = multi ? w.slice(12, 16) : w.slice(1, 3),
    bias = multi ? w[16]! : w[0]!;
  const values = multi ? result.hidden : [x, y];
  return {
    hidden,
    output: {
      name: "y",
      weights,
      bias,
      sum: bias + weights.reduce((s, v, j) => s + v * values[j]!, 0),
      value: result.p,
    },
  };
}
