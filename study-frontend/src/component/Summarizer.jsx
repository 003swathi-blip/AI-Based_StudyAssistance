import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
export default function Summarizer({ selectedSubject, activePlan, updateStats, saveActivity, resetTrigger, setResetTrigger }) {
  const [sumText, setSumText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [subjectWarning, setSubjectWarning] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    if (resetTrigger) {
      setSumText('');
      setUploadedFileName('');
      setMediaFile(null);
      setSubjectWarning('');
      setResult('');
      setErrorMessage('');
      
      if (typeof setResetTrigger === 'function') {
        setResetTrigger(false);
      }
    }
  }, [resetTrigger, setResetTrigger]);
  
  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setMediaFile(file);
    setUploadedFileName(file.name);
    setSubjectWarning('');
    const fileNameLower = file.name.toLowerCase();
    
    const mathKeywords = ['math', 'calculus', 'algebra', 'matrix', 'equation', 'geometry', 'integral', 'derivative'];
    const techKeywords = ['helmet', 'iot', 'sensor', 'arduino', 'raspberry', 'circuit', 'network', 'system', 'algorithm', 'code', 'data', 'analysis'];
    const literatureKeywords = ['poem', 'novel', 'shakespeare', 'prose', 'literary', 'chapter', 'author', 'fiction'];
    const isMathFile = mathKeywords.some(keyword => fileNameLower.includes(keyword));
    const isTechFile = techKeywords.some(keyword => fileNameLower.includes(keyword));
    
    if (selectedSubject === 'Mathematics' && !isMathFile && (isTechFile || literatureKeywords.some(kw => fileNameLower.includes(kw)))) {
      setSubjectWarning(
        `Warning: Your file ("${file.name}") doesn't look like a Mathematics document, but your current focus is set to Mathematics.`
      );
    } else if (selectedSubject === 'Literature' && isTechFile) {
      setSubjectWarning(
        `Warning: Your file ("${file.name}") appears to be technical/engineering, but your focus is set to Literature.`
      );
    }
  };
  const handleApiCall = async () => {
    setIsLoading(true);
    setResult('');
    setErrorMessage('');
    try {
      const formData = new FormData();
      if (mediaFile) formData.append("file", mediaFile);
      formData.append("text", sumText || (activePlan ? `Summarize topics for study plan: ${activePlan.syllabus} - ${activePlan.topics}` : ''));
      formData.append("subject", selectedSubject);
      if (activePlan) formData.append("activePlan", JSON.stringify(activePlan));
      const endpoint = mediaFile ? 'summarize-file' : 'summarize-text';
      const response = await fetch(`http://localhost:5000/api/${endpoint}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || data.message || "Request Failed");
        return;
      }
      updateStats("pdf");
      saveActivity("PDF Summary", uploadedFileName || "Text Summary", `Subject: ${selectedSubject}\n\nSummary:\n${data.reply}`);
      setResult(data.reply);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <h2 className="modal-header-title">Summarize Text & Documents ({selectedSubject})</h2>
      {activePlan && (
        <div style={{ fontSize: '0.85rem', color: '#2563eb', marginBottom: '10px', background: 'rgba(37, 99, 235, 0.1)', padding: '8px', borderRadius: '6px' }}>
          💡 <strong>Context Enabled:</strong> Active Study Plan "{activePlan.syllabus}" will guide this summarization.
        </div>
      )}
      
      {subjectWarning && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', 
          padding: '12px', borderRadius: '8px', marginBottom: '15px',
          color: '#b91c1c', fontSize: '0.9rem'
        }}>
          <p style={{ margin: '0', fontWeight: '500' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '6px' }}></i>
            {subjectWarning}
          </p>
        </div>
      )}
      <div className="file-upload-container" style={{ marginBottom: '20px' }}>
        <label className="file-upload-label" style={{
          display: 'block', padding: '12px', background: '#f8fafc',
          border: '2px dashed #cbd5e1', borderRadius: '12px',
          textAlign: 'center', cursor: 'pointer', color: '#64748b', fontWeight: '500'
        }}>
          <i className="bi bi-folder-fill"></i> Attach study document (.txt, .pdf, image)
          <input 
            type="file" 
            accept=".txt,.pdf,image/*" 
            onChange={handleMediaUpload} 
            style={{ display: 'none' }} 
            key={mediaFile ? mediaFile.name : 'empty-file-input'} 
          />
        </label>
        {uploadedFileName && (
          <p style={{ fontSize: '0.85rem', color: '#2563eb', marginTop: '6px', fontWeight: '500' }}>
            📄 Selected File: {uploadedFileName}
          </p>
        )}
      </div>
      <textarea className="modal-textarea-field" placeholder={activePlan ? `Or enter text to summarize in context of "${activePlan.syllabus}"...` : "Enter text to summarize or attach files above..."} value={sumText} onChange={(e) => setSumText(e.target.value)} />
      <button className="modal-action-btn" disabled={isLoading} onClick={handleApiCall}>
        {isLoading ? 'Summarizing...' : 'Summarize'}
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