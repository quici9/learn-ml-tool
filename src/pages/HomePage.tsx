import { Link } from 'react-router-dom';
import { PHASES } from '../constants/lessons-meta';
import styles from './HomePage.module.css';

const TOTAL_LESSONS = 11;
const TOTAL_PHASES = 3;
const ESTIMATED_WEEKS = '8-10';

export function HomePage() {
  return (
    <div className={styles.homePage}>
      {/* Background ambient orbs */}
      <div className={styles.ambientOrb} style={{ top: '-10%', left: '20%', background: 'var(--color-phase-1)' }} />
      <div className={styles.ambientOrb} style={{ top: '40%', right: '-10%', background: 'var(--color-phase-2)' }} />
      <div className={styles.ambientOrb} style={{ bottom: '-20%', left: '50%', background: 'var(--color-phase-3)' }} />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.badgePulse}></span>
          Interactive Learning Experience
        </div>
        <h1 className={styles.heroTitle}>
          Master ML with <br/> Intuitive Visuals
        </h1>
        <p className={styles.heroSubtitle}>
          From basic Python to advanced MLOps. Learn through interactive diagrams,
          real-time code playgrounds, and visual thresholds instead of just reading math.
        </p>
        <div className={styles.heroActions}>
          <Link to={`/lesson/01-python-data-science`} className={styles.primaryButton}>
            Start Learning
          </Link>
          <a href="#curriculum" className={styles.secondaryButton}>
            View Curriculum
          </a>
        </div>
      </section>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{TOTAL_LESSONS}</div>
          <div className={styles.statLabel}>Interactive Lessons</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{TOTAL_PHASES}</div>
          <div className={styles.statLabel}>Core Phases</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{ESTIMATED_WEEKS}</div>
          <div className={styles.statLabel}>Weeks Duration</div>
        </div>
      </div>

      {/* Curriculum / Phase Cards */}
      <section id="curriculum" className={styles.curriculumSection}>
        <h2 className={styles.sectionTitle}>The Curriculum</h2>
        <div className={styles.phaseCards}>
          {PHASES.map((phase, index) => {
            const phaseColorVar = `var(--color-phase-${index + 1})`;
            return (
              <Link
                key={phase.id}
                to={`/lesson/${phase.lessons[0]?.id ?? ''}`}
                className={styles.phaseCard}
              >
                {/* Glowing border top */}
                <div 
                  className={styles.cardGlow} 
                  style={{ background: phaseColorVar, boxShadow: `0 0 20px ${phaseColorVar}` }} 
                />
                
                <div className={styles.cardContent}>
                  <div className={styles.phaseNumber} style={{ color: phaseColorVar }}>
                    Phase 0{index + 1}
                  </div>
                  <h3 className={styles.phaseCardTitle}>{phase.title}</h3>
                  <p className={styles.phaseCardSubtitle}>{phase.subtitle}</p>
                  
                  <div className={styles.cardFooter}>
                    <span className={styles.lessonCount}>{phase.lessons.length} Modules</span>
                    <span className={styles.cardArrow} style={{ color: phaseColorVar }}>→</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  );
}
