import { FormattedText } from './FormattedText';
import styles from './ComparisonTable.module.css';

interface ComparisonTableProps {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export function ComparisonTable({ headers, rows, caption }: ComparisonTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className={styles.th}>
                <FormattedText text={header} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className={styles.tr}>
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className={`${styles.td} ${cellIdx === 0 ? styles.rowLabel : ''}`}
                >
                  <FormattedText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {caption && <p className={styles.caption}><FormattedText text={caption} /></p>}
    </div>
  );
}
