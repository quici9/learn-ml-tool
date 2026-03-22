import { useState } from 'react';
import type { InsightContent } from '../types/lesson';
import styles from './InsightStep.module.css';

interface InsightStepProps {
  content: InsightContent;
}

export function InsightStep({ content }: InsightStepProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className={`${styles.step} ${isRevealed ? styles.revealed : ''}`}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.icon}>🤔</div>
          <div className={styles.main}>
            <h4 className={styles.question}>
              {content.question}
            </h4>
            {!isRevealed && content.hint && (
              <p className={styles.hint}>
                Gợi ý: {content.hint}
              </p>
            )}
          </div>
        </div>

        {!isRevealed ? (
          <div className={styles.actions}>
            <button 
              onClick={() => setIsRevealed(true)}
              className={styles.revealBtn}
            >
              <span>Xem câu trả lời</span>
              <svg className={styles.revealIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        ) : (
          <div className={styles.answer}>
            <div dangerouslySetInnerHTML={{ 
              __html: content.answer
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/`([^`]+)`/g, '<code>$1</code>') 
            }} />
          </div>
        )}
      </div>
    </div>
  );
}
