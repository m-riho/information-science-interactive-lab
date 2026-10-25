export type Example = "A" | "B" | "C";
export type Prediction = "STOP" | "LOOP";
export interface ExampleFrame {
  value: number;
  outcome: "running" | "STOP" | "observation-limit";
  message: string;
}
export const OBSERVATION_LIMIT = 6;
export function exampleFrames(example: Example): ExampleFrame[] {
  if (example === "A")
    return Array.from({ length: 4 }, (_, i) => ({
      value: i,
      outcome: i === 3 ? "STOP" : "running",
      message:
        i === 3
          ? "3回の処理を終え、プログラムはSTOPしました。"
          : `処理回数 ${i} / 3。${i === 0 ? "まだ処理していません。" : "次の処理へ進みます。"}`,
    }));
  if (example === "B")
    return Array.from({ length: OBSERVATION_LIMIT + 1 }, (_, i) => ({
      value: i,
      outcome: i === OBSERVATION_LIMIT ? "observation-limit" : "running",
      message:
        i === OBSERVATION_LIMIT
          ? "画面の観察を6回で打ち切りました。プログラムがSTOPしたわけではありません。この例に終了条件がないことはコードから分かります。"
          : `同じ処理を${i}回観察しました。終了へ進む命令はありません。`,
    }));
  let n = 7;
  const frames: ExampleFrame[] = [
    {
      value: n,
      outcome: "running",
      message:
        "n=7から始めます。nが1より大きい間、奇数なら1を足し、偶数なら2で割ります。",
    },
  ];
  while (n > 1) {
    const previous = n;
    n = n % 2 === 0 ? n / 2 : n + 1;
    frames.push({
      value: n,
      outcome: n === 1 ? "STOP" : "running",
      message: `n=${previous}は${previous % 2 === 0 ? "偶数なので2で割る" : "奇数なので1を足す"} → n=${n}。${n === 1 ? "条件n>1が偽になりSTOPします。" : ""}`,
    });
  }
  return frames;
}
export interface HaltingState {
  part: 0 | 1 | 2 | 3;
  step: number;
  example: Example;
  prediction: Prediction;
}
export type HaltingAction =
  | { type: "step" | "next" | "previous" | "reset" }
  | { type: "example"; example: Example }
  | { type: "prediction"; prediction: Prediction };
export const initialHalting = (): HaltingState => ({
  part: 0,
  step: 0,
  example: "A",
  prediction: "STOP",
});
export const opposite = (prediction: Prediction): Prediction =>
  prediction === "STOP" ? "LOOP" : "STOP";
export const lastStep = (state: HaltingState): number =>
  state.part === 0
    ? exampleFrames(state.example).length - 1
    : state.part === 1
      ? 2
      : state.part === 2
        ? 2
        : 4;
export function transition(
  state: HaltingState,
  action: HaltingAction,
): HaltingState {
  switch (action.type) {
    case "reset":
      return initialHalting();
    case "step":
      return { ...state, step: Math.min(state.step + 1, lastStep(state)) };
    case "next":
      return state.part === 3
        ? state
        : { ...state, part: (state.part + 1) as HaltingState["part"], step: 0 };
    case "previous":
      return state.part === 0
        ? state
        : { ...state, part: (state.part - 1) as HaltingState["part"], step: 0 };
    case "example":
      return { ...state, part: 0, step: 0, example: action.example };
    case "prediction":
      return { ...state, step: 0, prediction: action.prediction };
  }
}
