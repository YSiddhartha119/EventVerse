import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setSession } from '../lib/api';

const Auth = () => {
  const [role, setRole] = useState(''); // organizer, team_lead, volunteer
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : { ...formData, globalRole: role };
        
      const res = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      setSession(data);
      
      // Fetch events to redirect
      const eventsRes = await api('/events');
      const events = await eventsRes.json();
      
      if (events && events.length > 0) {
        navigate(`/event/${events[0].id}`);
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="auth-container">
        <div className="auth-header">
          <h1>EventVerse</h1>
          <p>IIITA Event Coordination Platform</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
            Sign up &amp; sign in with your @iiita.ac.in email
          </p>
        </div>
        <div className="role-picker">
          <div className="role-card" onClick={() => handleRoleSelect('organizer')}>
            <div className="role-icon">🎪</div>
            <h3>I'm an Organizer</h3>
            <p>Create and manage entire events, schedules, and teams.</p>
          </div>
          <div className="role-card" onClick={() => handleRoleSelect('team_lead')}>
            <div className="role-icon">👥</div>
            <h3>I'm a Team Lead</h3>
            <p>Manage your volunteer team and communicate directly.</p>
          </div>
          <div className="role-card" onClick={() => handleRoleSelect('volunteer')}>
            <div className="role-icon">🙌</div>
            <h3>I'm a Volunteer</h3>
            <p>Join a team, view schedules, and help out at the event.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <button className="back-btn" onClick={() => setRole('')}>
        ← Back to roles
      </button>
      <div className="auth-form-card">
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              required
              placeholder="yourname@iiita.ac.in"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
            <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block' }}>
              Only @iiita.ac.in addresses are accepted
            </small>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              required 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        <div className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
