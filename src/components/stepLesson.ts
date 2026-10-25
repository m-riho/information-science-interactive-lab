import { mountDemoLayout, type DemoMetadata } from "./demoLayout";
import { session05Config } from "../sessions/session05";
const STEP_INTERVAL_MS = 900;
/** 有限の説明手順を再生する。変更時・非表示時・離脱時には停止する。 */
export function mountStepLesson(
  root: HTMLElement,
  demo: DemoMetadata,
  resetData: () => void,
) {
  let index = 0,
    length = 1,
    renderFrame: (index: number) => void = () => {},
    timer: ReturnType<typeof setInterval> | undefined;
  const clear = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  };
  const update = () => {
    layout.controls.setCompleted(index >= length - 1);
    renderFrame(index);
  };
  const advance = () => {
    index = Math.min(index + 1, length - 1);
    if (index === length - 1) {
      clear();
      layout.controls.setRunning(false);
    }
    update();
  };
  const layout = mountDemoLayout(
    root,
    demo,
    {
      step: advance,
      start: () => {
        clear();
        timer = setInterval(advance, STEP_INTERVAL_MS);
      },
      stop: clear,
      reset: () => {
        clear();
        resetData();
      },
    },
    session05Config,
  );
  return {
    ...layout,
    setFrames(count: number, render: (index: number) => void) {
      if (!Number.isInteger(count) || count < 1)
        throw new RangeError("手順は1件以上必要です");
      clear();
      layout.controls.setRunning(false);
      index = 0;
      length = count;
      renderFrame = render;
      update();
    },
    dispose() {
      clear();
      layout.dispose();
    },
  };
}
