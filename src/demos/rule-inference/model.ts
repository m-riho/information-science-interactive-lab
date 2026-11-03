export const labels = {
  off: "ランプが消灯している",
  on: "ランプが点灯している",
  check: "電源供給を確認すべき",
  first: "電源を最初の確認候補にする",
} as const;
export type Fact = keyof typeof labels;
export type Observation = "off" | "on";
export const goal: Fact = "first";
export const rules = [
  { id: "R1", when: "off", then: "check" },
  { id: "R2", when: "check", then: "first" },
] as const;
type Rule = (typeof rules)[number];
export interface Frame {
  message: string;
  rule: Rule["id"] | null;
  derived: Fact[];
  seeking: Fact | null;
  supported: boolean | null;
}
function trace() {
  const derived = new Set<Fact>(),
    frames: Frame[] = [];
  return {
    derived,
    frames,
    record(
      message: string,
      rule: Rule | null = null,
      seeking: Fact | null = null,
      supported: boolean | null = null,
    ) {
      frames.push({
        message,
        rule: rule?.id ?? null,
        derived: [...derived],
        seeking,
        supported,
      });
    },
  };
}
export function forward(obs: Observation): Frame[] {
  const t = trace();
  t.record("観察した事実から始めます。");
  // Apply each rule only when its premise is known and its conclusion is new.
  for (;;) {
    const r = rules.find(
      (r) =>
        (r.when === obs || t.derived.has(r.when)) && !t.derived.has(r.then),
    );
    if (!r) break;
    t.derived.add(r.then);
    t.record(
      `「${labels[r.when]}」が成立するので、「${labels[r.then]}」を導きます。`,
      r,
    );
  }
  const ok = t.derived.has(goal);
  t.record(
    ok
      ? "目標を導けました。"
      : "適用できる規則がありません。この観察からは目標を導けません。",
    null,
    null,
    ok,
  );
  return t.frames;
}
export function backward(obs: Observation): Frame[] {
  const t = trace();
  t.record("目標が成り立つかを調べます。まだ結論ではありません。", null, goal);
  // The fixed two-rule chain has one justification per conclusion and no cycles.
  function prove(f: Fact): boolean {
    const r = rules.find((r) => r.then === f);
    if (!r) {
      const ok = f === obs;
      t.record(
        ok
          ? "前提が観察した事実と一致しました。"
          : `必要な「${labels[f]}」は観察されていません。`,
        null,
        f,
      );
      return ok;
    }
    t.record(
      `「${labels[f]}」を支持するには、「${labels[r.when]}」を確かめます。`,
      r,
      r.when,
    );
    if (!prove(r.when)) return false;
    t.derived.add(f);
    t.record(`前提を確認できたので「${labels[f]}」が支持されます。`, r, null);
    return true;
  }
  const ok = prove(goal);
  t.record(
    ok
      ? "目標を支持する根拠がそろいました。"
      : "前提を確認できず、この観察からは目標を支持できません。",
    null,
    null,
    ok,
  );
  return t.frames;
}
