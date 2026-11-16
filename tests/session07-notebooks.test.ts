import { it, expect } from "vitest";
import { session07Materials } from "../src/sessions/session07";
import { notebookLinks } from "../src/sessions/session07View";
it.each(session07Materials.filter((m) => m.kind === "notebook"))(
  "$filenameの配布先・GitHub・Colabのリンクが一致",
  (m) => {
    const links = notebookLinks(m.filename);
    expect(links.download).toContain("notebooks/session07/" + m.filename);
    expect(links.github).toContain(
      "m-riho/information-science-interactive-lab/blob/main/public/notebooks/session07/",
    );
    expect(links.colab).toContain("https://colab.research.google.com/github/");
  },
);
