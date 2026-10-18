export interface DemoActions {
  reset?: () => void;
  step?: () => void;
  start?: () => void;
  stop?: () => void;
}
/** デモ側で数値状態を管理し、操作部品には実行可否とコールバックを渡す。 */
export function mountDemoControls(
  host: HTMLElement,
  actions: DemoActions = {},
) {
  host.innerHTML = `<div class="transport" role="group" aria-label="デモ操作"><button data-action="step">1ステップ</button><button data-action="start">自動実行</button><button data-action="stop">停止</button><button data-action="reset">リセット</button><label class="check"><input type="checkbox">動きを減らす</label></div>`;
  const abort = new AbortController();
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = host.querySelector<HTMLInputElement>("input")!;
  reduced.checked = media.matches;
  let running = false;
  let completed = false;
  const button = (key: keyof DemoActions) =>
    host.querySelector<HTMLButtonElement>(`[data-action="${key}"]`)!;
  const update = () => {
    button("step").disabled = !actions.step || running || completed;
    button("reset").disabled = !actions.reset;
    button("start").disabled =
      completed ||
      !actions.start ||
      !actions.stop ||
      running ||
      reduced.checked ||
      document.hidden;
    button("stop").disabled = !actions.stop || !running;
  };
  const stop = () => {
    if (running) actions.stop?.();
    running = false;
    update();
  };
  const on = (target: EventTarget, event: string, fn: () => void) =>
    target.addEventListener(event, fn, { signal: abort.signal });
  on(button("step"), "click", () => actions.step?.());
  on(button("reset"), "click", () => {
    stop();
    actions.reset?.();
  });
  on(button("start"), "click", () => {
    running = true;
    update();
    actions.start?.();
  });
  on(button("stop"), "click", stop);
  on(reduced, "change", stop);
  on(media, "change", () => {
    reduced.checked = media.matches;
    stop();
  });
  on(document, "visibilitychange", () => {
    if (document.hidden) stop();
    else update();
  });
  update();
  return {
    setCompleted(value: boolean) {
      completed = value;
      update();
    },
    setRunning(value: boolean) {
      running = value;
      update();
    },
    dispose() {
      stop();
      abort.abort();
      host.replaceChildren();
    },
  };
}
