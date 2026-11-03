import { expect, it } from "vitest";
import {
  inputs,
  neuron,
  presets,
  target,
  multilayer,
} from "../src/demos/perceptron/model";
import {
  session06Demos,
  session06Summary,
  session06Path,
} from "../src/sessions/session06";
import { parseRoute } from "../src/utils/router";
it.each(["AND", "OR"] as const)("%sの重みで4点を正しく分類する", (task) => {
  expect(inputs.map((p) => neuron(p, presets[task]).value)).toEqual(
    inputs.map((p) => target(task, p)),
  );
});
it("両重み0としきい値の等号を扱う", () => {
  for (const p of inputs) {
    expect(neuron(p, [0, 0, 0]).value).toBe(1);
    expect(neuron(p, [0, 0, -0.5]).value).toBe(0);
  }
});
it("XORの正例と負例の対角線でzの和が等しい（分離には一方が非負、他方が負でなければならない）", () => {
  for (const a of [-3, 0, 1, 3])
    for (const b of [-3, 0, 1, 3])
      for (const c of [-1.5, 0, 2]) {
        const z = inputs.map((p) => neuron(p, [a, b, c]).z);
        expect(z[0]! + z[3]!).toBe(z[1]! + z[2]!);
        expect(
          inputs.some((p) => neuron(p, [a, b, c]).value !== target("XOR", p)),
        ).toBe(true);
      }
});
it("多層の途中値とXORの全4ケース", () => {
  expect(
    inputs.map((p) => {
      const { h1, h2, y } = multilayer(p);
      return [h1.value, h2.value, y.value];
    }),
  ).toEqual([
    [0, 0, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 0],
  ]);
});
it("第6回の10件と全件が利用可能で直接リンクを維持", () => {
  expect(session06Demos).toHaveLength(10);
  expect(session06Summary).toBe("10件利用可能");
  expect(parseRoute(session06Path)).toEqual({ kind: "session06" });
  for (const d of session06Demos)
    expect(parseRoute(session06Path + "/" + d.slug)).toEqual({
      kind: "demo06",
      slug: d.slug,
    });
});
