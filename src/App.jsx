import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { getSession, api } from './lib/api';
import Auth from './pages/Auth';
import Home from './pages/Home';
import CreateEvent from './pages/CreateEvent';
import OrganizerLayout from './pages/organizer/OrganizerLayout';
import TeamLeadLayout from './pages/teamlead/TeamLeadLayout';
import VolunteerLayout from './pages/volunteer/VolunteerLayout';
import Loading from './components/Loading';

const RequireAuth = ({ children }) => {
  const session = getSession();
  if (!session.token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const EventWrapper = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/events/${eventId}`)
      .then(res => {
        if (!res.ok) throw new Error('Event not found');
        return res.json();
      })
      .then(data => {
        setEvent(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [eventId]);

  if (loading) return <Loading />;
  if (error) return <div className="error-msg" style={{ margin: '2rem' }}>{error}</div>;

  if (event.role === 'organizer') return <OrganizerLayout event={event} setEvent={setEvent} />;
  if (event.role === 'team_lead') return <TeamLeadLayout event={event} />;
  if (event.role === 'volunteer') return <VolunteerLayout event={event} />;
  
  return <Navigate to="/home" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/events/new" element={<RequireAuth><CreateEvent /></RequireAuth>} />
        <Route path="/event/:eventId/*" element={<RequireAuth><EventWrapper /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
