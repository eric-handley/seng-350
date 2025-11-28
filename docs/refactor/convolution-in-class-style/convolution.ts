// convolution.ts

import * as fs from "fs";
import * as path from "path";
import * as tf from "@tensorflow/tfjs-node";

// ---------------------
// CLI arguments & files
// ---------------------

if (process.argv.length < 3) {
  console.error("Usage: ts-node convolution.ts <input_text_file>");
  process.exit(1);
}

const stopwordsPath = path.join(__dirname, "stop_words.txt");
const inputFilePath = path.resolve(process.argv[2]);

const stopwords = new Set(
  fs.readFileSync(stopwordsPath, "utf8").split(",").map((w) => w.trim())
);

const inputText = fs.readFileSync(inputFilePath, "utf8").toLowerCase();

// Match [a-z]{2,}
const allWords = inputText.match(/[a-z]{2,}/g) || [];

// Filter stopwords
const words = allWords.filter((w) => !stopwords.has(w));

// ---------------------
// Build vocab & indices
// ---------------------

// uniqs = [''] + list(set(words))
const uniqSet = new Set<string>(words);
const uniqs: string[] = [""].concat(Array.from(uniqSet));

// word -> index
const uniqsIndices = new Map<string, number>();
// index -> word (not strictly needed, but mirrors Python)
const indicesUniqs = new Map<number, string>();

uniqs.forEach((w, i) => {
  uniqsIndices.set(w, i);
  indicesUniqs.set(i, w);
});

// indices = [uniqs_indices[w] for w in words]
const indices: number[] = words.map((w) => uniqsIndices.get(w)!);

// ---------------------
// Sizes
// ---------------------

const WORDS_SIZE = words.length;
const VOCAB_SIZE = uniqs.length;
const BIN_SIZE = Math.ceil(Math.log2(VOCAB_SIZE)); // log base 2

console.log(
  `Words size ${WORDS_SIZE}, vocab size ${VOCAB_SIZE}, bin size ${BIN_SIZE}`
);

// ---------------------
// encode_binary(W)
// ---------------------

function encodeBinary(W: number[]): tf.Tensor4D {
  // Shape: [1, WORDS_SIZE, BIN_SIZE, 1]
  const data = new Float32Array(1 * WORDS_SIZE * BIN_SIZE * 1);

  for (let i = 0; i < W.length; i++) {
    const w = W[i];
    for (let n = 0; n < BIN_SIZE; n++) {
      const n2 = 1 << n;
      const bit = (w & n2) === n2 ? 1 : 0;
      // index: [batch=0, i, n, channel=0]
      const idx = i * BIN_SIZE + n;
      data[idx] = bit;
    }
  }

  return tf.tensor4d(data, [1, WORDS_SIZE, BIN_SIZE, 1]);
}

// ---------------------
// conv_layer_set_weights
// ---------------------

function convLayerSetWeights(layer: tf.layers.Layer) {
  // Kernel shape: [filterHeight, filterWidth, inChannels, outChannels]
  // = [1, BIN_SIZE, 1, VOCAB_SIZE]
  const kernelSize = 1 * BIN_SIZE * 1 * VOCAB_SIZE;
  const kernelData = new Float32Array(kernelSize);
  const biasData = new Float32Array(VOCAB_SIZE); // zeros

  // First pass: set +1 / -1 based on bits
  for (let i = 0; i < VOCAB_SIZE; i++) {
    for (let n = 0; n < BIN_SIZE; n++) {
      const n2 = 1 << n;
      const val = (i & n2) === n2 ? 1 : -1;
      // index for [fh=0, fw=n, cIn=0, cOut=i]
      const idx = n * VOCAB_SIZE + i;
      kernelData[idx] = val;
    }
  }

  // Second pass: normalize +1 and -1 per filter i
  for (let i = 0; i < VOCAB_SIZE; i++) {
    const onesIndices: number[] = [];
    const minusIndices: number[] = [];

    for (let n = 0; n < BIN_SIZE; n++) {
      const idx = n * VOCAB_SIZE + i;
      const v = kernelData[idx];
      if (v === 1) {
        onesIndices.push(idx);
      } else if (v === -1) {
        minusIndices.push(idx);
      }
    }

    const nOnes = onesIndices.length;
    const nMinus = minusIndices.length;

    if (nOnes > 0) {
      const val = 1.0 / nOnes;
      for (const idx of onesIndices) {
        kernelData[idx] = val;
      }
    }

    if (nMinus > 0) {
      const val = -1.0 / nMinus;
      for (const idx of minusIndices) {
        kernelData[idx] = val;
      }
    }
  }

  const kernel = tf.tensor4d(kernelData, [1, BIN_SIZE, 1, VOCAB_SIZE]);
  const bias = tf.tensor1d(biasData);

  // Set weights on the Conv2D layer
  layer.setWeights([kernel, bias]);
}

// ---------------------
// build_model
// ---------------------

function buildModel(): tf.Sequential {
  const model = tf.sequential();

  model.add(
    tf.layers.conv2d({
      filters: VOCAB_SIZE,
      kernelSize: [1, BIN_SIZE],
      inputShape: [WORDS_SIZE, BIN_SIZE, 1],
      useBias: true,
      // no activation here; thresholded ReLU will be applied manually
    })
  );

  // No ReLU layer here; we'll do thresholded ReLU in code to match Python's ReLU(threshold=...)
  return model;
}

// ---------------------
// Main
// ---------------------

async function main() {
  const model = buildModel();
  model.summary();

  // Set weights on the first layer (Conv2D)
  convLayerSetWeights(model.layers[0]);

  const batchX = encodeBinary(indices);

  // Run the model: conv outputs [1, WORDS_SIZE, 1, VOCAB_SIZE]
  const convOutput = model.predict(batchX) as tf.Tensor4D;

  // Python: ReLU(threshold=1 - 1/BIN_SIZE)
  const threshold = 1 - 1 / BIN_SIZE;

  // Apply thresholded ReLU manually:
  // if x > threshold => keep x; else 0
  const thresholded = tf.tidy(() => {
    const thr = tf.scalar(threshold);
    const mask = convOutput.greater(thr); // bool tensor
    return convOutput.mul(mask.toFloat());
  });

  // Sum over axis=1 (word positions), like SumPooling2D in Python
  const summed = thresholded.sum(1); // shape: [1, 1, 1, VOCAB_SIZE]

  // Reshape to [VOCAB_SIZE]
  const prediction = summed.reshape([VOCAB_SIZE]);
  const predictionData = prediction.dataSync(); // Float32Array

  // Pair each vocab word with its score
  const pairs: Array<[string, number]> = uniqs.map((w, i) => [
    w,
    predictionData[i],
  ]);

  // Sort by score descending
  pairs.sort((a, b) => b[1] - a[1]);

  // Print top 25
  for (const [w, c] of pairs.slice(0, 25)) {
    console.log(`${w} - ${c}`);
  }

  // Clean up tensors
  batchX.dispose();
  convOutput.dispose();
  thresholded.dispose();
  summed.dispose();
  prediction.dispose();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
