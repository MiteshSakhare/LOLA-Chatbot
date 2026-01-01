import React, { useEffect, useRef } from 'react';
import Message from './Message';
import QuestionInput from './QuestionInput';
import ProgressBar from './ProgressBar';
import ThemeToggle from '../Shared/ThemeToggle';
import { useSession } from '../../hooks/useSession';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
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

  const messagesEndRef = useRef(null);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isCompleted) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <ThemeToggle />
        </div>
        <div className="completion-screen">
          <div className="completion-icon">
            <CheckCircleIcon style={{ fontSize: '80px', color: 'var(--color-success)' }} />
          </div>
          <h1>Thank You!</h1>
          <p>Your business discovery form has been submitted successfully.</p>
          
          {summary && summary.answers && (
            <div className="summary-section card">
              <h3>Your Responses</h3>
              <div className="summary-grid">
                {Object.entries(summary.answers).map(([key, value]) => (
                  <div key={key} className="summary-item">
                    <strong>{key.replace(/_/g, ' ')}:</strong>
                    <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={resetSession} className="btn btn-primary btn-lg">
            <RefreshIcon style={{ fontSize: '20px' }} />
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <h2>Business Discovery Chat</h2>
          <ThemeToggle />
        </div>
        <ProgressBar {...progress} />
      </div>

      <div className="messages-container">
        {messages.length === 0 && !isLoading && !error && (
          <div className="empty-state">
            <div className="spinner"></div>
            <p>Initializing chat...</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <Message key={index} type={msg.type} content={msg.content} />
        ))}
        
        {error && (
          <div className="error-banner card">
            <strong>Error:</strong> {error}
            <br />
            <button onClick={startNewSession} className="btn btn-primary btn-sm" style={{ marginTop: '10px' }}>
              Retry
            </button>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {currentQuestion && !isLoading && (
        <div className="input-container">
          <QuestionInput
            question={currentQuestion}
            onSubmit={submitAnswer}
            isLoading={isLoading}
          />
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
