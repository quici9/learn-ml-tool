import { useState } from 'react';
import styles from './ShapExplainer.module.css';

const ALERTS = [
  { 
    id: 1, 
    type: 'Port Scan (Anomaly)', 
    base: 0.05, 
    features: [
      { name: 'unique_dests_count', val: '+ 0.75' }, 
      { name: 'conn_state_REJ', val: '+ 0.15' }, 
      { name: 'bytes_sent', val: '- 0.05' }
    ], 
    total: 0.90 
  },
  { 
    id: 2, 
    type: 'Data Exfiltration (Anomaly)', 
    base: 0.05, 
    features: [
      { name: 'out_bytes', val: '+ 0.80' }, 
      { name: 'duration', val: '+ 0.12' },
      { name: 'history_S', val: '- 0.02' }
    ], 
    total: 0.95 
  },
  { 
    id: 3, 
    type: 'Normal Web Browsing', 
    base: 0.05, 
    features: [
      { name: 'unique_dests_count', val: '- 0.02' },
      { name: 'duration', val: '- 0.01' }
    ], 
    total: 0.02 
  },
];

export function ShapExplainer() {
  const [activeAlert, setActiveAlert] = useState(ALERTS[0]?.id ?? 1);

  const alert = ALERTS.find(a => a.id === activeAlert) || ALERTS[0];
  if (!alert) return null;

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h4>Select an Event</h4>
        {ALERTS.map(a => (
          <button 
            key={a.id} 
            className={`${styles.alertBtn} ${activeAlert === a.id ? styles.active : ''}`} 
            onClick={() => setActiveAlert(a.id)}
          >
            Event #{a.id} <br /> 
            <small style={{ fontWeight: 'normal', opacity: 0.8 }}>{a.type}</small>
          </button>
        ))}
      </div>
      <div className={styles.main}>
        <h4>SHAP Explanation (Local)</h4>
        <div className={styles.waterfall}>
           <div className={styles.baseVal}>Base Expected Score: {alert.base.toFixed(2)}</div>
           {alert.features.map(f => {
              const isPos = f.val.trim().startsWith('+');
              return (
                 <div key={f.name} className={`${styles.featureItem} ${isPos ? styles.positive : styles.negative}`}>
                    <span className={styles.fName}>{f.name}</span>
                    <span className={styles.fVal}>{f.val}</span>
                 </div>
              );
           })}
           <div className={styles.totalVal}>Model Output Score: {alert.total.toFixed(2)}</div>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          <strong>How to read:</strong> Features pushing the score higher (anomaly) are shown in <span style={{color: '#ef4444'}}>red (+)</span>. Features pushing the score lower (normal) are in <span style={{color: '#3b82f6'}}>blue (-)</span>.
        </p>
      </div>
    </div>
  );
}
