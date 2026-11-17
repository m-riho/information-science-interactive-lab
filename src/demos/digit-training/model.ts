import { random } from "../learning-common/model";
import type { Engine } from "./types";

export const INPUTS = 784;
export const HIDDEN = 32;
export const HIDDEN_BIAS = INPUTS * HIDDEN;
export const OUTPUT_WEIGHT = HIDDEN_BIAS + HIDDEN;
export const OUTPUT_BIAS = OUTPUT_WEIGHT + HIDDEN;
const parameterCount = OUTPUT_BIAS + 1;

export function initialWeights(pretrained?: Float32Array) {
  if (pretrained) {
    if (pretrained.length !== parameterCount || !pretrained.every(Number.isFinite))
      throw new RangeError("学習済み重みの個数または値が不正です。");
    return pretrained.slice();
  }
  const parameters = new Float32Array(parameterCount);
  const next = random(7013);
  // He-uniform for the ReLU layer, Glorot-uniform for the output. Biases start at zero.
  const hiddenLimit = Math.sqrt(6 / INPUTS);
  const outputLimit = Math.sqrt(6 / (HIDDEN + 1));
  for (let i = 0; i < HIDDEN_BIAS; i++) parameters[i] = (2 * next() - 1) * hiddenLimit;
  for (let j = 0; j < HIDDEN; j++) parameters[OUTPUT_WEIGHT + j] = (2 * next() - 1) * outputLimit;
  return parameters;
}

export function imageCount(x: Float32Array) {
  if (!x.length || x.length % INPUTS !== 0)
    throw new RangeError("入力画像は1枚につき784画素必要です。");
  for (const pixel of x) {
    if (!(pixel >= 0 && pixel <= 1)) throw new RangeError("画素値は0から1の範囲で指定してください。");
  }
  return x.length / INPUTS;
}

function checkLabels(y: Float32Array, count: number) {
  if (!count || y.length !== count || !y.every(label => label === 0 || label === 1))
    throw new RangeError("画像と同数の二値ラベルが必要です。");
}

export function checkBatch(x: Float32Array, y: Float32Array) {
  checkLabels(y, imageCount(x));
}

export function checkRate(rate: number) {
  if (!(rate > 0) || !Number.isFinite(Math.fround(rate)))
    throw new RangeError("学習率には正の有限値が必要です。");
}

function forward(parameters: Float32Array, x: Float32Array, offset: number, hidden: Float64Array) {
  hidden.set(parameters.subarray(HIDDEN_BIAS, OUTPUT_WEIGHT));
  for (let i = 0; i < INPUTS; i++) {
    const pixel = x[offset + i]!;
    if (pixel === 0) continue;
    for (let j = 0; j < HIDDEN; j++)
      hidden[j] = hidden[j]! + pixel * parameters[i * HIDDEN + j]!;
  }
  let logit = parameters[OUTPUT_BIAS]!;
  for (let j = 0; j < HIDDEN; j++) {
    hidden[j] = Math.max(0, hidden[j]!);
    logit += hidden[j]! * parameters[OUTPUT_WEIGHT + j]!;
  }
  return 1 / (1 + Math.exp(-logit));
}

/** Backpropagate the mean binary cross-entropy over this mini-batch. */
export function batchGradient(parameters: Float32Array, x: Float32Array, y: Float32Array) {
  checkBatch(x, y);
  const gradient = new Float64Array(parameterCount);
  const hidden = new Float64Array(HIDDEN);
  const hiddenError = new Float64Array(HIDDEN);
  for (let n = 0; n < y.length; n++) {
    const offset = n * INPUTS;
    const probability = forward(parameters, x, offset, hidden);
    // Derivative of BCE through the output sigmoid, with respect to its logit.
    const outputError = (probability - y[n]!) / y.length;
    gradient[OUTPUT_BIAS] = gradient[OUTPUT_BIAS]! + outputError;
    for (let j = 0; j < HIDDEN; j++) {
      const index = OUTPUT_WEIGHT + j;
      gradient[index] = gradient[index]! + outputError * hidden[j]!;
      hiddenError[j] = hidden[j]! > 0 ? parameters[index]! * outputError : 0;
      gradient[HIDDEN_BIAS + j] = gradient[HIDDEN_BIAS + j]! + hiddenError[j]!;
    }
    for (let i = 0; i < INPUTS; i++) {
      const pixel = x[offset + i]!;
      if (pixel === 0) continue;
      for (let j = 0; j < HIDDEN; j++) {
        const index = i * HIDDEN + j;
        gradient[index] = gradient[index]! + pixel * hiddenError[j]!;
      }
    }
  }
  return gradient;
}

export function createManual(pretrained?: Float32Array) {
  let parameters = initialWeights(pretrained);
  return {
    predict(x: Float32Array) {
      const count = imageCount(x);
      const probabilities = new Float32Array(count);
      const hidden = new Float64Array(HIDDEN);
      for (let n = 0; n < count; n++) probabilities[n] = forward(parameters, x, n * INPUTS, hidden);
      return probabilities;
    },
    train(x: Float32Array, y: Float32Array, rate: number) {
      checkRate(rate);
      const gradients = batchGradient(parameters, x, y);
      const next = parameters.map((weight, i) => weight - rate * gradients[i]!);
      if (!next.every(Number.isFinite)) throw new RangeError("重みの更新が有限の範囲を超えました。");
      const before = parameters[OUTPUT_WEIGHT]!;
      parameters = next;
      return { before, gradient: gradients[OUTPUT_WEIGHT]!, after: next[OUTPUT_WEIGHT]! };
    },
    dispose() { /* Typed arrays are reclaimed by the JavaScript garbage collector. */ },
  } satisfies Engine;
}

export function summarize(probabilities: Float32Array, labels: Float32Array) {
  checkLabels(labels, probabilities.length);
  let loss = 0, correct = 0, positives = 0, truePositives = 0;
  for (let i = 0; i < labels.length; i++) {
    const p = probabilities[i]!;
    if (!(p >= 0 && p <= 1)) throw new RangeError("分類モデルが不正な確率を返しました。");
    const label = labels[i]!;
    // Clip for the log only, just as TF.js clips probabilities for binaryCrossentropy.
    const clipped = Math.min(1 - 1e-7, Math.max(1e-7, p));
    loss -= label === 1 ? Math.log(clipped) : Math.log1p(-clipped);
    const prediction = p >= 0.5 ? 1 : 0;
    if (prediction === label) correct++;
    if (label === 1) {
      positives++;
      if (prediction === 1) truePositives++;
    }
  }
  return {
    loss: loss / labels.length,
    accuracy: correct / labels.length,
    recall: positives ? truePositives / positives : null,
  };
}
