// Create the three classroom handouts from the actual application views.
import { build } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const target = process.argv[2];
if (!target) throw new Error("出力先のディレクトリを指定してください");
const demos = [
  ["vector-arithmetic", "mountVectorArithmetic", "単語ベクトルの加減算"],
  ["word-order", "mountWordOrder", "語順と位置情報"],
  ["multi-head", "mountMultiHead", "複数のAttentionヘッド"]
];
await mkdir(target, { recursive: true });
for (const [slug, mount, title] of demos) {
  const entry = resolve("session08-offline-entry.js");
  const others = demos.filter(demo => demo[0] !== slug);
  const nav = others.map(([, , name]) => `<a href="${name}.html">${name}</a>`).join("");
  const bundle = await build({
    configFile: false, logLevel: "warn",
    plugins: [{
      name: "session08-offline",
      resolveId: id => id === entry ? "\0" + entry : null,
      load: id => id === "\0" + entry ? `
        import ${JSON.stringify(resolve("src/styles/theme.css"))};
        import { ${mount} } from ${JSON.stringify(resolve(`src/demos/${slug}/view.ts`))};
        const root = document.querySelector("main");
        ${mount}(root);
        root.querySelector(".back").remove();
        root.querySelector("nav").innerHTML = ${JSON.stringify(nav)};
      ` : null
    }],
    build: { write: false, lib: { entry, name: "Lecture08", formats: ["iife"], fileName: "demo", cssFileName: "demo" } }
  });
  const outputs = (Array.isArray(bundle) ? bundle[0] : bundle).output;
  const js = outputs.find(asset => asset.type === "chunk").code;
  const css = outputs.find(asset => asset.fileName.endsWith(".css")).source;
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} | 情報科学A</title><style>${css}</style></head><body><main></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
  await writeFile(join(target, title + ".html"), html);
}
