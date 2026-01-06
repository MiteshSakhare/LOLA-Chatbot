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
    const o = JSON.parse(str);
    if (o && typeof o === "object") {
      return true;
    }
  } catch (e) { }
  return false;
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
  // Determine which field holds the value
  const rawValue = answer.answer ?? answer.response ?? answer.value ?? answer.text_answer ?? answer.answer_text;

  // Helper to render content based on type
  const renderContent = () => {
    if (rawValue === null || rawValue === undefined) return 'No answer';

    // 1. If it's a JSON string, parse it
    let parsedValue = rawValue;
    let isJson = false;

    if (typeof rawValue === 'string' && isJsonString(rawValue)) {
      parsedValue = JSON.parse(rawValue);
      isJson = true;
    } else if (typeof rawValue === 'object') {
      isJson = true;
    }

    // 2. Render Object/JSON nicely
    if (isJson && typeof parsedValue === 'object' && parsedValue !== null) {
      // If it's an Array (like a Ranking question)
      if (Array.isArray(parsedValue)) {
        return (
          <div className="formatted-json-answer">
            {parsedValue.map((item, i) => (
              <div key={i} className="json-item">
                <span className="json-key">#{i + 1}</span>
                <span className="json-value">{String(item)}</span>
              </div>
            ))}
          </div>
        );
      }
      
      // If it's an Object (like a Multi-field question)
      return (
        <div className="formatted-json-answer">
          {Object.entries(parsedValue).map(([key, value]) => (
            <div key={key} className="json-item">
              <span className="json-key">{key.replace(/_/g, ' ')}:</span>
              <span className="json-value">{String(value)}</span>
            </div>
          ))}
        </div>
      );
    }

    // 3. Render Standard Text
    return <p>{String(rawValue)}</p>;
  };

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
          {answer.question_text || `Question ${index + 1}`}
        </motion.h4>

        <motion.div
          className="answer-value"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.2 }}
        >
          {renderContent()}
        </motion.div>

        {(answer.answered_at || answer.created_at) && (
          <motion.div
            className="answer-timestamp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.3 }}
          >
            {formatDate(answer.answered_at || answer.created_at)}
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

  // ========== LOAD DATA ==========
  const loadResponse = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check if sessionId exists
      if (!sessionId && sessionId !== 0) {
        throw new Error("Invalid Session ID");
      }

      // Try fetching by ID (adjust endpoint if needed)
      // Note: Using a generic endpoint pattern. Replace with exact API route if different.
      const res = await axios.get(`${API_BASE}/admin/response/${sessionId}`);
      
      console.log('📊 API Response Data:', res.data);
      setResponse(res.data);
      toast.success('Response loaded successfully');
    } catch (error) {
      console.error('Failed to load response:', error);
      toast.error('Failed to load response details');
      navigate('/admin');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, navigate]);

  // ========== CLIENT-SIDE EXPORT ==========
  const handleExport = useCallback(() => {
    if (!response) {
      toast.error("No data to export");
      return;
    }

    try {
      // 1. Create a clean JSON string from the current state
      const jsonString = JSON.stringify(response, null, 2);
      
      // 2. Create a Blob
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // 3. Create a link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `response_${response.session_id || sessionId}_export.json`;
      document.body.appendChild(a);
      a.click();
      
      // 4. Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Response exported! 📥');
    } catch (err) {
      console.error("Export Error:", err);
      toast.error("Failed to export JSON");
    }
  }, [response, sessionId]);

  const handleBack = useCallback(() => {
    navigate('/admin');
  }, [navigate]);

  // ========== EFFECTS ==========
  useEffect(() => {
    loadResponse();
  }, [loadResponse]);

  // ========== COMPUTED VALUES ==========
  const statusBadge = useMemo(() => {
    // Handle nested session object if it exists (common API pattern)
    const status = response?.session?.status || response?.status;
    
    if (!status) return <span className="status-badge">Unknown</span>;
    
    const statusClass = status === 'completed' ? 'status-completed' : 'status-in-progress';

    return (
      <span className={`status-badge ${statusClass}`}>
        {status === 'completed' ? (
          <CheckCircleIcon style={{ fontSize: '1rem' }} />
        ) : (
          <HourglassEmptyIcon style={{ fontSize: '1rem' }} />
        )}
        {formatStatus(status)}
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

  // Handle data structure variations (Direct object vs Nested in 'session')
  const displaySessionId = response.session?.id || response.session_id || response.id;
  const displayDate = response.session?.created_at || response.created_at;
  // Ensure we are grabbing the array. Check 'answers' first.
  const displayAnswers = response.answers || [];

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
              value={displaySessionId || 'N/A'} 
              isSpecial 
            />
            <InfoItem label="Status" value={statusBadge} />
            <InfoItem
              label="Created"
              value={formatDate(displayDate)}
            />
            <InfoItem
              label="Total Answers"
              value={
                <span className="answer-count">
                  {displayAnswers.length}
                </span>
              }
            />
          </div>
        </InfoCard>

        {/* Answers Section */}
        <div className="answers-section">
          <div className="section-header">
            <QuestionAnswerIcon />
            <h3>Responses ({displayAnswers.length})</h3>
          </div>

          {displayAnswers.length > 0 ? (
            <motion.div
              className="answers-list"
              variants={ANIMATION_VARIANTS.container}
            >
              <AnimatePresence>
                {displayAnswers.map((answer, index) => (
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