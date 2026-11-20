import { mountDemoLayout } from "../../components/demoLayout";
import type { DemoActions } from "../../components/demoControls";
import { demo08, session08Config } from "../../sessions/session08";
import "./style.css";
export function mountLlm(root: HTMLElement, slug: string, instructions: string, actions: DemoActions = {}) {
  const demo = demo08(slug);
  const layout = mountDemoLayout(root, demo, actions, session08Config);
  layout.body.classList.add("llm-body");
  root.querySelector('[data-slot="controls"]')!.classList.add("llm-controls");
  layout.instructions.textContent = instructions;
  const metadata = document.createElement("p");
  metadata.className = "hint";
  metadata.textContent = `${demo.code} · 対応スライド ${demo.slides} · ${demo.usage}`;
  layout.instructions.before(metadata);
  for (const key of ["step", "start", "stop"] as const) {
    if (!actions[key]) root.querySelector<HTMLButtonElement>(`[data-action="${key}"]`)!.hidden = true;
  }
  return layout;
}
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
export function probabilityBars(labels: readonly string[], probabilities: readonly number[], quantity = "確率"): string {
  return `<div class="llm-bars">${labels.map((label, i) => `<div class="llm-bar-row"><span>${escapeHtml(label)}</span><meter min="0" max="1" value="${probabilities[i] ?? 0}" aria-label="${escapeHtml(label)}の${escapeHtml(quantity)}"></meter><span>${((probabilities[i] ?? 0) * 100).toFixed(1)}%</span></div>`).join("")}</div>`;
}
