import { PHASES, LESSONS } from '../constants/lessons-meta';
import { BarChart2, Check, PieChart, Circle } from 'lucide-react';
import { LESSON_CONTENT_BY_ID } from '../lessons';
import { useProgress } from '../stores/progress-store';
import styles from './ProgressDashboard.module.css';

export function ProgressDashboard() {
  const { getProgress } = useProgress();

  // Compute overall stats
  const totalLessons = LESSONS.length;
  const completedLessons = LESSONS.filter(
    (l) => getProgress(l.id).status === 'completed'
  ).length;
  const inProgressLessons = LESSONS.filter(
    (l) => getProgress(l.id).status === 'in-progress'
  ).length;
  const overallPercent = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

  // Collect quiz scores for lessons that have quizzes
  const quizResults = LESSONS.map((lesson) => {
    const progress = getProgress(lesson.id);
    const content = LESSON_CONTENT_BY_ID.get(lesson.id);
    const hasQuiz = content?.quiz && content.quiz.length > 0;
    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      lessonNumber: lesson.number,
      hasQuiz,
      quizScore: progress.quizScore,
      quizCorrect: progress.quizCorrect,
      quizTotal: progress.quizTotal,
    };
  }).filter((r) => r.hasQuiz);

  const circumference = 2 * Math.PI * 52;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}><BarChart2 size={32} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Tiến độ học tập</h1>
        <p className={styles.subtitle}>
          Theo dõi hành trình học ML của bạn
        </p>
      </header>

      {/* Overview cards */}
      <div className={styles.overviewGrid}>
        {/* Overall progress ring */}
        <div className={styles.ringCard}>
          <div className={styles.ring}>
            <svg viewBox="0 0 120 120" className={styles.ringSvg}>
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="8"
              />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="8"
                strokeDasharray={`${(overallPercent / 100) * circumference} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className={styles.ringProgress}
              />
            </svg>
            <div className={styles.ringLabel}>
              <span className={styles.ringValue}>{overallPercent}</span>
              <span className={styles.ringUnit}>%</span>
            </div>
          </div>
          <p className={styles.ringCaption}>Hoàn thành tổng thể</p>
        </div>

        {/* Stats cards */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--color-success)' }}><Check size={24} /></div>
          <div className={styles.statValue}>{completedLessons}</div>
          <div className={styles.statLabel}>Hoàn thành</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--color-warning)' }}><PieChart size={24} /></div>
          <div className={styles.statValue}>{inProgressLessons}</div>
          <div className={styles.statLabel}>Đang học</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--color-text-tertiary)' }}><Circle size={24} /></div>
          <div className={styles.statValue}>
            {totalLessons - completedLessons - inProgressLessons}
          </div>
          <div className={styles.statLabel}>Chưa bắt đầu</div>
        </div>
      </div>

      {/* Phase progress bars */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tiến độ theo Phase</h2>
        <div className={styles.phaseGrid}>
          {PHASES.map((phase, idx) => {
            const phaseCompleted = phase.lessons.filter(
              (l) => getProgress(l.id).status === 'completed'
            ).length;
            const phaseTotal = phase.lessons.length;
            const phasePercent = phaseTotal > 0
              ? Math.round((phaseCompleted / phaseTotal) * 100)
              : 0;

            return (
              <div key={phase.id} className={styles.phaseCard}>
                <div className={styles.phaseHeader}>
                  <span
                    className={styles.phaseDot}
                    style={{ backgroundColor: `var(--color-phase-${idx + 1})` }}
                  />
                  <span className={styles.phaseName}>
                    {phase.title} — {phase.subtitle}
                  </span>
                  <span className={styles.phaseCount}>
                    {phaseCompleted}/{phaseTotal}
                  </span>
                </div>
                <div className={styles.phaseBar}>
                  <div
                    className={styles.phaseBarFill}
                    style={{
                      width: `${phasePercent}%`,
                      background: `var(--color-phase-${idx + 1})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quiz scores */}
      {quizResults.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Điểm bài kiểm tra</h2>
          <div className={styles.quizGrid}>
            {quizResults.map((result) => (
              <div key={result.lessonId} className={styles.quizCard}>
                <div className={styles.quizCardHeader}>
                  <span className={styles.quizLessonBadge}>
                    {String(result.lessonNumber).padStart(2, '0')}
                  </span>
                  <span className={styles.quizLessonTitle}>
                    {result.lessonTitle}
                  </span>
                </div>
                {result.quizScore !== null ? (
                  <div className={styles.quizScoreRow}>
                    <span
                      className={styles.quizScoreValue}
                      style={{
                        color: result.quizScore >= 70
                          ? 'var(--color-success)'
                          : 'var(--color-warning)',
                      }}
                    >
                      {result.quizScore}%
                    </span>
                    <span className={styles.quizScoreDetail}>
                      {result.quizCorrect}/{result.quizTotal} câu đúng
                    </span>
                  </div>
                ) : (
                  <div className={styles.quizNotAttempted}>
                    Chưa làm bài
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
