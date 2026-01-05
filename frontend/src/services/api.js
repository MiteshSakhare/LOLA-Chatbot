import axios from 'axios';

const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get client info
const getClientInfo = () => {
  return {
    ip_address: 'browser',
    user_agent: navigator.userAgent,
  };
};

// Start a new session
export const startSession = async () => {
  try {
    const clientInfo = getClientInfo();
    const response = await api.post('/session/start', clientInfo);
    return response.data;
  } catch (error) {
    console.error('Start session error:', error);
    throw error.response?.data || error;
  }
};

// Submit an answer - FIXED ENDPOINT
export const submitAnswer = async (sessionId, questionId, answer) => {
  try {
    const response = await api.post(`/session/${sessionId}/answer`, {
      question_id: questionId,
      answer: answer,
    });
    return response.data;
  } catch (error) {
    console.error('Submit answer error:', error);
    throw error.response?.data || error;
  }
};

// Get session summary
export const getSessionSummary = async (sessionId) => {
  try {
    const response = await api.get(`/session/summary/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Get summary error:', error);
    throw error.response?.data || error;
  }
};

export default api;
