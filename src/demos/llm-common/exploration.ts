import { demoNavigation } from "../../components/demoLayout";
import { demo08, session08Config, session08Path } from "../../sessions/session08";
import "./style.css";

export function mountExploration(root: HTMLElement, slug: string, instructions: string, actions: { reset: () => void }) {
  const demo = demo08(slug);
  const { previous, next } = demoNavigation(demo, session08Config);
  root.innerHTML = `<a class="back" href="${session08Path}">第8回のデモ一覧</a>
    <div class="exploration-heading"><p class="eyebrow">情報科学A　第8回　·　スライド ${demo.slides}</p><h1>${demo.title}</h1></div>
    <div class="exploration-instructions"><p>${instructions}</p><button data-action="reset" type="button">リセット</button></div>
    <div class="llm-body" data-slot="body"></div><p class="goal" data-slot="status" role="status"></p>
    <nav class="demo-navigation" aria-label="第8回のデモを移動">${previous ? `<a href="${session08Path}/${previous.slug}">前：${previous.title}</a>` : ""}
    ${next ? `<a href="${session08Path}/${next.slug}">次：${next.title}</a>` : ""}</nav>`;
  const controller = new AbortController();
  root.querySelector("button")!.addEventListener("click", actions.reset, { signal: controller.signal });
  return { body: root.querySelector<HTMLElement>('[data-slot="body"]')!,
    status: root.querySelector<HTMLElement>('[data-slot="status"]')!, dispose: () => controller.abort() };
}
