import { expect, it } from "vitest";
import { parseRoute } from "../src/utils/router";
import { demos } from "../src/sessions/catalog";
it("空のhashとトップを扱う", () => {
  expect(parseRoute("")).toEqual({ kind: "home" });
  expect(parseRoute("#/")).toEqual({ kind: "home" });
});
it("第3回を開ける", () =>
  expect(parseRoute("#/sessions/03")).toEqual({ kind: "session" }));
it.each(demos)("$slugへの直接リンクを解析できる", (demo) =>
  expect(parseRoute(`#/sessions/03/${demo.slug}`)).toEqual({
    kind: "demo",
    slug: demo.slug,
  }),
);
it("不正なパスを画面に埋め込まない", () =>
  expect(parseRoute("#/sessions/03/<script>")).toEqual({ kind: "missing" }));
