import type { Lesson } from '../types/lesson';
import { lesson01 } from './lesson-01-python';
import { lesson02 } from './lesson-02-pandas';
import { lesson03 } from './lesson-03-numpy-statistics';
import { lesson04 } from './lesson-04-ml-fundamentals';
import { lesson05 } from './lesson-05-sklearn-anomaly-detection';
import { lesson06 } from './lesson-06-feature-engineering';
import { lesson07 } from './lesson-07-fastapi-ml-engine';
import { lesson08 } from './lesson-08-elasticsearch';
import { lesson09 } from './lesson-09-supervised-learning';
import { lesson10 } from './lesson-10-autoencoder';
import { lesson11 } from './lesson-11-mlops';

// Registry of all lessons with full content
const LESSONS_CONTENT: Lesson[] = [
  lesson01,
  lesson02,
  lesson03,
  lesson04,
  lesson05,
  lesson06,
  lesson07,
  lesson08,
  lesson09,
  lesson10,
  lesson11,
];

export const LESSON_CONTENT_BY_ID = new Map<string, Lesson>(
  LESSONS_CONTENT.map((l) => [l.id, l])
);
