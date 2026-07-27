import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import StatCard from '../../components/StatCard';
import SubEventCard from '../../components/SubEventCard';
import AnnouncementCard from '../../components/AnnouncementCard';
import Loading from '../../components/Loading';

const TeamLeadDashboard = ({ event }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    api(`/events/${event.id}/dashboard`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
    
    const socket = getSocket();
    const handleRefresh = () => fetchDashboard();
    
    socket.on('subevent:created', handleRefresh);
    socket.on('subevent:updated', handleRefresh);
    socket.on('subevent:deleted', handleRefresh);
    socket.on('announcement:new', handleRefresh);

    return () => {
      socket.off('subevent:created', handleRefresh);
      socket.off('subevent:updated', handleRefresh);
      socket.off('subevent:deleted', handleRefresh);
      socket.off('announcement:new', handleRefresh);
    };
  }, [event.id]);

  if (loading) return <Loading />;

  return (
    <div>
      <div className={`event-banner ${!event.bannerUrl ? 'banner-placeholder' : ''}`}>
        {event.bannerUrl && (
          <img src={event.bannerUrl} alt="Banner" className="banner-image" />
        )}
        <div className="banner-content">
          <h1>{event.title}</h1>
          <p>📍 {event.venue || 'No venue'} • 📅 {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'Dates TBA'}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', background: 'var(--primary-ultra-light)' }}>
        <h3 style={{ color: 'var(--primary-dark)', margin: 0 }}>Team: {event.teamName}</h3>
      </div>

      <div className="stats-grid">
        <StatCard label="My Volunteers" value={data.stats.myTeamVolunteers ?? 0} icon="👥" color="emerald" />
        <StatCard label="Total Sub-Events" value={data.stats.totalSubEvents ?? 0} icon="📅" color="indigo" />
        <StatCard label="Announcements" value={data.stats.totalAnnouncements ?? 0} icon="🔔" color="amber" />
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="list-header">
            <h3>Upcoming Schedule</h3>
          </div>
          <div className="card">
            {data.upcomingSubEvents.length === 0 ? (
              <div className="empty-state">
                <p>No upcoming sub-events.</p>
              </div>
            ) : (
              data.upcomingSubEvents.map(se => (
                <SubEventCard key={se.id} subevent={se} readOnly={true} />
              ))
            )}
          </div>
        </div>

        <div>
          <div className="list-header">
            <h3>Latest Announcements</h3>
          </div>
          <div className="card">
            {data.announcements.length === 0 ? (
              <div className="empty-state">
                <p>No announcements yet.</p>
              </div>
            ) : (
              data.announcements.map(ann => (
                <AnnouncementCard key={ann.id} announcement={ann} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLeadDashboard;
