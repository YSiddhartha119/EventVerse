import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import AnnouncementCard from '../../components/AnnouncementCard';
import Loading from '../../components/Loading';

const AnnouncementsPage = ({ event }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', body: '' });

  const fetchAnnouncements = () => {
    api(`/events/${event.id}/announcements`)
      .then(res => res.json())
      .then(data => {
        setAnnouncements(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnnouncements();
    const socket = getSocket();
    socket.on('announcement:new', fetchAnnouncements);
    return () => socket.off('announcement:new', fetchAnnouncements);
  }, [event.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api(`/events/${event.id}/announcements`, {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    setFormData({ title: '', body: '' });
    fetchAnnouncements();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await api(`/events/${event.id}/announcements/${id}`, { method: 'DELETE' });
    fetchAnnouncements();
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1>Announcements</h1>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Post New Announcement</h3>
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label>Title</label>
            <input type="text" required className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Message Body</label>
            <textarea required className="form-control" rows="3" value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary">Post Announcement</button>
        </form>
      </div>

      <div className="announcements-list">
        {announcements.length === 0 ? (
          <div className="empty-state">
            <p>No announcements posted yet.</p>
          </div>
        ) : (
          announcements.map(ann => (
            <AnnouncementCard key={ann.id} announcement={ann} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
