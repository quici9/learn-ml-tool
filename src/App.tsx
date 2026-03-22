import { HashRouter, Routes, Route } from 'react-router-dom';
import { ProgressProvider } from './stores/progress-store';
import { Sidebar } from './components/Sidebar';
import { LessonView } from './components/LessonView';
import { HomePage } from './pages/HomePage';
import { ProgressDashboard } from './pages/ProgressDashboard';

export function App() {
  return (
    <HashRouter>
      <ProgressProvider>
        <div className="app-layout">
          <Sidebar />
          <main className="app-main">
            <div className="app-main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<ProgressDashboard />} />
                <Route path="/lesson/:lessonId" element={<LessonView />} />
              </Routes>
            </div>
          </main>
        </div>
      </ProgressProvider>
    </HashRouter>
  );
}
