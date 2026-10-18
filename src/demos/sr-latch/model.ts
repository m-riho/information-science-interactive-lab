import type { Bit } from "../logic-gates/model";
/** 禁止入力および禁止解除後の保持を、不定(null)として扱う教育用モデル。 */
export function srNext(q: Bit | null, s: Bit, r: Bit): Bit | null {
  if (s === 1 && r === 1) return null;
  if (s === 1) return 1;
  if (r === 1) return 0;
  return q;
}
