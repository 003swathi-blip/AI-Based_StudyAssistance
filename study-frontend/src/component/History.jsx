import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './History.css';

export default function History({ user }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!user || !user.email) return;
    try {
      const key = `activities_${user.email}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setActivities(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
  }, [user]);

  const clearHistory = () => {
    if (!user || !user.email) return;
    localStorage.removeItem(`activities_${user.email}`);
    setActivities([]);
  };

  return (
    <div className="workspace-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="modal-header-title" style={{ margin: 0 }}>Activity & Study History</h2>
        {activities.length > 0 && (
          <button 
            onClick={clearHistory}
            className="btn btn-sm btn-outline-danger"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <i className="bi bi-trash"></i> Clear History
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <i className="bi bi-clock-history" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block' }}></i>
          <p style={{ margin: 0 }}>No activity history found. Complete tasks or generate study plans to see them here!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {activities.map((act, index) => (
            <div 
              key={index} 
              style={{ 
                background: 'var(--bg-card)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)', 
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--primary-color)', background: 'rgba(37, 99, 235, 0.1)', padding: '3px 8px', borderRadius: '4px' }}>
                    {act.type}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', margin: '8px 0 4px 0', color: 'var(--text-main)' }}>
                    {act.title}
                  </h3>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {act.date}
                </span>
              </div>
              {act.content && (
                <div 
                  style={{ 
                    marginTop: '12px', 
                    padding: '12px 16px', 
                    background: 'var(--bg-main, #f8fafc)', 
                    color: 'var(--text-color)', // Added explicit text color binding
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  <div style={{ color: 'var(--text-color)' }}>
                    <ReactMarkdown>{act.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}