import React, { useEffect, useState } from 'react';
import { api, getSession } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import MessageFeed from '../../components/MessageFeed';
import Loading from '../../components/Loading';

const MessagesPage = ({ event }) => {
  const [activeTab, setActiveTab] = useState('org');
  const [orgMessages, setOrgMessages] = useState([]);
  const [teamMessages, setTeamMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const session = getSession();

  const fetchMessages = () => {
    Promise.all([
      api(`/events/${event.id}/messages`),
      api(`/events/${event.id}/messages?teamName=${encodeURIComponent(event.teamName)}`)
    ])
      .then(([orgRes, teamRes]) => Promise.all([orgRes.json(), teamRes.json()]))
      .then(([orgData, teamData]) => {
        setOrgMessages(orgData);
        setTeamMessages(teamData);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMessages();
    const socket = getSocket();
    
    const handleNewMessage = (msg) => {
      if (!msg.teamName) {
        setOrgMessages(prev => [...prev, msg]);
      } else if (msg.teamName === event.teamName) {
        setTeamMessages(prev => [...prev, msg]);
      }
    };
    
    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [event.id, event.teamName]);

  const handleSend = async (text) => {
    const teamName = activeTab === 'org' ? null : event.teamName;
    await api(`/events/${event.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, teamName })
    });
  };

  if (loading) return <Loading />;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Messages</h1>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'org' ? 'active' : ''}`}
          onClick={() => setActiveTab('org')}
        >
          Organizer Channel
        </button>
        <button 
          className={`tab ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          My Team ({event.teamName})
        </button>
      </div>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <MessageFeed 
          key={activeTab} // Force re-render on tab switch
          messages={activeTab === 'org' ? orgMessages : teamMessages} 
          onSend={handleSend} 
          currentUser={session.user} 
          placeholder={`Message ${activeTab === 'org' ? 'organizers and team leads' : 'your team'}...`}
        />
      </div>
    </div>
  );
};

export default MessagesPage;
