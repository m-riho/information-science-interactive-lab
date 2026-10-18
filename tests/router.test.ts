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

it("第4回を開ける", () =>
  expect(parseRoute("#/sessions/04")).toEqual({ kind: "session04" }));
it("第4回の不正なパスを拒否する", () => {
  for (const path of [
    "#/sessions/04/<script>",
    "#/sessions/04/sr-latch/extra",
    "#/b/sessions/04",
  ])
    expect(parseRoute(path)).toEqual({ kind: "missing" });
});
