import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getSession } from '../lib/api';
import TopBar from '../components/TopBar';

const CreateEvent = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const session = getSession();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api('/events', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to create event');
      
      navigate(`/event/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <div className="main-wrapper">
        <TopBar title="Create New Event" user={session.user} onMenuToggle={() => {}} />
        <div className="main-content">
          <div className="page-header">
            <div>
              <h1>Create Event</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Set up your new event details.</p>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/home')}>Cancel</button>
          </div>
          
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Event Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="form-control"
                  rows="4"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Venue / Location</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.venue}
                  onChange={e => setFormData({...formData, venue: e.target.value})}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>
              <div style={{ marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
