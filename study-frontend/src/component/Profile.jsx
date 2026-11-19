import React from 'react';
import './Dashboard.css'; // Reuses your clean dashboard/profile styling

export default function Profile({ user, stats, handleLogout, switchView }) {
  return (
    <div className="dashboard-container" style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>User Profile</h1>
          <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Manage your account and study analytics</p>
        </div>
        <button 
          onClick={handleLogout} 
          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
        >
          Logout
        </button>
      </div>
<div className="profile-card">
  <div className="profile-avatar">
    <i className="bi bi-person-circle"></i>
  </div>
  <div className="profile-info">
    <h3 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Account Information</h3>
    <p style={{ color: 'var(--text-main)', margin: '5px 0' }}><strong>Name:</strong> {user?.name}</p>
    <p style={{ color: 'var(--text-main)', margin: '5px 0' }}><strong>Email:</strong> {user?.email}</p>
    <p style={{ color: 'var(--text-muted)', margin: '5px 0' }}><strong>Account Created:</strong> {stats?.createdAt || 'N/A'}</p>
    <p style={{ color: 'var(--text-muted)', margin: '5px 0' }}><strong>Last Login:</strong> {stats?.lastLogin || 'N/A'}</p>
  </div>
</div>

      <div style={{ display: 'flex', gap: '15px' }}>
        <button 
          onClick={() => switchView('dashboard')}
          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
        >
          View Full Dashboard Statistics
        </button>
        <button 
          onClick={() => switchView('home')}
          style={{ background: '#64748b', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
        >
          Back to Home Hub
        </button>
      </div>
    </div>
  );
}