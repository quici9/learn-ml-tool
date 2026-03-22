// Pre-computed output variants for Code Playground parameter changes.
// Since we can't run Python in the browser, each parameter combination
// maps to a realistic pre-calculated output string.

interface OutputVariantMap {
  [sectionId: string]: {
    [paramKey: string]: string;
  };
}

/**
 * Key format: "paramName=value" (e.g. "contamination=0.05")
 * For multiple params: "param1=val1|param2=val2"
 */
export const OUTPUT_VARIANTS: OutputVariantMap = {
  'end-to-end-example': {
    'contamination=0.01': 'FPR: 0.5% | Recall: 52.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%\n\n⚠️ contamination quá thấp → model quá bảo thủ, bỏ sót nhiều anomaly.',
    'contamination=0.02': 'FPR: 0.8% | Recall: 62.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%\n\n⚠️ Recall chưa đạt ngưỡng 80%.',
    'contamination=0.03': 'FPR: 1.2% | Recall: 70.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%',
    'contamination=0.04': 'FPR: 1.6% | Recall: 76.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%',
    'contamination=0.05': 'FPR: 2.1% | Recall: 80.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%\n\n✅ Sweet spot! FPR thấp và Recall đạt ngưỡng.',
    'contamination=0.06': 'FPR: 3.0% | Recall: 82.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%',
    'contamination=0.07': 'FPR: 3.8% | Recall: 84.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%',
    'contamination=0.08': 'FPR: 4.5% | Recall: 86.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%',
    'contamination=0.09': 'FPR: 5.3% | Recall: 86.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%',
    'contamination=0.10': 'FPR: 6.5% | Recall: 88.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%',
    'contamination=0.11': 'FPR: 7.2% | Recall: 88.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%',
    'contamination=0.12': 'FPR: 8.1% | Recall: 90.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%',
    'contamination=0.13': 'FPR: 9.0% | Recall: 90.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%',
    'contamination=0.14': 'FPR: 9.8% | Recall: 92.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%',
    'contamination=0.15': 'FPR: 11.5% | Recall: 92.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%\n\n⚠️ FPR vượt ngưỡng 10%! Quá nhiều false alarm cho SOC team.',
    'contamination=0.16': 'FPR: 12.8% | Recall: 94.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%\n\n⚠️ FPR vượt ngưỡng 10%!',
    'contamination=0.17': 'FPR: 14.2% | Recall: 94.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%\n\n❌ FPR quá cao!',
    'contamination=0.18': 'FPR: 15.5% | Recall: 96.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%\n\n❌ FPR quá cao!',
    'contamination=0.19': 'FPR: 17.0% | Recall: 96.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%\n\n❌ FPR quá cao!',
    'contamination=0.20': 'FPR: 18.5% | Recall: 98.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%\n\n❌ Recall cao nhưng FPR quá cao → alert fatigue!',
  },
};

/**
 * Look up the output for a given section and parameter state.
 * Falls back to the closest match or default output.
 */
export function getOutputForParams(
  sectionId: string,
  params: Record<string, number | string>,
): string | null {
  const variants = OUTPUT_VARIANTS[sectionId];
  if (!variants) return null;

  const key = Object.entries(params)
    .map(([name, value]) => `${name}=${value}`)
    .sort()
    .join('|');

  if (variants[key]) return variants[key];

  // Try closest numeric match for single param
  const entries = Object.entries(params);
  if (entries.length === 1) {
    const entry = entries[0];
    if (!entry) return null;
    const [paramName, paramValue] = entry;
    const numValue = Number(paramValue);

    let closestKey = '';
    let closestDiff = Infinity;

    for (const variantKey of Object.keys(variants)) {
      const match = variantKey.match(new RegExp(`${paramName}=(\\d+\\.?\\d*)`));
      if (match) {
        const diff = Math.abs(Number(match[1]) - numValue);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestKey = variantKey;
        }
      }
    }

    if (closestKey) return variants[closestKey] ?? null;
  }

  return null;
}
