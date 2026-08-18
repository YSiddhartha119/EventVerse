import React, { useEffect, useState } from 'react';
import { api, getSession } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import MessageFeed from '../../components/MessageFeed';
import Loading from '../../components/Loading';

const MessagesPage = ({ event }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const session = getSession();

  const fetchMessages = () => {
    api(`/events/${event.id}/messages`)
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
      if (!msg.teamName) {
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      }
    };
    
    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [event.id]);

  const handleSend = async (text) => {
    const res = await api(`/events/${event.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, teamName: null })
    });
    if (res.ok) {
      const newMsg = await res.json();
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
    }
  };

  if (loading) return <Loading />;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Organizer Channel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Broadcast messages to all Team Leads</p>
        </div>
      </div>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <MessageFeed 
          messages={messages} 
          onSend={handleSend} 
          currentUser={session.user} 
          placeholder="Type a message to all team leads..."
        />
      </div>
    </div>
  );
};

export default MessagesPage;
