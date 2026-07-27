import React from 'react';

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <h2 className="brand">EventVerse</h2>
      <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
    </div>
  );
};

export default Loading;
