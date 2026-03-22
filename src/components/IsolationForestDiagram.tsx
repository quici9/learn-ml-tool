import { useState, useCallback, useEffect, useRef } from 'react';
import styles from './IsolationForestDiagram.module.css';

/**
 * Simple binary tree node for the Isolation Forest visualization.
 * Children are lazily generated to create a visual effect.
 */
interface TreeNode {
  id: string;
  depth: number;
  label: string;
  isLeaf: boolean;
  isAnomaly?: boolean;
  children: [TreeNode, TreeNode] | null;
}

/** Build a small demo tree with fixed structure. */
function buildDemoTree(): TreeNode {
  return {
    id: 'root',
    depth: 0,
    label: 'bytes > 500?',
    isLeaf: false,
    children: [
      {
        id: 'l1',
        depth: 1,
        label: 'port < 1024?',
        isLeaf: false,
        children: [
          {
            id: 'l2',
            depth: 2,
            label: 'duration > 1s?',
            isLeaf: false,
            children: [
              {
                id: 'l3',
                depth: 3,
                label: 'protocol = tcp?',
                isLeaf: false,
                children: [
                  { id: 'l4a', depth: 4, label: 'Normal ✓', isLeaf: true, isAnomaly: false, children: null },
                  { id: 'l4b', depth: 4, label: 'Normal ✓', isLeaf: true, isAnomaly: false, children: null },
                ],
              },
              { id: 'l3b', depth: 3, label: 'Normal ✓', isLeaf: true, isAnomaly: false, children: null },
            ],
          },
          {
            id: 'r2',
            depth: 2,
            label: 'resp_bytes > 10K?',
            isLeaf: false,
            children: [
              { id: 'r3a', depth: 3, label: 'Normal ✓', isLeaf: true, isAnomaly: false, children: null },
              { id: 'r3b', depth: 3, label: 'Normal ✓', isLeaf: true, isAnomaly: false, children: null },
            ],
          },
        ],
      },
      {
        id: 'r1',
        depth: 1,
        label: 'Anomaly ✗',
        isLeaf: true,
        isAnomaly: true,
        children: null,
      },
    ],
  };
}

type PathType = 'normal' | 'anomaly' | null;

// Path IDs for normal (deep) and anomaly (short)
const NORMAL_PATH = ['root', 'l1', 'l2', 'l3', 'l4a'];
const ANOMALY_PATH = ['root', 'r1'];

export function IsolationForestDiagram() {
  const [activePath, setActivePath] = useState<PathType>(null);
  const [visiblePathIdx, setVisiblePathIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tree = buildDemoTree();

  const startAnimation = useCallback(
    (type: PathType) => {
      if (isAnimating) return;
      if (timerRef.current) clearTimeout(timerRef.current);

      setActivePath(type);
      setVisiblePathIdx(0);
      setIsAnimating(true);

      const path = type === 'normal' ? NORMAL_PATH : ANOMALY_PATH;
      let idx = 1;

      const step = () => {
        if (idx >= path.length) {
          setIsAnimating(false);
          return;
        }
        setVisiblePathIdx(idx);
        idx++;
        timerRef.current = setTimeout(step, 500);
      };
      timerRef.current = setTimeout(step, 500);
    },
    [isAnimating],
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActivePath(null);
    setVisiblePathIdx(0);
    setIsAnimating(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const currentPath = activePath === 'normal' ? NORMAL_PATH : activePath === 'anomaly' ? ANOMALY_PATH : [];

  return (
    <div className={styles.diagram}>
      {/* Controls */}
      <div className={styles.controls}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnNormal}`}
          onClick={() => startAnimation('normal')}
          disabled={isAnimating}
        >
          🟢 Normal Path (deep)
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnAnomaly}`}
          onClick={() => startAnimation('anomaly')}
          disabled={isAnimating}
        >
          🔴 Anomaly Path (short)
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnReset}`}
          onClick={reset}
        >
          ↩ Reset
        </button>
      </div>

      {/* Tree visualization */}
      <div className={styles.treeContainer}>
        <TreeNodeView
          node={tree}
          currentPath={currentPath}
          visiblePathIdx={visiblePathIdx}
          pathIndex={0}
        />
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotNormal}`} />
          Normal: cần 4 câu hỏi → path dài → khó cô lập
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotAnomaly}`} />
          Anomaly: chỉ 1 câu hỏi → path ngắn → dễ cô lập
        </span>
      </div>
    </div>
  );
}

/* ─── Tree Node Renderer ─── */

interface TreeNodeViewProps {
  node: TreeNode;
  currentPath: string[];
  visiblePathIdx: number;
  pathIndex: number;
}

function TreeNodeView({ node, currentPath, visiblePathIdx, pathIndex }: TreeNodeViewProps) {
  const isOnPath = currentPath.includes(node.id);
  const nodePathIdx = currentPath.indexOf(node.id);
  const isVisible = nodePathIdx <= visiblePathIdx;
  const isCurrentStep = nodePathIdx === visiblePathIdx && isOnPath;

  const nodeClass = [
    styles.node,
    node.isLeaf ? styles.nodeLeaf : styles.nodeDecision,
    node.isAnomaly === true ? styles.nodeAnomaly : '',
    node.isAnomaly === false && node.isLeaf ? styles.nodeNormal : '',
    isOnPath && isVisible ? styles.nodeActive : '',
    isCurrentStep ? styles.nodePulse : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.nodeGroup}>
      <div className={nodeClass}>
        <span className={styles.nodeLabel}>{node.label}</span>
        {!node.isLeaf && (
          <span className={styles.nodeDepth}>depth {node.depth}</span>
        )}
      </div>

      {node.children && (
        <div className={styles.childrenRow}>
          {node.children.map((child) => (
            <div key={child.id} className={styles.childBranch}>
              <div
                className={`${styles.connector} ${
                  currentPath.includes(child.id) &&
                  currentPath.indexOf(child.id) <= visiblePathIdx
                    ? styles.connectorActive
                    : ''
                }`}
              />
              <TreeNodeView
                node={child}
                currentPath={currentPath}
                visiblePathIdx={visiblePathIdx}
                pathIndex={pathIndex + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
