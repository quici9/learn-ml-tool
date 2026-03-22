import { useState, useCallback, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import type { CodeContent, PlaygroundParameter } from '../types/lesson';
import { getOutputForParams } from '../utils/code-outputs';
import styles from './CodePlayground.module.css';

interface CodePlaygroundProps {
  content: CodeContent;
  sectionId: string;
}

const FAKE_RUN_DELAY_MS = 800;

export function CodePlayground({ content, sectionId }: CodePlaygroundProps) {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [currentOutput, setCurrentOutput] = useState(content.output ?? '');
  const [paramValues, setParamValues] = useState<Record<string, number | string>>(() =>
    buildDefaultParams(content.parameters),
  );
  const codeRef = useRef<HTMLElement>(null);

  // Highlight code on mount and when code changes
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [content.code]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
      const textarea = document.createElement('textarea');
      textarea.value = content.code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content.code]);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setShowOutput(false);

    setTimeout(() => {
      // Try to get variant output based on current params
      const variantOutput = getOutputForParams(sectionId, paramValues);
      setCurrentOutput(variantOutput ?? content.output ?? 'No output.');
      setIsRunning(false);
      setShowOutput(true);
    }, FAKE_RUN_DELAY_MS);
  }, [sectionId, paramValues, content.output]);

  const handleParamChange = useCallback(
    (paramName: string, value: number | string) => {
      setParamValues((prev) => ({ ...prev, [paramName]: value }));
      // Auto-run when parameter changes if output is already showing
      if (showOutput) {
        const newParams = { ...paramValues, [paramName]: value };
        const variantOutput = getOutputForParams(sectionId, newParams);
        setCurrentOutput(variantOutput ?? content.output ?? 'No output.');
      }
    },
    [showOutput, paramValues, sectionId, content.output],
  );

  const hasParams = content.parameters && content.parameters.length > 0;

  return (
    <div className={styles.playground}>
      {/* ─── Header ─── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {content.filename && (
            <span className={styles.filename}>{content.filename}</span>
          )}
          <span className={styles.langBadge}>{content.language}</span>
          <span className={styles.playgroundBadge}>▶ Playground</span>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.copyBtn} ${copied ? styles.copyBtnSuccess : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          <button
            type="button"
            className={styles.runBtn}
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <span className={styles.runningSpinner} />
                Running...
              </>
            ) : (
              '▶ Run'
            )}
          </button>
        </div>
      </div>

      {/* ─── Description ─── */}
      {content.description && (
        <p className={styles.description}>{content.description}</p>
      )}

      {/* ─── Code ─── */}
      <pre className={styles.codeArea}>
        <code
          ref={codeRef}
          className={`language-${content.language}`}
        >
          {content.code}
        </code>
      </pre>

      {/* ─── Parameter Controls ─── */}
      {hasParams && (
        <div className={styles.paramsPanel}>
          <span className={styles.paramsPanelTitle}>⚙ Parameters</span>
          {content.parameters!.map((param) => (
            <ParameterControl
              key={param.name}
              param={param}
              value={paramValues[param.name] ?? param.defaultValue}
              onChange={handleParamChange}
            />
          ))}
        </div>
      )}

      {/* ─── Output ─── */}
      {showOutput && (
        <div className={styles.outputPanel}>
          <div className={styles.outputPanelInner}>
            <div className={styles.outputHeader}>
              <span className={styles.outputDot} />
              <span className={styles.outputLabel}>Output</span>
            </div>
            <pre className={styles.outputPre}>{currentOutput}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Parameter Control ─── */

interface ParameterControlProps {
  param: PlaygroundParameter;
  value: number | string;
  onChange: (name: string, value: number | string) => void;
}

function ParameterControl({ param, value, onChange }: ParameterControlProps) {
  if (param.type === 'slider') {
    return (
      <div className={styles.paramRow}>
        <label className={styles.paramLabel} htmlFor={`param-${param.name}`}>
          {param.label}
        </label>
        <input
          id={`param-${param.name}`}
          type="range"
          className={styles.paramSlider}
          min={param.min ?? 0}
          max={param.max ?? 1}
          step={param.step ?? 0.01}
          value={Number(value)}
          onChange={(e) => onChange(param.name, parseFloat(e.target.value))}
        />
        <span className={styles.paramValue}>
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
      </div>
    );
  }

  // Select type
  return (
    <div className={styles.paramRow}>
      <label className={styles.paramLabel} htmlFor={`param-${param.name}`}>
        {param.label}
      </label>
      <select
        id={`param-${param.name}`}
        value={String(value)}
        onChange={(e) => onChange(param.name, e.target.value)}
      >
        {param.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ─── Helpers ─── */

function buildDefaultParams(
  params?: PlaygroundParameter[],
): Record<string, number | string> {
  if (!params) return {};
  const result: Record<string, number | string> = {};
  for (const p of params) {
    result[p.name] = p.defaultValue;
  }
  return result;
}
