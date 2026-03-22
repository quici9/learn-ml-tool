// Lesson metadata types and section content types

export interface LessonMeta {
  id: string;
  number: number;
  title: string;
  description: string;
  phase: Phase;
  estimatedTime: string;
  prerequisites: string[];
}

export type Phase = 'phase-1' | 'phase-2' | 'phase-3';

export interface PhaseInfo {
  id: Phase;
  title: string;
  subtitle: string;
  color: string;
  lessons: LessonMeta[];
}

export type SectionType =
  | 'text'
  | 'code'
  | 'comparison-table'
  | 'interactive'
  | 'diagram'
  | 'quiz';

export interface LessonSection {
  id: string;
  title: string;
  type: SectionType;
  content: TextContent | CodeContent | ComparisonTableContent | InteractiveContent;
}

export interface TextContent {
  kind: 'text';
  paragraphs: string[];
  highlights?: HighlightBlock[];
}

export interface HighlightBlock {
  type: 'tip' | 'warning' | 'info' | 'important';
  text: string;
}

export interface CodeContent {
  kind: 'code';
  language: string;
  code: string;
  filename?: string;
  description?: string;
  output?: string;
  isPlayground?: boolean;
  parameters?: PlaygroundParameter[];
  outputVariants?: Record<string, string>;
}

export interface PlaygroundParameter {
  name: string;
  label: string;
  type: 'slider' | 'select';
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number | string;
  options?: { label: string; value: string }[];
}

export interface ComparisonTableContent {
  kind: 'comparison-table';
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface InteractiveContent {
  kind: 'interactive';
  component: string;
  props?: Record<string, unknown>;
  description?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'fill-in-blank' | 'compute';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  tolerance?: number;
  explanation: string;
  hint?: string;
}

export interface Lesson extends LessonMeta {
  sections: LessonSection[];
  quiz?: QuizQuestion[];
}
