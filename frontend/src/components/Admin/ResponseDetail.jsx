import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import './ResponseDetail.css';

const API_BASE = 'http://localhost:5000';

const ResponseDetail = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResponse();
  }, [sessionId]);

  const loadResponse = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/admin/response/${sessionId}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to load response:', error);
      setError(error.response?.data?.error || 'Failed to load response details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="response-detail">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading response details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="response-detail">
        <div className="error-state card">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/admin')} className="btn btn-primary">
            <ArrowBackIcon style={{ fontSize: '18px' }} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="response-detail">
      <div className="detail-header">
        <button onClick={() => navigate('/admin')} className="btn btn-secondary">
          <ArrowBackIcon style={{ fontSize: '18px' }} />
          Back
        </button>
        <h1>Session Details</h1>
      </div>

      <div className="detail-content">
        <div className="session-info card">
          <h2>Session Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <PersonIcon style={{ color: 'var(--color-primary)' }} />
              <div>
                <div className="info-label">Session ID</div>
                <div className="info-value">{data.session.id}</div>
              </div>
            </div>
            <div className="info-item">
              <CalendarTodayIcon style={{ color: 'var(--color-primary)' }} />
              <div>
                <div className="info-label">Created</div>
                <div className="info-value">
                  {new Date(data.session.created_at).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="info-item">
              <QuestionAnswerIcon style={{ color: 'var(--color-primary)' }} />
              <div>
                <div className="info-label">Status</div>
                <div className="info-value">
                  <span className={`badge ${
                    data.session.status === 'completed' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {data.session.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="answers-section card">
          <h2>Responses ({data.answers.length})</h2>
          <div className="answers-list">
            {data.answers.map((answer, index) => (
              <div key={index} className="answer-item">
                <div className="answer-question">
                  Q{index + 1}: {answer.question_id.replace(/_/g, ' ')}
                </div>
                <div className="answer-text">
                  {answer.answer_text}
                </div>
                <div className="answer-time">
                  {new Date(answer.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDetail;
