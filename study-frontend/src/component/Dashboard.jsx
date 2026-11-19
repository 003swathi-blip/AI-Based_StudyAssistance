import React from 'react';
import './Dashboard.css';

function Dashboard({ switchView, stats }) {
  const GOALS = {
    studySessions: 20,
    quizzes: 10,
    aiQuestions: 20,
    pdfs: 10,
    studyPlans: 5
  };

  const getProgress = (current, target) => Math.min(Math.round((current / target) * 100), 100);

  const progressData = {
    sessions: getProgress(stats.studySessions || 0, GOALS.studySessions),
    quizzes: getProgress(stats.quizzes || 0, GOALS.quizzes),
    ai: getProgress(stats.aiQuestions || 0, GOALS.aiQuestions),
    pdfs: getProgress(stats.pdfs || 0, GOALS.pdfs)
  };

  const overallProgress = Math.round(
    (progressData.sessions + progressData.quizzes + progressData.ai + progressData.pdfs) / 4
  );

  const circleRadius = 45;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset = circleCircumference - (overallProgress / 100) * circleCircumference;

  return (
    <div className="workspace-container">
      <div className="dashboard" style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Welcome Section */}
        <div className="welcome-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>User Dashboard & Statistics</h1>
            <p style={{ margin: '5px 0 15px', opacity: 0.9 }}>Monitor your progress, milestones, and engagement.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-light" onClick={() => switchView('plan')} style={{ background: '#fff', color: '#2563eb', fontWeight: '600', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                <i className="bi bi-mortarboard" style={{ marginRight: '5px' }}></i> Active Study Plan
              </button>
              <button className="btn btn-outline-light" onClick={() => switchView('sessions')} style={{ background: 'transparent', color: '#fff', fontWeight: '600', border: '1px solid rgba(255,255,255,0.4)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                <i className="bi bi-clock-history" style={{ marginRight: '5px' }}></i> View Sessions
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.1)', padding: '15px 20px', borderRadius: '12px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={circleRadius} stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                <circle 
                  cx="50" cy="50" r={circleRadius} 
                  stroke="#10b981" 
                  strokeWidth="8" 
                  fill="none" 
                  strokeDasharray={circleCircumference} 
                  strokeDashoffset={circleOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>
                {overallProgress}%
              </div>
            </div>
            <div>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#fff' }}>Overall Mastery</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8, color: '#fff' }}>Based on completed targets</p>
            </div>
          </div>
        </div>

        {/* Milestone Progress Bars (Fixed with explicit background fills) */}
        <div className="dashboard-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, marginBottom: '20px' }}>
            <i className="bi bi-bullseye" style={{ color: 'var(--primary-color)' }}></i> Actual Progression Milestones
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {[
              { label: 'Study Sessions', current: stats.studySessions || 0, target: GOALS.studySessions, progress: progressData.sessions, color: '#3b82f6' },
              { label: 'Quizzes Passed', current: stats.quizzes || 0, target: GOALS.quizzes, progress: progressData.quizzes, color: '#10b981' },
              { label: 'AI Tutor Questions', current: stats.aiQuestions || 0, target: GOALS.aiQuestions, progress: progressData.ai, color: '#8b5cf6' },
              { label: 'PDFs Summarized', current: stats.pdfs || 0, target: GOALS.pdfs, progress: progressData.pdfs, color: '#f97316' },
            ].map((item, index) => (
              <div key={index} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>
                  <span>{item.label}</span>
                  <span>{item.current} / {item.target}</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.max(item.progress, 3)}%`, 
                    backgroundColor: item.color, 
                    borderRadius: '6px',
                    transition: 'width 0.8s ease-in-out' 
                  }}></div>
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* Lifetime Statistics */}
        <div className="dashboard-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
            <i className="bi bi-bar-chart-fill" style={{ color: 'var(--primary-color)' }}></i> Lifetime Statistics
          </h3>
          <div className="stats-grid">
            {/* <div className="stat-card blue">
              <i className="bi bi-clock-history"></i>
              <h2>{stats.totalStudyMinutes || 0}m</h2>
              <p>Total Study Time</p>
            </div> */}
            <div className="stat-card green">
              <i className="bi bi-check2-square"></i>
              <h2>{stats.quizzes || 0}</h2>
              <p>Quizzes Passed</p>
            </div>
            <div className="stat-card purple">
              <i className="bi bi-robot"></i>
              <h2>{stats.aiQuestions || 0}</h2>
              <p>AI Queries Solved</p>
            </div>
            <div className="stat-card pink">
              <i className="bi bi-calendar-check"></i>
              <h2>{stats.flashcards || 0}</h2>
              <p>Study Plans Created</p>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="dashboard-section">
          <h3 style={{ marginTop: 0 }}>Account Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', color: 'var(--text-color)' }}>
            <div style={{ background: 'var(--bg-secondary, #f8fafc)', padding: '15px', borderRadius: '8px' }}>
              <strong>Total Logins:</strong> <br/>{stats.loginCount || 1}
            </div>
            <div style={{ background: 'var(--bg-secondary, #f8fafc)', padding: '15px', borderRadius: '8px' }}>
              <strong>Account Created:</strong> <br/>{stats.createdAt || 'N/A'}
            </div>
            <div style={{ background: 'var(--bg-secondary, #f8fafc)', padding: '15px', borderRadius: '8px' }}>
              <strong>Last Login:</strong> <br/>{stats.lastLogin || 'Just now'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;