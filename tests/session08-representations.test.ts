import { describe, expect, it } from "vitest";
import { analogy, analogyPoints } from "../src/demos/vector-arithmetic/model";
import { movePoint } from "../src/demos/embedding/model";
import { sentenceRepresentation } from "../src/demos/word-order/model";
import { compareHeads, inputs } from "../src/demos/multi-head/model";

describe("単語ベクトルの演算", () => {
  it("引き算と足し算を順に適用し、入力以外の候補までの距離を測る", () => {
    const result = analogy(analogyPoints());
    expect(result.path.map(p => [p.x, p.y])).toEqual([[0, 0], [4, 8], [1, 5], [8, 8]]);
    expect(result.candidates.map(p => p.label)).toEqual(["queen", "crown"]);
    expect(result.candidates[0]?.distance).toBeCloseTo(Math.sqrt(.08));
  });
  it("候補を動かすと近い語も変わり、入力を動かすと負の成分も生じる", () => {
    const points = movePoint(analogyPoints(), "queen", 0, 0);
    expect(analogy(points).candidates[0]?.label).toBe("crown");
    expect(analogy(movePoint(points, "man", 10, 10)).path[2]).toEqual({ x: -6, y: -2 });
  });
});

it.each([false, true])("語の入れ替えで同じ語の表現を比較する（位置 %s）", position => {
  const a = sentenceRepresentation(false, position), b = sentenceRepresentation(true, position);
  expect(a.sentence).toBe("太郎が花子を追う");
  expect(b.sentence).toBe("花子が太郎を追う");
  const changed = a.rows.filter((row, i) => row.vector.join() !== b.rows[i]?.vector.join());
  expect(changed.map(r => r.word)).toEqual(position ? ["太郎", "花子"] : []);
  expect(b.rows[0]?.vector).toEqual([10, position ? 3 : 0]);
});

it("同じ入力・異なる射影から独立した重み付き和を計算して連結する", () => {
  const { first, second, joined } = compareHeads(2, 1);
  expect(first.weights[0]).toBeGreaterThan(first.weights[1]!);
  expect(second.weights[1]).toBeGreaterThan(second.weights[0]!);
  for (const head of [first, second]) {
    expect(head.weights.reduce((a,b) => a+b, 0)).toBeCloseTo(1);
    for (const axis of [0, 1] as const) {
      expect(head.output[axis]).toBeCloseTo(inputs.reduce((sum, x, i) => sum+x[axis]*head.weights[i]!, 0));
    }
  }
  expect(joined).toEqual([...first.output, ...second.output]);
});
it("同じ射影で両ヘッドが一致し、ゼロQueryでは重みが一様になる", () => {
  const { first, second } = compareHeads(1, 0);
  expect(first).toEqual(second);
  expect(second.weights).toEqual([1/3, 1/3, 1/3]);
  expect(() => compareHeads(3, 0)).toThrow();
});
