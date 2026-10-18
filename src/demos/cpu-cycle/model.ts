export type Instruction =
  | { op: "LOAD" | "ADD" | "SUB" | "STORE" | "JMP" | "JZ"; addr: number }
  | { op: "HALT" };
export type Memory = Readonly<Record<number, Instruction | number>>;
export type Phase = "fetch" | "decode" | "execute";
export const MAX_INSTRUCTIONS = 100;
export interface CPUState {
  memory: Memory;
  pc: number;
  ir: Instruction | null;
  acc: number;
  zero: boolean;
  phase: Phase;
  lastPhase: Phase | null;
  halted: boolean;
  reason: "halt" | "limit" | "error" | null;
  count: number;
  message: string;
  touched: number | null;
  history: ReadonlyArray<{
    from: number;
    to: number;
    instruction: string;
    acc: number;
    zero: boolean;
  }>;
}
export const address = (value: number) => String(value).padStart(2, "0");
export const instructionText = (i: Instruction) =>
  i.op === "HALT" ? "HALT" : `${i.op} ${address(i.addr)}`;
export function additionProgram(): Memory {
  return {
    0: { op: "LOAD", addr: 10 },
    1: { op: "ADD", addr: 11 },
    2: { op: "STORE", addr: 12 },
    3: { op: "HALT" },
    10: 5,
    11: 8,
    12: 0,
  };
}
export function countdownProgram(value: number): Memory {
  return {
    0: { op: "LOAD", addr: 10 },
    1: { op: "JZ", addr: 6 },
    2: { op: "SUB", addr: 11 },
    3: { op: "STORE", addr: 10 },
    4: { op: "JMP", addr: 1 },
    6: { op: "HALT" },
    10: value,
    11: 1,
  };
}
export function initialCPU(memory: Memory): CPUState {
  return {
    memory: { ...memory },
    pc: 0,
    ir: null,
    acc: 0,
    zero: true,
    phase: "fetch",
    lastPhase: null,
    halted: false,
    reason: null,
    count: 0,
    message: "PC=00から開始します。次はFetchです。",
    touched: null,
    history: [],
  };
}
export function describe(i: Instruction): string {
  switch (i.op) {
    case "LOAD":
      return `${address(i.addr)}番地の数値をACCへ読み込みます。`;
    case "ADD":
      return `${address(i.addr)}番地の数値をACCに足します。`;
    case "SUB":
      return `${address(i.addr)}番地の数値をACCから引きます。`;
    case "STORE":
      return `ACCを${address(i.addr)}番地へ保存します。`;
    case "JMP":
      return `次のPCを${address(i.addr)}へ変更します。`;
    case "JZ":
      return `Zero flagが1なら${address(i.addr)}へ、0なら次の番地へ進みます。`;
    case "HALT":
      return "実行を終了します。";
  }
}
export function stepCPU(s: CPUState): CPUState {
  if (s.halted) return s;
  const fail = (message: string): CPUState => ({
    ...s,
    halted: true,
    reason: "error",
    message,
  });
  if (s.phase === "fetch") {
    const cell = s.memory[s.pc];
    if (cell === undefined || typeof cell === "number")
      return fail("PCの番地に命令がありません。停止しました。");
    return {
      ...s,
      ir: { ...cell },
      phase: "decode",
      lastPhase: "fetch",
      touched: s.pc,
      message: `Fetch：${address(s.pc)}番地の「${instructionText(cell)}」をIRへ取り込みました。`,
    };
  }
  if (!s.ir) return fail("命令レジスタが空です。");
  if (s.phase === "decode")
    return {
      ...s,
      phase: "execute",
      lastPhase: "decode",
      touched: null,
      message: `Decode：${describe(s.ir)}`,
    };
  const i = s.ir;
  let acc = s.acc,
    zero = s.zero,
    pc = s.pc + 1,
    memory = s.memory,
    touched: number | null = null;
  let message = describe(i),
    halted = false,
    reason: CPUState["reason"] = null;
  switch (i.op) {
    case "LOAD":
    case "ADD":
    case "SUB": {
      const value = memory[i.addr];
      if (typeof value !== "number")
        return fail("参照先に数値データがありません。停止しました。");
      acc =
        i.op === "LOAD" ? value : i.op === "ADD" ? acc + value : acc - value;
      if (!Number.isSafeInteger(acc))
        return fail("安全に扱える整数の範囲を超えました。");
      zero = acc === 0;
      touched = i.addr;
      message += ` ACC=${acc}、Zero flag=${Number(zero)}。`;
      break;
    }
    case "STORE":
      if (typeof memory[i.addr] !== "number")
        return fail("保存先は数値データの番地を指定してください。");
      memory = { ...memory, [i.addr]: acc };
      touched = i.addr;
      message += ` 保存値は${acc}です。`;
      break;
    case "JMP":
      pc = i.addr;
      break;
    case "JZ":
      pc = zero ? i.addr : s.pc + 1;
      message = `Zero flag=${Number(zero)}：条件${zero ? "成立" : "不成立"}。PC ${address(s.pc)} → ${address(pc)}。`;
      break;
    case "HALT":
      pc = s.pc;
      halted = true;
      reason = "halt";
      break;
  }
  const count = s.count + 1;
  if (!halted && count >= MAX_INSTRUCTIONS) {
    halted = true;
    reason = "limit";
    message = `安全のため${MAX_INSTRUCTIONS}命令で停止しました。リセットして再開できます。`;
  }
  return {
    ...s,
    memory,
    pc,
    acc,
    zero,
    count,
    halted,
    reason,
    touched,
    phase: "fetch",
    lastPhase: "execute",
    message: `Execute：${message}${halted ? "" : " 次のPC=" + address(pc) + "。"}`,
    history: [
      ...s.history,
      { from: s.pc, to: pc, instruction: instructionText(i), acc, zero },
    ],
  };
}
/** 部分実行中ならその命令を完了し、次の命令には進まない。 */
export function runInstruction(s: CPUState): CPUState {
  const count = s.count;
  let result = s;
  for (let n = 0; n < 3 && !result.halted && result.count === count; n++)
    result = stepCPU(result);
  return result;
}
