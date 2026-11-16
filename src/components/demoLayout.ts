import {
  session04Demos,
  session04Path,
  type Session04Demo,
} from "../sessions/session04";
import { mountDemoControls, type DemoActions } from "./demoControls";
export interface DemoMetadata {
  slug: string;
  title: string;
  description: string;
  goal: string;
  keywords: string;
  phase: number;
  ready: boolean;
}
export interface DemoSession {
  number: string;
  path: string;
  demos: readonly DemoMetadata[];
  note: string;
}
const defaultSession: DemoSession = {
  number: "04",
  path: session04Path,
  demos: session04Demos,
  note: "このデモは概念理解のため単純化しています。実際の回路やCPUの厳密な動作・時間を再現するものではありません。",
};
export function demoNavigation(
  demo: DemoMetadata,
  session: DemoSession = defaultSession,
) {
  const index = session.demos.findIndex((item) => item.slug === demo.slug);
  return {
    index,
    previous: session.demos[index - 1],
    next: session.demos[index + 1],
  };
}
export function mountDemoLayout(
  root: HTMLElement,
  demo: DemoMetadata,
  actions: DemoActions = {},
  session: DemoSession = defaultSession,
) {
  const { index, previous, next } = demoNavigation(demo, session);
  root.innerHTML = `<a class="back" href="${session.path}">← Session ${session.number}トップへ</a><div class="page-heading"><p class="eyebrow">Information Science A / Session ${session.number} / Demo ${index + 1}</p><h1>${demo.title}</h1><p class="lead">${demo.description}</p></div><p class="goal"><strong>学習目標</strong>　${demo.goal}</p><section class="lab session04-lab" aria-label="${demo.title}"><div class="lab-bar"><span>操作して、しくみを確かめよう</span></div><div class="session04-padding"><h2>操作方法</h2><p data-slot="instructions"></p><div data-slot="controls"></div><div data-slot="body"></div><section class="session04-status"><h2>いま何が起きた？</h2><p data-slot="status" role="status" aria-live="polite"></p></section></div></section><p class="hint">${session.note}</p><nav class="demo-navigation" aria-label="第${Number(session.number)}回のデモを移動">${previous ? `<a href="${session.path}/${previous.slug}">← 前：${previous.title}</a>` : "<span></span>"}<a href="${session.path}">Session ${session.number}トップへ</a>${next ? `<a href="${session.path}/${next.slug}">次：${next.title} →</a>` : "<span></span>"}</nav>`;
  const slot = (name: string) =>
    root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;
  const controlHost = slot("controls");
  if (
    demo.ready &&
    !actions.start &&
    !actions.step &&
    ["06", "07"].includes(session.number)
  )
    controlHost.classList.add("s6-direct-controls");
  const controls = mountDemoControls(controlHost, actions);
  return {
    body: slot("body"),
    instructions: slot("instructions"),
    status: slot("status"),
    controls,
    dispose: () => controls.dispose(),
  };
}
export function mountSession04Placeholder(
  root: HTMLElement,
  demo: Session04Demo,
): () => void {
  const layout = mountDemoLayout(root, demo);
  layout.instructions.textContent =
    "現在は準備中です。シミュレーションの操作は、デモ本体の実装後に利用できます。";
  layout.body.innerHTML = `<div class="session04-placeholder"><span class="badge">準備中 · Phase ${demo.phase}で実装予定</span><h2>これから学ぶこと</h2><p>${demo.keywords}</p></div>`;
  layout.status.textContent =
    "Phase 1では共通画面とナビゲーションを用意しました。シミュレーションはまだ実行されません。";
  return layout.dispose;
}
