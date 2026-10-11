import { expect, it } from "vitest";
import {
  access,
  emptyCache,
  makeSequence,
  type CacheState,
} from "../src/demos/memory-hierarchy/model";
const run = (addresses: number[], capacity: number): CacheState =>
  addresses.reduce(
    (state, address) => access(state, address, capacity).state,
    emptyCache(),
  );
it("同じブロックの後続アドレスがヒットする", () => {
  const state = run([0, 1, 2, 3], 2);
  expect(state.hits).toBe(3);
  expect(state.misses).toBe(1);
  expect(state.wait).toBe(14);
});
it("LRUは最近使っていないブロックを追い出す", () => {
  const state = run([0, 4, 0], 2);
  const next = access(state, 8, 2);
  expect(next.evicted).toBe(1);
  expect(next.state.blocks).toEqual([2, 0]);
});
it("元の状態を書き換えない", () => {
  const state = emptyCache();
  access(state, 0, 2);
  expect(state).toEqual(emptyCache());
});
it("4ブロックの繰り返しは容量4なら初回以外ヒット", () => {
  const s = run(makeSequence("repeat"), 4);
  expect(s.misses).toBe(4);
  expect(s.hits).toBe(44);
  expect(s.wait).toBe(88);
});
it("容量2では4ブロックの繰り返しが毎回ミス", () => {
  const s = run(makeSequence("repeat"), 2);
  expect(s.misses).toBe(48);
  expect(s.hits).toBe(0);
  expect(s.wait).toBe(528);
});
it("順次アクセスは4要求に1回のミス", () => {
  const s = run(makeSequence("sequential"), 2);
  expect(s.misses).toBe(12);
  expect(s.hits).toBe(36);
});
it("ランダム列は再現可能で0〜31の48要求", () => {
  const a = makeSequence("random");
  expect(a).toEqual(makeSequence("random"));
  expect(a.length).toBe(48);
  expect(a.every((n) => Number.isInteger(n) && n >= 0 && n < 32)).toBe(true);
  expect(new Set(a).size).toBeGreaterThan(16);
});
it("容量1でも最新ブロックのみを保持する", () =>
  expect(run([0, 4, 8], 1).blocks).toEqual([2]));
it("空キャッシュのヒット数・ミス数・待ち時間は0", () =>
  expect(emptyCache()).toEqual({ blocks: [], hits: 0, misses: 0, wait: 0 }));
