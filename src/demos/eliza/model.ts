// 各規則の X は空でない文字列。ひな型は1か所だけ X を含む。
export const rules = [
  {
    before: "私は",
    after: "が心配です",
    template: "なぜXが心配なのですか？",
    example: "私は試験が心配です",
  },
  {
    before: "私は",
    after: "が好きです",
    template: "Xのどんなところが好きですか？",
    example: "私は音楽が好きです",
  },
  {
    before: "私は",
    after: "を試したいです",
    template: "Xを試すなら、何から始めますか？",
    example: "私は作曲を試したいです",
  },
  {
    before: "最近",
    after: "を始めました",
    template: "Xを始めたきっかけは何ですか？",
    example: "最近写真を始めました",
  },
] as const;
export function respond(input: string) {
  const sentence = input
    .trim()
    .replace(/[。.!！?？]+$/u, "")
    .trimEnd();
  if (!sentence) return null;
  for (const [i, rule] of rules.entries()) {
    if (!sentence.startsWith(rule.before) || !sentence.endsWith(rule.after))
      continue;
    const x = sentence
      .slice(rule.before.length, sentence.length - rule.after.length)
      .trim();
    if (!x) continue;
    return {
      input,
      pattern: `R${i + 1}：${rule.before} X ${rule.after}`,
      x,
      template: rule.template,
      reply: rule.template.replace("X", () => x),
    };
  }
  return {
    input,
    pattern: "一致する規則なし",
    x: null,
    template: null,
    reply: "もう少し詳しく話してもらえますか？",
  };
}
