import { it, expect } from "vitest";
import { parseRoute } from "../src/utils/router";
import {
  session07Materials,
  session07Config,
  session07Path,
} from "../src/sessions/session07";
import { renderSession07 } from "../src/sessions/session07View";
import { demoNavigation } from "../src/components/demoLayout";
it.each(session07Materials)("$codeの一覧・直接リンク・前後移動が一致", (m) => {
  const path = session07Path + "/" + m.slug;
  expect(parseRoute(path)).toEqual({ kind: "material07", slug: m.slug });
  expect(renderSession07()).toContain('href="' + path + '"');
  const i = session07Materials.indexOf(m),
    nav = demoNavigation(m, session07Config);
  expect(nav.previous).toBe(session07Materials[i - 1]);
  expect(nav.next).toBe(session07Materials[i + 1]);
  expect(m.ready).toBe(true);
});
it("10デモと4Notebookを区別し、未作成の実行リンクは置かない", () => {
  expect(new Set(session07Materials.map((m) => m.slug)).size).toBe(14);
  expect(
    session07Materials.filter((m) => m.kind === "javascript"),
  ).toHaveLength(10);
  expect(session07Materials.filter((m) => m.kind === "notebook")).toHaveLength(
    4,
  );
  const html = renderSession07();
  expect(html).not.toContain('href="https://colab');
  expect(html).not.toMatch(/href="[^"]+\.ipynb"/);
  expect(parseRoute(session07Path)).toEqual({ kind: "session07" });
  expect(parseRoute(session07Path + "/bad/extra")).toEqual({ kind: "missing" });
});
