import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Loading from '../../components/Loading';

const TeamsPage = ({ event }) => {
  const [teams, setTeams] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ email: '', role: 'volunteer', teamName: '' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const fetchTeams = async () => {
    try {
      const [teamsRes, membersRes] = await Promise.all([
        api(`/events/${event.id}/teams`),
        api(`/events/${event.id}/members`)
      ]);
      const teamsData = await teamsRes.json();
      const membersData = await membersRes.json();
      
      setTeams(teamsData);
      setUnassigned(membersData.filter(m => !m.teamName && m.role !== 'organizer'));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [event.id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    try {
      const res = await api(`/events/${event.id}/members`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');
      
      setFormData({ email: '', role: 'volunteer', teamName: '' });
      fetchTeams();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (uid) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api(`/events/${event.id}/members/${uid}`, { method: 'DELETE' });
      fetchTeams();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h1>Teams & Members</h1>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Add New Member</h3>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1', minWidth: '200px' }}>
            <label>Email Address</label>
            <input type="email" required className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, width: '150px' }}>
            <label>Role</label>
            <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="team_lead">Team Lead</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '1', minWidth: '200px' }}>
            <label>Team Name</label>
            <input type="text" required className="form-control" placeholder="e.g. Stage Crew" value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={adding}>
            {adding ? 'Adding...' : 'Add Member'}
          </button>
        </form>
      </div>

      <div className="teams-list">
        {teams.length === 0 && unassigned.length === 0 && (
          <div className="empty-state">
            <p>No teams or members added yet.</p>
          </div>
        )}
        
        {teams.map(team => (
          <div key={team.name} className="team-card">
            <div className="team-header">
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary)' }}>{team.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{team.volunteerCount} Volunteers</p>
              </div>
            </div>
            
            <div className="member-list">
              {team.lead && (
                <div className="member-item">
                  <div className="member-info">
                    <div className="avatar" style={{ background: 'var(--success)' }}>{team.lead.name.charAt(0)}</div>
                    <div className="member-details">
                      <h4>{team.lead.name} <span className="badge badge-team_lead">Lead</span></h4>
                      <p>{team.lead.email}</p>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(team.lead.id)}>Remove</button>
                </div>
              )}
              
              {team.volunteers.map(vol => (
                <div key={vol.id} className="member-item">
                  <div className="member-info">
                    <div className="avatar" style={{ background: 'var(--warning)' }}>{vol.name.charAt(0)}</div>
                    <div className="member-details">
                      <h4>{vol.name} <span className="badge badge-volunteer">Volunteer</span></h4>
                      <p>{vol.email}</p>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(vol.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {unassigned.length > 0 && (
          <div className="team-card">
            <div className="team-header">
              <h3 style={{ margin: 0 }}>Unassigned Members</h3>
            </div>
            <div className="member-list">
              {unassigned.map(user => (
                <div key={user.id} className="member-item">
                  <div className="member-info">
                    <div className="avatar">{user.name.charAt(0)}</div>
                    <div className="member-details">
                      <h4>{user.name}</h4>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(user.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;
