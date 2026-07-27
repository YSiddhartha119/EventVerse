import React from 'react';

const TopBar = ({ title, onMenuToggle, user }) => {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          ☰
        </button>
        <h2 className="page-title">{title}</h2>
      </div>
      <div className="topbar-right">
        {user && (
          <div className="avatar" title={user.name}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
