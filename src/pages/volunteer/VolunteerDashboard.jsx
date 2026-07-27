import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import SubEventCard from '../../components/SubEventCard';
import AnnouncementCard from '../../components/AnnouncementCard';
import Loading from '../../components/Loading';

const VolunteerDashboard = ({ event }) => {
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

  // Filter today's events vs upcoming
  const today = new Date().toISOString().split('T')[0];
  const todaysEvents = data.upcomingSubEvents.filter(se => se.date === today);
  const upcomingEvents = data.upcomingSubEvents.filter(se => se.date !== today).slice(0, 5);

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
        <h3 style={{ color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🛡️ Team: {event.teamName} 
        </h3>
        <p style={{ marginTop: '0.5rem', color: 'var(--primary)' }}>
          Assigned role: Volunteer
        </p>
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="list-header">
            <h3>Today's Schedule</h3>
          </div>
          <div className="card">
            {todaysEvents.length === 0 ? (
              <div className="empty-state">
                <p>Nothing scheduled for today.</p>
              </div>
            ) : (
              todaysEvents.map(se => (
                <SubEventCard key={se.id} subevent={se} readOnly={true} />
              ))
            )}
          </div>

          <div className="list-header" style={{ marginTop: '2rem' }}>
            <h3>Upcoming Next</h3>
          </div>
          <div className="card">
            {upcomingEvents.length === 0 ? (
              <div className="empty-state">
                <p>No upcoming sub-events.</p>
              </div>
            ) : (
              upcomingEvents.map(se => (
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

export default VolunteerDashboard;
