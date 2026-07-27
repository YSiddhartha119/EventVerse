import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import { joinEvent, leaveEvent } from '../../lib/socket';
import { getSession } from '../../lib/api';

import TeamLeadDashboard from './TeamLeadDashboard';
import TeamMembersPage from './TeamMembersPage';
import SchedulePage from './SchedulePage';
import MessagesPage from './MessagesPage';

const LayoutDashboard = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>;
const CalendarDays = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const Users = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const MessageSquare = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;

const TeamLeadLayout = ({ event }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const session = getSession();
  const basePath = `/event/${event.id}`;

  useEffect(() => {
    joinEvent(event.id);
    return () => leaveEvent(event.id);
  }, [event.id]);

  const links = [
    { label: 'Dashboard', path: `${basePath}/dashboard`, Icon: LayoutDashboard },
    { label: 'My Team', path: `${basePath}/team`, Icon: Users },
    { label: 'Schedule', path: `${basePath}/schedule`, Icon: CalendarDays },
    { label: 'Messages', path: `${basePath}/messages`, Icon: MessageSquare },
  ];

  const currentPath = window.location.pathname;
  const currentTitle = links.find(l => currentPath.startsWith(l.path))?.label || 'Team Lead Area';

  return (
    <div className="app-layout">
      <Sidebar links={links} event={event} isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-wrapper">
        <TopBar title={currentTitle} user={session.user} onMenuToggle={() => setSidebarOpen(true)} />
        <div className="main-content">
          <Routes>
            <Route path="dashboard" element={<TeamLeadDashboard event={event} />} />
            <Route path="team" element={<TeamMembersPage event={event} />} />
            <Route path="schedule" element={<SchedulePage event={event} />} />
            <Route path="messages" element={<MessagesPage event={event} />} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default TeamLeadLayout;
