import React from 'react';
import BarChartIcon from '@mui/icons-material/BarChart';
import './ProgressBar.css';

const ProgressBar = ({ current, total, percentage }) => {
  const milestones = [25, 50, 75, 100];

  return (
    <div className="progress-wrapper">
      <div className="progress-info-bar">
        <div className="progress-label-group">
          <BarChartIcon className="progress-icon" />
          <span className="progress-text">
            Question <strong>{current}</strong> of <strong>{total}</strong>
          </span>
        </div>
        <div className="progress-percent">
          {percentage}%
        </div>
      </div>

      <div className="progress-bar-wrapper">
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-active"
            style={{ width: `${percentage}%` }}
          >
            <div className="progress-shine"></div>
          </div>
        </div>

        {/* Milestone dots */}
        <div className="progress-dots">
          {milestones.map((milestone) => (
            <div
              key={milestone}
              className={`progress-dot ${percentage >= milestone ? 'active' : ''}`}
              style={{ left: `${milestone}%` }}
            >
              {percentage >= milestone && (
                <span className="dot-check">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage labels */}
      <div className="progress-stages">
        <span className={`stage-label ${percentage >= 0 ? 'active' : ''}`}>
          Getting Started
        </span>
        <span className={`stage-label ${percentage >= 50 ? 'active' : ''}`}>
          Halfway There
        </span>
        <span className={`stage-label ${percentage >= 100 ? 'active' : ''}`}>
          Complete!
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
