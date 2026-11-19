import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function AiTutor({ selectedSubject, activePlan, updateStats, saveActivity, resetTrigger, setResetTrigger }) {
  const [promptText, setPromptText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [result, setResult] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (resetTrigger) {
      setPromptText('');
      setMediaFile(null);
      setUploadedFileName('');
      setResult('');
      setImageUrl('');
      setErrorMessage('');
      setIsListening(false);
      if (typeof setResetTrigger === 'function') {
        setResetTrigger(false);
      }
    }
  }, [resetTrigger, setResetTrigger]);

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try using Google Chrome.");
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      setPromptText(prev => (prev ? `${prev} ${spokenText}` : spokenText));
      setIsListening(false);
    };
    recognition.onerror = (err) => {
      console.error("Speech recognition error", err);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleAskTutor = async () => {
    setIsLoading(true);
    setResult('');
    setErrorMessage('');
    try {
      const formData = new FormData();
      if (mediaFile) formData.append("file", mediaFile);
      formData.append("text", promptText);
      formData.append("subject", selectedSubject);
      if (activePlan) formData.append("activePlan", JSON.stringify(activePlan));
      
      const response = await fetch(`http://localhost:5000/api/ai-tutor`, {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "Request Failed");
        return;
      }
      
      setResult(data.reply);
      updateStats("ai");
      saveActivity("AI Tutor", promptText || uploadedFileName, data.reply);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!promptText.trim()) {
      setErrorMessage("Please enter a description or topic for the illustration.");
      return;
    }
    setIsImageLoading(true);
    setImageUrl('');
    setErrorMessage('');
    try {
      const response = await fetch(`http://localhost:5000/api/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "Image Generation Failed");
        return;
      }
      
      // Appends a dynamic timestamp to completely prevent caching issues across rapid generations
      const finalImageUrl = `${data.imageUrl}&v=${Date.now()}`;
      setImageUrl(finalImageUrl);
      updateStats("ai");
      saveActivity("AI Illustration", promptText, "Generated diagram illustration");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleDownloadJpg = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `illustration_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(imageUrl, '_blank');
    }
  };

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>AI Tutor Study Notes</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { color: #2563eb; }
          </style>
        </head>
        <body>
          <h1>AI Tutor Report (${selectedSubject})</h1>
          <hr/>
          <div>${result.replace(/\n/g, '<br/>')}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="modal-header-title">AI Tutor Mode ({selectedSubject})</h2>
        <button 
          onClick={toggleVoiceInput}
          style={{ 
            background: isListening ? '#ef4444' : '#2563eb', 
            color: '#fff', 
            border: 'none', 
            padding: '6px 12px', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          title="Dictate prompt via voice"
        >
          <i className={`bi ${isListening ? 'bi-mic-fill' : 'bi-mic'}`}></i>
          {isListening ? 'Listening...' : ' Voice Input'}
        </button>
      </div>

      {activePlan && (
        <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', margin: '10px 0', background: 'rgba(37, 99, 235, 0.1)', padding: '8px', borderRadius: '6px' }}>
          💡 <strong>Context Enabled:</strong> Active Study Plan "{activePlan.syllabus}" will be used as input for this AI session.
        </div>
      )}
      
      <textarea 
        className="modal-textarea-field" 
        placeholder="Ask your AI tutor anything or describe an image to generate..." 
        value={promptText} 
        onChange={(e) => setPromptText(e.target.value)} 
      />

      <div style={{ margin: '15px 0' }}>
        <input 
          type="file" 
          accept=".txt,.pdf,image/*" 
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setMediaFile(e.target.files[0]);
              setUploadedFileName(e.target.files[0].name);
            }
          }} 
          key={mediaFile ? mediaFile.name : 'tutor-file-input-empty'}
        />
        {uploadedFileName && (
          <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginTop: '5px' }}>
            Attached: {uploadedFileName}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="modal-action-btn" disabled={isLoading} onClick={handleAskTutor}>
          {isLoading ? 'Thinking...' : 'Ask Tutor'}
        </button>
        <button 
          className="modal-action-btn" 
          style={{ background: '#10b981' }} 
          disabled={isImageLoading} 
          onClick={handleGenerateImage}
        >
          {isImageLoading ? 'Generating Image...' : '🎨 Generate Illustration'}
        </button>
      </div>

      {errorMessage && <div style={{ color: 'var(--danger)', marginTop: '10px' }}>{errorMessage}</div>}
      
      {/* RESULT SECTION */}
      {result && (
        <div style={{ marginTop: '20px', padding: '20px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Tutor Response</h3>
            <button 
              onClick={handleDownloadPdf}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              📥 Download PDF
            </button>
          </div>
          <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* IMAGE SECTION WITH AUTOMATIC FALLBACK */}
      {imageUrl && (
        <div style={{ marginTop: '20px', padding: '20px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-main)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Generated Educational Illustration</h3>
            <button 
              onClick={handleDownloadJpg}
              style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              📥 Download JPG
            </button>
          </div>
          <img 
            src={imageUrl} 
            alt="AI Generated Study Illustration" 
            style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
            onError={(e) => {
              // Automatically switches to a reliable fallback placeholder if capacity limit is hit
              e.target.src = `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/800/600`;
            }}
          />
        </div>
      )}
    </>
  );
}