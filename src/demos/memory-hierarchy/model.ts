export type AccessPattern = "sequential" | "repeat" | "random";
export interface CacheState {
  /** 先頭が最近使用したブロック、末尾がLRU。 */
  blocks: number[];
  hits: number;
  misses: number;
  wait: number;
}
export interface AccessResult {
  state: CacheState;
  address: number;
  block: number;
  hit: boolean;
  evicted: number | undefined;
  cost: number;
}
export const BLOCK_SIZE = 4;
export const CACHE_WAIT = 1;
export const RAM_WAIT = 10;
export function emptyCache(): CacheState {
  return { blocks: [], hits: 0, misses: 0, wait: 0 };
}
export function access(
  state: CacheState,
  address: number,
  capacity: number,
): AccessResult {
  const block = Math.floor(address / BLOCK_SIZE);
  const hit = state.blocks.includes(block);
  const blocks = [block, ...state.blocks.filter((value) => value !== block)];
  const evicted = blocks.length > capacity ? blocks.pop() : undefined;
  const cost = CACHE_WAIT + (hit ? 0 : RAM_WAIT);
  return {
    address,
    block,
    hit,
    evicted,
    cost,
    state: {
      blocks,
      hits: state.hits + (hit ? 1 : 0),
      misses: state.misses + (hit ? 0 : 1),
      wait: state.wait + cost,
    },
  };
}
/** 固定シードの疑似乱数で、容量を変えても同じ要求列を比較できる。 */
export function makeSequence(pattern: AccessPattern): number[] {
  let seed = 2026;
  return Array.from({ length: 48 }, (_, i) => {
    if (pattern === "sequential") return i % 32;
    if (pattern === "repeat") return (i % 4) * 4;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor((seed / 4294967296) * 32);
  });
}
