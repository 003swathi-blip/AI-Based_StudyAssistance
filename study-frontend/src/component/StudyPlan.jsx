import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function StudyPlan({ selectedSubject, activePlan, setActivePlan, updateStats, saveActivity, resetTrigger, setResetTrigger }) {
  const [planSyllabus, setPlanSyllabus] = useState('');
  const [planTopics, setPlanTopics] = useState('');
  const [planStart, setPlanStart] = useState('');
  const [planEnd, setPlanEnd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (resetTrigger) {
      setPlanSyllabus('');
      setPlanTopics('');
      setPlanStart('');
      setPlanEnd('');
      setResult('');
      setErrorMessage('');
      if (typeof setResetTrigger === 'function') {
        setResetTrigger(false);
      }
    }
  }, [resetTrigger, setResetTrigger, setActivePlan]);

  const todayDateStr = new Date().toISOString().split("T")[0];

  const handleCreatePlan = async () => {
    if (!planSyllabus.trim()) {
      setErrorMessage("Please enter a syllabus title.");
      return;
    }
    if (!planTopics.trim()) {
      setErrorMessage("Please enter at least one topic or syllabus objective.");
      return;
    }
    if (!planStart) {
      setErrorMessage("Please select a start date.");
      return;
    }
    if (!planEnd) {
      setErrorMessage("Please select an end date.");
      return;
    }
    if (new Date(planEnd) < new Date(planStart)) {
      setErrorMessage("End date cannot be earlier than the start date.");
      return;
    }

    setIsLoading(true);
    setResult('');
    setErrorMessage('');

    try {
      const response = await fetch(`http://localhost:5000/api/generate-plan`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          syllabus: planSyllabus, 
          topics: planTopics, 
          startDate: planStart, 
          endDate: planEnd,
          subject: selectedSubject,
          activePlan: activePlan 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || data.message || "Request Failed");
        return;
      }

      const planData = { 
        syllabus: planSyllabus, 
        topics: planTopics, 
        subject: selectedSubject, 
        start: planStart, 
        end: planEnd, 
        reply: data.reply 
      };

      setActivePlan(planData);
      localStorage.setItem('activeStudyPlan', JSON.stringify(planData));
      setResult(data.reply);
      
      // FIX: Increments Study Plans Created counter and lifetime stats immediately
      if (typeof updateStats === 'function') {
        updateStats("flashcards");
      }

      saveActivity(
        "Study Planner", 
        `Generated plan for ${planSyllabus}`, 
        `Subject: ${selectedSubject}\nTopics: ${planTopics}\nDuration: ${planStart} to ${planEnd}\n\nPlan Details:\n${data.reply}`
      );

    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="modal-header-title">Create a Study Plan ({selectedSubject})</h2>
      
      <input 
        className="modal-input-element" 
        type="text" 
        placeholder="Syllabus Title (e.g. Advanced Calculus)" 
        value={planSyllabus} 
        onChange={(e) => setPlanSyllabus(e.target.value)} 
      />

      <textarea 
        className="modal-textarea-field" 
        placeholder="Topics to cover..." 
        value={planTopics} 
        onChange={(e) => setPlanTopics(e.target.value)} 
      />

      <div style={{ display: 'flex', gap: '10px' }}>
        <input 
          className="modal-input-element" 
          type="date" 
          min={todayDateStr} 
          value={planStart} 
          onChange={(e) => setPlanStart(e.target.value)} 
        />
        <input 
          className="modal-input-element" 
          type="date" 
          min={planStart || todayDateStr} 
          value={planEnd} 
          onChange={(e) => setPlanEnd(e.target.value)} 
        />
      </div>

      <button className="modal-action-btn" disabled={isLoading} onClick={handleCreatePlan}>
        {isLoading ? 'Generating Plan...' : 'Generate Plan'}
      </button>

      {errorMessage && <div className="error-message" style={{ color: '#ef4444', marginTop: '10px' }}>{errorMessage}</div>}

      {result && (
        <div className="result-container" style={{ 
          marginTop: '20px', 
          padding: '20px', 
          background: 'var(--bg-card)', 
          borderRadius: '10px', 
          border: '1px solid var(--border-color)',
          maxWidth: '100%',
          overflowX: 'auto',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap'
        }}>
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
    </>
  );
}