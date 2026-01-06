import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useSession } from '../../hooks/useSession';
import { useSessionCleanup } from '../../hooks/useSessionCleanup';
import toast from 'react-hot-toast';

// Components
import QuestionInput from './QuestionInput';
import ProgressBar from './ProgressBar';
import ThemeToggle from '../Shared/ThemeToggle';

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Styles
import './ChatContainer.css';

// ============================================
// CONSTANTS
// ============================================
const CONFETTI_DURATION = 5000;
const TOAST_DURATION = 5000;

const ANIMATION_VARIANTS = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -30, scale: 0.95 },
};

// ============================================
// SUB-COMPONENTS
// ============================================
const LoadingState = () => (
  <div className="loading-state">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="spinner" />
    </motion.div>
    <motion.h3
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      Initializing your session...
    </motion.h3>
  </div>
);

const WelcomeScreen = () => (
  <motion.div
    className="welcome-screen"
    initial="initial"
    animate="animate"
    exit="exit"
    variants={ANIMATION_VARIANTS}
  >
    <motion.div
      className="welcome-icon"
      animate={{
        rotate: [0, -10, 10, -10, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatDelay: 3,
      }}
    >
      <AutoAwesomeIcon />
    </motion.div>

    <h2>Welcome to LOLA</h2>
    <p>
      I'm your AI assistant ready to learn about your business. Let's discover
      what makes your venture unique!
    </p>

    <motion.div
      className="welcome-features"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="feature-item">
        <RocketLaunchIcon />
        <span>Quick & Easy</span>
      </div>
      <div className="feature-item">
        <TipsAndUpdatesIcon />
        <span>AI-Powered Insights</span>
      </div>
    </motion.div>
  </motion.div>
);

const ErrorState = ({ error }) => (
  <motion.div
    className="error-state"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <ErrorOutlineIcon />
    <p>{error}</p>
  </motion.div>
);

const ProcessingState = () => (
  <motion.div
    className="processing-state"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="spinner-small" />
    <p>Processing your response...</p>
  </motion.div>
);

const CompletionScreen = ({ onRestart }) => (
  <motion.div
    className="completion-screen"
    initial="initial"
    animate="animate"
    exit="exit"
    variants={ANIMATION_VARIANTS}
  >
    <motion.div
      className="completion-icon"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <CheckCircleIcon />
    </motion.div>

    <div className="completion-content">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        🎉 Journey Complete!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Thank you for sharing your vision with us. We've captured all the essential
        details about your business. Our team will review your responses and get back
        to you soon!
      </motion.p>
    </div>

    <motion.div
      className="completion-actions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <motion.button
        className="restart-btn"
        onClick={onRestart}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <RefreshIcon />
        Start New Session
      </motion.button>
    </motion.div>
  </motion.div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const ChatContainer = () => {
  // ========== HOOKS ==========
  const {
    sessionId,
    messages,
    currentQuestion,
    progress,
    isLoading,
    isCompleted,
    error,
    summary,
    startNewSession,
    submitAnswer,
    resetSession,
  } = useSession();

  useSessionCleanup(sessionId, isCompleted);

  // ========== STATE ==========
  const hasStartedSession = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // ========== CALLBACKS ==========
  const handleResize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  const initializeSession = useCallback(async () => {
    const loadingToast = toast.loading('Initializing your session...');
    
    try {
      await startNewSession();
      toast.dismiss(loadingToast);
      toast.success("Session started! Let's begin 🚀", { duration: 3000 });
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to start session. Please try again.', {
        duration: TOAST_DURATION,
      });
    }
  }, [startNewSession]);

  const handleRestart = useCallback(() => {
    resetSession();
    hasStartedSession.current = false;
    setShowConfetti(false);
  }, [resetSession]);

  // ========== EFFECTS ==========
  // Window resize listener
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Session initialization
  useEffect(() => {
    if (!hasStartedSession.current && !sessionId) {
      hasStartedSession.current = true;
      initializeSession();
    }
  }, [sessionId, initializeSession]);

  // Completion handling
  useEffect(() => {
    if (isCompleted) {
      setShowConfetti(true);
      toast.success('🎉 Journey Complete! Amazing work!', {
        duration: TOAST_DURATION,
        icon: '🎊',
      });

      const timer = setTimeout(() => setShowConfetti(false), CONFETTI_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  // Error notifications
  useEffect(() => {
    if (error) {
      toast.error(error, { duration: TOAST_DURATION });
    }
  }, [error]);

  // ========== RENDER ==========
  // Completion Screen
  if (isCompleted) {
    return (
      <div className="chat-container">
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
          />
        )}
        <CompletionScreen onRestart={handleRestart} />
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-left">
          <motion.div
            className="logo-container"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <AutoAwesomeIcon />
          </motion.div>
          <div className="header-title">
            <h1>LOLA</h1>
            <p>AI Discovery Assistant</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Progress Bar */}
      {progress && progress.total_questions > 0 && (
        <div className="progress-section">
          <ProgressBar progress={progress} />
        </div>
      )}

      {/* Main Content */}
      <main className="chat-content">
        <AnimatePresence mode="wait">
          {/* Loading State */}
          {isLoading && !currentQuestion && (
            <motion.div key="loading" {...ANIMATION_VARIANTS}>
              <LoadingState />
            </motion.div>
          )}

          {/* Welcome Screen */}
          {!isLoading && !currentQuestion && !error && (
            <motion.div key="welcome" {...ANIMATION_VARIANTS}>
              <WelcomeScreen />
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div key="error" {...ANIMATION_VARIANTS}>
              <ErrorState error={error} />
            </motion.div>
          )}

                    {/* Question Section */}
          {currentQuestion && (
            <motion.div
              key={`question-${currentQuestion.id}`}
             className="question-section"
              {...ANIMATION_VARIANTS}
            >
             {/* Question Header - Badge + Text Inline */}
             <div className="question-header">
               <motion.div
                 className="question-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
               >
                 <AutoAwesomeIcon />
                 Question {progress?.answered_count + 1 || 1}
               </motion.div>
          
               <motion.h2
                  className="question-text"
                 initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.2 }}
               >
                 {currentQuestion.text}
               </motion.h2>
             </div>
          
              {/* Question Input */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
             >
               <QuestionInput
                 question={currentQuestion}
                 onSubmit={submitAnswer}
                 isLoading={isLoading}
                />
              </motion.div>
           </motion.div>
          )}

          {/* Processing State */}
          {isLoading && currentQuestion && (
            <motion.div key="processing" {...ANIMATION_VARIANTS}>
              <ProcessingState />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ChatContainer;
