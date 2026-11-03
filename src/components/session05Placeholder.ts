import { mountDemoLayout, type DemoMetadata } from "./demoLayout";
import { session05Config } from "../sessions/session05";
export function mountSession05Placeholder(
  root: HTMLElement,
  demo: DemoMetadata,
  session = session05Config,
): () => void {
  const layout = mountDemoLayout(root, demo, {}, session);
  layout.instructions.textContent =
    "現在は準備中です。実装後に、この画面で操作できるようになります。";
  layout.body.innerHTML = `<div class="session04-placeholder"><span class="badge">準備中 · Phase ${demo.phase}で実装予定</span><h2>これから学ぶこと</h2><p>${demo.keywords}</p></div>`;
  layout.status.textContent =
    "このデモは準備中です。シミュレーションはまだ実行されません。";
  return layout.dispose;
}
