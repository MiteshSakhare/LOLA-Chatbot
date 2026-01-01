import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ current = 0, total = 12, percentage = 0 }) => {
  return (
    <div className="progress-container">
      <div className="progress-info">
        <span className="progress-text">Question {current} of {total}</span>
        <span className="progress-percentage">{percentage}%</span>
      </div>
      <div className="progress-bar-track">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        >
          <div className="progress-shimmer"></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
