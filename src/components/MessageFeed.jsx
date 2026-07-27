import React, { useRef, useEffect, useState } from 'react';

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageFeed = ({ messages, onSend, currentUser, placeholder = 'Type a message...' }) => {
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="messages-container">
      <div className="messages-feed">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderName === currentUser.name;
            return (
              <div key={msg.id} className={`message ${isOwn ? 'own' : 'others'}`}>
                <div className="message-header">
                  <span className="message-sender">{msg.senderName}</span>
                  {msg.senderRole && <span className={`badge badge-${msg.senderRole}`}>{msg.senderRole.replace('_', ' ')}</span>}
                  <span className="message-time">{formatTime(msg.createdAt)}</span>
                </div>
                <div className="message-bubble">{msg.text}</div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <div className="message-input">
        <textarea
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="btn btn-primary" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default MessageFeed;
