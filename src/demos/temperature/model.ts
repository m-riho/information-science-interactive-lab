export const BASE_PROBABILITIES = [0.6, 0.25, 0.1, 0.05] as const;
export const CANDIDATE_LABELS = ["持って", "買って", "忘れて", "その他"] as const;

function validateWeights(values: readonly number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!values.length || values.some(value => !Number.isFinite(value) || value < 0) || !Number.isFinite(total) || total <= 0) {
    throw new RangeError("確率には0以上の有限値と正の合計が必要です。");
  }
  return total;
}

/** log空間で最大値を引き、低温でも指数計算の桁あふれを避ける。 */
export function temperatureDistribution(probabilities: readonly number[], temperature: number): number[] {
  validateWeights(probabilities);
  if (!Number.isFinite(temperature) || temperature <= 0) throw new RangeError("Temperatureは正の有限値にしてください。");
  const logs = probabilities.map(p => p === 0 ? -Infinity : Math.log(p));
  const maximum = Math.max(...logs);
  const weights = logs.map(value => Math.exp((value - maximum) / temperature));
  const total = weights.reduce((sum, value) => sum + value, 0);
  return weights.map(value => value / total);
}

/** 外部から[0,1)の乱数を渡すため、モデル自身には副作用がない。 */
export function sampleIndex(probabilities: readonly number[], random: number): number {
  const total = validateWeights(probabilities);
  if (!Number.isFinite(random) || random < 0 || random >= 1) throw new RangeError("乱数は0以上1未満にしてください。");
  const target = random * total;
  let cumulative = 0;
  let lastPositive = 0;
  for (let index = 0; index < probabilities.length; index++) {
    const probability = probabilities[index]!;
    if (probability > 0) lastPositive = index;
    cumulative += probability;
    if (target < cumulative) return index;
  }
  return lastPositive;
}

export interface SamplingState {
  readonly total: number;
  readonly counts: readonly number[];
  readonly history: readonly { draw: number; candidate: number }[];
}
export function initialSampling(): SamplingState {
  return { total: 0, counts: [0, 0, 0, 0], history: [] };
}
export function recordSample(state: SamplingState, candidate: number): SamplingState {
  if (!Number.isInteger(candidate) || candidate < 0 || candidate >= state.counts.length) throw new RangeError("候補が範囲外です。");
  const total = state.total + 1;
  return {
    total,
    counts: state.counts.map((count, index) => count + Number(index === candidate)),
    history: [...state.history, { draw: total, candidate }].slice(-24),
  };
}
