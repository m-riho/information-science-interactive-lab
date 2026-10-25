export type Person = "taro" | "hanako" | "jiro";
export const personNames: Record<Person, string> = {
  taro: "太郎",
  hanako: "花子",
  jiro: "次郎",
};
export interface ParentFact {
  readonly parent: Person;
  readonly child: Person;
}
export const familyFacts: readonly ParentFact[] = [
  { parent: "taro", child: "hanako" },
  { parent: "hanako", child: "jiro" },
];
export interface InferenceFrame {
  message: string;
  y: Person | null;
  edges: readonly number[];
  result: boolean | null;
}
/** 固定形のgrandparent問い合わせを、有限の親子関係で照合する。 */
export function inferGrandparent(
  x: Person,
  z: Person,
  facts: readonly ParentFact[] = familyFacts,
): InferenceFrame[] {
  const frames: InferenceFrame[] = [
    {
      message: `問い合わせを選びました。grandparent(${x}, ${z}) は成立するでしょうか？`,
      y: null,
      edges: [],
      result: null,
    },
    {
      message: `規則に当てはめます。X=${x}、Z=${z}。まず parent(${x}, Y) を探します。`,
      y: null,
      edges: [],
      result: null,
    },
  ];
  for (let i = 0; i < facts.length; i++) {
    const first = facts[i]!;
    if (first.parent !== x) continue;
    const y = first.child;
    frames.push({
      message: `parent(${x}, ${y}) が見つかりました。Y=${y} を候補にします。`,
      y,
      edges: [i],
      result: null,
    });
    const second = facts.findIndex((f) => f.parent === y && f.child === z);
    frames.push({
      message: `同じYで parent(${y}, ${z}) を確認：${second >= 0 ? "事実が見つかりました。" : "一致する事実がありません。次の候補を探します。"}`,
      y,
      edges: second >= 0 ? [second] : [],
      result: null,
    });
    if (second >= 0) {
      frames.push({
        message: `true：Y=${y} で2つの条件が成立しました。${personNames[x]}は${personNames[z]}の祖父母です。`,
        y,
        edges: [i, second],
        result: true,
      });
      return frames;
    }
  }
  frames.push({
    message:
      "false：登録された事実と規則では成立する組合せがありません。現実世界のすべての家族関係を否定する意味ではありません。",
    y: null,
    edges: [],
    result: false,
  });
  return frames;
}
export const queryPresets = [
  { x: "taro", z: "jiro", label: "太郎は次郎の祖父母？" },
  { x: "taro", z: "hanako", label: "太郎は花子の祖父母？" },
  { x: "jiro", z: "taro", label: "次郎は太郎の祖父母？" },
] as const;
