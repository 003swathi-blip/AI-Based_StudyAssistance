import React, { useState, useEffect, useCallback } from 'react';

export default function QuizGenerator({ selectedSubject, activePlan, stats, saveUserStats, saveActivity, resetTrigger, setResetTrigger }) {
  const [quizText, setQuizText] = useState('');
  const [quizLevel, setQuizLevel] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [parsedQuiz, setParsedQuiz] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTimerActive, setQuizTimerActive] = useState(false);
  const [quizSecondsTaken, setQuizSecondsTaken] = useState(0);
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Listen for reset trigger from parent App.jsx
  useEffect(() => {
    if (resetTrigger) {
      setQuizText('');
      setQuizLevel('Medium');
      setQuestionCount(5);
      setParsedQuiz([]);
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setQuizScore(0);
      setQuizTimerActive(false);
      setQuizSecondsTaken(0);
      setCustomStartTime('');
      setCustomEndTime('');
      setErrorMessage('');

      if (typeof setResetTrigger === 'function') {
        setResetTrigger(false);
      }
    }
  }, [resetTrigger, setResetTrigger]);

  const getEndTimePlusTwoMinutes = (date = new Date()) => {
    const futureDate = new Date(date.getTime() + 2 * 60000); 
    return futureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleSubmitQuiz = useCallback(() => {
    let scoreCount = 0;
    parsedQuiz.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        scoreCount += 1;
      }
    });
    setQuizScore(scoreCount);
    setQuizSubmitted(true);
    setQuizTimerActive(false);
    setCustomEndTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    saveUserStats({ ...stats, quizzes: (stats.quizzes || 0) + 1 });
    saveActivity("Quiz Completed", `Scored ${scoreCount}/${parsedQuiz.length}`, `Subject: ${selectedSubject} | Score: ${scoreCount}/${parsedQuiz.length}`);
  }, [parsedQuiz, selectedAnswers, selectedSubject, stats, saveUserStats, saveActivity]);

  useEffect(() => {
    let quizInterval = null;
    if (quizTimerActive) {
      quizInterval = setInterval(() => {
        setQuizSecondsTaken((prev) => {
          if (prev >= 119) { 
            clearInterval(quizInterval);
            handleSubmitQuiz(); 
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(quizInterval);
    }
    return () => clearInterval(quizInterval);
  }, [quizTimerActive, handleSubmitQuiz]);

  const formatQuizTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const handleOptionClick = (questionIndex, optionLetter) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionLetter }));
  };

  const handleRetakeQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizSecondsTaken(0);
    setQuizTimerActive(true);
    const now = new Date();
    setCustomStartTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setCustomEndTime(getEndTimePlusTwoMinutes(now));
  };

  const handleGenerateQuiz = async () => {
    const targetText = quizText.trim() || (activePlan ? activePlan.topics : '');
    if (!targetText) {
      setErrorMessage("Please enter a custom topic, notes, or create an active study plan first.");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`http://localhost:5000/api/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: targetText, 
          level: quizLevel, 
          count: questionCount,
          subject: selectedSubject,
          activePlan: activePlan 
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || data.message || "Request Failed");
        return;
      }
      saveActivity("Quiz", quizText || (activePlan ? activePlan.syllabus : selectedSubject), `Subject: ${selectedSubject} | Level: ${quizLevel} | Questions: ${questionCount}`);
      const newStats = { ...stats, quizzes: (stats.quizzes || 0) + 1, studySessions: (stats.studySessions || 0) + 1 };
      saveUserStats(newStats);
      setParsedQuiz(data.quiz);
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setQuizScore(0);
      setQuizSecondsTaken(0);
      setQuizTimerActive(true);
      const now = new Date();
      setCustomStartTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCustomEndTime(getEndTimePlusTwoMinutes(now));
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="modal-header-title">Contextual Quiz Generator ({selectedSubject})</h2>
      {parsedQuiz.length === 0 ? (
        <>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {activePlan ? `✨ Dynamically derived from your active plan: "${activePlan.syllabus}"` : 'Enter a topic or attach notes below.'}
          </p>
          <textarea 
            className="modal-textarea-field" 
            placeholder={activePlan ? `Using active plan topics: ${activePlan.topics}` : "Paste notes or enter custom topic..."} 
            value={quizText} 
            onChange={(e) => setQuizText(e.target.value)} 
          />
          <select className="modal-input-element" value={quizLevel} onChange={(e) => setQuizLevel(e.target.value)}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select className="modal-input-element" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
            <option value={5}>5 Questions</option>
            <option value={10}>10 Questions</option>
            <option value={15}>15 Questions</option>
            <option value={20}>20 Questions</option>
          </select>
          <button className="modal-action-btn" disabled={isLoading} onClick={handleGenerateQuiz}>
            {isLoading ? "Generating..." : "Generate Contextual Quiz"}
          </button>
          {errorMessage && <div className="error-message" style={{ color: '#ef4444', marginTop: '10px' }}>{errorMessage}</div>}
        </>
      ) : (
        <div className="quiz-render-container" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span><i className="bi bi-clock-history"></i> Start Time:</span>
              <input type="text" value={customStartTime} onChange={(e) => setCustomStartTime(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span><i className="bi bi-flag-fill"></i> End Time:</span>
              <input type="text" value={customEndTime} onChange={(e) => setCustomEndTime(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
            </div>
            <span><i className="bi bi-stopwatch"></i> Total Time Taken: <strong>{formatQuizTimer(quizSecondsTaken)}</strong></span>
            {quizSubmitted && <span><i className="bi bi-trophy-fill"></i> Score: <strong>{quizScore} / {parsedQuiz.length}</strong></span>}
          </div>
          {parsedQuiz.map((q, index) => {
            const optionsData = Array.isArray(q.options) 
              ? q.options.reduce((acc, opt, i) => {
                  acc[String.fromCharCode(65 + i)] = opt;
                  return acc;
                }, {})
              : (q.options || {});
            return (
              <div key={index} style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                <p style={{ fontWeight: '600', color: 'var(--text-main)' }}>{index + 1}. {q.question}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {Object.entries(optionsData).map(([letter, option]) => {
                    const isSelected = selectedAnswers[index] === letter;
                    const isCorrect = q.correctAnswer === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => handleOptionClick(index, letter)}
                        disabled={quizSubmitted}
                        style={{
                          display: "block", width: "100%", marginBottom: "10px", padding: "12px",
                          textAlign: "left", cursor: quizSubmitted ? "default" : "pointer",
                          border: "2px solid var(--border-color)", borderRadius: "10px", fontSize: "16px", fontWeight: "500",
                          backgroundColor: quizSubmitted ? (isCorrect ? "#22c55e" : isSelected ? "#ef4444" : "var(--bg-card)") : (isSelected ? "#2563eb" : "var(--bg-card)"),
                          color: quizSubmitted ? ((isCorrect || isSelected) ? "#ffffff" : "var(--text-main)") : (isSelected ? "#ffffff" : "var(--text-main)"),
                        }}
                      >
                        <strong>{letter}.</strong> {typeof option === "object" && option !== null ? option.text : option}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && (
                  <div style={{ marginTop: "10px", background: "var(--bg-app)", padding: "10px", borderRadius: "8px", color: "var(--text-main)", border: "1px solid var(--border-color)" }}>
                    <b>Correct Answer:</b> {q.correctAnswer}<br />
                    <b>Explanation:</b> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
          {!quizSubmitted ? (
            <button className="modal-action-btn" onClick={handleSubmitQuiz} style={{ marginTop: '15px' }}>Submit Quiz</button>
          ) : (
            <button className="modal-action-btn" onClick={handleRetakeQuiz} style={{ marginTop: '15px' }}>Retake Quiz</button>
          )}
        </div>
      )}
    </>
  );
}