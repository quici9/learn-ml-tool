import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

// Progress status for each lesson
export type LessonStatus = 'not-started' | 'in-progress' | 'completed';

export interface LessonProgress {
  status: LessonStatus;
  scrollPercent: number;
  quizScore: number | null; // null = not attempted, 0-100 = score percentage
  quizCorrect: number;
  quizTotal: number;
  lastAccessedAt: string | null;
  completedAt: string | null;
}

interface ProgressState {
  lessons: Record<string, LessonProgress>;
}

interface ProgressContextValue {
  getProgress: (lessonId: string) => LessonProgress;
  markStarted: (lessonId: string) => void;
  updateScroll: (lessonId: string, percent: number) => void;
  updateQuizScore: (lessonId: string, correct: number, total: number) => void;
  markCompleted: (lessonId: string) => void;
  resetLesson: (lessonId: string) => void;
  getAllProgress: () => Record<string, LessonProgress>;
}

const STORAGE_KEY = 'ml-learning-hub-progress';

const DEFAULT_PROGRESS: LessonProgress = {
  status: 'not-started',
  scrollPercent: 0,
  quizScore: null,
  quizCorrect: 0,
  quizTotal: 0,
  lastAccessedAt: null,
  completedAt: null,
};

function loadFromStorage(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as ProgressState;
    }
  } catch {
    // Corrupted data — start fresh
  }
  return { lessons: {} };
}

function saveToStorage(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(loadFromStorage);

  // Persist to localStorage on every state change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const getProgress = useCallback(
    (lessonId: string): LessonProgress => {
      return state.lessons[lessonId] ?? DEFAULT_PROGRESS;
    },
    [state.lessons]
  );

  const updateLesson = useCallback(
    (lessonId: string, updater: (prev: LessonProgress) => LessonProgress) => {
      setState((prev) => ({
        ...prev,
        lessons: {
          ...prev.lessons,
          [lessonId]: updater(prev.lessons[lessonId] ?? DEFAULT_PROGRESS),
        },
      }));
    },
    []
  );

  const markStarted = useCallback(
    (lessonId: string) => {
      updateLesson(lessonId, (prev) => {
        if (prev.status !== 'not-started') return prev;
        return {
          ...prev,
          status: 'in-progress',
          lastAccessedAt: new Date().toISOString(),
        };
      });
    },
    [updateLesson]
  );

  const updateScroll = useCallback(
    (lessonId: string, percent: number) => {
      updateLesson(lessonId, (prev) => ({
        ...prev,
        scrollPercent: Math.max(prev.scrollPercent, percent),
        lastAccessedAt: new Date().toISOString(),
      }));
    },
    [updateLesson]
  );

  const updateQuizScore = useCallback(
    (lessonId: string, correct: number, total: number) => {
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      updateLesson(lessonId, (prev) => ({
        ...prev,
        quizScore: score,
        quizCorrect: correct,
        quizTotal: total,
        lastAccessedAt: new Date().toISOString(),
      }));
    },
    [updateLesson]
  );

  const markCompleted = useCallback(
    (lessonId: string) => {
      updateLesson(lessonId, (prev) => ({
        ...prev,
        status: 'completed',
        completedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
      }));
    },
    [updateLesson]
  );

  const resetLesson = useCallback(
    (lessonId: string) => {
      updateLesson(lessonId, () => DEFAULT_PROGRESS);
    },
    [updateLesson]
  );

  const getAllProgress = useCallback(
    () => state.lessons,
    [state.lessons]
  );

  return (
    <ProgressContext.Provider
      value={{
        getProgress,
        markStarted,
        updateScroll,
        updateQuizScore,
        markCompleted,
        resetLesson,
        getAllProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
