import { initialCPU, type Instruction, type Memory } from "../cpu-cycle/model";
export function machineWords(): number[] {
  return [0x11, 0x22, 0x33, 0x00];
}
export function decodeWord(word: number): Instruction {
  if (!Number.isInteger(word) || word < 0 || word > 255)
    throw new RangeError("機械語は8bitです");
  const op = word >> 4,
    addr = word & 15;
  if (word === 0) return { op: "HALT" };
  if (op === 1) return { op: "LOAD", addr };
  if (op === 2) return { op: "ADD", addr };
  if (op === 3) return { op: "STORE", addr };
  throw new Error("未定義の命令です");
}
export function loadTranslation(a: number, b: number) {
  if (
    !Number.isInteger(a) ||
    !Number.isInteger(b) ||
    a < 0 ||
    b < 0 ||
    a > 15 ||
    b > 15
  )
    throw new RangeError("入力は0〜15です");
  const memory: Record<number, Instruction | number> = { 1: a, 2: b, 3: 0 };
  machineWords().forEach((word, index) => {
    memory[8 + index] = decodeWord(word);
  });
  return {
    ...initialCPU(memory as Memory),
    pc: 8,
    message: "翻訳した命令を08番地から配置しました。",
  };
}
