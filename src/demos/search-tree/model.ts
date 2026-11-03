export function treeCounts(b: number, d: number) {
  if (
    !Number.isInteger(b) ||
    !Number.isInteger(d) ||
    b < 1 ||
    b > 10 ||
    d < 0 ||
    d > 100
  )
    throw new RangeError("分岐数1〜10・深さ0〜100の整数が対象です");
  let leaves = 1n,
    total = 1n;
  for (let k = 0; k < d; k++) {
    leaves *= BigInt(b);
    total += leaves;
  }
  return { leaves, total };
}
