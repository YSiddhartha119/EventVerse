import React from 'react';

const SubEventCard = ({ subevent, onEdit, onDelete, readOnly }) => {
  return (
    <div className="subevent-card">
      <div className="subevent-header">
        <div>
          <h4 className="subevent-title">{subevent.title}</h4>
          <div className="subevent-time">
            📅 {new Date(subevent.date).toLocaleDateString()} | 🕒 {subevent.startTime} - {subevent.endTime}
          </div>
        </div>
        {subevent.assignedTeam && (
          <span className="badge badge-team_lead">{subevent.assignedTeam}</span>
        )}
      </div>
      <p className="subevent-desc">{subevent.description}</p>
      {!readOnly && (onEdit || onDelete) && (
        <div className="subevent-footer">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onEdit && <button className="btn btn-secondary btn-sm" onClick={() => onEdit(subevent)}>Edit</button>}
            {onDelete && <button className="btn btn-danger btn-sm" onClick={() => onDelete(subevent.id)}>Delete</button>}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubEventCard;
