import { expect, it } from "vitest";
import {
  session05Demos,
  session05Path,
  session05Config,
} from "../src/sessions/session05";
import { session04Demos } from "../src/sessions/session04";
import { parseRoute } from "../src/utils/router";
import { renderSession05 } from "../src/sessions/session05View";
import { demoNavigation } from "../src/components/demoLayout";
it.each(session05Demos)("$slugの直接リンク・カード・前後が一致する", (demo) => {
  expect(parseRoute(`${session05Path}/${demo.slug}`)).toEqual({
    kind: "demo05",
    slug: demo.slug,
  });
  expect(renderSession05()).toContain(`href="${session05Path}/${demo.slug}"`);
  const index = session05Demos.indexOf(demo);
  const nav = demoNavigation(demo, session05Config);
  expect(nav.previous).toBe(session05Demos[index - 1]);
  expect(nav.next).toBe(session05Demos[index + 1]);
});
it("第5回一覧と不正なURLを区別する", () => {
  expect(parseRoute(session05Path)).toEqual({ kind: "session05" });
  for (const path of [
    "#/sessions/05/<script>",
    "#/sessions/05/demo/extra",
    "#/b/sessions/05",
  ])
    expect(parseRoute(path)).toEqual({ kind: "missing" });
});
it("Phase5は7件利用可能で準備中表示がない", () => {
  expect(new Set(session05Demos.map((d) => d.slug)).size).toBe(7);
  expect(session05Demos.filter((d) => d.ready).map((d) => d.phase)).toEqual([
    2, 2, 2, 3, 4, 5, 5,
  ]);
  expect(renderSession05()).toContain("7件利用可能");
  expect(renderSession05()).toContain("体験できます");
  expect(renderSession05()).not.toContain("準備中");
});
it.each(session04Demos)(
  "共通化しても第4回の$slugのナビゲーションを維持",
  (demo) => {
    const index = session04Demos.indexOf(demo);
    expect(demoNavigation(demo)).toEqual({
      index,
      previous: session04Demos[index - 1],
      next: session04Demos[index + 1],
    });
  },
);
