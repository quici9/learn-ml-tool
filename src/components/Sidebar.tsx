import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PHASES } from '../constants/lessons-meta';
import { useProgress } from '../stores/progress-store';
import type { LessonStatus } from '../stores/progress-store';
import styles from './Sidebar.module.css';

const STATUS_ICONS: Record<LessonStatus, string> = {
  'not-started': '○',
  'in-progress': '◐',
  'completed': '●',
};

export function Sidebar() {
  const location = useLocation();
  const { getProgress } = useProgress();
  const [openPhases, setOpenPhases] = useState<Set<string>>(
    new Set(['phase-1', 'phase-2', 'phase-3'])
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const togglePhase = (phaseId: string) => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const closeMobile = () => setMobileOpen(false);

  const isLessonActive = (lessonId: string) =>
    location.pathname === `/lesson/${lessonId}`;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      <div
        className={`${styles.overlay} ${mobileOpen ? styles.overlayVisible : ''}`}
        onClick={closeMobile}
      />

      {/* Sidebar */}
      <nav
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}
        aria-label="Lesson navigation"
      >
        {/* Logo */}
        <div className={styles.header}>
          <NavLink to="/" className={styles.logo} onClick={closeMobile}>
            <div className={styles.logoIcon}>🧠</div>
            <div>
              <div className={styles.logoText}>ML Learning Hub</div>
              <div className={styles.logoSubtext}>Interactive • Visual • Practical</div>
            </div>
          </NavLink>
        </div>

        {/* Dashboard link */}
        <NavLink
          to="/dashboard"
          className={`${styles.dashboardLink} ${
            location.pathname === '/dashboard' ? styles.dashboardLinkActive : ''
          }`}
          onClick={closeMobile}
        >
          <span className={styles.dashboardIcon}>📊</span>
          <span>Tiến độ học tập</span>
        </NavLink>

        {/* Phase groups */}
        {PHASES.map((phase) => {
          const phaseLessons = phase.lessons;
          const completedCount = phaseLessons.filter(
            (l) => getProgress(l.id).status === 'completed'
          ).length;

          return (
            <div key={phase.id} className={styles.phaseGroup}>
              <button
                className={styles.phaseHeader}
                onClick={() => togglePhase(phase.id)}
                aria-expanded={openPhases.has(phase.id)}
              >
                <span
                  className={styles.phaseDot}
                  style={{ backgroundColor: phase.color }}
                />
                <span className={styles.phaseLabel}>
                  <span className={styles.phaseTitle}>{phase.title}</span>
                  <span className={styles.phaseSubtitle}>
                    {phase.subtitle} · {completedCount}/{phaseLessons.length}
                  </span>
                </span>
                <span
                  className={`${styles.phaseChevron} ${
                    openPhases.has(phase.id) ? styles.phaseChevronOpen : ''
                  }`}
                >
                  ▶
                </span>
              </button>

              {openPhases.has(phase.id) && (
                <ul className={styles.lessonList}>
                  {phase.lessons.map((lesson) => {
                    const progress = getProgress(lesson.id);
                    const statusIcon = STATUS_ICONS[progress.status];
                    const isCompleted = progress.status === 'completed';

                    return (
                      <li key={lesson.id}>
                        <NavLink
                          to={`/lesson/${lesson.id}`}
                          className={`${styles.lessonItem} ${
                            isLessonActive(lesson.id) ? styles.lessonItemActive : ''
                          }`}
                          onClick={closeMobile}
                        >
                          <span
                            className={`${styles.lessonNumber} ${
                              isCompleted ? styles.lessonNumberCompleted : ''
                            }`}
                          >
                            {isCompleted ? '✓' : String(lesson.number).padStart(2, '0')}
                          </span>
                          <span className={styles.lessonTitle}>{lesson.title}</span>
                          <span
                            className={`${styles.progressIcon} ${
                              isCompleted ? styles.progressIconCompleted : ''
                            }`}
                            title={progress.status.replace('-', ' ')}
                          >
                            {statusIcon}
                          </span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}
