import { expect, it } from "vitest";
import { infer, initial } from "../src/demos/prolog-family/model";
it("直接の子、孫、ひ孫が別々の変数解として現れる", () => {
  const frames = infer(initial);
  expect(
    frames
      .filter((f) => f.message.startsWith("解 "))
      .map((f) => [f.answers.at(-1), f.edges]),
  ).toEqual([
    ["hanako", [0]],
    ["jiro", [0, 1]],
    ["yui", [0, 1, 2]],
  ]);
  expect(frames[0]!.answers).toEqual([]);
  expect(frames.at(-1)?.done).toBe(true);
});
it("祖父母は2世代、祖先は1世代以上。末端や自分には誤って成立しない", () => {
  expect(infer({ ...initial, pred: "grandparent" }).at(-1)?.answers).toEqual([
    "jiro",
  ]);
  expect(infer({ ...initial, to: "yui" }).at(-1)?.answers).toEqual(["yui"]);
  for (const query of [
    { ...initial, pred: "grandparent" as const, to: "yui" as const },
    { ...initial, from: "yui" as const },
    { ...initial, to: "taro" as const },
  ])
    expect(infer(query).at(-1)?.answers).toEqual([]);
});
