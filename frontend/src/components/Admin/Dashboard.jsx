import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Components
import ThemeToggle from '../Shared/ThemeToggle';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import BarChartIcon from '@mui/icons-material/BarChart';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PercentIcon from '@mui/icons-material/Percent';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

// Styles
import './Dashboard.css';

// ============================================
// CONSTANTS
// ============================================
const API_BASE = 'http://localhost:5000';
const PER_PAGE = 20;
const CLEANUP_MINUTES = 30;

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
const getStatusBadgeClass = (status) => {
  const statusMap = {
    completed: 'status-completed',
    in_progress: 'status-in-progress',
    abandoned: 'status-abandoned',
  };
  return `status-badge ${statusMap[status] || 'status-badge'}`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const truncateId = (id, length = 8) => {
  return id ? `${id.substring(0, length)}...` : 'N/A';
};

// ============================================
// SUB-COMPONENTS
// ============================================
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="dashboard-loading">
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
      {message}
    </motion.p>
  </div>
);

const EmptyState = () => (
  <motion.div
    className="empty-state"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <BarChartIcon />
    <h3>No Sessions Yet</h3>
    <p>Start a conversation to see data here.</p>
  </motion.div>
);

const StatsCard = ({ icon: Icon, label, value, delay }) => (
  <motion.div
    className="stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -5 }}
  >
    <div className="stat-header">
      <div className="stat-icon">
        <Icon />
      </div>
      <span className="stat-label">{label}</span>
    </div>
    <div className="stat-value">{value}</div>
  </motion.div>
);

const DeleteConfirmModal = ({ session, onConfirm, onCancel }) => (
  <motion.div
    className="modal-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onCancel}
  >
    <motion.div
      className="modal-content"
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <h3>Confirm Delete</h3>
        <button className="modal-close" onClick={onCancel}>
          <CloseIcon />
        </button>
      </div>
      <div className="modal-body">
        <p>
          Are you sure you want to delete session{' '}
          <strong>{truncateId(session?.id)}</strong>?
        </p>
        <p className="modal-warning">This action cannot be undone.</p>
      </div>
      <div className="modal-actions">
        <motion.button
          className="btn btn-secondary"
          onClick={onCancel}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
        <motion.button
          className="btn btn-error"
          onClick={onConfirm}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <DeleteIcon />
          Delete Session
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);

const SessionRow = ({ session, onView, onDelete, index }) => (
  <motion.tr
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ backgroundColor: 'var(--color-background)' }}
  >
    <td>
      <span className="session-id-cell">{truncateId(session.id)}</span>
    </td>
    <td>
      <span className={getStatusBadgeClass(session.status)}>
        {session.status === 'completed' ? (
          <CheckCircleIcon style={{ fontSize: '1rem' }} />
        ) : (
          <HourglassEmptyIcon style={{ fontSize: '1rem' }} />
        )}
        {session.status.replace('_', ' ')}
      </span>
    </td>
    <td>{formatDate(session.created_at)}</td>
    <td>
      <span className="answers-count">{session.answers_count}</span>
    </td>
    <td>
      <div className="table-actions">
        <motion.button
          className="icon-btn"
          onClick={() => onView(session.id)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="View Details"
        >
          <VisibilityIcon />
        </motion.button>
        <motion.button
          className="icon-btn icon-btn-delete"
          onClick={() => onDelete(session)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Delete Session"
        >
          <DeleteIcon />
        </motion.button>
      </div>
    </td>
  </motion.tr>
);

const Pagination = ({ current, total, onChange }) => {
  if (total <= 1) return null;

  return (
    <div className="pagination">
      <motion.button
        className="btn btn-secondary"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        whileHover={{ scale: current === 1 ? 1 : 1.05 }}
        whileTap={{ scale: current === 1 ? 1 : 0.95 }}
      >
        Previous
      </motion.button>
      <span className="pagination-info">
        Page {current} of {total}
      </span>
      <motion.button
        className="btn btn-secondary"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        whileHover={{ scale: current === total ? 1 : 1.05 }}
        whileTap={{ scale: current === total ? 1 : 0.95 }}
      >
        Next
      </motion.button>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const Dashboard = () => {
  // ========== STATE ==========
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  // ========== COMPUTED VALUES ==========
  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === 'completed').length;
    const inProgress = sessions.filter((s) => s.status === 'in_progress').length;
    const totalAnswers = sessions.reduce((sum, s) => sum + s.answers_count, 0);

    return {
      total,
      completed,
      inProgress,
      totalAnswers,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [sessions]);

  // ========== CALLBACKS ==========
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/admin/responses`, {
        params: { page, per_page: PER_PAGE },
      });
      setSessions(response.data.sessions);
      setPagination(response.data.pagination);
      toast.success(`Loaded ${response.data.sessions.length} sessions`);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error(error.response?.data?.error || 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  const handleExport = useCallback(async () => {
    const exportPromise = axios
      .get(`${API_BASE}/admin/export?format=csv`, { responseType: 'blob' })
      .then((response) => {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lola_responses_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      });

    toast.promise(exportPromise, {
      loading: 'Exporting data...',
      success: 'CSV downloaded successfully! 📥',
      error: 'Export failed',
    });
  }, []);

  const handleDelete = useCallback(
    async (sessionId) => {
      const deletePromise = axios
        .delete(`${API_BASE}/admin/response/${sessionId}`)
        .then(() => {
          loadSessions();
          setDeleteConfirm(null);
        });

      toast.promise(deletePromise, {
        loading: 'Deleting session...',
        success: 'Session deleted successfully! 🗑️',
        error: 'Failed to delete session',
      });
    },
    [loadSessions]
  );

  const handleCleanup = useCallback(async () => {
    const cleanupPromise = axios
      .post(`${API_BASE}/admin/cleanup?minutes=${CLEANUP_MINUTES}`)
      .then((response) => {
        loadSessions();
        return response.data.message;
      });

    toast.promise(cleanupPromise, {
      loading: 'Cleaning up abandoned sessions...',
      success: (message) => message || 'Cleanup completed! ✨',
      error: 'Cleanup failed',
    });
  }, [loadSessions]);

  const handleView = useCallback(
    (sessionId) => {
      navigate(`/admin/response/${sessionId}`);
    },
    [navigate]
  );

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  // ========== EFFECTS ==========
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ========== RENDER ==========
  return (
    <div className="dashboard">
      {/* Header */}
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="dashboard-title">
          <DashboardIcon />
          <h1>Admin Dashboard</h1>
        </div>
        <div className="dashboard-actions">
          <motion.button
            className="btn btn-secondary"
            onClick={handleExport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileDownloadIcon />
            Export CSV
          </motion.button>
          <motion.button
            className="btn btn-secondary"
            onClick={handleCleanup}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CleaningServicesIcon />
            Cleanup
          </motion.button>
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Stats Cards */}
      {!isLoading && sessions.length > 0 && (
        <motion.div
          className="stats-grid"
          variants={ANIMATION_VARIANTS.container}
          initial="hidden"
          animate="show"
        >
          <StatsCard
            icon={BarChartIcon}
            label="Total Sessions"
            value={stats.total}
            delay={0}
          />
          <StatsCard
            icon={TaskAltIcon}
            label="Completed"
            value={stats.completed}
            delay={0.1}
          />
          <StatsCard
            icon={PendingActionsIcon}
            label="In Progress"
            value={stats.inProgress}
            delay={0.2}
          />
          <StatsCard
            icon={PercentIcon}
            label="Completion Rate"
            value={`${stats.completionRate}%`}
            delay={0.3}
          />
        </motion.div>
      )}

      {/* Sessions Table */}
      <motion.div
        className="responses-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="section-header">
          <div className="section-title">
            <BarChartIcon />
            <h2>Recent Sessions</h2>
          </div>
          <div className="section-actions">
            <motion.button
              className="btn btn-primary"
              onClick={loadSessions}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Refresh
            </motion.button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && <LoadingSpinner message="Loading sessions..." />}

        {/* Empty State */}
        {!isLoading && sessions.length === 0 && <EmptyState />}

        {/* Table */}
        {!isLoading && sessions.length > 0 && (
          <>
            <div className="responses-table-wrapper">
              <table className="responses-table">
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Answers</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {sessions.map((session, index) => (
                      <SessionRow
                        key={session.id}
                        session={session}
                        onView={handleView}
                        onDelete={setDeleteConfirm}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <Pagination
                current={pagination.page}
                total={pagination.pages}
                onChange={handlePageChange}
              />
            )}
          </>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirmModal
            session={deleteConfirm}
            onConfirm={() => handleDelete(deleteConfirm.id)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
