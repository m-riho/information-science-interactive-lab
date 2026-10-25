import { expect, it } from "vitest";
import { sumSteps } from "../src/demos/programming-paradigms/model";
import {
  evaluatePipeline,
  moveBlock,
  type ListOperation,
} from "../src/demos/function-pipeline/model";
import {
  inferGrandparent,
  familyFacts,
} from "../src/demos/prolog-inference/model";
it.each([1, 5, 10, 20])("1から%dまでの状態変化と合計", (n) => {
  const frames = sumSteps(n);
  expect(frames).toHaveLength(n + 1);
  expect(frames[0]).toEqual({ addend: 0, before: 0, total: 0 });
  expect(frames.at(-1)?.total).toBe((n * (n + 1)) / 2);
  frames.slice(1).forEach((f, i) => {
    expect(f.addend).toBe(i + 1);
    expect(f.total).toBe(f.before + f.addend);
  });
});
it.each([0, -1, 21, 1.5, NaN, Infinity])("不正なN=%sを拒否", (n) =>
  expect(() => sumSteps(n)).toThrow(),
);
it("パイプラインの順序・不変性・空配列を扱う", () => {
  const input = Object.freeze([1, 2, 3]);
  const ops = Object.freeze(["double", "increment"] as ListOperation[]);
  expect(evaluatePipeline(input, ops).result).toBe(15);
  expect(evaluatePipeline(input, ["increment", "double"]).result).toBe(18);
  expect(evaluatePipeline(input, ["double", "increment", "even"]).result).toBe(
    0,
  );
  expect(evaluatePipeline(input, ["even", "double", "increment"]).result).toBe(
    5,
  );
  expect(evaluatePipeline([], ops).result).toBe(0);
  expect(evaluatePipeline(input, []).result).toBe(6);
  expect(input).toEqual([1, 2, 3]);
  expect(ops).toEqual(["double", "increment"]);
  expect(evaluatePipeline(input, ops)).toEqual(evaluatePipeline(input, ops));
});
it("並べ替えは端で止まり元の順序を変えない", () => {
  const ops: ListOperation[] = ["double", "increment", "even"];
  expect(moveBlock(ops, 0, -1)).toEqual(ops);
  expect(moveBlock(ops, 2, 1)).toEqual(ops);
  expect(moveBlock(ops, 1, -1)).toEqual(["increment", "double", "even"]);
  expect(ops).toEqual(["double", "increment", "even"]);
});
it("太郎から次郎への推論の束縛・辺・成功を返す", () => {
  const frames = inferGrandparent("taro", "jiro");
  expect(frames.at(-1)?.result).toBe(true);
  expect(frames.some((f) => f.y === "hanako")).toBe(true);
  expect(frames.some((f) => f.edges.includes(0))).toBe(true);
  expect(frames.some((f) => f.edges.includes(1))).toBe(true);
  expect(frames.slice(0, -1).every((f) => f.result === null)).toBe(true);
});
it.each([
  ["taro", "hanako"],
  ["jiro", "taro"],
  ["hanako", "jiro"],
] as const)("%sから%sは成立しない", (x, z) =>
  expect(inferGrandparent(x, z).at(-1)?.result).toBe(false),
);
it("失敗した候補から次の候補へ探索し、知識を書き換えない", () => {
  const facts = [
    ...familyFacts,
    { parent: "taro", child: "jiro" },
    { parent: "jiro", child: "taro" },
  ] as const;
  const before = JSON.stringify(facts);
  const frames = inferGrandparent("taro", "taro", facts);
  expect(frames.at(-1)?.result).toBe(true);
  expect(frames.some((f) => f.message.includes("次の候補"))).toBe(true);
  expect(JSON.stringify(facts)).toBe(before);
  expect(inferGrandparent("taro", "jiro", []).at(-1)?.result).toBe(false);
});
