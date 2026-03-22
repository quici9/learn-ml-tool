import { useState, useRef, useEffect } from 'react';
import { Lightbulb, Check, X, RotateCcw, FileText } from 'lucide-react';
import type { QuizQuestion } from '../types/lesson';
import styles from './QuizQuestionCard.module.css';

interface QuizQuestionCardProps {
  question: QuizQuestion;
  index: number;
  onAnswer: (questionId: string, isCorrect: boolean) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function QuizQuestionCard({ question, index, onAnswer }: QuizQuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillAnswer, setFillAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on question change
  useEffect(() => {
    setSelectedOption(null);
    setFillAnswer('');
    setIsSubmitted(false);
    setIsCorrect(false);
    setShowHint(false);
  }, [question.id]);

  const checkAnswer = () => {
    let correct = false;

    if (question.type === 'multiple-choice') {
      correct = selectedOption === String(question.correctAnswer);
    } else {
      const numAnswer = parseFloat(fillAnswer);
      const numCorrect = Number(question.correctAnswer);
      const tolerance = question.tolerance ?? 0.01;
      correct = !isNaN(numAnswer) && Math.abs(numAnswer - numCorrect) <= tolerance;
    }

    setIsCorrect(correct);
    setIsSubmitted(true);
    onAnswer(question.id, correct);
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setFillAnswer('');
    setIsSubmitted(false);
    setIsCorrect(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const canSubmit =
    question.type === 'multiple-choice'
      ? selectedOption !== null
      : fillAnswer.trim().length > 0;

  const questionTypeLabel = getTypeLabel(question.type);

  return (
    <div
      className={`${styles.card} ${isSubmitted ? (isCorrect ? styles.correct : styles.wrong) : ''}`}
    >
      {/* Question header */}
      <div className={styles.cardHeader}>
        <span className={styles.questionNumber}>Câu {index + 1}</span>
        <span className={styles.questionType}>{questionTypeLabel}</span>
      </div>

      {/* Question text */}
      <p className={styles.questionText}>{question.question}</p>

      {/* Options or input */}
      <div className={styles.answerArea}>
        {question.type === 'multiple-choice' && question.options ? (
          <div className={styles.optionsGrid}>
            {question.options.map((option, optIdx) => {
              const letter = OPTION_LETTERS[optIdx] ?? String(optIdx);
              const isSelected = selectedOption === option;
              const isCorrectOption = isSubmitted && option === String(question.correctAnswer);
              const isWrongSelected = isSubmitted && isSelected && !isCorrect;

              return (
                <button
                  key={optIdx}
                  className={`${styles.optionBtn} ${isSelected ? styles.selected : ''} ${isCorrectOption ? styles.correctOption : ''} ${isWrongSelected ? styles.wrongOption : ''}`}
                  onClick={() => !isSubmitted && setSelectedOption(option)}
                  disabled={isSubmitted}
                  type="button"
                >
                  <span className={styles.optionLetter}>{letter}</span>
                  <span className={styles.optionText}>{option}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.fillInput}>
            <label className={styles.fillLabel}>
              {question.type === 'compute' ? 'Nhập kết quả tính:' : 'Nhập đáp án:'}
            </label>
            <input
              ref={inputRef}
              type="text"
              className={styles.inputField}
              value={fillAnswer}
              onChange={(e) => !isSubmitted && setFillAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canSubmit && !isSubmitted && checkAnswer()}
              disabled={isSubmitted}
              placeholder={question.type === 'compute' ? 'Ví dụ: 0.85' : 'Nhập đáp án...'}
            />
            {isSubmitted && !isCorrect && (
              <p className={styles.correctValue}>
                Đáp án đúng: <strong>{String(question.correctAnswer)}</strong>
                {question.tolerance ? ` (± ${question.tolerance})` : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Hint */}
      {question.hint && !isSubmitted && (
        <div className={styles.hintArea}>
          <button
            className={styles.hintBtn}
            onClick={() => setShowHint(!showHint)}
            type="button"
          >
            <Lightbulb size={16} style={{ marginRight: 6 }} /> {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý'}
          </button>
          {showHint && <p className={styles.hintText}>{question.hint}</p>}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {!isSubmitted ? (
          <button
            className={styles.submitBtn}
            onClick={checkAnswer}
            disabled={!canSubmit}
            type="button"
          >
            Kiểm tra
          </button>
        ) : (
          <div className={styles.resultActions}>
            <div className={`${styles.resultBadge} ${isCorrect ? styles.correctBadge : styles.wrongBadge}`}>
              {isCorrect ? <><Check size={16} style={{ marginRight: 4 }} /> Chính xác!</> : <><X size={16} style={{ marginRight: 4 }} /> Chưa đúng</>}
            </div>
            {!isCorrect && (
              <button className={styles.retryBtn} onClick={handleRetry} type="button">
                <RotateCcw size={14} style={{ marginRight: 6 }} /> Thử lại
              </button>
            )}
          </div>
        )}
      </div>

      {/* Explanation */}
      {isSubmitted && (
        <div className={`${styles.explanation} ${isCorrect ? styles.explanationCorrect : styles.explanationWrong}`}>
          <span className={styles.explanationIcon}><FileText size={20} /></span>
          <p className={styles.explanationText}>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

function getTypeLabel(type: QuizQuestion['type']): string {
  switch (type) {
    case 'multiple-choice':
      return 'Trắc nghiệm';
    case 'fill-in-blank':
      return 'Điền đáp án';
    case 'compute':
      return 'Tính toán';
    default:
      return 'Câu hỏi';
  }
}
