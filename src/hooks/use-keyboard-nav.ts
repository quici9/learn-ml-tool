import { useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LESSONS } from '../constants/lessons-meta';

/**
 * Keyboard navigation for lessons.
 * ← / → (ArrowLeft / ArrowRight) to navigate between lessons.
 * Only active when no input/textarea is focused.
 */
export function useKeyboardNav() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const currentIndex = LESSONS.findIndex((l) => l.id === lessonId);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      navigate(`/lesson/${LESSONS[currentIndex - 1]?.id}`);
    }
  }, [currentIndex, navigate]);

  const goNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < LESSONS.length - 1) {
      navigate(`/lesson/${LESSONS[currentIndex + 1]?.id}`);
    }
  }, [currentIndex, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext]);

  const prevLesson = currentIndex > 0 ? LESSONS[currentIndex - 1] ?? null : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < LESSONS.length - 1
      ? LESSONS[currentIndex + 1] ?? null
      : null;

  return { prevLesson, nextLesson, goPrev, goNext };
}
