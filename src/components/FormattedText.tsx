import React from 'react';
import {
  Lightbulb, AlertTriangle, CheckCircle, XCircle, FileText, Check, Target, Star, ThumbsUp, BookOpen, Radio, AlertCircle
} from 'lucide-react';

const EMOJI_ICON_MAP: Record<string, React.ReactElement> = {
  '💡': <Lightbulb size={18} style={{ marginRight: 4, verticalAlign: 'text-bottom', color: 'var(--color-accent)' }} />,
  '⚠️': <AlertTriangle size={18} style={{ marginRight: 4, verticalAlign: 'text-bottom', color: 'var(--color-warning)' }} />,
  '✅': <CheckCircle size={18} style={{ marginRight: 4, verticalAlign: 'text-bottom', color: 'var(--color-success)' }} />,
  '❌': <XCircle size={18} style={{ marginRight: 4, verticalAlign: 'text-bottom', color: 'var(--color-danger)' }} />,
  '🔴': <AlertCircle size={18} style={{ marginRight: 4, verticalAlign: 'text-bottom', color: 'var(--color-danger)' }} />,
  '📡': <Radio size={18} style={{ marginRight: 4, verticalAlign: 'text-bottom', color: 'var(--color-phase-2)' }} />,
  '📝': <FileText size={18} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />,
  '✓': <Check size={18} style={{ marginRight: 4, verticalAlign: 'text-bottom', color: 'var(--color-success)' }} />,
  '🎯': <Target size={18} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />,
  '🌟': <Star size={18} style={{ marginRight: 4, verticalAlign: 'text-bottom', color: 'var(--color-highlight)' }} />,
  '👍': <ThumbsUp size={18} style={{ marginRight: 4, verticalAlign: 'text-bottom', color: 'var(--color-success)' }} />,
  '📖': <BookOpen size={18} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />,
};

const FORMAT_REGEX = /(\*\*.+?\*\*|\*.+?\*|`.+?`|💡|⚠️|✅|❌|🔴|📡|📝|✓|🎯|🌟|👍|📖)/g;

interface FormattedTextProps {
  text: string;
}

export function FormattedText({ text }: FormattedTextProps) {
  if (!text) return null;

  const parts = text.split(FORMAT_REGEX);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (EMOJI_ICON_MAP[part]) {
          return <React.Fragment key={i}>{EMOJI_ICON_MAP[part]}</React.Fragment>;
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i}>{part.slice(1, -1)}</code>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
