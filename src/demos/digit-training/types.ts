export interface WeightTrace {
  before: number;
  gradient: number;
  after: number;
}

/** Each consecutive block of 784 pixels is one normalized 28 × 28 image. */
export interface Engine {
  predict(x: Float32Array): Float32Array | Promise<Float32Array>;
  train(x: Float32Array, y: Float32Array, rate: number): WeightTrace | void | Promise<WeightTrace | void>;
  dispose(): void;
}
