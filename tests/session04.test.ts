import { expect, it } from "vitest";
import { session04Demos, session04Path } from "../src/sessions/session04";
import { parseRoute } from "../src/utils/router";
import { renderSession04 } from "../src/sessions/session04View";
it.each(session04Demos)("$slugへの直接リンクとカードが一致する", (demo) => {
  expect(parseRoute(`${session04Path}/${demo.slug}`)).toEqual({
    kind: "demo04",
    slug: demo.slug,
  });
  expect(renderSession04()).toContain(`href="${session04Path}/${demo.slug}"`);
});
it("第4回は重複のない7デモと実装済み件数を示す", () => {
  expect(new Set(session04Demos.map((d) => d.slug)).size).toBe(7);
  expect(renderSession04()).toContain("7件利用可能");
});
