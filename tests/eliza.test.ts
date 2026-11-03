import { it, expect } from "vitest";
import { respond, rules } from "../src/demos/eliza/model";
it.each(rules.map((r, i) => ({ r, x: ["試験", "音楽", "作曲", "写真"][i]! })))(
  "例文 $r.example の語句を返答に使う",
  ({ r, x }) => {
    const result = respond(" " + r.example + "。 ");
    expect(result?.x).toBe(x);
    expect(result?.reply).toBe(r.template.replace("X", x));
  },
);
it("文型不一致と空入力を区別", () => {
  expect(respond("試験が不安")?.template).toBeNull();
  expect(respond("私はが心配です")?.x).toBeNull();
  expect(respond("  ")).toBeNull();
});
it("抽出した文字を置換記号やHTMLとして加工しない", () => {
  const x = "<$&>";
  expect(respond("私は" + x + "が心配です")?.reply).toBe(
    "なぜ" + x + "が心配なのですか？",
  );
});
