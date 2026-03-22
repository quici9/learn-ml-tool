import { useState } from 'react';
import styles from './ModelBenchmarkComparison.module.css';

const MODELS = [
  { id: 'if', name: 'Isolation Forest', f1: 0.85, speed: 'Fast', interpret: 'High', desc: 'Good baseline, works well in high dimensions.' },
  { id: 'lof', name: 'Local Outlier Factor', f1: 0.78, speed: 'Slow', interpret: 'Medium', desc: 'Finds local anomalies based on neighborhood density.' },
  { id: 'ocsvm', name: 'One-Class SVM', f1: 0.82, speed: 'Slow', interpret: 'Medium', desc: 'Finds a boundary summarizing normal data.' },
  { id: 'ae', name: 'Autoencoder', f1: 0.91, speed: 'Medium', interpret: 'Low', desc: 'Learns identity function; high reconstruction error = anomaly.' },
  { id: 'dbscan', name: 'DBSCAN', f1: 0.72, speed: 'Medium', interpret: 'Medium', desc: 'Clusters normal data, sparse regions are anomalies.' },
];

export function ModelBenchmarkComparison() {
  const defaultModel = MODELS[0]?.id ?? 'if';
  const [selectedModel, setSelectedModel] = useState(defaultModel);

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {MODELS.map(m => (
          <button 
            key={m.id} 
            className={`${styles.tab} ${selectedModel === m.id ? styles.active : ''}`} 
            onClick={() => setSelectedModel(m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>
      <div className={styles.content}>
        {MODELS.filter(m => m.id === selectedModel).map(m => (
          <div key={m.id} className={styles.details}>
            <div className={styles.metric}><strong>{m.name}</strong>: {m.desc}</div>
            <div className={styles.metric}><strong>Interpretability:</strong> {m.interpret}</div>
            <div className={styles.metric}><strong>Speed:</strong> {m.speed}</div>
          </div>
        ))}

        <div className={styles.barChart}>
            <h4 style={{ margin: '0 0 0.5rem 150px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>F1-Score Comparison</h4>
            {MODELS.map(m => (
              <div key={m.id} className={`${styles.barRow} ${selectedModel === m.id ? styles.highlight : ''}`}>
                 <span className={styles.barLabel}>{m.name}</span>
                 <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${m.f1 * 100}%` }}></div>
                 </div>
                 <span className={styles.barValue}>{m.f1.toFixed(2)}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
