import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PHASES } from '../constants/lessons-meta';
import { useProgress } from '../stores/progress-store';
import type { LessonStatus } from '../stores/progress-store';
import { Brain, LayoutDashboard, Circle, CircleDashed, CheckCircle2, ChevronRight, Menu, X, Check } from 'lucide-react';
import styles from './Sidebar.module.css';

const STATUS_ICONS: Record<LessonStatus, React.ReactElement> = {
  'not-started': <CircleDashed size={16} />,
  'in-progress': <Circle size={16} />,
  'completed': <CheckCircle2 size={16} />,
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
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
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
            <div className={styles.logoIcon}><Brain size={32} /></div>
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
          <span className={styles.dashboardIcon}><LayoutDashboard size={20} /></span>
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
                className={`${styles.phaseHeader} ${openPhases.has(phase.id) ? styles.phaseHeaderActive : ''}`}
                onClick={() => togglePhase(phase.id)}
                aria-expanded={openPhases.has(phase.id)}
              >
                <div className={styles.phaseHeaderContent}>
                  <div className={styles.phaseTopRow}>
                    <span 
                      className={styles.phaseBadge} 
                      style={{ 
                        color: phase.color, 
                        backgroundColor: `color-mix(in srgb, ${phase.color} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${phase.color} 30%, transparent)`
                      }}
                    >
                      {phase.title}
                    </span>
                    <span className={styles.phaseProgressText}>
                      {completedCount}/{phaseLessons.length}
                    </span>
                  </div>
                  <div className={styles.phaseSubtitle}>{phase.subtitle}</div>
                  <div className={styles.progressBarWrapper}>
                    <div 
                      className={styles.progressBarFill} 
                      style={{ 
                        width: `${(completedCount / phaseLessons.length) * 100}%`, 
                        backgroundColor: phase.color,
                        boxShadow: `0 0 10px color-mix(in srgb, ${phase.color} 50%, transparent)`
                      }} 
                    />
                  </div>
                </div>
                <span
                  className={`${styles.phaseChevron} ${
                    openPhases.has(phase.id) ? styles.phaseChevronOpen : ''
                  }`}
                >
                  <ChevronRight size={16} />
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
                            {isCompleted ? <Check size={14} /> : String(lesson.number).padStart(2, '0')}
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
