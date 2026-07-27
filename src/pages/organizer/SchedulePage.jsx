import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import SubEventCard from '../../components/SubEventCard';
import Loading from '../../components/Loading';

const SchedulePage = ({ event }) => {
  const [subEvents, setSubEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', date: '', startTime: '', endTime: '', assignedTeam: ''
  });

  const fetchSchedule = () => {
    api(`/events/${event.id}/subevents`)
      .then(res => res.json())
      .then(data => {
        setSubEvents(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSchedule();
    const socket = getSocket();
    socket.on('subevent:created', fetchSchedule);
    socket.on('subevent:updated', fetchSchedule);
    socket.on('subevent:deleted', fetchSchedule);
    return () => {
      socket.off('subevent:created', fetchSchedule);
      socket.off('subevent:updated', fetchSchedule);
      socket.off('subevent:deleted', fetchSchedule);
    };
  }, [event.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PATCH' : 'POST';
    const path = editingId ? `/events/${event.id}/subevents/${editingId}` : `/events/${event.id}/subevents`;
    
    await api(path, { method, body: JSON.stringify(formData) });
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: '', description: '', date: '', startTime: '', endTime: '', assignedTeam: '' });
    fetchSchedule();
  };

  const handleEdit = (se) => {
    setFormData(se);
    setEditingId(se.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sub-event?')) return;
    await api(`/events/${event.id}/subevents/${id}`, { method: 'DELETE' });
    fetchSchedule();
  };

  // Group by date
  const grouped = subEvents.reduce((acc, se) => {
    const d = se.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(se);
    return acc;
  }, {});

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1>Event Schedule</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Sub-Event</button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>{editingId ? 'Edit Sub-Event' : 'New Sub-Event'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input type="text" required className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Date</label>
                <input type="date" required className="form-control" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Start Time</label>
                <input type="time" required className="form-control" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>End Time</label>
                <input type="time" required className="form-control" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Assigned Team (Optional)</label>
                <input type="text" className="form-control" value={formData.assignedTeam || ''} onChange={e => setFormData({...formData, assignedTeam: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">Save Sub-Event</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ title: '', description: '', date: '', startTime: '', endTime: '', assignedTeam: '' }); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state">
          <p>No sub-events scheduled yet.</p>
        </div>
      ) : (
        Object.keys(grouped).sort().map(date => (
          <div key={date} style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            {grouped[date].map(se => (
              <SubEventCard key={se.id} subevent={se} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default SchedulePage;
