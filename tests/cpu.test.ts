import { expect, it } from "vitest";
import {
  initialCPU,
  stepCPU,
  runInstruction,
  additionProgram,
  countdownProgram,
  MAX_INSTRUCTIONS,
  type CPUState,
} from "../src/demos/cpu-cycle/model";
function finish(s: CPUState) {
  for (let i = 0; i < MAX_INSTRUCTIONS + 1 && !s.halted; i++)
    s = runInstruction(s);
  return s;
}
it("Fetchで命令をIRへ取り込み、DecodeまでメモリとACCを変更しない", () => {
  const a = initialCPU(additionProgram());
  const b = stepCPU(a),
    c = stepCPU(b);
  expect(b.ir).toEqual({ op: "LOAD", addr: 10 });
  expect(b.pc).toBe(0);
  expect(c.acc).toBe(0);
  expect(c.phase).toBe("execute");
  expect(c.memory).toEqual(a.memory);
  expect(a.ir).toBe(null);
});
it("LOAD/ADD/STORE/HALTで結果13を保存する", () => {
  let s = initialCPU(additionProgram());
  s = runInstruction(s);
  expect(s.acc).toBe(5);
  expect(s.pc).toBe(1);
  s = runInstruction(s);
  expect(s.acc).toBe(13);
  s = runInstruction(s);
  expect(s.memory[12]).toBe(13);
  s = runInstruction(s);
  expect(s.halted).toBe(true);
  expect(s.reason).toBe("halt");
  expect(stepCPU(s)).toBe(s);
});
it("部分実行から1命令は現在命令だけを完了する", () => {
  const s = runInstruction(stepCPU(initialCPU(additionProgram())));
  expect(s.count).toBe(1);
  expect(s.pc).toBe(1);
});
it("カウントダウンはSUBとJMP/JZで0に到達する", () => {
  const s = finish(initialCPU(countdownProgram(3)));
  expect(s.reason).toBe("halt");
  expect(s.memory[10]).toBe(0);
  expect(s.zero).toBe(true);
  expect(s.history.some((h) => h.instruction === "JZ 06" && h.to === 2)).toBe(
    true,
  );
  expect(s.history.some((h) => h.instruction === "JZ 06" && h.to === 6)).toBe(
    true,
  );
  expect(s.history.some((h) => h.instruction === "JMP 01" && h.to === 1)).toBe(
    true,
  );
});
it("初期0は最初のJZでHALTへ進む", () => {
  const s = finish(initialCPU(countdownProgram(0)));
  expect(s.count).toBe(3);
  expect(s.memory[10]).toBe(0);
});
it("無限ジャンプは最大命令数で停止する", () => {
  const s = finish(initialCPU({ 0: { op: "JMP", addr: 0 } }));
  expect(s.count).toBe(MAX_INSTRUCTIONS);
  expect(s.reason).toBe("limit");
  expect(runInstruction(s)).toBe(s);
});
it("STOREは入力メモリを書き換えない", () => {
  const start = initialCPU(additionProgram());
  finish(start);
  expect(start.memory[12]).toBe(0);
});
it("命令以外のFetchと不正データアクセスはエラー停止", () => {
  expect(stepCPU(initialCPU({ 0: 5 })).reason).toBe("error");
  expect(
    runInstruction(initialCPU({ 0: { op: "LOAD", addr: 10 } })).reason,
  ).toBe("error");
});
it("SUBは負数も扱いZero flagを更新する", () => {
  const s = runInstruction(initialCPU({ 0: { op: "SUB", addr: 10 }, 10: 1 }));
  expect(s.acc).toBe(-1);
  expect(s.zero).toBe(false);
});
