import { defineConfig } from "vite";
// 公開先を変更するときは、このリポジトリ名を変更する。
const repository = "information-science-interactive-lab";
export default defineConfig(({ command, isPreview }) => ({
  base: command === "serve" && !isPreview ? "/" : `/${repository}/`,
}));
