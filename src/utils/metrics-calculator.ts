/**
 * Simulates how Precision, Recall, F1, and FPR change
 * as the anomaly-detection threshold moves from 0 to 1.
 *
 * Uses a synthetic score distribution for 1 000 samples:
 *   - 950 normal  → scores ∼ N(0.3, 0.15)
 *   - 50  anomaly → scores ∼ N(0.7, 0.12)
 *
 * For each threshold, predictions = score ≥ threshold → "anomaly".
 */

export interface ThresholdDataPoint {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
  fpr: number;
}

const NUM_NORMAL = 950;
const NUM_ANOMALY = 50;
const STEPS = 51; // 0.00, 0.02, …, 1.00

/** Seeded pseudo-random (deterministic). */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Box-Muller transform → standard normal. */
function gaussianSample(rand: () => number, mean: number, std: number): number {
  const u1 = rand();
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

function generateScores(): { normalScores: number[]; anomalyScores: number[] } {
  const rand = seededRandom(42);

  const normalScores = Array.from({ length: NUM_NORMAL }, () =>
    Math.max(0, Math.min(1, gaussianSample(rand, 0.3, 0.15))),
  );
  const anomalyScores = Array.from({ length: NUM_ANOMALY }, () =>
    Math.max(0, Math.min(1, gaussianSample(rand, 0.7, 0.12))),
  );

  return { normalScores, anomalyScores };
}

let cachedData: ThresholdDataPoint[] | null = null;

export function getThresholdData(): ThresholdDataPoint[] {
  if (cachedData) return cachedData;

  const { normalScores, anomalyScores } = generateScores();
  const data: ThresholdDataPoint[] = [];

  for (let i = 0; i < STEPS; i++) {
    const t = i / (STEPS - 1);

    // Predictions
    const fp = normalScores.filter((s) => s >= t).length;
    const tn = NUM_NORMAL - fp;
    const tp = anomalyScores.filter((s) => s >= t).length;
    const fn = NUM_ANOMALY - tp;

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;

    data.push({
      threshold: parseFloat(t.toFixed(2)),
      precision: parseFloat(precision.toFixed(4)),
      recall: parseFloat(recall.toFixed(4)),
      f1: parseFloat(f1.toFixed(4)),
      fpr: parseFloat(fpr.toFixed(4)),
    });
  }

  cachedData = data;
  return data;
}

/** Find the data point closest to a given threshold. */
export function getMetricsAtThreshold(t: number): ThresholdDataPoint {
  const data = getThresholdData();
  if (data.length === 0) {
    return { threshold: t, precision: 0, recall: 0, f1: 0, fpr: 0 };
  }
  const first = data[0] as ThresholdDataPoint;
  let closest = first;
  let minDist = Math.abs(first.threshold - t);

  for (const point of data) {
    const dist = Math.abs(point.threshold - t);
    if (dist < minDist) {
      minDist = dist;
      closest = point;
    }
  }

  return closest;
}
