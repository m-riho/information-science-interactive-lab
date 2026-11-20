import { demoNavigation } from "../../components/demoLayout";
import { demo08, session08Config, session08Path } from "../../sessions/session08";
import figure from "./figure.html?raw";
import "./style.css";

export function mountContextFigure(root: HTMLElement): () => void {
  const demo = demo08("context-figure");
  const { previous, next } = demoNavigation(demo, session08Config);
  root.innerHTML = `
    <a class="back" href="${session08Path}">← 第8回のデモ一覧</a>
    <h1>${demo.title}</h1>
    ${figure}
    <nav class="demo-navigation" aria-label="教材の移動">
      ${previous ? `<a href="${session08Path}/${previous.slug}">← ${previous.title}</a>` : ""}
      <a href="${session08Path}">第8回のデモ一覧</a>
      ${next ? `<a href="${session08Path}/${next.slug}">${next.title} →</a>` : ""}
    </nav>`;
  return () => root.replaceChildren();
}
