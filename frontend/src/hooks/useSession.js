import { useState } from 'react';
import { sessionAPI } from '../services/api';
import { useLocalStorage } from './useLocalStorage';

export const useSession = () => {
  const [sessionId, setSessionId, clearSessionId] = useLocalStorage('lola_session_id', null);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 12, percentage: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  const startNewSession = async () => {
    setIsLoading(true);
    setError(null);
    console.log('Starting new session...');
    
    try {
      const data = await sessionAPI.startSession();
      console.log('Session started successfully:', data);
      
      setSessionId(data.session_id);
      setCurrentQuestion(data.question);
      setProgress(data.progress);
      setMessages([{
        type: 'bot',
        content: data.question.text,
        question: data.question,
      }]);
    } catch (err) {
      console.error('Failed to start session:', err);
      setError(err.response?.data?.error || 'Failed to start session. Please check if backend is running on http://localhost:5000');
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (questionId, answer) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userMessage = {
        type: 'user',
        content: formatAnswerForDisplay(answer),
        answer: answer,
      };
      setMessages(prev => [...prev, userMessage]);

      console.log('Submitting answer:', { sessionId, questionId, answer });
      const data = await sessionAPI.submitAnswer(sessionId, questionId, answer);
      console.log('Answer submitted successfully:', data);
      
      if (data.completed) {
        setIsCompleted(true);
        setSummary(data.summary);
        setProgress(data.progress);
        // Clear session from localStorage when completed
        clearSessionId();
      } else {
        setCurrentQuestion(data.question);
        setProgress(data.progress);
        setMessages(prev => [...prev, {
          type: 'bot',
          content: data.question.text,
          question: data.question,
        }]);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setError(err.response?.data?.error || 'Failed to submit answer');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const formatAnswerForDisplay = (answer) => {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return String(answer);
  };

  const resetSession = () => {
    clearSessionId();
    setMessages([]);
    setCurrentQuestion(null);
    setProgress({ current: 0, total: 12, percentage: 0 });
    setIsCompleted(false);
    setSummary(null);
    setError(null);
    setTimeout(() => {
      startNewSession();
    }, 100);
  };

  return {
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
  };
};
