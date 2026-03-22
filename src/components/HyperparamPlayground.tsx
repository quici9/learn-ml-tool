import { useState, useMemo } from 'react';
import styles from './HyperparamPlayground.module.css';

export function HyperparamPlayground() {
  const [nEstimators, setNEstimators] = useState(100);
  const [maxDepth, setMaxDepth] = useState(10);
  const [learningRate, setLearningRate] = useState(0.1);

  // MOCK: Fake score calculation with a "sweet spot"
  const score = useMemo(() => {
    const neScore = 1 - Math.abs(nEstimators - 250) / 400; // sweet spot around 250
    const mdScore = 1 - Math.abs(maxDepth - 15) / 20; // sweet spot around 15
    const lrScore = 1 - Math.abs(learningRate - 0.05) / 0.15; // sweet spot around 0.05
    const finalScore = (neScore * 0.4 + mdScore * 0.3 + lrScore * 0.3) * 0.95;
    return Math.max(0.5, Math.min(0.99, finalScore));
  }, [nEstimators, maxDepth, learningRate]);

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>n_estimators: {nEstimators}</label>
          <input type="range" min="10" max="500" step="10" value={nEstimators} onChange={e => setNEstimators(Number(e.target.value))} />
        </div>
        <div className={styles.controlGroup}>
          <label>max_depth: {maxDepth}</label>
          <input type="range" min="1" max="30" step="1" value={maxDepth} onChange={e => setMaxDepth(Number(e.target.value))} />
        </div>
        <div className={styles.controlGroup}>
          <label>learning_rate: {learningRate}</label>
          <input type="range" min="0.01" max="0.2" step="0.01" value={learningRate} onChange={e => setLearningRate(Number(e.target.value))} />
        </div>
      </div>
      <div className={styles.result}>
        <h4>Validation Score (PR-AUC)</h4>
        <div className={styles.scoreDisplay}>{(score * 100).toFixed(1)}%</div>
      </div>
    </div>
  );
}
