import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getSession, clearSession } from '../lib/api';
import Loading from '../components/Loading';
import TopBar from '../components/TopBar';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => {
    api('/events')
      .then(res => res.json())
      .then(events => {
        if (events && events.length > 0) {
          navigate(`/event/${events[0].id}`);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <Loading />;

  return (
    <div className="app-layout">
      <div className="main-wrapper">
        <TopBar title="EventVerse Home" user={session.user} onMenuToggle={() => {}} />
        <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem 2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Welcome, {session.user?.name}!</h2>
            
            {session.user?.globalRole === 'organizer' ? (
              <>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  You don't have any events yet. Create your first event to get started.
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/events/new')}>
                  Create New Event
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>
                You haven't been added to any events yet. Please wait for an organizer to add your email.
              </p>
            )}
            
            <div style={{ marginTop: '3rem' }}>
              <button 
                className="btn btn-ghost"
                onClick={() => {
                  clearSession();
                  navigate('/login');
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
