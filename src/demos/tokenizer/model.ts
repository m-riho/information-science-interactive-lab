import { Tiktoken } from "js-tiktoken/lite";
import o200k from "js-tiktoken/ranks/o200k_base";

export const JAPANESE_EXAMPLE = "今日は雨なので、傘を持って出かけます。";
export const ENGLISH_EXAMPLE = "It is raining.";
export const MAX_TEXT_LENGTH = 1000;
export interface TokenInfo {
  id: number;
  bytes: number[];
  hex: string;
  text: string | null;
}

// js-tiktoken 1.0.21の公開rankデータを使用する。各行は長さ・開始ID・base64列。
// decode()は不完全なUTF-8を置換するため、元バイト列をrankデータから取得する。
const encodedBytes = new Map<number, string>();
for (const line of o200k.bpe_ranks.split("\n")) {
  if (!line) continue;
  const [, start, ...tokens] = line.split(" ");
  const offset = Number(start);
  tokens.forEach((bytes, index) => encodedBytes.set(offset + index, bytes));
}
const encoder = new Tiktoken(o200k);
const strictDecoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
export function tokenize(text: string): TokenInfo[] {
  if (text.length > MAX_TEXT_LENGTH) throw new RangeError("入力は1000文字以内にしてください。");
  // 特殊トークンの表記も入力された普通の文字列として符号化する。
  return encoder.encode(text, [], []).map(id => {
    const encoded = encodedBytes.get(id);
    if (encoded === undefined) throw new Error("トークンのバイト列が見つかりません。");
    const bytes = Array.from(atob(encoded), char => char.charCodeAt(0));
    let decoded: string | null;
    try { decoded = strictDecoder.decode(new Uint8Array(bytes)); }
    catch { decoded = null; }
    return { id, bytes, hex: bytes.map(byte => byte.toString(16).padStart(2, "0")).join(" "), text: decoded };
  });
}
export function restoreTokens(tokens: readonly TokenInfo[]): string {
  return strictDecoder.decode(new Uint8Array(tokens.flatMap(token => token.bytes)));
}
