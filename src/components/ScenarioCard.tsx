import type { ScenarioContent } from '../types/lesson';
import styles from './ScenarioCard.module.css';

interface ScenarioCardProps {
  content: ScenarioContent;
}

export function ScenarioCard({ content }: ScenarioCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.leftEdge}>
        <span className={styles.icon}>🏢</span>
      </div>
      
      <div className={styles.header}>
        <span className={styles.label}>Real-world Scenario</span>
        <h4 className={styles.situation}>
          {content.situation}
        </h4>
      </div>
      
      <div className={styles.problemBox}>
        <strong className={styles.problemLabel}>Vấn đề:</strong>
        {content.problem}
      </div>
      
      <div className={styles.questionBox}>
        <svg className={styles.qIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {content.question}
      </div>
    </div>
  );
}
