import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function QuestionAnswering({ selectedSubject, activePlan, updateStats, saveActivity, resetTrigger, setResetTrigger }) {
  const [qaContext, setQaContext] = useState('');
  const [qaQuestion, setQaQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Listen for reset trigger from parent App.jsx
  useEffect(() => {
    if (resetTrigger) {
      setQaContext('');
      setQaQuestion('');
      setResult('');
      setErrorMessage('');

      if (typeof setResetTrigger === 'function') {
        setResetTrigger(false);
      }
    }
  }, [resetTrigger, setResetTrigger]);

  const handleApiCall = async () => {
    // Validation: Ensure the question field is not empty
    if (!qaQuestion.trim()) {
      setErrorMessage("Please enter a structured inquiry query.");
      return;
    }

    // Validation: Ensure context is available either manually or through activePlan
    const currentContext = qaContext || (activePlan ? `Active Study Plan: ${activePlan.syllabus} - Topics: ${activePlan.topics}` : '');
    if (!currentContext.trim()) {
      setErrorMessage("Please provide context text or create an active study plan first.");
      return;
    }

    setIsLoading(true);
    setResult('');
    setErrorMessage('');
    try {
      const response = await fetch(`http://localhost:5000/api/answer-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          context: currentContext, 
          question: qaQuestion,
          subject: selectedSubject,
          activePlan: activePlan 
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || data.message || "Request Failed");
        return;
      }
      setResult(data.reply);
      updateStats("question");
      saveActivity("Question Answering", qaQuestion, `Subject: ${selectedSubject}\nContext: ${currentContext}\n\nAnswer:\n${data.reply}`);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="modal-header-title">Improved Structured Q&A ({selectedSubject})</h2>
      {activePlan && (
        <div style={{ fontSize: '0.85rem', color: '#2563eb', marginBottom: '10px', background: 'rgba(37, 99, 235, 0.1)', padding: '8px', borderRadius: '6px' }}>
          💡 <strong>Context Enabled:</strong> Active Study Plan "{activePlan.syllabus}" can be used as context parameters.
        </div>
      )}
      <textarea 
        className="modal-textarea-field" 
        placeholder={activePlan ? `Context auto-filled from plan or paste custom textbook excerpts...` : "Paste context text, textbook excerpts, or reference materials..."} 
        value={qaContext} 
        onChange={(e) => setQaContext(e.target.value)} 
      />
      <input 
        className="modal-input-element" 
        type="text" 
        placeholder="Ask a structured inquiry query..." 
        value={qaQuestion} 
        onChange={(e) => setQaQuestion(e.target.value)} 
      />
      <button className="modal-action-btn" disabled={isLoading} onClick={handleApiCall}>
        {isLoading ? 'Finding Answer...' : 'Get Structured Answer'}
      </button>
      {errorMessage && <div className="error-message" style={{ color: '#ef4444', marginTop: '10px' }}>{errorMessage}</div>}
      {result && (
        <div className="result-container" style={{ marginTop: '20px', padding: '20px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
    </>
  );
}