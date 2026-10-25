export interface City {
  readonly name: string;
  readonly x: number;
  readonly y: number;
}
export const cities: readonly City[] = [
  { name: "A", x: 15, y: 20 },
  { name: "B", x: 75, y: 15 },
  { name: "C", x: 90, y: 70 },
  { name: "D", x: 50, y: 90 },
  { name: "E", x: 15, y: 70 },
];
export const MAX_SEARCH_CITIES = 8;
/** 出発点を固定し、逆回りを同一視した完全無向グラフの候補数。 */
export function candidateCount(n: number): bigint {
  if (!Number.isInteger(n) || n < 3 || n > 100)
    throw new RangeError("都市数は3〜100の整数です");
  let value = 1n;
  for (let i = 2; i < n; i++) value *= BigInt(i);
  return value / 2n;
}
const validIndex = (data: readonly City[], index: number) =>
  Number.isInteger(index) && index >= 0 && index < data.length;
/** 各辺の直線距離を切り上げた整数を、この教材の距離と定義する。 */
export function edgeDistance(
  data: readonly City[],
  a: number,
  b: number,
): number {
  if (!validIndex(data, a) || !validIndex(data, b))
    throw new RangeError("不正な都市番号です");
  const first = data[a]!,
    second = data[b]!;
  return Math.ceil(Math.hypot(first.x - second.x, first.y - second.y));
}
export function routeDistance(
  data: readonly City[],
  route: readonly number[],
): number {
  if (!route.every((i) => validIndex(data, i)))
    throw new RangeError("不正な都市番号です");
  let distance = 0;
  for (let i = 1; i < route.length; i++)
    distance += edgeDistance(data, route[i - 1]!, route[i]!);
  return distance;
}
export function validateRoute(data: readonly City[], route: readonly number[]) {
  const indicesValid = route.every((i) => validIndex(data, i));
  const closed = route.length >= 2 && route[0] === route.at(-1);
  const visits = closed ? route.slice(0, -1) : route;
  const allOnce =
    indicesValid &&
    visits.length === data.length &&
    new Set(visits).size === data.length;
  return { allOnce, closed, valid: data.length >= 3 && allOnce && closed };
}
export interface Tour {
  route: readonly number[];
  distance: number;
}
export function enumerateTours(data: readonly City[]): Tour[] {
  if (data.length > MAX_SEARCH_CITIES)
    throw new RangeError("全探索は8都市以下に制限しています");
  if (data.length < 3) throw new RangeError("3都市以上必要です");
  const tours: Tour[] = [];
  const visit = (path: number[], remaining: number[]) => {
    if (remaining.length === 0) {
      if (path[1]! > path.at(-1)!) return;
      const route = [...path, 0];
      tours.push({ route, distance: routeDistance(data, route) });
      return;
    }
    remaining.forEach((city, i) =>
      visit(
        [...path, city],
        remaining.filter((_, j) => j !== i),
      ),
    );
  };
  visit(
    [0],
    Array.from({ length: data.length - 1 }, (_, i) => i + 1),
  );
  return tours;
}
export const shortestTour = (data: readonly City[]): Tour =>
  enumerateTours(data).reduce((best, tour) =>
    tour.distance < best.distance ? tour : best,
  );
export function verifyCertificate(
  data: readonly City[],
  route: readonly number[],
  threshold: number,
) {
  if (
    !Number.isFinite(threshold) ||
    !Number.isInteger(threshold) ||
    threshold < 0
  )
    throw new RangeError("Dは0以上の整数です");
  const validation = validateRoute(data, route),
    distance = validation.valid ? routeDistance(data, route) : null;
  return {
    ...validation,
    distance,
    accepted: distance !== null && distance <= threshold,
  };
}
export const routeNames = (route: readonly number[]) =>
  route.map((i) => cities[i]?.name ?? "?").join(" → ");
