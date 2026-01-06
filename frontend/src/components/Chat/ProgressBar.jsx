import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckIcon from '@mui/icons-material/Check';
import './ProgressBar.css';

// ============================================
// CONSTANTS
// ============================================
const ANIMATION_VARIANTS = {
  progressBar: {
    initial: { scaleX: 0 },
    animate: { scaleX: 1 },
    transition: { duration: 0.8, ease: 'easeOut' },
  },
  dot: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { type: 'spring', stiffness: 300 },
  },
};

// ============================================
// SUB-COMPONENTS
// ============================================
const ProgressInfo = ({ answered, total, percentage }) => (
  <div className="progress-info-bar">
    <div className="progress-label-group">
      <motion.div
        className="progress-icon"
        animate={{
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      >
        <TrendingUpIcon />
      </motion.div>
      <p className="progress-text">
        Progress: <strong>{answered}</strong> of <strong>{total}</strong> questions
      </p>
    </div>

    <motion.div
      className="progress-percent"
      key={percentage}
      initial={{ scale: 1.2 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {percentage}%
    </motion.div>
  </div>
);

const ProgressDot = ({ position, isActive, index }) => (
  <motion.div
    className={`progress-dot ${isActive ? 'active' : ''}`}
    style={{ left: `${position}%` }}
    initial="initial"
    animate="animate"
    variants={ANIMATION_VARIANTS.dot}
    transition={{ delay: index * 0.1 }}
  >
    {isActive && (
      <motion.span
        className="dot-check"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <CheckIcon style={{ fontSize: '0.875rem' }} />
      </motion.span>
    )}
  </motion.div>
);

const StageLabel = ({ label, position, isActive }) => (
  <div
    className={`stage-label ${isActive ? 'active' : ''}`}
    style={{ width: `${100 / 3}%` }}
  >
    {label}
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const ProgressBar = ({ progress }) => {
  // ========== VALIDATION ==========
  if (!progress || progress.total_questions === 0) {
    return null;
  }

  // ========== COMPUTED VALUES ==========
  const { answered_count, total_questions } = progress;
  const percentage = useMemo(
    () => Math.round((answered_count / total_questions) * 100),
    [answered_count, total_questions]
  );

  // Calculate milestone positions (Start, Halfway, Complete)
  const milestones = useMemo(() => {
    const halfway = Math.floor(total_questions / 2);
    return [
      { position: 0, isActive: answered_count >= 0, label: 'Start' },
      {
        position: 50,
        isActive: answered_count >= halfway,
        label: 'Halfway',
      },
      {
        position: 100,
        isActive: answered_count >= total_questions,
        label: 'Complete',
      },
    ];
  }, [answered_count, total_questions]);

  // ========== RENDER ==========
  return (
    <motion.div
      className="progress-wrapper"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Progress Info */}
      <ProgressInfo
        answered={answered_count}
        total={total_questions}
        percentage={percentage}
      />

      {/* Progress Bar */}
      <div className="progress-bar-wrapper">
        <div className="progress-bar-bg">
          <motion.div
            className="progress-bar-active"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="progress-shine" />
          </motion.div>
        </div>

        {/* Progress Dots */}
        <div className="progress-dots">
          {milestones.map((milestone, index) => (
            <ProgressDot
              key={index}
              position={milestone.position}
              isActive={milestone.isActive}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Stage Labels */}
      <div className="progress-stages">
        {milestones.map((milestone, index) => (
          <StageLabel
            key={index}
            label={milestone.label}
            position={milestone.position}
            isActive={milestone.isActive}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ProgressBar;
