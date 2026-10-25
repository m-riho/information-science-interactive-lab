export type ListOperation = "double" | "increment" | "even";
export const operationNames: Record<ListOperation, string> = {
  double: "各値を2倍",
  increment: "各値に1を足す",
  even: "偶数だけ残す",
};
export const originalInput: readonly number[] = Object.freeze([1, 2, 3]);
export interface PipelineFrame {
  label: string;
  values: readonly number[];
}
export function evaluatePipeline(
  input: readonly number[],
  operations: readonly ListOperation[],
) {
  let values = [...input];
  const frames: PipelineFrame[] = [{ label: "元の配列", values }];
  for (const operation of operations) {
    values =
      operation === "double"
        ? values.map((v) => v * 2)
        : operation === "increment"
          ? values.map((v) => v + 1)
          : values.filter((v) => v % 2 === 0);
    frames.push({ label: operationNames[operation], values });
  }
  return { frames, result: values.reduce((a, b) => a + b, 0) };
}
export function moveBlock(
  operations: readonly ListOperation[],
  index: number,
  direction: -1 | 1,
): ListOperation[] {
  const next = [...operations],
    other = index + direction;
  if (index < 0 || other < 0 || index >= next.length || other >= next.length)
    return next;
  [next[index], next[other]] = [next[other]!, next[index]!];
  return next;
}
