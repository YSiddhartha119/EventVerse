import React, { useEffect, useState } from 'react';
import { api, getSession } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import MessageFeed from '../../components/MessageFeed';
import Loading from '../../components/Loading';

const TeamChannelPage = ({ event }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const session = getSession();

  const fetchMessages = () => {
    api(`/events/${event.id}/messages?teamName=${encodeURIComponent(event.teamName)}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMessages();
    const socket = getSocket();
    
    const handleNewMessage = (msg) => {
      if (msg.teamName === event.teamName) {
        setMessages(prev => [...prev, msg]);
      }
    };
    
    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [event.id, event.teamName]);

  const handleSend = async (text) => {
    await api(`/events/${event.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, teamName: event.teamName })
    });
  };

  if (loading) return <Loading />;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Team Channel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Chat with your team lead and fellow volunteers</p>
        </div>
      </div>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <MessageFeed 
          messages={messages} 
          onSend={handleSend} 
          currentUser={session.user} 
          placeholder={`Message Team ${event.teamName}...`}
        />
      </div>
    </div>
  );
};

export default TeamChannelPage;
