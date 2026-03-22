import type { AnalogyContent } from '../types/lesson';
import { Brain } from 'lucide-react';
import { FormattedText } from './FormattedText';
import styles from './AnalogyCard.module.css';

interface AnalogyCardProps {
  content: AnalogyContent;
}

export function AnalogyCard({ content }: AnalogyCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.leftBorder} />
      <div className={styles.content}>
        <div className={styles.icon}>
          {content.icon || <Brain size={24} />}
        </div>
        <div className={styles.body}>
          <h4 className={styles.title}>
            Mental Model: {content.concept}
          </h4>
          <p className={styles.realWorld}>
            "Giống như {content.realWorld}"
          </p>

          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <div className={styles.abstract}>Khái niệm ({content.concept})</div>
              <div className={styles.concrete}>Thực tế ({content.realWorld})</div>
            </div>
            {content.mapping.map((row, idx) => (
              <div key={idx} className={styles.tableRow}>
                <div className={styles.abstract}>
                  <span className={styles.bullet}>•</span>
                  <FormattedText text={row.abstract} />
                </div>
                <div className={styles.concrete}>
                  <span className={styles.arrow}>→</span>
                  <FormattedText text={row.concrete} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
