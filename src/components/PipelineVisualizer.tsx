import { useState, useCallback } from 'react';
import styles from './PipelineVisualizer.module.css';

interface PipelineStep {
  id: string;
  icon: string;
  label: string;
  description: string;
  detail: string;
  code?: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'collect',
    icon: '📡',
    label: 'Thu thập',
    description: 'Zeek conn.log',
    detail: 'Zeek sensor phân tích packet → sinh conn.log với 20+ fields cho mỗi connection.',
    code: 'zeek -r capture.pcap\n# → conn.log, dns.log, http.log ...',
  },
  {
    id: 'clean',
    icon: '🧹',
    label: 'Làm sạch',
    description: 'Missing / Duplicates',
    detail: 'Loại bỏ records thiếu dữ liệu, xóa duplicates, xử lý giá trị ngoài phạm vi.',
    code: 'df.dropna(subset=FEATURE_COLUMNS)\ndf.drop_duplicates()',
  },
  {
    id: 'feature',
    icon: '🔧',
    label: 'Feature Eng.',
    description: '4–8 features',
    detail: 'Chọn và tạo features: duration, orig_bytes, resp_bytes, dest_port, bytes_ratio, unique_dests.',
    code: 'FEATURES = ["duration", "orig_bytes",\n  "resp_bytes", "dest_port"]',
  },
  {
    id: 'scale',
    icon: '📏',
    label: 'StandardScaler',
    description: 'Chuẩn hóa',
    detail: 'Đưa tất cả features về cùng thang đo (mean=0, std=1) để model không bị thiên vị bởi scale.',
    code: 'scaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)',
  },
  {
    id: 'train',
    icon: '🌲',
    label: 'Isolation Forest',
    description: 'n_estimators=100',
    detail: 'Xây 100 cây quyết định ngẫu nhiên. Mỗi cây cố gắng "cô lập" từng data point.',
    code: 'model = IsolationForest(\n  n_estimators=100,\n  contamination=0.05)',
  },
  {
    id: 'score',
    icon: '📊',
    label: 'Score',
    description: 'score_samples()',
    detail: 'Tính anomaly score cho mỗi connection. Score thấp (âm) = bất thường.',
    code: 'scores = model.score_samples(X)\n# Range: -0.8 (anomaly) to 0.1 (normal)',
  },
  {
    id: 'threshold',
    icon: '🎯',
    label: 'Threshold',
    description: 'FPR ≤ 10%',
    detail: 'So sánh score với ngưỡng. Tối ưu threshold để đạt FPR ≤ 10% và Recall ≥ 80%.',
    code: 'prediction = "anomaly"\n  if score < threshold else "normal"',
  },
  {
    id: 'alert',
    icon: '🚨',
    label: 'Alert',
    description: 'SOC Dashboard',
    detail: 'Gửi kết quả anomaly lên dashboard SOC để analyst xác minh và phản hồi.',
    code: 'if is_anomaly:\n  send_alert(source_ip, score)',
  },
];

interface PipelineVisualizerProps {
  highlightStep?: string;
}

export function PipelineVisualizer({ highlightStep }: PipelineVisualizerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleStep = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id));
    },
    [],
  );

  const playAnimation = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);
    setExpandedId(null);

    let step = 0;
    const interval = setInterval(() => {
      if (step >= PIPELINE_STEPS.length) {
        clearInterval(interval);
        setAnimatingIdx(null);
        setIsPlaying(false);
        return;
      }
      setAnimatingIdx(step);
      step++;
    }, 600);
  }, [isPlaying]);

  return (
    <div className={styles.pipeline}>
      {/* Controls */}
      <div className={styles.controls}>
        <button
          className={styles.playBtn}
          onClick={playAnimation}
          disabled={isPlaying}
          type="button"
        >
          {isPlaying ? '⏳ Running…' : '▶ Play Pipeline'}
        </button>
        <span className={styles.hint}>Click vào bước bất kỳ để xem chi tiết</span>
      </div>

      {/* Steps */}
      <div className={styles.stepsWrapper}>
        {PIPELINE_STEPS.map((step, idx) => {
          const isActive = animatingIdx !== null && idx <= animatingIdx;
          const isHighlighted = highlightStep === step.id;
          const isExpanded = expandedId === step.id;

          return (
            <div key={step.id} className={styles.stepGroup}>
              {/* Arrow between steps */}
              {idx > 0 && (
                <div
                  className={`${styles.arrow} ${isActive ? styles.arrowActive : ''}`}
                />
              )}

              {/* Step card */}
              <button
                type="button"
                className={`
                  ${styles.step}
                  ${isActive ? styles.stepActive : ''}
                  ${isHighlighted ? styles.stepHighlighted : ''}
                  ${isExpanded ? styles.stepExpanded : ''}
                `}
                onClick={() => toggleStep(step.id)}
                aria-expanded={isExpanded}
              >
                <span className={styles.stepIcon}>{step.icon}</span>
                <span className={styles.stepLabel}>{step.label}</span>
                <span className={styles.stepDesc}>{step.description}</span>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className={styles.detail}>
                  <p className={styles.detailText}>{step.detail}</p>
                  {step.code && (
                    <pre className={styles.detailCode}>
                      <code>{step.code}</code>
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
