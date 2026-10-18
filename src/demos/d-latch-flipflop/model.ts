import type { Bit } from "../logic-gates/model";
export interface ClockState {
  d: Bit;
  clk: Bit;
  latch: Bit;
  ff: Bit;
}
export const initialClock = (): ClockState => ({
  d: 0,
  clk: 0,
  latch: 0,
  ff: 0,
});
export function clockNext(previous: ClockState, d: Bit, clk: Bit): ClockState {
  return {
    d,
    clk,
    latch: clk === 1 ? d : previous.latch,
    ff: previous.clk === 0 && clk === 1 ? d : previous.ff,
  };
}
