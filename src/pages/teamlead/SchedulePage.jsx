import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import SubEventCard from '../../components/SubEventCard';
import Loading from '../../components/Loading';

const SchedulePage = ({ event }) => {
  const [subEvents, setSubEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
      </div>

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
              <SubEventCard key={se.id} subevent={se} readOnly={true} />
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default SchedulePage;
