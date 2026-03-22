import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import { Lightbulb, AlertTriangle, Info, Key, Pin, ChevronDown, ChevronUp, Blocks } from 'lucide-react';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import type {
  LessonSection,
  TextContent,
  CodeContent,
  InteractiveContent,
  AnalogyContent,
  InsightContent,
  ScenarioContent,
  DecisionContent,
} from '../types/lesson';
import { AnalogyCard } from './AnalogyCard';
import { InsightStep } from './InsightStep';
import { DecisionGuide } from './DecisionGuide';
import { ScenarioCard } from './ScenarioCard';
import { ComparisonTable } from './ComparisonTable';
import { CodePlayground } from './CodePlayground';
import { ConfusionMatrixExplorer } from './ConfusionMatrixExplorer';
import { ThresholdExplorer } from './ThresholdExplorer';
import { PipelineVisualizer } from './PipelineVisualizer';
import { IsolationForestDiagram } from './IsolationForestDiagram';
import { FeatureImportanceChart } from './FeatureImportanceChart';
import { HyperparamPlayground } from './HyperparamPlayground';
import { ShapExplainer } from './ShapExplainer';
import { ModelBenchmarkComparison } from './ModelBenchmarkComparison';
import { FormattedText } from './FormattedText';
import styles from './SectionRenderer.module.css';

interface SectionRendererProps {
  section: LessonSection;
}

type HighlightType = 'tip' | 'warning' | 'info' | 'important';

const HIGHLIGHT_ICONS: Record<HighlightType, React.ReactElement> = {
  tip: <Lightbulb size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
  important: <Key size={20} />,
};

const HIGHLIGHT_CLASSES: Record<HighlightType, string> = {
  tip: styles.highlightTip ?? '',
  warning: styles.highlightWarning ?? '',
  info: styles.highlightInfo ?? '',
  important: styles.highlightImportant ?? '',
};

export function SectionRenderer({ section }: SectionRendererProps) {
  return (
    <section className={styles.section} id={section.id}>
      <h2 className={styles.sectionTitle}>{section.title}</h2>
      <div className={styles.sectionBody}>{renderContent(section)}</div>
    </section>
  );
}

function renderContent(section: LessonSection) {
  const { content } = section;

  switch (content.kind) {
    case 'text':
      return <TextBlock content={content} />;
    case 'code':
      // Route playground code blocks to CodePlayground
      if (content.isPlayground) {
        return <CodePlayground content={content} sectionId={section.id} />;
      }
      return <CodeBlock content={content} />;
    case 'comparison-table':
      return (
        <ComparisonTable
          headers={content.headers}
          rows={content.rows}
          caption={content.caption}
        />
      );
    case 'interactive':
      return renderInteractive(content);
    case 'analogy':
      return <AnalogyCard content={content as AnalogyContent} />;
    case 'insight':
      return <InsightStep content={content as InsightContent} />;
    case 'scenario':
      return <ScenarioCard content={content as ScenarioContent} />;
    case 'decision':
      return <DecisionGuide content={content as DecisionContent} />;
    default:
      return null;
  }
}

/* ─── Text Block ─── */

function TextBlock({ content }: { content: TextContent }) {
  return (
    <div className={styles.textBlock}>
      {content.paragraphs.map((para, idx) => (
        <p
          key={idx}
          className={styles.paragraph}
        >
          <FormattedText text={para} />
        </p>
      ))}
      {content.highlights?.map((h, idx) => (
        <div
          key={idx}
          className={`${styles.highlight} ${HIGHLIGHT_CLASSES[h.type] ?? ''}`}
        >
          <span className={styles.highlightIcon}>
            {HIGHLIGHT_ICONS[h.type] ?? <Pin size={20} />}
          </span>
          <p
            className={styles.highlightText}
          >
            <FormattedText text={h.text} />
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─── Code Block (non-playground, with Prism highlighting) ─── */

function CodeBlock({ content }: { content: CodeContent }) {
  const codeRef = useRef<HTMLElement>(null);
  const [isExpanded, setIsExpanded] = useState(!content.isOptional);

  useEffect(() => {
    if (codeRef.current && isExpanded) {
      Prism.highlightElement(codeRef.current);
    }
  }, [content.code, isExpanded]);

  return (
    <div className={styles.codeBlock}>
      {content.isOptional && !isExpanded && (
        <div className={styles.optionalBanner} onClick={() => setIsExpanded(true)}>
          <div className={styles.optionalInfo}>
            <span className={styles.optionalBadge}>Nâng cao</span>
            <span className={styles.optionalTitle}>Mã nguồn chi tiết (Tùy chọn)</span>
          </div>
          <button className={styles.optionalBtn}>Xem Code <ChevronDown size={14} style={{ marginLeft: 4 }} /></button>
        </div>
      )}
      
      {content.isOptional && isExpanded && (
        <div className={styles.optionalBannerExpanded} onClick={() => setIsExpanded(false)}>
          <span className={styles.optionalTitle}>Mã nguồn chi tiết</span>
          <button className={styles.optionalBtn}>Đóng Code <ChevronUp size={14} style={{ marginLeft: 4 }} /></button>
        </div>
      )}

      {(!content.isOptional || isExpanded) && (
        <div className={styles.codeContentWrapper}>
          {content.filename && (
            <div className={styles.codeHeader}>
              <span className={styles.codeFilename}>{content.filename}</span>
              <span className={styles.codeLang}>{content.language}</span>
            </div>
          )}
          {content.description && (
            <p className={styles.codeDescription}>{content.description}</p>
          )}
          <pre className={styles.pre}>
            <code ref={codeRef} className={`language-${content.language}`}>
              {content.code}
            </code>
          </pre>
          {content.output && (
            <div className={styles.codeOutput}>
              <span className={styles.outputLabel}>Output:</span>
              <pre className={styles.outputPre}>{content.output}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Interactive Dispatcher ─── */

function renderInteractive(content: InteractiveContent) {
  switch (content.component) {
    case 'ConfusionMatrixExplorer': {
      const props = content.props as {
        tn?: number;
        fp?: number;
        fn?: number;
        tp?: number;
      } | undefined;
      return (
        <ConfusionMatrixExplorer
          defaultTn={props?.tn}
          defaultFp={props?.fp}
          defaultFn={props?.fn}
          defaultTp={props?.tp}
        />
      );
    }
    case 'ThresholdExplorer': {
      const props = content.props as {
        defaultThreshold?: number;
      } | undefined;
      return (
        <ThresholdExplorer
          defaultThreshold={props?.defaultThreshold}
        />
      );
    }
    case 'PipelineVisualizer': {
      const props = content.props as {
        highlightStep?: string;
      } | undefined;
      return (
        <PipelineVisualizer
          highlightStep={props?.highlightStep}
        />
      );
    }
    case 'IsolationForestDiagram':
      return <IsolationForestDiagram />;
    case 'FeatureImportanceChart': {
      const featureProps = content.props as {
        features?: Array<{ name: string; importance: number; category: string }>;
      } | undefined;
      return <FeatureImportanceChart features={featureProps?.features} />;
    }
    case 'HyperparamPlayground':
      return <HyperparamPlayground />;
    case 'ModelBenchmarkComparison':
      return <ModelBenchmarkComparison />;
    case 'ShapExplainer':
      return <ShapExplainer />;
    default:
      return (
        <div className={styles.interactivePlaceholder}>
          <span className={styles.interactiveIcon}><Blocks size={24} /></span>
          <p className={styles.interactiveLabel}>
            Interactive: {content.component}
          </p>
          {content.description && (
            <p className={styles.interactiveDesc}>{content.description}</p>
          )}
          <span className={styles.comingSoonBadge}>Coming Soon</span>
        </div>
      );
  }
}

