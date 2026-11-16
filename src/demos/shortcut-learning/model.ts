import { random } from "../learning-common/model";
export interface Example {
  animal: number;
  shape: number;
  background: number;
}
export function samples(bias: number, seed = 7): Example[] {
  const r = random(seed);
  return Array.from({ length: 200 }, (_, i) => {
    const animal = i % 2;
    return {
      animal,
      shape: r() < 0.75 ? animal : 1 - animal,
      background: r() < bias ? animal : 1 - animal,
    };
  });
}
export const probability = (
  e: Example,
  w: readonly number[],
  background: boolean,
) =>
  1 /
  (1 +
    Math.exp(
      -(w[0]! + w[1]! * e.shape + (background ? w[2]! * e.background : 0)),
    ));
export const accuracy = (
  data: readonly Example[],
  w: readonly number[],
  bg: boolean,
) =>
  data.filter((e) => Number(probability(e, w, bg) >= 0.5) === e.animal).length /
  data.length;
export function train(data: readonly Example[], bg: boolean) {
  let w = [0, 0, 0];
  const fs = [w];
  for (let k = 0; k < 300; k++) {
    const g = [0, 0, 0];
    for (const e of data) {
      const error = probability(e, w, bg) - e.animal;
      g[0] = g[0]! + error;
      g[1] = g[1]! + error * e.shape;
      g[2] = g[2]! + error * (bg ? e.background : 0);
    }
    w = w.map((v, j) => v - (0.5 * g[j]!) / data.length);
    if ((k + 1) % 10 === 0) fs.push(w);
  }
  return fs;
}
