import { useState, useCallback } from 'react';
import { FileText, RotateCcw, Target, Star, ThumbsUp, BookOpen } from 'lucide-react';
import type { QuizQuestion } from '../types/lesson';
import { QuizQuestionCard } from './QuizQuestionCard';
import styles from './QuizSection.module.css';

interface QuizSectionProps {
  questions: QuizQuestion[];
  lessonTitle: string;
  onScoreChange?: (correct: number, total: number) => void;
}

interface AnswerResult {
  questionId: string;
  isCorrect: boolean;
}

export function QuizSection({ questions, lessonTitle, onScoreChange }: QuizSectionProps) {
  const [answers, setAnswers] = useState<Map<string, AnswerResult>>(new Map());
  const [isCompleted, setIsCompleted] = useState(false);

  const handleAnswer = useCallback((questionId: string, isCorrect: boolean) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, { questionId, isCorrect });

      // Report score to parent
      const correctCount = Array.from(next.values()).filter((a) => a.isCorrect).length;
      onScoreChange?.(correctCount, questions.length);

      // Check if all questions answered
      if (next.size === questions.length) {
        setIsCompleted(true);
      }

      return next;
    });
  }, [questions.length, onScoreChange]);

  const correctCount = Array.from(answers.values()).filter((a) => a.isCorrect).length;
  const answeredCount = answers.size;
  const totalCount = questions.length;
  const scorePercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const handleResetAll = () => {
    setAnswers(new Map());
    setIsCompleted(false);
  };

  return (
    <div className={styles.quizSection}>
      {/* Quiz header */}
      <div className={styles.quizHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.quizIcon}><FileText size={24} /></span>
          <div>
            <h2 className={styles.quizTitle}>Bài kiểm tra</h2>
            <p className={styles.quizSubtitle}>{lessonTitle}</p>
          </div>
        </div>
        <div className={styles.progress}>
          <span className={styles.progressText}>
            {answeredCount}/{totalCount}
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${totalCount > 0 ? (answeredCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className={styles.questionsContainer}>
        {questions.map((q, idx) => (
          <QuizQuestionCard
            key={q.id}
            question={q}
            index={idx}
            onAnswer={handleAnswer}
          />
        ))}
      </div>

      {/* Score summary */}
      {isCompleted && (
        <div className={styles.scoreSummary}>
          <div className={styles.scoreRing}>
            <svg viewBox="0 0 120 120" className={styles.scoreSvg}>
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="8"
              />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={scorePercent >= 70 ? 'var(--color-success)' : 'var(--color-warning)'}
                strokeWidth="8"
                strokeDasharray={`${(scorePercent / 100) * 327} 327`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className={styles.scoreCircle}
              />
            </svg>
            <div className={styles.scoreValue}>
              <span className={styles.scoreNumber}>{scorePercent}</span>
              <span className={styles.scoreUnit}>%</span>
            </div>
          </div>

          <div className={styles.scoreDetails}>
            <p className={styles.scoreLabel}>
              {correctCount}/{totalCount} câu đúng
            </p>
            <p className={styles.scoreMessage}>
              <span style={{ marginRight: 8, verticalAlign: 'middle' }}>{getScoreMessage(scorePercent).icon}</span>
              {getScoreMessage(scorePercent).text}
            </p>
            <button className={styles.resetBtn} onClick={handleResetAll} type="button">
              <RotateCcw size={16} style={{ marginRight: 6 }} /> Làm lại bài kiểm tra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getScoreMessage(percent: number): { text: string; icon: React.ReactElement } {
  if (percent === 100) return { text: 'Xuất sắc! Bạn nắm vững toàn bộ kiến thức!', icon: <Target size={18} /> };
  if (percent >= 80) return { text: 'Rất tốt! Bạn hiểu hầu hết các khái niệm.', icon: <Star size={18} /> };
  if (percent >= 60) return { text: 'Khá tốt! Hãy ôn lại các phần chưa đúng.', icon: <ThumbsUp size={18} /> };
  return { text: 'Hãy đọc lại bài học và thử lại nhé!', icon: <BookOpen size={18} /> };
}
