import React from 'react';

const StatCard = ({ label, value, icon, color = 'indigo' }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon icon-${color}`}>
        {icon}
      </div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
