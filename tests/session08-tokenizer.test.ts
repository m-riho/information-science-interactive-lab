import { describe, expect, it } from "vitest";
import { Tiktoken } from "js-tiktoken/lite";
import o200k from "js-tiktoken/ranks/o200k_base";
import { tokenize, restoreTokens, JAPANESE_EXAMPLE, ENGLISH_EXAMPLE } from "../src/demos/tokenizer/model";

describe("第8回 o200k_base", () => {
  it("スライド9の日本語IDと不完全UTF-8バイトを再現する", () => {
    const tokens = tokenize(JAPANESE_EXAMPLE);
    expect(tokens.map(token => token.id)).toEqual([170411, 53307, 145461, 1395, 27113, 246, 7277, 17592, 30677, 6390, 7128, 15707, 14429, 788]);
    expect(tokens[4]).toMatchObject({ text: null, hex: "e5 82" });
    expect(tokens[5]).toMatchObject({ text: null, hex: "98" });
    expect(restoreTokens(tokens)).toBe(JAPANESE_EXAMPLE);
  });
  it("スライド9の英語IDと先頭空白を保つ", () => {
    const tokens = tokenize(ENGLISH_EXAMPLE);
    expect(tokens.map(token => token.id)).toEqual([3206, 382, 131429, 13]);
    expect(tokens[1]?.text).toBe(" is");
    expect(restoreTokens(tokens)).toBe(ENGLISH_EXAMPLE);
  });
  it.each(["", "<script>alert(1)</script>", "<|endoftext|>", "😀☔️𠮷", "\uFEFFhello\n\t world", "猫 犬 机 椅子"])('入力 %s のバイトを保持しライブラリと一致する', text => {
    const tokens = tokenize(text);
    const encoder = new Tiktoken(o200k);
    expect(tokens.map(token => token.id)).toEqual(encoder.encode(text, [], []));
    expect(tokens.flatMap(token => token.bytes)).toEqual(Array.from(new TextEncoder().encode(text)));
    expect(restoreTokens(tokens)).toBe(text);
  });
  it("tiktoken 0.12.0で実測した絵文字・補助漢字のIDと一致する", () => {
    expect(tokenize("😀☔️𠮷").map(token => token.id)).toEqual([84083, 8434, 242, 15148, 172, 254, 106, 115]);
  });
  it("長すぎる入力を明示的に拒否する", () => expect(() => tokenize("a".repeat(1001))).toThrow("1000"));
});
