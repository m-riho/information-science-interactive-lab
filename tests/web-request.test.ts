import { expect, it } from "vitest";
import {
  createWebFlow,
  books,
  searchBooks,
} from "../src/demos/web-request-php/model";
it("正常時はリクエストからブラウザ表示まで順に進む", () => {
  const flow = createWebFlow("情報科学", true);
  expect(flow.map((f) => f.stage)).toEqual([
    "ready",
    "request",
    "server",
    "php",
    "database",
    "generate",
    "response",
    "browser",
  ]);
  expect(flow.at(-1)?.status).toBe(200);
  expect(flow.at(-1)?.results.map((b) => b.title)).toEqual(["情報科学入門"]);
  expect(flow.slice(0, 4).every((f) => f.results.length === 0)).toBe(true);
});
it("処理系停止時はDB検索せずエラー応答を返す", () => {
  const flow = createWebFlow("情報", false);
  expect(flow.map((f) => f.stage)).toEqual([
    "ready",
    "request",
    "server",
    "php",
    "response",
    "browser",
  ]);
  expect(flow.at(-1)?.status).toBe(503);
  expect(flow.every((f) => f.results.length === 0)).toBe(true);
  expect(flow[3]?.message).toContain("検索処理を実行できない");
});
it("一致なしは正常な0件の検索であり障害とは違う", () => {
  const end = createWebFlow("天文学", true).at(-1)!;
  expect(end.status).toBe(200);
  expect(end.results).toEqual([]);
});
it("部分一致・空白・空検索と入力を文字列として扱う", () => {
  expect(searchBooks(" 情報 ").map((b) => b.id)).toEqual([1, 3]);
  expect(searchBooks("")).toEqual(books);
  expect(searchBooks("<script>")).toEqual([]);
});
it("新しい検索・再開で前の結果を持ち越さず知識も変えない", () => {
  const before = JSON.stringify(books);
  const first = createWebFlow("情報", true);
  expect(createWebFlow("科学", false)[0]?.results).toEqual([]);
  expect(createWebFlow("科学", true).at(-1)?.results).toHaveLength(2);
  expect(first.at(-1)?.results).toHaveLength(2);
  expect(JSON.stringify(books)).toBe(before);
  expect(createWebFlow("情報", true)).toEqual(first);
});
