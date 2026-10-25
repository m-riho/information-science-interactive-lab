import { expect, it } from "vitest";
import {
  candidateCount,
  cities,
  edgeDistance,
  routeDistance,
  validateRoute,
  enumerateTours,
  shortestTour,
  verifyCertificate,
} from "../src/demos/tsp-shared/model";
it.each([
  [5, 12n],
  [10, 181440n],
  [15, 43589145600n],
] as const)("%d都市の候補数", (n, count) =>
  expect(candidateCount(n)).toBe(count),
);
it("大きい候補数を整数で扱う", () => {
  expect(candidateCount(100) > 10n ** 100n).toBe(true);
});
it.each([0, 2, 3.5, 101, NaN, Infinity])("不正な都市数%sを拒否", (n) =>
  expect(() => candidateCount(n)).toThrow(),
);
it("3-4-5の距離、巡回距離と逆回りの一致", () => {
  const triangle = [
    { name: "A", x: 0, y: 0 },
    { name: "B", x: 3, y: 0 },
    { name: "C", x: 3, y: 4 },
  ];
  expect(edgeDistance(triangle, 0, 2)).toBe(5);
  expect(routeDistance(triangle, [0, 1, 2, 0])).toBe(12);
  expect(routeDistance(triangle, [0, 2, 1, 0])).toBe(12);
  expect(routeDistance(triangle, [0])).toBe(0);
});
it.each(
  [
    [0, 1, 1, 3, 4, 0],
    [0, 1, 2, 3, 0],
    [0, 1, 2, 3, 4],
    [0, 1, 2, 3, 9, 0],
    [],
  ].map((route) => ({ route })),
)("不正巡回路 $route", ({ route }) =>
  expect(validateRoute(cities, route).valid).toBe(false),
);
it("順列を重複なく生成し最短路を選ぶ", () => {
  const tours = enumerateTours(cities);
  expect(tours).toHaveLength(12);
  expect(new Set(tours.map((t) => t.route.join(","))).size).toBe(12);
  expect(tours.every((t) => validateRoute(cities, t.route).valid)).toBe(true);
  const best = shortestTour(cities);
  expect(best.distance).toBe(Math.min(...tours.map((t) => t.distance)));
  expect(
    tours.every((t) => t.route[0] === 0 && t.route[1]! < t.route.at(-2)!),
  ).toBe(true);
});
it("9都市以上は順列生成前に拒否する", () => {
  const large = Array.from({ length: 9 }, (_, i) => ({
    name: String(i),
    x: i,
    y: 0,
  }));
  expect(() => enumerateTours(large)).toThrow("8都市");
  expect(() => shortestTour(large)).toThrow("8都市");
});
it("証拠の条件を順に確認し境界Dを含む", () => {
  const best = shortestTour(cities);
  expect(verifyCertificate(cities, best.route, best.distance).accepted).toBe(
    true,
  );
  expect(
    verifyCertificate(cities, best.route, best.distance - 1).accepted,
  ).toBe(false);
  expect(verifyCertificate(cities, [0, 1, 1, 3, 4, 0], 1000).accepted).toBe(
    false,
  );
  expect(verifyCertificate(cities, [0, 1, 2, 3, 4], 1000).accepted).toBe(false);
  expect(() => verifyCertificate(cities, best.route, -1)).toThrow();
});
it("巡回路と都市データを変更しない・範囲外距離は拒否", () => {
  const route = Object.freeze([0, 1, 2, 3, 4, 0]);
  const before = JSON.stringify(cities);
  verifyCertificate(cities, route, 300);
  shortestTour(cities);
  expect(JSON.stringify(cities)).toBe(before);
  expect(route).toEqual([0, 1, 2, 3, 4, 0]);
  expect(() => routeDistance(cities, [0, 99])).toThrow();
});
