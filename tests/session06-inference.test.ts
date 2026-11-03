import { it, expect } from "vitest";
import { forward, backward } from "../src/demos/rule-inference/model";
it("前向きは前提を得てから次の規則を適用する", () => {
  const fs = forward("off");
  expect(fs.map((f) => f.derived)).toEqual([
    [],
    ["check"],
    ["check", "first"],
    ["check", "first"],
  ]);
  expect(fs.at(-1)?.supported).toBe(true);
});
it("後向きの目標と前提は照合するまで結論にしない", () => {
  const fs = backward("off");
  expect(fs.slice(0, 3).map((f) => f.seeking)).toEqual([
    "first",
    "check",
    "off",
  ]);
  expect(fs.slice(0, 4).every((f) => !f.derived.length)).toBe(true);
  expect(fs.filter((f) => f.derived.length).map((f) => f.rule)).toEqual([
    "R1",
    "R2",
    null,
  ]);
  expect(fs.at(-1)?.supported).toBe(true);
});
it.each([forward, backward])("点灯時は目標を支持する根拠がない", (trace) => {
  const fs = trace("on");
  expect(fs.every((f) => !f.derived.length)).toBe(true);
  expect(fs.at(-1)?.supported).toBe(false);
});
