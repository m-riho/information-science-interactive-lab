import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { batchGradient, createManual, summarize } from "../src/demos/digit-training/model";
import { createTensorFlow } from "../src/demos/digit-training/tfModel";

const pixels = 784;
const hidden = 32;
const hiddenBias = pixels * hidden;
const outputWeight = hiddenBias + hidden;
const outputBias = outputWeight + hidden;

function fixture() {
  const weights = new Float32Array(outputBias + 1);
  weights[0] = 0.5;
  weights[hidden] = -0.25;
  weights[hiddenBias] = 0.4;
  weights[outputWeight] = 0.75;
  weights[outputBias] = -0.1;
  weights[1] = -0.5;
  weights[hiddenBias + 1] = -0.4; // Second unit stays on the inactive side of ReLU.
  weights[outputWeight + 1] = 0.6;
  const x = new Float32Array(2 * pixels);
  x[0] = 1;
  x[pixels + 1] = 1;
  const y = Float32Array.of(1, 0);
  return { weights, x, y };
}

describe("28 × 28 digit classifier", () => {
  it("uses 32 ReLUs and a sigmoid and averages BCE over real predictions", () => {
    const { weights, x, y } = fixture();
    const p = createManual(weights).predict(x);
    expect(p[0]).toBeCloseTo(1 / (1 + Math.exp(-0.575)), 6);
    expect(p[1]).toBeCloseTo(1 / (1 + Math.exp(-0.0125)), 6);
    const metrics = summarize(p, y);
    expect(metrics.loss).toBeCloseTo((-Math.log(p[0]!) - Math.log1p(-p[1]!)) / 2);
    expect(metrics.accuracy).toBe(0.5);
    expect(metrics.recall).toBe(1);
    expect(summarize(Float32Array.of(0.1), Float32Array.of(0)).recall).toBeNull();
  });

  it("matches central differences for both layers, both biases, and inactive ReLUs", () => {
    const { weights, x, y } = fixture();
    const gradients = batchGradient(weights, x, y);
    for (const i of [0, hidden, hiddenBias, outputWeight, outputBias, 1, hiddenBias + 1, outputWeight + 1]) {
      const plus = weights.slice();
      const minus = weights.slice();
      plus[i] = weights[i]! + 0.002;
      minus[i] = weights[i]! - 0.002;
      const difference = (summarize(createManual(plus).predict(x), y).loss
        - summarize(createManual(minus).predict(x), y).loss) / (plus[i]! - minus[i]!);
      expect(gradients[i]).toBeCloseTo(difference, 4);
    }
  });

  it("updates the inspected weight by SGD, lowers training loss, and preserves the source weights", () => {
    const { weights, x, y } = fixture();
    const model = createManual(weights);
    const before = summarize(model.predict(x), y).loss;
    const trace = model.train(x, y, 0.1);
    expect(trace.before).toBe(weights[outputWeight]);
    expect(trace.after).toBeCloseTo(trace.before - 0.1 * trace.gradient, 6);
    expect(trace.after).not.toBe(trace.before);
    for (let i = 0; i < 10; i++) model.train(x, y, 0.1);
    expect(summarize(model.predict(x), y).loss).toBeLessThan(before);
    expect(weights[outputWeight]).toBe(0.75);
  });

  it("detects invalid input, parameters and calculated metrics", () => {
    const { x, y } = fixture();
    const model = createManual();
    expect(() => model.train(x, y, NaN)).toThrow();
    expect(() => model.train(x, y.slice(1), 0.1)).toThrow();
    expect(() => createManual(new Float32Array(8))).toThrow();
    expect(() => model.predict(new Float32Array(100))).toThrow();
    x[1] = NaN;
    expect(() => model.train(x, y, 0.1)).toThrow();
    expect(() => summarize(Float32Array.of(NaN), Float32Array.of(1))).toThrow();
  });

  it("reproduces the supplied model's held-out MNIST evaluation in both engines", async () => {
    const weightsFile = readFileSync("public/data/session07-digits/pretrained.f32");
    const weights = Float32Array.from({ length: weightsFile.length / 4 }, (_, i) => weightsFile.readFloatLE(i * 4));
    const testFile = readFileSync("public/data/session07-digits/test.bin");
    const labels = Float32Array.from(testFile.subarray(0, 500), digit => Number(digit === 1));
    const x = Float32Array.from(testFile.subarray(500), value => value / 255);
    for (const model of [createManual(weights), await createTensorFlow(weights)]) {
      try {
        const metrics = summarize(await model.predict(x), labels);
        expect(metrics.accuracy).toBe(494 / 500);
        expect(metrics.recall).toBe(246 / 250);
      } finally {
        model.dispose();
      }
    }
  });

  it("finishes an in-flight TF batch and releases tensors when leaving the lesson", async () => {
    const tf = await import("@tensorflow/tfjs");
    const { weights, x, y } = fixture();
    const previous = tf.memory().numTensors;
    const model = await createTensorFlow(weights);
    const pending = model.train(x, y, 0.1);
    model.dispose();
    await pending;
    model.dispose();
    expect(tf.memory().numTensors).toBe(previous);
    await expect(model.predict(x)).rejects.toThrow();
  });

  it("matches TensorFlow.js after same-seed initialization and mini-batch SGD with changing rates", async () => {
    const tf = await import("@tensorflow/tfjs");
    await tf.setBackend("cpu");
    const { weights, x, y } = fixture();
    const baseline = tf.memory().numTensors;
    for (const init of [undefined, weights]) {
      const manual = createManual(init);
      const library = await createTensorFlow(init);
      try {
        for (const rate of [0.1, 0.05, 0.01]) {
          const p = await library.predict(x);
          const expected = manual.predict(x);
          for (let i = 0; i < y.length; i++) expect(p[i]).toBeCloseTo(expected[i]!, 5);
          manual.train(x, y, rate);
          await library.train(x, y, rate);
        }
        const p = await library.predict(x);
        expect(p[0]).toBeCloseTo(manual.predict(x)[0]!, 5);
      } finally {
        library.dispose();
        manual.dispose();
      }
    }
    expect(tf.memory().numTensors).toBe(baseline);
  });
});
