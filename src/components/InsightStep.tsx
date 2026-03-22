import { useState } from 'react';
import { Lightbulb, ChevronDown } from 'lucide-react';
import type { InsightContent } from '../types/lesson';
import { FormattedText } from './FormattedText';
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
          <div className={styles.icon}><Lightbulb size={24} /></div>
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
              <ChevronDown className={styles.revealIcon} size={20} />
            </button>
          </div>
        ) : (
          <div className={styles.answer}>
            <FormattedText text={content.answer} />
          </div>
        )}
      </div>
    </div>
  );
}
