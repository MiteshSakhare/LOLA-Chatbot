import { useState, useCallback } from 'react';
import { startSession, submitAnswer } from '../services/api';

export const useSession = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 12, percentage: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  const startNewSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await startSession();
      setSessionId(response.session_id);
      setCurrentQuestion(response.question);
      setProgress(response.progress);
    } catch (err) {
      setError(err.message || 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmitAnswer = useCallback(async (questionId, answer) => {
    if (!sessionId || !currentQuestion) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add user's answer to messages
      const answerText = Array.isArray(answer) ? answer.join(', ') : answer;
      setMessages(prev => [...prev, {
        type: 'user',
        content: answerText
      }]);

      const response = await submitAnswer(sessionId, questionId, answer);

      if (response.completed) {
        setIsCompleted(true);
        setSummary(response.summary);
        setCurrentQuestion(null);
      } else {
        setCurrentQuestion(response.question);
        setProgress(response.progress);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, currentQuestion]);

  const resetSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setCurrentQuestion(null);
    setProgress({ current: 0, total: 12, percentage: 0 });
    setIsLoading(false);
    setIsCompleted(false);
    setError(null);
    setSummary(null);
    startNewSession();
  }, [startNewSession]);

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
    submitAnswer: handleSubmitAnswer,
    resetSession,
  };
};
