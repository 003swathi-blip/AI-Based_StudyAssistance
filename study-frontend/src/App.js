import 'bootstrap-icons/font/bootstrap-icons.css';
import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import logo from './assets/Logo.jpg';

// Imported modular components
import Dashboard from "./component/Dashboard";
import Profile from "./component/Profile";
import History from "./component/History";
import Login from "./component/Login";
import Register from "./component/Register";
import AiTutor from './component/AiTutor';
import Summarizer from './component/Summarizer';
import QuizGenerator from './component/QuizGenerator';
import QuestionAnswering from './component/QuestionAnswering';
import StudyPlan from './component/StudyPlan';
import StudySessions from "./component/StudySessions";

function App() {
  const [view, setView] = useState('home'); 
  const [selectedSubject, setSelectedSubject] = useState('Computer Science');
  const [activePlan, setActivePlan] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('activeStudyPlan')) || null;
    } catch {
      return null;
    }
  });
  const [resetTrigger, setResetTrigger] = useState(false);

  const [stats, setStats] = useState({
    studySessions: 0,
    pdfs: 0,
    quizzes: 0,
    aiQuestions: 0,
    flashcards: 0,
    questionAnswers: 0,
    loginCount: 0,
    totalStudyMinutes: 0,
    createdAt: "",
    lastLogin: "",
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('userLoggedIn') === 'true';
  });

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  };

  // Load user stats automatically on initial render or login
  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.email) {
      const key = `stats_${user.email}`;
      const savedStats = JSON.parse(localStorage.getItem(key));
      if (savedStats) {
        setStats(savedStats);
      }
    }
  }, [isLoggedIn]);

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    localStorage.setItem("user", JSON.stringify({ name: userData.name, email: userData.email }));
    localStorage.setItem("userLoggedIn", "true");
    
    const key = `stats_${userData.email}`;
    let dashboard = JSON.parse(localStorage.getItem(key)) || {
      studySessions: 0, pdfs: 0, quizzes: 0, aiQuestions: 0, flashcards: 0, questionAnswers: 0, loginCount: 0, totalStudyMinutes: 0, createdAt: new Date().toLocaleString(), lastLogin: ""
    };

    if (!dashboard.createdAt) {
      dashboard.createdAt = new Date().toLocaleString();
    }
    
    dashboard.loginCount += 1;
    dashboard.lastLogin = new Date().toLocaleString();
    localStorage.setItem(key, JSON.stringify(dashboard));
    setStats(dashboard);
    switchView("profile");
  };

  const handleRegisterSuccess = (userData) => {
    handleLoginSuccess(userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('user');
    alert("You have been logged out.");
    switchView('home');
  };

  const updateStats = useCallback((type) => {
    const user = getCurrentUser();
    if (!user) return;
    const key = `stats_${user.email}`;
    let dashboard = JSON.parse(localStorage.getItem(key)) || { ...stats };
    
    switch(type){
      case "session":
      case "studySessions": dashboard.studySessions = (dashboard.studySessions || 0) + 1; break;
      case "pdf": dashboard.pdfs = (dashboard.pdfs || 0) + 1; break;
      case "quiz": dashboard.quizzes = (dashboard.quizzes || 0) + 1; break;
      case "ai": dashboard.aiQuestions = (dashboard.aiQuestions || 0) + 1; break;
      case "question": dashboard.questionAnswers = (dashboard.questionAnswers || 0) + 1; break;
      case "flashcards": 
      case "plan": dashboard.flashcards = (dashboard.flashcards || 0) + 1; break;
      default: break;
    }
    localStorage.setItem(key, JSON.stringify(dashboard));
    setStats(dashboard);
  }, [stats]);

  const saveActivity = useCallback((type, title, content = "") => {
    try {
      const user = getCurrentUser();
      if (!user || !user.email) return;
      const key = `activities_${user.email}`;
      let activities = [];
      try {
        const storedActivities = localStorage.getItem(key);
        activities = storedActivities ? JSON.parse(storedActivities) : [];
      } catch {
        activities = [];
      }
      activities.unshift({ type, title, content, date: new Date().toLocaleString() });
      localStorage.setItem(key, JSON.stringify(activities.slice(0, 20)));
    } catch (err) {
      console.error("Error saving activity:", err);
    }
  }, []);

  const saveUserStats = (dashboard) => {
    const user = getCurrentUser();
    if (!user) return;
    localStorage.setItem(`stats_${user.email}`, JSON.stringify(dashboard));
    setStats(dashboard);
  };

  // Study Timer Interval: Adds minutes directly to totalStudyMinutes & localStorage
  useEffect(() => {
    const studyViews = ["quiz", "questions", "summarize", "qa", "plan", "sessions"];
    let interval = null;
    if (studyViews.includes(view) && isLoggedIn) {
      interval = setInterval(() => {
        const user = getCurrentUser();
        if (!user) return;
        const key = `stats_${user.email}`;
        let dashboard = JSON.parse(localStorage.getItem(key)) || { ...stats };
        
        dashboard.totalStudyMinutes = (dashboard.totalStudyMinutes || 0) + 1;
        localStorage.setItem(key, JSON.stringify(dashboard));
        setStats({ ...dashboard });
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [view, isLoggedIn, stats]);

  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const switchView = (targetView) => {
    const restrictedViews = ['qa', 'summarize', 'quiz', 'plan', 'questions', 'dashboard', 'sessions'];
    if (restrictedViews.includes(targetView) && !isLoggedIn) {
      alert("Please sign up or login first to access this feature!");
      switchView('login');
      return;
    }
    
    const studyTools = ['qa', 'summarize', 'quiz', 'plan', 'questions', 'sessions'];
    if (studyTools.includes(targetView) && isLoggedIn) {
      updateStats("session");
    }

    setView(targetView);
  };

  const handleResetCurrentView = () => {
    setResetTrigger(true);
  };

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <nav className="side-navbar">
        <ul className="nav-menu">
          <li className="nav-link-item" title="Sign Up / Login" onClick={() => switchView("login")}>
            <span className="nav-icon"><i className="bi bi-person-plus"></i></span>
          </li>
          <li className={`nav-link-item ${view === 'home' ? 'active' : ''}`} onClick={() => switchView('home')} title="Home">
            <span className="nav-icon"><i className="bi bi-house"></i></span>
          </li>
          <li className={`nav-link-item ${view === 'plan' ? 'active' : ''}`} onClick={() => switchView('plan')} title="Study Plan">
            <span className="nav-icon"><i className="bi bi-mortarboard"></i></span>
          </li>
          <li className={`nav-link-item ${view === 'sessions' ? 'active' : ''}`} onClick={() => switchView('sessions')} title="Study Sessions">
            <span className="nav-icon"><i className="bi bi-clock-history"></i></span>
          </li>
          <li className={`nav-link-item ${view === 'qa' ? 'active' : ''}`} onClick={() => switchView('qa')} title="Question Answering">
            <span className="nav-icon"><i className="bi bi-book"></i></span>
          </li>
          <li className={`nav-link-item ${view === 'summarize' ? 'active' : ''}`} onClick={() => switchView('summarize')} title="Summarize PDF/Text">
            <span className="nav-icon"><i className="bi bi-file-earmark-text"></i></span>
          </li>
          <li className={`nav-link-item ${view === 'quiz' ? 'active' : ''}`} onClick={() => switchView('quiz')} title="Quiz Generator">
            <span className="nav-icon"><i className="bi bi-question-circle"></i></span>
          </li>
          <li className={`nav-link-item ai-tutor-item ${view === 'questions' ? 'active' : ''}`} onClick={() => switchView('questions')} title="AI Tutor">
            <span className="nav-icon"><i className="bi bi-robot"></i></span>
          </li>
          <li className={`nav-link-item ${view === 'history' ? 'active' : ''}`} onClick={() => switchView('history')} title="History">
            <span className="nav-icon"><i className="bi bi-clock-history"></i></span>
          </li>
          {isLoggedIn && (
            <li className="nav-link-item" onClick={handleLogout} style={{ marginTop: 'auto', color: '#ef4444' }} title="Log out">
              <span className="nav-icon"><i className="bi bi-box-arrow-right"></i></span>
            </li>
          )}
        </ul>

        {/* Theme Toggle Section */}
        <div className="theme-toggle-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
            <i className={`bi ${isDarkMode ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`}></i>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </nav>

      {/* VIEWPORT */}
      <div className="study-app-wrapper">
        {activePlan && view !== 'history' && view !== 'home' && view !== 'login' && view !== 'register' && view !== 'dashboard' && view !== 'sessions' && (
          <div className="active-study-plan-banner">
            <div><i className="bi bi-pin-angle-fill" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i><strong>Active Study Plan:</strong> {activePlan.syllabus} ({activePlan.subject})</div>
            <button className="btn-outline-danger" onClick={() => { setActivePlan(null); localStorage.removeItem('activeStudyPlan'); }}>
              <i className="bi bi-x-circle" style={{ marginRight: '4px' }}></i> Clear Plan
            </button>
          </div>
        )}

        {view === 'home' ? (
          <div className="home-menu-grid">
            <div className="hub-header-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <img src={logo} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
              <div>
                <h1 className="main-title" style={{ margin: 0 }}>Study Assistant Hub</h1>
                <p className="main-subtitle" style={{ margin: 0, color: 'var(--text-muted)' }}>
                  Multi-Subject AI Framework anchored to your active study roadmap
                </p>
              </div>
            </div>
            <div className="grid-layout">
              <div className="menu-card" onClick={() => switchView('login')}>
                <div className="card-icon" style={{color: '#10b981'}}><i className="bi bi-box-arrow-in-right"></i></div>
                <h3>Login / Register</h3>
                <p>Login or create an account to save your study sessions</p>
              </div>
              <div className="menu-card" onClick={() => switchView("dashboard")}>
                <div className="card-icon" style={{ color: "#2563eb" }}><i className="bi bi-speedometer2"></i></div>
                <h3>Dashboard</h3>
                <p>View your profile, statistics and recent activity</p>
              </div>
              <div className="menu-card" onClick={() => switchView('plan')}>
                <div className="card-icon" style={{color: '#3b82f6'}}><i className="bi bi-calculator"></i></div>
                <h3>Create a Study Plan</h3>
                <p>Map targeted milestone tracks between future dates</p>
              </div>
              <div className="menu-card" onClick={() => switchView('sessions')}>
                <div className="card-icon" style={{color: '#8b5cf6'}}><i className="bi bi-clock-history"></i></div>
                <h3>Study Sessions</h3>
                <p>Monitor your active engagement block metrics</p>
              </div>
              <div className="menu-card" onClick={() => switchView('questions')}>
                <div className="card-icon" style={{color: '#ef4444'}}><i className="bi bi-robot"></i></div>
                <h3>AI Tutor</h3>
                <p>Interactive multi-subject guidance with speech & media</p>
              </div>
              <div className="menu-card" onClick={() => switchView('summarize')}>
                <div className="card-icon" style={{color: '#f97316'}}><i className="bi bi-file-earmark-text"></i></div>
                <h3>Summarize PDF / Image</h3>
                <p>Condense lengthy documents and visual assignments instantly</p>
              </div>
              <div className="menu-card" onClick={() => switchView('quiz')}>
                <div className="card-icon" style={{color: '#ec4899'}}><i className="bi bi-question-circle"></i></div>
                <h3>Contextual Quizzes</h3>
                <p>Generate session or timed tests derived from active plans</p>
              </div>
              <div className="menu-card" onClick={() => switchView('qa')}>
                <div className="card-icon" style={{color: '#06b6d4'}}><i className="bi bi-search"></i></div>
                <h3>Structured Q&A</h3>
                <p>Resolve targeted structural checkpoints from context parameters</p>
              </div>
            </div>
          </div>
        ) : view === "profile" ? (
          <Profile user={getCurrentUser()} stats={stats} handleLogout={handleLogout} switchView={switchView} />
        ) : view === "dashboard" ? (
          <Dashboard switchView={switchView} stats={stats} />
        ) : view === "sessions" ? (
          <StudySessions 
            sessionId="session_123"
            onSessionFailed={(msg) => alert(msg)}
            stats={stats} 
            switchView={switchView}
            renderQuizComponent={() => (
              <QuizGenerator 
                selectedSubject={selectedSubject} 
                activePlan={activePlan} 
                stats={stats} 
                saveUserStats={saveUserStats} 
                saveActivity={saveActivity}
                resetTrigger={resetTrigger}
                setResetTrigger={setResetTrigger}
              />
            )}
          />
        ) : view === "history" ? (
          <History user={getCurrentUser()} />
        ) : view === "login" ? (
          <div className="workspace-container">
            <Login onLoginSuccess={handleLoginSuccess} switchView={switchView} />
          </div>
        ) : view === "register" ? (
          <div className="workspace-container">
            <Register onRegisterSuccess={handleRegisterSuccess} switchView={switchView} />
          </div>
        ) : (
          <div className="workspace-container">
            <div className="feature-card-modal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ flex: 1, marginRight: '10px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Academic Subject Focus:</label>
                  <select className="modal-input-element" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="History">History</option>
                    <option value="Literature">Literature</option>
                    <option value="Economics">Economics</option>
                    <option value="General Studies">General Studies</option>
                  </select>
                </div>
                <button 
                  onClick={handleResetCurrentView}
                  className="btn btn-sm btn-outline-secondary"
                  style={{ height: '38px', marginTop: '22px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  title="Reset current view fields"
                >
                  <i className="bi bi-arrow-counterclockwise"></i> Reset
                </button>
              </div>

              {view === 'questions' && (
                <AiTutor 
                  selectedSubject={selectedSubject} 
                  activePlan={activePlan} 
                  stats={stats} 
                  updateStats={updateStats} 
                  saveActivity={saveActivity} 
                  saveUserStats={saveUserStats}
                  resetTrigger={resetTrigger}
                  setResetTrigger={setResetTrigger}
                />
              )}

              {view === 'summarize' && (
               <Summarizer 
                  selectedSubject={selectedSubject} 
                  activePlan={activePlan} 
                  updateStats={updateStats} 
                  saveActivity={saveActivity} 
                  resetTrigger={resetTrigger}
                  setResetTrigger={setResetTrigger}
               />
              )}

              {view === 'plan' && (
                <StudyPlan 
                  selectedSubject={selectedSubject} 
                  activePlan={activePlan} 
                  setActivePlan={setActivePlan} 
                  updateStats={updateStats} 
                  saveActivity={saveActivity} 
                  resetTrigger={resetTrigger}
                  setResetTrigger={setResetTrigger}
                />
              )}

              {view === 'qa' && (
                <QuestionAnswering 
                  selectedSubject={selectedSubject} 
                  activePlan={activePlan} 
                  updateStats={updateStats} 
                  saveActivity={saveActivity} 
                  resetTrigger={resetTrigger}
                  setResetTrigger={setResetTrigger}
                />
              )}

              {view === "quiz" && (
                <QuizGenerator 
                  selectedSubject={selectedSubject} 
                  activePlan={activePlan} 
                  stats={stats} 
                  saveUserStats={saveUserStats} 
                  saveActivity={saveActivity}
                  resetTrigger={resetTrigger}
                  setResetTrigger={setResetTrigger}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;