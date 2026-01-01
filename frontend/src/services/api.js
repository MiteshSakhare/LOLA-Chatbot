import axios from 'axios';

const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? 'http://localhost:5000' : '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const sessionAPI = {
  startSession: async () => {
    const response = await api.post('/session/start');
    return response.data;
  },

  submitAnswer: async (sessionId, questionId, answer) => {
    const response = await api.post(`/session/${sessionId}/answer`, {
      question_id: questionId,
      answer: answer,
    });
    return response.data;
  },

  getSummary: async (sessionId) => {
    const response = await api.get(`/session/${sessionId}/summary`);
    return response.data;
  },
};

export const adminAPI = {
  getResponses: async (page = 1, perPage = 20) => {
    const response = await api.get('/admin/responses', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  getResponse: async (sessionId) => {
    const response = await api.get(`/admin/response/${sessionId}`);
    return response.data;
  },

  deleteResponse: async (sessionId) => {
    const response = await api.delete(`/admin/response/${sessionId}`);
    return response.data;
  },

  exportResponses: async () => {
    const response = await api.get('/admin/export?format=csv', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;
