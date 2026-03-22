import type { DecisionContent } from '../types/lesson';
import styles from './DecisionGuide.module.css';

interface DecisionGuideProps {
  content: DecisionContent;
}

export function DecisionGuide({ content }: DecisionGuideProps) {
  return (
    <div className={styles.guide}>
      <div className={styles.header}>
        <h4 className={styles.title}>
          <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {content.title}
        </h4>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.thSignal}`}>Tín hiệu</th>
              <th className={`${styles.th} ${styles.thCondition}`}>Tình huống</th>
              <th className={`${styles.th} ${styles.thRecommendation}`}>Khuyến nghị</th>
              <th className={`${styles.th} ${styles.thRationale}`}>Lý do</th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {content.conditions.map((row, idx) => {
              const trColor = row.signal === 'green' ? styles.bgGreen : row.signal === 'yellow' ? styles.bgYellow : styles.bgRed;
              const dotColor = row.signal === 'green' ? styles.dotGreen : row.signal === 'yellow' ? styles.dotYellow : styles.dotRed;
              
              return (
                <tr key={idx} className={`${styles.tr} ${trColor}`}>
                  <td className={`${styles.td} ${styles.tdSignal}`}>
                    <span 
                      className={`${styles.dot} ${dotColor}`} 
                      title={row.signal}
                    ></span>
                  </td>
                  <td className={`${styles.td} ${styles.tdCondition}`}>
                    {row.condition}
                  </td>
                  <td className={`${styles.td} ${styles.tdRecommendation}`}>
                    {row.recommendation}
                  </td>
                  <td className={`${styles.td} ${styles.tdRationale}`}>
                    <div dangerouslySetInnerHTML={{ 
                      __html: row.rationale
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/`([^`]+)`/g, '<code>$1</code>') 
                    }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
