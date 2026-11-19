import React, { useState } from 'react';
import './Login.css'; // Reuses your login styling for consistency

export default function Register({ onRegisterSuccess, switchView }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onRegisterSuccess({ name: data.name || name, email });
      } else {
        setError(data.message || 'Registration failed. Try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Server error. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-large">
        <h2 className="login-title">Create Account</h2>
        
        {error && <div className="login-error-msg">{error}</div>}

        <form onSubmit={handleRegister} className="login-form">
          <div className="login-input-group">
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
              className="login-input-field"
            />
          </div>

          <div className="login-input-group">
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              className="login-input-field"
            />
          </div>

          <div className="login-input-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              className="login-input-field"
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="login-footer-links" style={{ marginTop: '20px', textAlign: 'center' }}>
          <span>Already have an account? </span>
          <a href="#login" onClick={(e) => { e.preventDefault(); switchView('login'); }}>
            Login here
          </a>
        </div>
      </div>
    </div>
  );
}