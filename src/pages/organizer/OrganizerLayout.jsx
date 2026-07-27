import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import { joinEvent, leaveEvent } from '../../lib/socket';
import { getSession } from '../../lib/api';

import OrganizerDashboard from './OrganizerDashboard';
import TeamsPage from './TeamsPage';
import SchedulePage from './SchedulePage';
import AnnouncementsPage from './AnnouncementsPage';
import MessagesPage from './MessagesPage';
import EventSettingsPage from './EventSettingsPage';

// Simple SVG Icons
const LayoutDashboard = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>;
const CalendarDays = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const Users = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const Bell = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const MessageSquare = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const Settings = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;

const OrganizerLayout = ({ event, setEvent }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const session = getSession();
  const basePath = `/event/${event.id}`;

  useEffect(() => {
    joinEvent(event.id);
    return () => leaveEvent(event.id);
  }, [event.id]);

  const links = [
    { label: 'Dashboard', path: `${basePath}/dashboard`, Icon: LayoutDashboard },
    { label: 'Schedule', path: `${basePath}/schedule`, Icon: CalendarDays },
    { label: 'Teams', path: `${basePath}/teams`, Icon: Users },
    { label: 'Announcements', path: `${basePath}/announcements`, Icon: Bell },
    { label: 'Messages', path: `${basePath}/messages`, Icon: MessageSquare },
    { label: 'Settings', path: `${basePath}/settings`, Icon: Settings },
  ];

  const currentPath = window.location.pathname;
  const currentTitle = links.find(l => currentPath.startsWith(l.path))?.label || 'Organizer Area';

  return (
    <div className="app-layout">
      <Sidebar 
        links={links} 
        event={event} 
        isOpen={sidebarOpen} 
        setOpen={setSidebarOpen} 
      />
      <div className="main-wrapper">
        <TopBar 
          title={currentTitle} 
          user={session.user} 
          onMenuToggle={() => setSidebarOpen(true)} 
        />
        <div className="main-content">
          <Routes>
            <Route path="dashboard" element={<OrganizerDashboard event={event} />} />
            <Route path="teams" element={<TeamsPage event={event} />} />
            <Route path="schedule" element={<SchedulePage event={event} />} />
            <Route path="announcements" element={<AnnouncementsPage event={event} />} />
            <Route path="messages" element={<MessagesPage event={event} />} />
            <Route path="settings" element={<EventSettingsPage event={event} setEvent={setEvent} />} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default OrganizerLayout;
