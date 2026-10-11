import { defineConfig } from "vite";
// 公開先を変更するときは、この仮のリポジトリ名を変更する。
const repository = "csa-interactive-demos";
export default defineConfig(({ command, isPreview }) => ({
  base: command === "serve" && !isPreview ? "/" : `/${repository}/`,
}));
