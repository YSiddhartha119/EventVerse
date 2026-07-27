import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiUpload } from '../../lib/api';

const EventSettingsPage = ({ event, setEvent }) => {
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    venue: event.venue || '',
    startDate: event.startDate ? event.startDate.split('T')[0] : '',
    endDate: event.endDate ? event.endDate.split('T')[0] : ''
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api(`/events/${event.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setEvent(data);
      setMsg('Settings saved successfully.');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (e) => {
    e.preventDefault();
    if (!bannerFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', bannerFile);
      const res = await apiUpload(`/events/${event.id}/banner`, fd);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      // Merge just the bannerUrl into the existing event object
      setEvent(prev => ({ ...prev, bannerUrl: data.bannerUrl }));
      setBannerFile(null);
      setMsg('Banner uploaded successfully.');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you ABSOLUTELY sure you want to delete this event? This action cannot be undone.')) return;
    try {
      await api(`/events/${event.id}`, { method: 'DELETE' });
      navigate('/home');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Event Settings</h1>
      </div>

      {msg && <div style={{ padding: '1rem', background: 'rgba(18, 161, 80, 0.1)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>{msg}</div>}

      <div className="card">
        <h3>Event Details</h3>
        <form onSubmit={handleDetailsSubmit} style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label>Event Title</label>
            <input type="text" className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Venue</label>
            <input type="text" className="form-control" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Start Date</label>
              <input type="date" className="form-control" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>End Date</label>
              <input type="date" className="form-control" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>

      <div className="card">
        <h3>Banner Image</h3>
        {event.bannerUrl && (
          <div style={{ margin: '1rem 0' }}>
            <img src={event.bannerUrl} alt="Banner" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
          </div>
        )}
        <form onSubmit={handleBannerUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input type="file" accept="image/*" onChange={e => setBannerFile(e.target.files[0])} />
          <button type="submit" className="btn btn-secondary" disabled={!bannerFile || uploading}>
            {uploading ? 'Uploading...' : 'Upload Banner'}
          </button>
        </form>
      </div>

      <div className="card" style={{ borderColor: 'var(--accent)', background: 'rgba(229, 83, 83, 0.02)' }}>
        <h3 style={{ color: 'var(--accent)' }}>Danger Zone</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Deleting this event will permanently remove all associated data (teams, members, schedule, messages). This action cannot be undone.</p>
        <button className="btn btn-danger" onClick={handleDeleteEvent}>Delete Event</button>
      </div>
    </div>
  );
};

export default EventSettingsPage;
