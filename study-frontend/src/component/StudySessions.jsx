import { useEffect, useRef, useState } from 'react';

export default function StudySessions({ sessionId, onSessionFailed, renderQuizComponent }) {
  // Session States
  const [sessionStatus, setSessionStatus] = useState('active'); // active, paused, completed, incomplete
  const [offlineCountdown, setOfflineCountdown] = useState(null);
  
  // Learning Progress States
  const [checkpointUnlocked, setCheckpointUnlocked] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const isOnlineRef = useRef(navigator.onLine);

  // 1. Activity Heartbeat & Idle Detection (2-Minute Threshold)
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (sessionStatus === 'paused') {
        setSessionStatus('active'); // Auto-resume on movement
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const inactiveDuration = (now - lastActivityRef.current) / 1000; // in seconds

      if (inactiveDuration > 120 && sessionStatus === 'active') {
        setSessionStatus('paused'); // Pause timer after 2 minutes of zero activity
      }

      // Send heartbeat ping to backend
      if (isOnlineRef.current) {
        fetch('/api/session/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, status: sessionStatus })
        }).catch(() => {});
      }
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(heartbeatInterval);
    };
  }, [sessionStatus, sessionId]);

  // 2. Grace Period for Disconnections (60 Seconds)
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      setOfflineCountdown(null);
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      setOfflineCountdown(60); // 60-second grace period
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let graceTimer;
    if (offlineCountdown !== null && offlineCountdown > 0) {
      graceTimer = setInterval(() => {
        setOfflineCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(graceTimer);
            setSessionStatus('incomplete');
            onSessionFailed('Disconnected for too long. Session marked incomplete.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(graceTimer);
    };
  }, [offlineCountdown, onSessionFailed]);

  // 3. Active Checkpoint Handler
  const handleRevealCheckpoint = () => {
    setCheckpointUnlocked(true);
  };

  return (
    <div style={{ 
      maxWidth: '700px', 
      margin: '20px auto', 
      padding: '24px', 
      background: 'var(--bg-card, #ffffff)', 
      color: 'var(--text-color, #1e293b)', 
      border: '1px solid var(--border-color, #ddd)', 
      borderRadius: '8px', 
      fontFamily: 'sans-serif' 
    }}>
      
      {/* Offline Warning Banner */}
      {offlineCountdown !== null && (
        <div style={{ background: '#fff3cd', color: '#856404', padding: '12px', marginBottom: '16px', borderRadius: '4px' }}>
          ⚠️ Network connection lost! Reconnect within <strong>{offlineCountdown}s</strong> to avoid session failure.
        </div>
      )}

      {/* AFK / Paused Warning Banner */}
      {sessionStatus === 'paused' && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', marginBottom: '16px', borderRadius: '4px' }}>
          ⏸️ Session paused due to inactivity. Move your mouse or type to resume!
        </div>
      )}

      <h2 style={{ color: 'var(--text-color)' }}>Secure Study Module: Advanced Concepts</h2>
      <hr style={{ margin: '12px 0', borderColor: 'var(--border-color)' }} />

      {!quizStarted ? (
        <div>
          <h3>Phase 1: Reading & Active Checkpoint</h3>
          <p style={{ color: 'var(--text-color)', opacity: 0.85 }}>Read through the synchronized summary. You must unlock the micro-prompt to proceed.</p>
          
          <div style={{ 
            background: 'var(--bg-color, #f8fafc)', 
            color: 'var(--text-color)', 
            padding: '16px', 
            borderLeft: '4px solid #007bff', 
            margin: '16px 0',
            borderRadius: '4px',
            border: '1px solid var(--border-color, #e2e8f0)'
          }}>
            <p style={{ margin: '0 0 12px 0', color: 'var(--text-color)' }}>
              <strong>Core Concept:</strong> Time-based tracking ensures accountability, preventing passive window-gazing.
            </p>
            
            {!checkpointUnlocked ? (
              <button onClick={handleRevealCheckpoint} style={{ marginTop: '5px', padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
                Click to Verify Understanding Checkpoint
              </button>
            ) : (
              <p style={{ color: '#10b981', marginTop: '10px', fontWeight: 'bold' }}>✓ Checkpoint Cleared! You can now start the quiz.</p>
            )}
          </div>

          <button 
            disabled={!checkpointUnlocked || sessionStatus === 'paused'}
            onClick={() => setQuizStarted(true)}
            style={{ 
              padding: '10px 20px', 
              background: checkpointUnlocked ? '#28a745' : 'var(--border-color, #94a3b8)', 
              color: checkpointUnlocked ? '#fff' : 'var(--text-color, #fff)', 
              opacity: checkpointUnlocked ? 1 : 0.7,
              border: 'none', 
              borderRadius: '4px', 
              cursor: checkpointUnlocked ? 'pointer' : 'not-allowed',
              fontWeight: '600'
            }}
          >
            Proceed to Timed Quiz
          </button>
        </div>
      ) : (
        <div>
          <h3>Phase 2: Timed Assessment Gate</h3>
          <p style={{ color: 'var(--text-color)', opacity: 0.85, marginBottom: '15px' }}>Answer quickly before the countdown expires. Risk of failure is active!</p>
          
          {renderQuizComponent ? (
            renderQuizComponent()
          ) : (
            <div style={{ padding: '20px', background: 'var(--bg-color)', color: 'var(--text-color)', borderRadius: '4px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <p>[ Quiz Generator Component Not Passed ]</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}