import { calculateAttention, type Vector2 } from "../attention/model";

export const inputs: readonly Vector2[] = [[2, 0], [0, 2], [1, 1]];
export const labels = ["太郎", "花子", "読む"] as const;
export type Axis = 0 | 1;

// Both heads use the same V = X. The selected projection supplies Q and K.
export function compareHeads(queryIndex: number, secondAxis: Axis) {
  if (!Number.isInteger(queryIndex) || !inputs[queryIndex]) throw new RangeError("入力位置が範囲外です");
  const head = (axis: Axis) => {
    const keys = inputs.map<Vector2>(x => axis === 0 ? [x[0], 0] : [0, x[1]]);
    const query = keys[queryIndex]!;
    return { axis, query, keys, ...calculateAttention(query, keys, inputs) };
  };
  const first = head(0), second = head(secondAxis);
  return { first, second, joined: [...first.output, ...second.output] };
}
