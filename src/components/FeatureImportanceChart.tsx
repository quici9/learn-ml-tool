import { useState } from 'react';
import styles from './FeatureImportanceChart.module.css';

interface FeatureData {
  name: string;
  importance: number;
  category: string;
}

interface FeatureImportanceChartProps {
  features?: FeatureData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  derived: '#a78bfa',
  aggregation: '#60a5fa',
  encoding: '#34d399',
  numerical: '#fbbf24',
};

const CATEGORY_LABELS: Record<string, string> = {
  derived: 'Derived Features',
  aggregation: 'IP Aggregation',
  encoding: 'Categorical Encoding',
  numerical: 'Numerical',
};

const DEFAULT_FEATURES: FeatureData[] = [
  { name: 'bytes_ratio', importance: 0.25, category: 'derived' },
  { name: 'connection_count', importance: 0.18, category: 'aggregation' },
  { name: 'port_diversity', importance: 0.15, category: 'derived' },
  { name: 'avg_duration', importance: 0.12, category: 'aggregation' },
  { name: 's0_ratio', importance: 0.10, category: 'encoding' },
  { name: 'unique_dest_ports', importance: 0.08, category: 'aggregation' },
  { name: 'total_orig_bytes', importance: 0.05, category: 'numerical' },
  { name: 'has_unknown_svc', importance: 0.04, category: 'encoding' },
  { name: 'max_duration', importance: 0.03, category: 'aggregation' },
];

export function FeatureImportanceChart({
  features = DEFAULT_FEATURES,
}: FeatureImportanceChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const maxImportance = Math.max(...features.map((f) => f.importance));
  const categories = [...new Set(features.map((f) => f.category))];

  const filteredFeatures = filterCategory
    ? features.filter((f) => f.category === filterCategory)
    : features;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Feature Importance</h3>
        <p className={styles.subtitle}>
          Độ quan trọng của từng feature trong Isolation Forest
        </p>
      </div>

      {/* Category filter pills */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterPill} ${!filterCategory ? styles.filterActive : ''}`}
          onClick={() => setFilterCategory(null)}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.filterPill} ${filterCategory === cat ? styles.filterActive : ''}`}
            style={{
              borderColor: filterCategory === cat ? CATEGORY_COLORS[cat] : undefined,
              color: filterCategory === cat ? CATEGORY_COLORS[cat] : undefined,
            }}
            onClick={() =>
              setFilterCategory(filterCategory === cat ? null : cat)
            }
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div className={styles.chart}>
        {filteredFeatures.map((feature, idx) => {
          const barWidth = (feature.importance / maxImportance) * 100;
          const isHovered = hoveredIndex === idx;
          const color = CATEGORY_COLORS[feature.category] ?? '#999';

          return (
            <div
              key={feature.name}
              className={`${styles.barRow} ${isHovered ? styles.barRowHovered : ''}`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span className={styles.barLabel}>{feature.name}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: color,
                    opacity: isHovered ? 1 : 0.8,
                  }}
                />
              </div>
              <span className={styles.barValue}>
                {(feature.importance * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Tooltip for hovered feature */}
      {hoveredIndex !== null && filteredFeatures[hoveredIndex] && (
        <div className={styles.tooltip}>
          <span
            className={styles.tooltipDot}
            style={{
              backgroundColor:
                CATEGORY_COLORS[filteredFeatures[hoveredIndex].category],
            }}
          />
          <strong>{filteredFeatures[hoveredIndex].name}</strong>
          <span className={styles.tooltipCategory}>
            {CATEGORY_LABELS[filteredFeatures[hoveredIndex].category]}
          </span>
          <span className={styles.tooltipValue}>
            Importance: {(filteredFeatures[hoveredIndex].importance * 100).toFixed(1)}%
          </span>
        </div>
      )}

      {/* Legend */}
      <div className={styles.legend}>
        {categories.map((cat) => (
          <div key={cat} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ backgroundColor: CATEGORY_COLORS[cat] }}
            />
            <span className={styles.legendLabel}>
              {CATEGORY_LABELS[cat] ?? cat}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
