export type TapeSymbol = "1" | "□";
export const rules = [
  { state: "q0", read: "1", write: "1", move: "右", next: "q0" },
  { state: "q0", read: "□", write: "1", move: "停止", next: "q1" },
] as const;
export interface MachineState {
  tape: Readonly<Record<number, TapeSymbol>>;
  head: number;
  state: "q0" | "q1";
  steps: number;
  halted: boolean;
  lastRule: 0 | 1 | null;
}
export const initialMachine = (): MachineState => ({
  tape: { 0: "1", 1: "1", 2: "1" },
  head: 0,
  state: "q0",
  steps: 0,
  halted: false,
  lastRule: null,
});
export const readTape = (s: MachineState, position: number): TapeSymbol =>
  s.tape[position] ?? "□";
export function stepMachine(s: MachineState): MachineState {
  if (s.halted || s.state === "q1") return s;
  const lastRule = readTape(s, s.head) === "1" ? 0 : 1;
  const rule = rules[lastRule];
  return {
    tape: { ...s.tape, [s.head]: rule.write },
    head: s.head + (rule.move === "右" ? 1 : 0),
    state: rule.next,
    steps: s.steps + 1,
    halted: rule.next === "q1",
    lastRule,
  };
}
