export type Vector2 = readonly [number, number];
export const attentionLabels = ["太郎", "花子", "本"] as const;
export const initialQuery: Vector2 = [1, 0];
export const initialKeys: readonly Vector2[] = [[0, 1], [1, 0], [0.5, 0.5]];
export const attentionValues: readonly Vector2[] = [[1, 0], [0, 1], [1, 1]];

/** -Infinity is a masked score. An all-masked row has no distribution; return zeros. */
export function stableSoftmax(scores: readonly number[]): number[] {
  if (scores.some(score => Number.isNaN(score) || score === Infinity))
    throw new RangeError("スコアは有限値またはマスクの−∞にしてください");
  const maximum = scores.reduce((max, score) => Math.max(max, score), -Infinity);
  if (maximum === -Infinity) return scores.map(() => 0);
  const exponentials = scores.map(score => Math.exp(score - maximum));
  const sum = exponentials.reduce((total, value) => total + value, 0);
  return exponentials.map(value => value / sum);
}

export function calculateAttention(
  query: Vector2,
  keys: readonly Vector2[],
  values: readonly Vector2[],
  allowed: readonly boolean[] = keys.map(() => true),
) {
  if (keys.length === 0 || keys.length !== values.length || keys.length !== allowed.length)
    throw new RangeError("Key・Value・マスクは同じ正の長さが必要です");
  if ([query, ...keys, ...values].some(vector => vector.some(value => !Number.isFinite(value))))
    throw new RangeError("ベクトルは有限値で指定してください");
  const dots = keys.map(key => query[0] * key[0] + query[1] * key[1]);
  if (dots.some(value => !Number.isFinite(value))) throw new RangeError("内積が大きすぎます");
  const scores = dots.map(value => value / Math.sqrt(2));
  const maskedScores = scores.map((score, i) => allowed[i] ? score : -Infinity);
  const weights = stableSoftmax(maskedScores);
  const contributions: Vector2[] = values.map((value, i) => [value[0] * weights[i]!, value[1] * weights[i]!]);
  const output = contributions.reduce<[number, number]>((sum, value) => [sum[0] + value[0], sum[1] + value[1]], [0, 0]);
  return { dots, scores, maskedScores, weights, contributions, output, allMasked: allowed.every(value => !value) };
}
