import React from 'react';

const formatTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(dateStr).toLocaleDateString();
};

const AnnouncementCard = ({ announcement, onDelete }) => {
  return (
    <div className="announcement-card">
      <div className="announcement-header">
        <h4 className="announcement-title">{announcement.title}</h4>
        <span className="announcement-meta">
          {announcement.authorName} • {formatTime(announcement.createdAt)}
        </span>
      </div>
      <p className="announcement-body">{announcement.body}</p>
      {onDelete && (
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(announcement.id)}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default AnnouncementCard;
