import { useState, useCallback, useMemo } from 'react';
import styles from './ConfusionMatrixExplorer.module.css';

interface ConfusionMatrixProps {
  defaultTn?: number;
  defaultFp?: number;
  defaultFn?: number;
  defaultTp?: number;
}

interface CellInfo {
  label: string;
  shortLabel: string;
  description: string;
  example: string;
  color: 'correct' | 'error';
}

type CellKey = 'tn' | 'fp' | 'fn' | 'tp';

const CELL_INFO: Record<CellKey, CellInfo> = {
  tn: {
    label: 'True Negative',
    shortLabel: 'TN',
    description: 'Model dự đoán Normal và thực tế là Normal.',
    example: 'Kết nối HTTP bình thường → model bỏ qua (đúng).',
    color: 'correct',
  },
  fp: {
    label: 'False Positive',
    shortLabel: 'FP',
    description: 'Model dự đoán Anomaly nhưng thực tế là Normal (cảnh báo sai).',
    example: 'Backup đêm tạo traffic lớn → model báo tấn công (sai).',
    color: 'error',
  },
  fn: {
    label: 'False Negative',
    shortLabel: 'FN',
    description: 'Model dự đoán Normal nhưng thực tế là Anomaly (BỎ SÓT!).',
    example: 'Port scan chậm → model bỏ qua (nguy hiểm!).',
    color: 'error',
  },
  tp: {
    label: 'True Positive',
    shortLabel: 'TP',
    description: 'Model dự đoán Anomaly và thực tế là Anomaly.',
    example: 'DDoS traffic → model phát hiện đúng.',
    color: 'correct',
  },
};

const DEFAULT_VALUES = { tn: 930, fp: 20, fn: 10, tp: 40 };

export function ConfusionMatrixExplorer({
  defaultTn = DEFAULT_VALUES.tn,
  defaultFp = DEFAULT_VALUES.fp,
  defaultFn = DEFAULT_VALUES.fn,
  defaultTp = DEFAULT_VALUES.tp,
}: ConfusionMatrixProps) {
  const [values, setValues] = useState({
    tn: defaultTn,
    fp: defaultFp,
    fn: defaultFn,
    tp: defaultTp,
  });
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleChange = useCallback(
    (key: keyof typeof values, raw: string) => {
      const num = parseInt(raw, 10);
      if (!Number.isNaN(num) && num >= 0) {
        setValues((prev) => ({ ...prev, [key]: num }));
      }
    },
    [],
  );

  const metrics = useMemo(() => computeMetrics(values), [values]);

  const handleReset = useCallback(() => {
    setValues({
      tn: defaultTn,
      fp: defaultFp,
      fn: defaultFn,
      tp: defaultTp,
    });
  }, [defaultTn, defaultFp, defaultFn, defaultTp]);

  return (
    <div className={styles.explorer}>
      {/* ─── Matrix Grid ─── */}
      <div className={styles.matrixWrapper}>
        {/* Axis labels */}
        <div className={styles.axisTop}>
          <span className={styles.axisLabel}>Predicted</span>
        </div>
        <div className={styles.axisLeft}>
          <span className={styles.axisLabel}>Actual</span>
        </div>

        {/* Column headers */}
        <div className={styles.colHeaders}>
          <span className={styles.colHeader}>Normal</span>
          <span className={styles.colHeader}>Anomaly</span>
        </div>

        {/* Grid */}
        <div className={styles.grid}>
          {/* Row 1: Actual Normal */}
          <div className={styles.rowLabel}>Normal</div>
          <MatrixCell
            cellKey="tn"
            value={values.tn}
            info={CELL_INFO.tn}
            isActive={activeTooltip === 'tn'}
            onChange={(v) => handleChange('tn', v)}
            onToggleTooltip={() =>
              setActiveTooltip((prev) => (prev === 'tn' ? null : 'tn'))
            }
          />
          <MatrixCell
            cellKey="fp"
            value={values.fp}
            info={CELL_INFO.fp}
            isActive={activeTooltip === 'fp'}
            onChange={(v) => handleChange('fp', v)}
            onToggleTooltip={() =>
              setActiveTooltip((prev) => (prev === 'fp' ? null : 'fp'))
            }
          />

          {/* Row 2: Actual Anomaly */}
          <div className={styles.rowLabel}>Anomaly</div>
          <MatrixCell
            cellKey="fn"
            value={values.fn}
            info={CELL_INFO.fn}
            isActive={activeTooltip === 'fn'}
            onChange={(v) => handleChange('fn', v)}
            onToggleTooltip={() =>
              setActiveTooltip((prev) => (prev === 'fn' ? null : 'fn'))
            }
          />
          <MatrixCell
            cellKey="tp"
            value={values.tp}
            info={CELL_INFO.tp}
            isActive={activeTooltip === 'tp'}
            onChange={(v) => handleChange('tp', v)}
            onToggleTooltip={() =>
              setActiveTooltip((prev) => (prev === 'tp' ? null : 'tp'))
            }
          />
        </div>

        <button
          type="button"
          className={styles.resetBtn}
          onClick={handleReset}
        >
          ↺ Reset
        </button>
      </div>

      {/* ─── Metrics Panel ─── */}
      <div className={styles.metricsPanel}>
        <span className={styles.metricsPanelTitle}>📊 Computed Metrics</span>
        <div className={styles.metricsGrid}>
          {metrics.map((m) => (
            <div key={m.name} className={styles.metricCard}>
              <span className={styles.metricName}>{m.name}</span>
              <span
                className={`${styles.metricValue} ${getMetricClass(m)}`}
              >
                {m.display}
              </span>
              <span className={styles.metricFormula}>{m.formula}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Matrix Cell ─── */

interface MatrixCellProps {
  cellKey: string;
  value: number;
  info: CellInfo;
  isActive: boolean;
  onChange: (value: string) => void;
  onToggleTooltip: () => void;
}

function MatrixCell({
  cellKey,
  value,
  info,
  isActive,
  onChange,
  onToggleTooltip,
}: MatrixCellProps) {
  const colorClass =
    info.color === 'correct' ? styles.cellCorrect : styles.cellError;

  return (
    <div className={`${styles.cell} ${colorClass}`}>
      <button
        type="button"
        className={styles.cellInfoBtn}
        onClick={onToggleTooltip}
        aria-label={`Info about ${info.label}`}
      >
        ℹ
      </button>
      <span className={styles.cellLabel}>{info.shortLabel}</span>
      <input
        id={`matrix-${cellKey}`}
        type="number"
        className={styles.cellInput}
        value={value}
        min={0}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* Tooltip */}
      {isActive && (
        <div className={styles.tooltip}>
          <strong>{info.label}</strong>
          <p>{info.description}</p>
          <p className={styles.tooltipExample}>
            <em>VD:</em> {info.example}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Metric computation ─── */

interface MetricResult {
  name: string;
  value: number;
  display: string;
  formula: string;
  status: 'good' | 'warn' | 'bad' | 'neutral';
}

function computeMetrics(v: {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}): MetricResult[] {
  const total = v.tn + v.fp + v.fn + v.tp;
  const accuracy = total > 0 ? (v.tn + v.tp) / total : 0;
  const precision = v.tp + v.fp > 0 ? v.tp / (v.tp + v.fp) : 0;
  const recall = v.tp + v.fn > 0 ? v.tp / (v.tp + v.fn) : 0;
  const fpr = v.fp + v.tn > 0 ? v.fp / (v.fp + v.tn) : 0;
  const f1 =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

  return [
    {
      name: 'Accuracy',
      value: accuracy,
      display: `${(accuracy * 100).toFixed(1)}%`,
      formula: '(TP+TN) / Total',
      status: accuracy >= 0.9 ? 'good' : accuracy >= 0.7 ? 'warn' : 'bad',
    },
    {
      name: 'Precision',
      value: precision,
      display: `${(precision * 100).toFixed(1)}%`,
      formula: 'TP / (TP+FP)',
      status:
        precision >= 0.8 ? 'good' : precision >= 0.5 ? 'warn' : 'bad',
    },
    {
      name: 'Recall',
      value: recall,
      display: `${(recall * 100).toFixed(1)}%`,
      formula: 'TP / (TP+FN)',
      status: recall >= 0.8 ? 'good' : recall >= 0.5 ? 'warn' : 'bad',
    },
    {
      name: 'FPR',
      value: fpr,
      display: `${(fpr * 100).toFixed(1)}%`,
      formula: 'FP / (FP+TN)',
      status: fpr <= 0.1 ? 'good' : fpr <= 0.2 ? 'warn' : 'bad',
    },
    {
      name: 'F1‑Score',
      value: f1,
      display: `${(f1 * 100).toFixed(1)}%`,
      formula: '2·P·R / (P+R)',
      status: f1 >= 0.7 ? 'good' : f1 >= 0.4 ? 'warn' : 'bad',
    },
  ];
}

function getMetricClass(m: MetricResult): string {
  switch (m.status) {
    case 'good':
      return styles.metricGood ?? '';
    case 'warn':
      return styles.metricWarn ?? '';
    case 'bad':
      return styles.metricBad ?? '';
    default:
      return '';
  }
}
