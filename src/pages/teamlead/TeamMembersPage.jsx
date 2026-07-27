import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Loading from '../../components/Loading';

const TeamMembersPage = ({ event }) => {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [email, setEmail]       = useState('');
  const [adding, setAdding]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const fetchMembers = () => {
    api(`/events/${event.id}/members`)
      .then(res => res.json())
      .then(data => {
        const myTeam = data.filter(m => m.teamName === event.teamName && m.role === 'volunteer');
        setMembers(myTeam);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, [event.id, event.teamName]);

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');
    try {
      const res = await api(`/events/${event.id}/members`, {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          role: 'volunteer',
          teamName: event.teamName,   // always locked to the team lead's own team
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add volunteer.');
      setEmail('');
      setSuccess(`${data.name} added to ${event.teamName} ✓`);
      setTimeout(() => setSuccess(''), 4000);
      fetchMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Team</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Managing volunteers for <strong style={{ color: 'var(--primary)' }}>{event.teamName}</strong>
          </p>
        </div>
      </div>

      {/* Add Volunteer Form */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Add a Volunteer</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          The volunteer must already have an account. They will be added to the <strong>{event.teamName}</strong> team.
        </p>

        {error   && <div className="error-msg">{error}</div>}
        {success && (
          <div style={{ padding: '0.75rem', background: 'rgba(18,161,80,0.1)', color: 'var(--success)',
                        borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {success}
          </div>
        )}

        <form
          onSubmit={handleAddVolunteer}
          style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}
        >
          <div className="form-group" style={{ flex: 1, minWidth: '220px', marginBottom: 0 }}>
            <label>Volunteer's IIITA Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="volunteer@iiita.ac.in"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={adding}>
            {adding ? 'Adding…' : '+ Add Volunteer'}
          </button>
        </form>
      </div>

      {/* Volunteer List */}
      <div className="card">
        <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
          {event.teamName} Volunteers
          <span style={{ marginLeft: '0.75rem', background: 'var(--primary-ultra-light)',
                         color: 'var(--primary)', borderRadius: '99px', padding: '0.15rem 0.6rem',
                         fontSize: '0.85rem', fontWeight: 700 }}>
            {members.length}
          </span>
        </h3>

        <div className="member-list">
          {members.length === 0 ? (
            <div className="empty-state">
              <p>No volunteers in your team yet. Add one above.</p>
            </div>
          ) : (
            members.map(member => (
              <div key={member.id} className="member-item">
                <div className="member-info">
                  <div className="avatar" style={{ background: 'var(--warning)' }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-details">
                    <h4>
                      {member.name}
                      <span className="badge badge-volunteer" style={{ marginLeft: '0.5rem' }}>Volunteer</span>
                    </h4>
                    <p>{member.email}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamMembersPage;
