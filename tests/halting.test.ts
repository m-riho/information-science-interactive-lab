import { expect, it } from "vitest";
import {
  initialHalting,
  transition,
  lastStep,
  exampleFrames,
  opposite,
  type HaltingState,
} from "../src/demos/halting-problem/model";
it("Aは3回処理した後に停止する", () => {
  const frames = exampleFrames("A");
  expect(frames.map((f) => f.value)).toEqual([0, 1, 2, 3]);
  expect(frames.at(-1)?.outcome).toBe("STOP");
});
it("Bの表示上限は実プログラムの停止と区別する", () => {
  const frames = exampleFrames("B");
  expect(frames).toHaveLength(7);
  expect(frames.at(-1)?.outcome).toBe("observation-limit");
  expect(frames.every((f) => f.outcome !== "STOP")).toBe(true);
});
it("Cは有限の例を計算して停止する", () => {
  expect(exampleFrames("C").map((f) => f.value)).toEqual([7, 8, 4, 2, 1]);
  expect(exampleFrames("C").at(-1)?.outcome).toBe("STOP");
});
it("前後移動・コマ送りは境界で止まり、各Partの初めに戻る", () => {
  let s = initialHalting();
  expect(transition(s, { type: "previous" })).toEqual(s);
  for (let part = 0; part < 4; part++) {
    for (let i = 0; i < 20; i++) s = transition(s, { type: "step" });
    expect(s.step).toBe(lastStep(s));
    if (part < 3) {
      s = transition(s, { type: "next" });
      expect(s.step).toBe(0);
    }
  }
  expect(transition(s, { type: "next" })).toEqual(s);
  expect(transition(s, { type: "previous" })).toMatchObject({
    part: 2,
    step: 0,
  });
});
it.each(["STOP", "LOOP"] as const)(
  "Hが%sのどちらを返すと仮定しても逆になる",
  (prediction) => {
    expect(opposite(prediction)).not.toBe(prediction);
    let s: HaltingState = {
      part: 3,
      step: 4,
      example: "C",
      prediction: "STOP",
    };
    s = transition(s, { type: "prediction", prediction });
    expect(s.step).toBe(0);
    expect(s.prediction).toBe(prediction);
    expect(transition(s, { type: "reset" })).toEqual(initialHalting());
  },
);
it("例の切替は最初から、元の状態を書き換えない", () => {
  const s: HaltingState = {
    part: 0,
    step: 3,
    example: "A",
    prediction: "STOP",
  };
  expect(transition(s, { type: "example", example: "C" })).toMatchObject({
    part: 0,
    step: 0,
    example: "C",
  });
  expect(s.step).toBe(3);
});
