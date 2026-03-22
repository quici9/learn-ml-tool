import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { LESSON_BY_ID } from '../constants/lessons-meta';
import { LESSON_CONTENT_BY_ID } from '../lessons';
import { useProgress } from '../stores/progress-store';
import { useKeyboardNav } from '../hooks/use-keyboard-nav';
import { SectionRenderer } from './SectionRenderer';
import { QuizSection } from './QuizSection';
import { LessonNav } from './LessonNav';
import styles from './LessonView.module.css';

const PHASE_COLORS: Record<string, { bg: string; color: string }> = {
  'phase-1': { bg: 'rgba(167, 139, 250, 0.15)', color: 'var(--color-phase-1)' },
  'phase-2': { bg: 'rgba(56, 189, 248, 0.15)', color: 'var(--color-phase-2)' },
  'phase-3': { bg: 'rgba(251, 146, 60, 0.15)', color: 'var(--color-phase-3)' },
};

const PHASE_LABELS: Record<string, string> = {
  'phase-1': 'Phase 1 · Python & Data Science',
  'phase-2': 'Phase 2 · Applied ML',
  'phase-3': 'Phase 3 · Advanced ML & MLOps',
};

const SCROLL_COMPLETE_THRESHOLD = 90;

export function LessonView() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [scrollProgress, setScrollProgress] = useState(0);
  const { markStarted, updateScroll, updateQuizScore, markCompleted, getProgress } = useProgress();
  const { prevLesson, nextLesson, goPrev, goNext } = useKeyboardNav();

  const lessonMeta = lessonId ? LESSON_BY_ID.get(lessonId) : undefined;
  const lessonContent = lessonId ? LESSON_CONTENT_BY_ID.get(lessonId) : undefined;

  // Mark lesson as started on mount
  useEffect(() => {
    if (lessonId) {
      markStarted(lessonId);
    }
  }, [lessonId, markStarted]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      const clampedProgress = Math.min(progress, 100);
      setScrollProgress(clampedProgress);

      // Track max scroll in progress store
      if (lessonId) {
        updateScroll(lessonId, clampedProgress);

        // Auto-mark completed when scrolled to bottom (90%+)
        const currentProgress = getProgress(lessonId);
        if (clampedProgress >= SCROLL_COMPLETE_THRESHOLD && currentProgress.status !== 'completed') {
          markCompleted(lessonId);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lessonId, updateScroll, markCompleted, getProgress]);

  // Reset scroll on lesson change
  useEffect(() => {
    window.scrollTo(0, 0);
    setScrollProgress(0);
  }, [lessonId]);

  const handleQuizScoreChange = useCallback(
    (correct: number, total: number) => {
      if (lessonId) {
        updateQuizScore(lessonId, correct, total);
      }
    },
    [lessonId, updateQuizScore]
  );

  if (!lessonMeta) {
    return (
      <div className={styles.lessonView}>
        <div className={styles.placeholder}>
          <span className={styles.placeholderIcon}>📚</span>
          <p className={styles.placeholderText}>Lesson not found</p>
        </div>
      </div>
    );
  }

  const phaseStyle = PHASE_COLORS[lessonMeta.phase] ?? {
    bg: 'var(--color-bg-tertiary)',
    color: 'var(--color-text-secondary)',
  };

  return (
    <div className={styles.lessonView}>
      {/* Scroll progress bar */}
      <div className={styles.scrollProgress}>
        <div
          className={styles.scrollProgressBar}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className={styles.lessonHeader}>
        <div className={styles.lessonMeta}>
          <span
            className={styles.phaseBadge}
            style={{
              backgroundColor: phaseStyle.bg,
              color: phaseStyle.color,
            }}
          >
            {PHASE_LABELS[lessonMeta.phase] ?? lessonMeta.phase}
          </span>
          <span className={styles.timeBadge}>
            ⏱ {lessonMeta.estimatedTime}
          </span>
        </div>
        <h1 className={styles.lessonTitle}>
          {String(lessonMeta.number).padStart(2, '0')}. {lessonMeta.title}
        </h1>
        <p className={styles.lessonDescription}>{lessonMeta.description}</p>
      </header>

      {/* Content sections or placeholder */}
      {lessonContent ? (
        <div className={styles.sectionsContainer}>
          {lessonContent.sections.map((section) => (
            <SectionRenderer key={section.id} section={section} />
          ))}

          {/* Quiz section at end of lesson */}
          {lessonContent.quiz && lessonContent.quiz.length > 0 && (
            <QuizSection
              questions={lessonContent.quiz}
              lessonTitle={lessonMeta.title}
              onScoreChange={handleQuizScoreChange}
            />
          )}

          {/* Prev/Next navigation */}
          <LessonNav
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            onPrev={goPrev}
            onNext={goNext}
          />
        </div>
      ) : (
        <div className={styles.placeholder}>
          <span className={styles.placeholderIcon}>🚧</span>
          <h2 className={styles.placeholderTitle}>{lessonMeta.title}</h2>
          <p className={styles.placeholderText}>
            {lessonMeta.description}
          </p>
          <span className={styles.comingSoon}>Đang phát triển</span>
          <p className={styles.placeholderHint}>
            Bài học này sẽ sớm có nội dung interactive. Trong lúc chờ, bạn có thể xem các bài học đã có sẵn.
          </p>

          {/* Navigation even for coming-soon pages */}
          <LessonNav
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            onPrev={goPrev}
            onNext={goNext}
          />
        </div>
      )}
    </div>
  );
}
