import React, { useState } from 'react';
import './Login.css';

export default function Login({ onLoginSuccess, switchView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess({ name: data.name || data.user?.name || email.split('@')[0], email });
      } else {
        setError(data.error || data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const resetEmail = prompt("Enter your registered email address:");
    if (!resetEmail) return;
    
    const newPass = prompt("Enter your new password:");
    if (!newPass) return;

    try {
      const response = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, newPassword: newPass })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Password reset successful! You can now log in with your new password.");
      } else {
        alert(data.error || "Password reset failed.");
      }
    } catch (err) {
      console.error('Reset error:', err);
      alert("Server error during password reset.");
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-large">
        <h2 className="login-title">Login</h2>
        
        {error && <div className="login-error-msg">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
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
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer-links" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <a href="#forgot" onClick={handleForgotPassword}>
            Forgot Password?
          </a>
          <a href="#register" onClick={(e) => { e.preventDefault(); switchView('register'); }}>
            Create Account
          </a>
        </div>
      </div>
    </div>
  );
}