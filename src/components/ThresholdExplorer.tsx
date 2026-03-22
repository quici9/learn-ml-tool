import { useState, useMemo, useCallback } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getThresholdData, getMetricsAtThreshold } from '../utils/metrics-calculator';
import type { ThresholdDataPoint } from '../utils/metrics-calculator';
import styles from './ThresholdExplorer.module.css';

const COLORS = {
  precision: '#36d399',
  recall: '#67e8f9',
  f1: '#c084fc',
  fpr: '#f87171',
  threshold: '#fbbf24',
  targetZone: 'rgba(54, 211, 153, 0.08)',
} as const;

const METRIC_LABELS: Record<string, string> = {
  precision: 'Precision',
  recall: 'Recall',
  f1: 'F1-Score',
  fpr: 'FPR',
};

const METRIC_DESCRIPTIONS: Record<string, string> = {
  precision: 'Trong số dự đoán Anomaly, bao nhiêu % đúng thật',
  recall: 'Trong số Anomaly thật, bao nhiêu % được phát hiện',
  f1: 'Trung bình điều hòa của Precision & Recall',
  fpr: 'Trong số Normal thật, bao nhiêu % bị báo sai',
};

interface ThresholdExplorerProps {
  defaultThreshold?: number;
}

export function ThresholdExplorer({
  defaultThreshold = 0.5,
}: ThresholdExplorerProps) {
  const [threshold, setThreshold] = useState(defaultThreshold);

  const data = useMemo(() => getThresholdData(), []);
  const currentMetrics = useMemo(() => getMetricsAtThreshold(threshold), [threshold]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setThreshold(parseFloat(e.target.value));
  }, []);

  return (
    <div className={styles.explorer}>
      {/* ─── Slider ─── */}
      <div className={styles.sliderSection}>
        <div className={styles.sliderHeader}>
          <label htmlFor="threshold-slider" className={styles.sliderLabel}>
            Detection Threshold
          </label>
          <span className={styles.thresholdValue}>{threshold.toFixed(2)}</span>
        </div>
        <input
          id="threshold-slider"
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={threshold}
          onChange={handleSliderChange}
          className={styles.slider}
        />
        <div className={styles.sliderScale}>
          <span>0.0 (All Anomaly)</span>
          <span>0.5</span>
          <span>1.0 (All Normal)</span>
        </div>
      </div>

      {/* ─── Current Metrics Cards ─── */}
      <div className={styles.metricsCards}>
        {(['precision', 'recall', 'f1', 'fpr'] as const).map((key) => (
          <MetricCard
            key={key}
            metricKey={key}
            value={currentMetrics[key]}
            threshold={threshold}
          />
        ))}
      </div>

      {/* ─── Chart ─── */}
      <div className={styles.chartWrapper}>
        <span className={styles.chartTitle}>Metrics vs Threshold</span>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
              />
              <XAxis
                dataKey="threshold"
                type="number"
                domain={[0, 1]}
                stroke="rgba(255,255,255,0.3)"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                tickCount={11}
              />
              <YAxis
                domain={[0, 1]}
                stroke="rgba(255,255,255,0.3)"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}
              />

              {/* PT186S target zone: FPR ≤ 10%, Recall ≥ 80% */}
              <ReferenceArea
                y1={0.8}
                y2={1}
                fill={COLORS.targetZone}
                fillOpacity={1}
                label={{
                  value: 'PT186S Target Zone',
                  position: 'insideTopRight',
                  fill: 'rgba(54,211,153,0.5)',
                  fontSize: 10,
                }}
              />

              {/* Current threshold line */}
              <ReferenceLine
                x={threshold}
                stroke={COLORS.threshold}
                strokeDasharray="5 3"
                strokeWidth={2}
                label={{
                  value: `t=${threshold.toFixed(2)}`,
                  position: 'top',
                  fill: COLORS.threshold,
                  fontSize: 11,
                }}
              />

              <Line
                type="monotone"
                dataKey="precision"
                name="Precision"
                stroke={COLORS.precision}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="recall"
                name="Recall"
                stroke={COLORS.recall}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="f1"
                name="F1-Score"
                stroke={COLORS.f1}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="fpr"
                name="FPR"
                stroke={COLORS.fpr}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Insight Box ─── */}
      <InsightBox threshold={threshold} metrics={currentMetrics} />
    </div>
  );
}

/* ─── Metric Card ─── */

interface MetricCardProps {
  metricKey: keyof typeof METRIC_LABELS;
  value: number;
  threshold: number;
}

function MetricCard({ metricKey, value, threshold }: MetricCardProps) {
  const isGood =
    metricKey === 'fpr'
      ? value <= 0.1
      : value >= 0.8;

  return (
    <div className={`${styles.metricCard} ${isGood ? styles.metricGood : styles.metricWarn}`}>
      <span
        className={styles.metricDot}
        style={{ background: COLORS[metricKey as keyof typeof COLORS] ?? '#fff' }}
      />
      <div className={styles.metricInfo}>
        <span className={styles.metricName}>{METRIC_LABELS[metricKey]}</span>
        <span className={styles.metricDesc}>{METRIC_DESCRIPTIONS[metricKey]}</span>
      </div>
      <span className={styles.metricValue}>
        {(value * 100).toFixed(1)}%
      </span>
      {/* Hidden for screen readers */}
      <span className={styles.srOnly}>
        at threshold {threshold.toFixed(2)}
      </span>
    </div>
  );
}

/* ─── Custom Tooltip ─── */

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>Threshold: {label?.toFixed(2)}</span>
      {payload.map((entry) => (
        <div key={entry.name} className={styles.tooltipRow}>
          <span
            className={styles.tooltipDot}
            style={{ background: entry.color }}
          />
          <span>{entry.name}:</span>
          <strong>{(entry.value * 100).toFixed(1)}%</strong>
        </div>
      ))}
    </div>
  );
}

/* ─── Insight Box ─── */

interface InsightBoxProps {
  threshold: number;
  metrics: ThresholdDataPoint;
}

function InsightBox({ threshold, metrics }: InsightBoxProps) {
  const meetsTarget = metrics.fpr <= 0.1 && metrics.recall >= 0.8;
  const icon = meetsTarget ? <CheckCircle size={20} /> : <AlertTriangle size={20} />;
  const statusClass = meetsTarget ? styles.insightGood : styles.insightWarn;

  let message: string;
  if (threshold < 0.2) {
    message = 'Threshold quá thấp → gần như mọi kết nối đều bị đánh dấu Anomaly. FPR rất cao, SOC bị alert fatigue.';
  } else if (threshold > 0.8) {
    message = 'Threshold quá cao → Recall rất thấp. Model bỏ sót hầu hết tấn công thật.';
  } else if (meetsTarget) {
    message = `Đạt target PT186S! FPR ≤ 10% (${(metrics.fpr * 100).toFixed(1)}%) và Recall ≥ 80% (${(metrics.recall * 100).toFixed(1)}%).`;
  } else {
    message = `Chưa đạt — cần FPR ≤ 10% (hiện ${(metrics.fpr * 100).toFixed(1)}%) VÀ Recall ≥ 80% (hiện ${(metrics.recall * 100).toFixed(1)}%).`;
  }

  return (
    <div className={`${styles.insightBox} ${statusClass}`}>
      <span className={styles.insightIcon}>{icon}</span>
      <p className={styles.insightMessage}>{message}</p>
    </div>
  );
}
