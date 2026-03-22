import type { LessonMeta } from '../types/lesson';
import styles from './LessonNav.module.css';

interface LessonNavProps {
  prevLesson: LessonMeta | null;
  nextLesson: LessonMeta | null;
  onPrev: () => void;
  onNext: () => void;
}

export function LessonNav({
  prevLesson,
  nextLesson,
  onPrev,
  onNext,
}: LessonNavProps) {
  return (
    <nav className={styles.nav} aria-label="Lesson navigation">
      {prevLesson ? (
        <button className={styles.navButton} onClick={onPrev}>
          <span className={styles.navDirection}>← Bài trước</span>
          <span className={styles.navTitle}>
            {String(prevLesson.number).padStart(2, '0')}. {prevLesson.title}
          </span>
        </button>
      ) : (
        <div />
      )}

      {nextLesson ? (
        <button
          className={`${styles.navButton} ${styles.navButtonNext}`}
          onClick={onNext}
        >
          <span className={styles.navDirection}>Bài tiếp →</span>
          <span className={styles.navTitle}>
            {String(nextLesson.number).padStart(2, '0')}. {nextLesson.title}
          </span>
        </button>
      ) : (
        <div />
      )}

      <p className={styles.hint}>
        Nhấn <kbd>←</kbd> <kbd>→</kbd> để chuyển bài
      </p>
    </nav>
  );
}
