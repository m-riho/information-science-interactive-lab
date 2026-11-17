import { readFile } from "node:fs/promises";
import { afterEach, expect, it, vi } from "vitest";
import { loadDigits, loadPretrained } from "../src/demos/digit-training/data";

afterEach(() => vi.unstubAllGlobals());

function usePackagedAssets(signal: AbortSignal) {
  vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
    expect(options.signal).toBe(signal);
    const name = url.slice(url.lastIndexOf("/") + 1);
    const file = new URL("../public/data/session07-digits/" + name, import.meta.url);
    return new Response(Uint8Array.from(await readFile(file)));
  });
}

it("同梱画像は各設定の先頭部分でも、数字1とそれ以外の件数が等しい", async () => {
  const { signal } = new AbortController();
  usePackagedAssets(signal);
  const { train, test } = await loadDigits(signal);
  for (const [split, sizes] of [[train, [200, 1000, 2000]], [test, [100, 500]]] as const) {
    expect(split.pixels.length).toBe(split.labels.length * 784);
    for (const count of sizes) {
      const prefix = split.labels.subarray(0, count);
      expect(prefix.filter(label => label === 1)).toHaveLength(count / 2);
      const negativeCounts = [0, 2, 3, 4, 5, 6, 7, 8, 9].map(
        digit => prefix.filter(label => label === digit).length,
      );
      expect(Math.max(...negativeCounts) - Math.min(...negativeCounts)).toBeLessThanOrEqual(1);
    }
  }
  const weights = await loadPretrained(signal);
  expect(weights.length).toBe(784 * 32 + 32 + 32 + 1);
  expect(weights.some(weight => weight !== 0)).toBe(true);
});

it("重みまたは画像のファイルが途中で切れたとき読込みエラーを返す", async () => {
  vi.stubGlobal("fetch", async () => new Response(new Uint8Array(3)));
  const { signal } = new AbortController();
  await expect(loadDigits(signal)).rejects.toThrow("サイズ");
  await expect(loadPretrained(signal)).rejects.toThrow("サイズ");
});
