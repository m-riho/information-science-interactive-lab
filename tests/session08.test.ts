import { expect, it } from "vitest";
import { parseRoute } from "../src/utils/router";
import { session08Demos, session08Config, session08Path } from "../src/sessions/session08";
import { renderSession08 } from "../src/sessions/session08View";
import { demoNavigation } from "../src/components/demoLayout";
import { renderSession06 } from "../src/sessions/session06View";
import { renderSession07 } from "../src/sessions/session07View";
it.each(session08Demos)("$code の直接リンク・一覧・前後移動", demo => {
  const path = `${session08Path}/${demo.slug}`;
  expect(parseRoute(path)).toEqual({ kind: "demo08", slug: demo.slug });
  expect(renderSession08()).toContain(`href="${path}"`);
  const index = session08Demos.indexOf(demo);
  const navigation = demoNavigation(demo, session08Config);
  expect(navigation.previous).toBe(session08Demos[index - 1]);
  expect(navigation.next).toBe(session08Demos[index + 1]);
});
it("授業内7本・復習2本と前回からの導線を提供する", () => {
  expect(session08Demos).toHaveLength(9);
  expect(new Set(session08Demos.map(item => item.slug)).size).toBe(9);
  expect(session08Demos.filter(item => item.usage === "授業内使用")).toHaveLength(7);
  expect(session08Demos.filter(item => item.usage === "復習用")).toHaveLength(2);
  expect(renderSession06()).toContain('href="#/sessions/08"');
  expect(renderSession07()).toContain('href="#/sessions/08"');
  expect(parseRoute(session08Path)).toEqual({ kind: "session08" });
  expect(parseRoute(session08Path + "/bad/extra")).toEqual({ kind: "missing" });
});
