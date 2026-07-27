import React from 'react';
import { NavLink } from 'react-router-dom';
import { clearSession } from '../lib/api';

const Sidebar = ({ links, event, isOpen, setOpen }) => {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-mark">EV</span>
            <span className="brand-text">EventVerse</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {event && (
          <div className="event-info">
            <div className="event-avatar">{event.title.charAt(0).toUpperCase()}</div>
            <div className="event-meta">
              <span className="event-name">{event.title}</span>
              <span className={`role-badge badge-${event.role}`}>
                {event.role === 'team_lead' ? 'Team Lead' : event.role.charAt(0).toUpperCase() + event.role.slice(1)}
              </span>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {links.map((link, idx) => {
            const Icon = link.Icon;
            return (
              <NavLink
                key={idx}
                to={link.path}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                onClick={() => setOpen(false)}
              >
                {Icon && (
                  <span className="nav-icon">
                    <Icon />
                  </span>
                )}
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {event?.teamName && (
            <div className="team-badge-footer">
              <span>Team: </span>
              <strong>{event.teamName}</strong>
            </div>
          )}
          <button
            className="btn btn-ghost btn-block signout-btn"
            onClick={() => {
              clearSession();
              window.location.href = '/login';
            }}
          >
            <span>⎋</span> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
