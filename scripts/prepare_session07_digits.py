"""Build the classroom MNIST subsets and a one-vs-rest classifier with NumPy."""

import argparse
import hashlib
from pathlib import Path
import tempfile
from urllib.request import urlretrieve

import numpy as np


SOURCE = "https://storage.googleapis.com/tensorflow/tf-keras-datasets/mnist.npz"
SHA256 = "731c5ac602752760c8e48fbffcf8c3b850d9dc2a2aedcf2cc48468fc17b673d1"
DESTINATION = Path(__file__).resolve().parents[1] / "public/data/session07-digits"
NEGATIVES = (0, 2, 3, 4, 5, 6, 7, 8, 9)


def subset(images, labels, count, seed):
    """Draw without replacement. Every pair has one positive and one negative."""
    rng = np.random.default_rng(seed)
    groups = [rng.permutation(np.flatnonzero(labels == digit)) for digit in range(10)]
    indices = []
    for pair in range(count // 2):
        negative = NEGATIVES[pair % len(NEGATIVES)]
        indices.extend((groups[1][pair], groups[negative][pair // len(NEGATIVES)]))
    return images[indices].reshape(count, 784), labels[indices]


def pretrain(pixels, labels):
    """ReLU hidden units, sigmoid output, mean binary cross-entropy and SGD."""
    x = pixels.astype(np.float64) / 255
    y = (labels == 1).astype(np.float64)
    rng = np.random.default_rng(7073)
    w1 = rng.normal(0, np.sqrt(2 / 784), (784, 32))
    b1 = np.zeros(32)
    w2 = rng.normal(0, np.sqrt(1 / 32), 32)
    b2 = 0.0
    for _ in range(3):
        shuffled = rng.permutation(len(y))
        for start in range(0, len(y), 32):
            rows = shuffled[start:start + 32]
            batch = x[rows]
            hidden = np.maximum(0, batch @ w1 + b1)
            scores = hidden @ w2 + b2
            probability = 1 / (1 + np.exp(-scores))
            output_gradient = (probability - y[rows]) / len(rows)
            hidden_gradient = np.outer(output_gradient, w2) * (hidden > 0)
            w1 -= 0.1 * (batch.T @ hidden_gradient)
            b1 -= 0.1 * hidden_gradient.sum(axis=0)
            w2 -= 0.1 * (hidden.T @ output_gradient)
            b2 -= 0.1 * output_gradient.sum()
    return np.concatenate((w1.ravel(), b1, w2, [b2])).astype("<f4")


def build(archive, destination):
    if hashlib.sha256(archive.read_bytes()).hexdigest() != SHA256:
        raise ValueError("The source archive does not match the Keras MNIST SHA-256.")
    with np.load(archive, allow_pickle=False) as mnist:
        train = subset(mnist["x_train"], mnist["y_train"], 2000, 7071)
        test = subset(mnist["x_test"], mnist["y_test"], 500, 7072)
    weights = pretrain(*train)
    destination.mkdir(parents=True, exist_ok=True)
    for name, (pixels, labels) in (("train", train), ("test", test)):
        (destination / f"{name}.bin").write_bytes(labels.tobytes() + pixels.tobytes())
    (destination / "pretrained.f32").write_bytes(weights.tobytes())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, help="local Keras mnist.npz archive")
    parser.add_argument("--output", type=Path, default=DESTINATION)
    args = parser.parse_args()
    if args.source:
        build(args.source, args.output)
    else:
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "mnist.npz"
            urlretrieve(SOURCE, source)
            build(source, args.output)
