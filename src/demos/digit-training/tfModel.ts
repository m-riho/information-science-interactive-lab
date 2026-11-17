import { checkBatch, checkRate, HIDDEN, HIDDEN_BIAS, imageCount, initialWeights, INPUTS, OUTPUT_BIAS, OUTPUT_WEIGHT } from "./model";
import type { Engine } from "./types";

export async function createTensorFlow(pretrained?: Float32Array): Promise<Engine> {
  const parameters = initialWeights(pretrained);
  const tf = await import("@tensorflow/tfjs");
  await tf.ready();
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [INPUTS], units: HIDDEN, activation: "relu", kernelInitializer: "zeros" }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid", kernelInitializer: "zeros" }));
  const optimizer = tf.train.sgd(0.01);
  let learningRate = 0.01;
  try {
    tf.tidy(() => model.setWeights([
      tf.tensor2d(parameters.subarray(0, HIDDEN_BIAS), [INPUTS, HIDDEN]),
      tf.tensor1d(parameters.subarray(HIDDEN_BIAS, OUTPUT_WEIGHT)),
      tf.tensor2d(parameters.subarray(OUTPUT_WEIGHT, OUTPUT_BIAS), [HIDDEN, 1]),
      tf.tensor1d(parameters.subarray(OUTPUT_BIAS)),
    ]));
    model.compile({ optimizer, loss: "binaryCrossentropy" });
  } catch (error) {
    optimizer.dispose();
    model.dispose();
    throw error;
  }

  // Navigation may release a lesson while its batch is still on the backend.
  let active = 0;
  let closed = false;
  function releaseWhenIdle() {
    if (closed && active === 0) {
      model.dispose();
      optimizer.dispose();
    }
  }
  function begin() {
    if (closed) throw new Error("モデルは破棄されています。");
    active++;
  }
  return {
    async predict(x) {
      const count = imageCount(x);
      begin();
      try {
        const output = tf.tidy(() => model.predict(tf.tensor2d(x, [count, INPUTS])) as import("@tensorflow/tfjs").Tensor);
        try {
          const probabilities = new Float32Array(await output.data());
          if (!probabilities.every(Number.isFinite)) throw new RangeError("予測値が有限の範囲を超えました。");
          return probabilities;
        } finally {
          output.dispose();
        }
      } finally {
        active--;
        releaseWhenIdle();
      }
    },
    async train(x, y, rate) {
      checkBatch(x, y);
      checkRate(rate);
      begin();
      try {
        if (learningRate !== rate) {
          optimizer.setLearningRate(rate);
          learningRate = rate;
        }
        const inputs = tf.tensor2d(x, [y.length, INPUTS]);
        const targets = tf.tensor2d(y, [y.length, 1]);
        try {
          const loss = await model.trainOnBatch(inputs, targets);
          if (!Number.isFinite(loss)) throw new RangeError("学習損失が有限の範囲を超えました。");
        } finally {
          tf.dispose([inputs, targets]);
        }
      } finally {
        active--;
        releaseWhenIdle();
      }
    },
    dispose() {
      if (closed) return;
      closed = true;
      releaseWhenIdle();
    },
  };
}
