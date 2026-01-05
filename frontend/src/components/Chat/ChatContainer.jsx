import React, { useEffect, useRef } from 'react';
import QuestionInput from './QuestionInput';
import ProgressBar from './ProgressBar';
import ThemeToggle from '../Shared/ThemeToggle';
import { useSession } from '../../hooks/useSession';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import './ChatContainer.css';

const ChatContainer = () => {
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

  const hasStartedSession = useRef(false);

  useEffect(() => {
    if (!hasStartedSession.current && !sessionId) {
      hasStartedSession.current = true;
      startNewSession();
    } else if (sessionId && messages.length === 0 && !currentQuestion) {
      hasStartedSession.current = true;
      startNewSession();
    }
  }, []);

  if (isCompleted) {
    return (
      <div className="survey-container">
        <div className="survey-header-minimal">
          <ThemeToggle />
        </div>
        <div className="completion-screen">
          <div className="completion-content">
            <div className="success-animation">
              <div className="success-circle">
                <CheckCircleIcon className="success-icon" />
              </div>
            </div>
            
            <h1 className="completion-title">🎉 Awesome!</h1>
            <p className="completion-subtitle">
              Your business discovery journey is complete. We've captured all the details!
            </p>
            
            {summary && summary.answers && (
              <div className="summary-card">
                <div className="summary-header">
                  <TipsAndUpdatesIcon />
                  <h3>Your Responses Summary</h3>
                </div>
                <div className="summary-list">
                  {Object.entries(summary.answers).map(([key, value], index) => (
                    <div key={key} className="summary-item" style={{'--item-index': index}}>
                      <div className="summary-key">
                        <span className="summary-bullet">•</span>
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="summary-value">
                        {Array.isArray(value) ? value.join(', ') : value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={resetSession} className="btn btn-primary btn-restart">
              <RefreshIcon />
              Start New Session
              <RocketLaunchIcon className="btn-icon-end" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-container">
      {/* Header */}
      <header className="survey-header">
        <div className="header-wrapper">
          <div className="header-brand">
            <div className="brand-icon">
              <AutoAwesomeIcon className="sparkle-icon" />
            </div>
            <div className="brand-text">
              <h2>Business Discovery</h2>
              <span className="brand-tagline">Powered by AI</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <ProgressBar {...progress} />
      </header>

      {/* Main Content Area */}
      <main className="survey-content">
        {!currentQuestion && !isLoading && !error && (
          <div className="loading-state">
            <div className="spinner-modern"></div>
            <p>Initializing your session...</p>
          </div>
        )}

        {!currentQuestion && !isLoading && messages.length === 0 && (
          <div className="welcome-section">
            <div className="welcome-icon-wrapper">
              <div className="robot-icon">
                <AutoAwesomeIcon className="robot-sparkle" />
              </div>
            </div>
            <h3>Hey there! 👋</h3>
            <p>
              I'm your AI assistant ready to learn about your business. 
              Let's discover what makes your venture unique!
            </p>
            <div className="feature-pills">
              <span className="pill">
                <AutoAwesomeIcon /> Smart Questions
              </span>
              <span className="pill">
                <RocketLaunchIcon /> Quick Process
              </span>
            </div>
          </div>
        )}

        {currentQuestion && !isLoading && (
          <div className="question-section">
            <div className="question-badge">
              <AutoAwesomeIcon className="badge-icon" />
              <span>Question {progress.current} of {progress.total}</span>
            </div>
            
            <h3 className="question-title">{currentQuestion.text}</h3>

            <QuestionInput
              question={currentQuestion}
              onSubmit={submitAnswer}
              isLoading={isLoading}
            />
          </div>
        )}

        {error && (
          <div className="error-section">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <strong>Oops! Something went wrong</strong>
              <p>{error}</p>
              <button onClick={startNewSession} className="btn btn-secondary btn-sm">
                Try Again
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="spinner-ring">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <p className="loading-text">Processing your response...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
