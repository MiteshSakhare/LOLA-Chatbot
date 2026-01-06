import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

// Components
import ThemeToggle from '../Shared/ThemeToggle';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

// Styles
import './ResponseDetail.css';

// ============================================
// CONSTANTS
// ============================================
const API_BASE = 'http://localhost:5000';

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatStatus = (status) => {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
};

const isJsonString = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

const formatAnswer = (answer) => {
  if (answer === null || answer === undefined) return 'No answer';
  
  if (typeof answer === 'object') {
    return JSON.stringify(answer, null, 2);
  }
  if (typeof answer === 'string' && isJsonString(answer)) {
    return JSON.stringify(JSON.parse(answer), null, 2);
  }
  return String(answer);
};

// ============================================
// SUB-COMPONENTS
// ============================================
const LoadingState = () => (
  <div className="detail-loading">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring' }}
    >
      <div className="spinner" />
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      Loading response details...
    </motion.p>
  </div>
);

const InfoCard = ({ icon: Icon, title, children }) => (
  <motion.div
    className="info-card"
    variants={ANIMATION_VARIANTS.item}
    whileHover={{ y: -5 }}
  >
    <div className="info-header">
      <Icon />
      <h2>{title}</h2>
    </div>
    {children}
  </motion.div>
);

const InfoItem = ({ label, value, isSpecial = false }) => (
  <div className="info-item">
    <span className="info-label">{label}</span>
    <div className={isSpecial ? 'session-id-value' : 'info-value'}>
      {value}
    </div>
  </div>
);

const AnswerCard = ({ answer, index }) => {
  const isJson = useMemo(
    () => typeof answer.answer === 'object',
    [answer.answer]
  );

  return (
    <motion.div
      className="answer-card"
      variants={ANIMATION_VARIANTS.item}
      whileHover={{ x: 4 }}
    >
      <motion.div
        className="answer-number"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: index * 0.05 }}
      >
        {index + 1}
      </motion.div>

      <div className="answer-content">
        <motion.h4
          className="answer-question"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 + 0.1 }}
        >
          {answer.question_text || 'Question not available'}
        </motion.h4>

        <motion.div
          className="answer-value"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.2 }}
        >
          {isJson ? (
            <pre className="answer-json">{formatAnswer(answer.answer)}</pre>
          ) : (
            <p>{formatAnswer(answer.answer)}</p>
          )}
        </motion.div>

        {answer.answered_at && (
          <motion.div
            className="answer-timestamp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.3 }}
          >
            {formatDate(answer.answered_at)}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ResponseDetail = () => {
  // ========== HOOKS ==========
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // ========== STATE ==========
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ========== CALLBACKS ==========
  const loadResponse = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/response/${sessionId}`);
      setResponse(res.data);
      toast.success('Response loaded successfully');
    } catch (error) {
      console.error('Failed to load response:', error);
      toast.error(error.response?.data?.error || 'Failed to load response');
      navigate('/admin');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, navigate]);

  const handleExport = useCallback(async () => {
    const exportPromise = axios
      .get(`${API_BASE}/admin/response/${sessionId}/export`, {
        responseType: 'blob',
      })
      .then((res) => {
        const blob = res.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `response_${sessionId}_${
          new Date().toISOString().split('T')[0]
        }.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      });

    toast.promise(exportPromise, {
      loading: 'Exporting response...',
      success: 'Response exported! 📥',
      error: 'Export failed',
    });
  }, [sessionId]);

  const handleBack = useCallback(() => {
    navigate('/admin');
  }, [navigate]);

  // ========== EFFECTS ==========
  useEffect(() => {
    loadResponse();
  }, [loadResponse]);

  // ========== COMPUTED VALUES ==========
  const statusBadge = useMemo(() => {
    if (!response?.status) return <span className="status-badge">Unknown</span>;
    
    const statusClass =
      response.status === 'completed' ? 'status-completed' : 'status-in-progress';

    return (
      <span className={`status-badge ${statusClass}`}>
        {response.status === 'completed' ? (
          <CheckCircleIcon style={{ fontSize: '1rem' }} />
        ) : (
          <HourglassEmptyIcon style={{ fontSize: '1rem' }} />
        )}
        {formatStatus(response.status)}
      </span>
    );
  }, [response]);

  // ========== RENDER ==========
  if (isLoading) {
    return (
      <div className="response-detail">
        <LoadingState />
      </div>
    );
  }

  if (!response) {
    return null;
  }

  return (
    <div className="response-detail">
      {/* Header */}
      <motion.div
        className="detail-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-left">
          <motion.button
            className="btn btn-secondary"
            onClick={handleBack}
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowBackIcon />
            Back to Dashboard
          </motion.button>
        </div>
        <div className="header-right">
          <motion.button
            className="btn btn-primary"
            onClick={handleExport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <DownloadIcon />
            Export JSON
          </motion.button>
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="detail-content"
        variants={ANIMATION_VARIANTS.container}
        initial="hidden"
        animate="show"
      >
        {/* Session Info */}
        <InfoCard icon={InfoIcon} title="Session Information">
          <div className="info-grid">
            <InfoItem 
              label="Session ID" 
              value={response.session_id || 'N/A'} 
              isSpecial 
            />
            <InfoItem label="Status" value={statusBadge} />
            <InfoItem
              label="Created"
              value={formatDate(response.created_at)}
            />
            <InfoItem
              label="Total Answers"
              value={
                <span className="answer-count">
                  {response.answers?.length || 0}
                </span>
              }
            />
          </div>
        </InfoCard>

        {/* Answers Section */}
        <div className="answers-section">
          <div className="section-header">
            <QuestionAnswerIcon />
            <h3>Responses ({response.answers?.length || 0})</h3>
          </div>

          {response.answers && response.answers.length > 0 ? (
            <motion.div
              className="answers-list"
              variants={ANIMATION_VARIANTS.container}
            >
              <AnimatePresence>
                {response.answers.map((answer, index) => (
                  <AnswerCard 
                    key={answer.id || index} 
                    answer={answer} 
                    index={index} 
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="empty-state">
              <p>No answers recorded yet.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResponseDetail;
