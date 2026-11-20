export const causalTokens = ["今日", "は", "雨", "です"] as const;

export function causalMatrix(enabled: boolean): boolean[][] {
  return causalTokens.map((_, row) => causalTokens.map((_, column) => !enabled || column <= row));
}

export function inspectCausalRow(row: number, enabled: boolean) {
  if (!Number.isInteger(row) || row < 0 || row >= causalTokens.length)
    throw new RangeError("計算する位置は0〜3の整数です");
  const allowed = causalMatrix(enabled)[row]!;
  return {
    references: allowed.flatMap((value, index) => value ? [index] : []),
    nextTarget: causalTokens[row + 1] ?? null,
    leaksNextTarget: row + 1 < causalTokens.length && allowed[row + 1] === true,
  };
}
