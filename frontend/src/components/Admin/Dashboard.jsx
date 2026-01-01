import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../Shared/ThemeToggle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import ChatIcon from '@mui/icons-material/Chat';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import './Dashboard.css';

const API_BASE = 'http://localhost:5000';

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, [page]);

  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/admin/responses`, {
        params: { page, per_page: 20 }
      });
      setSessions(response.data.sessions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/export?format=csv`, {
        responseType: 'blob'
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `responses_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (sessionId) => {
    try {
      await axios.delete(`${API_BASE}/admin/response/${sessionId}`);
      loadSessions();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCleanup = async () => {
    const minutes = 30;
    if (!confirm(`Clean up abandoned sessions with no answers that are older than ${minutes} minutes?`)) {
      return;
    }
    
    try {
      const response = await axios.post(`${API_BASE}/admin/cleanup?minutes=${minutes}`);
      alert(response.data.message);
      loadSessions();
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'badge badge-success';
      case 'in_progress':
        return 'badge badge-warning';
      default:
        return 'badge badge-error';
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <div className="header-title">
            <DashboardIcon style={{ fontSize: '32px' }} />
            <h1>Admin Dashboard</h1>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="header-actions">
          <button onClick={handleCleanup} className="btn btn-warning btn-sm">
            <CleaningServicesIcon style={{ fontSize: '18px' }} />
            Cleanup
          </button>
          <button onClick={handleExport} className="btn btn-success btn-sm">
            <FileDownloadIcon style={{ fontSize: '18px' }} />
            Export CSV
          </button>
          <button onClick={() => navigate('/')} className="btn btn-primary btn-sm">
            <ChatIcon style={{ fontSize: '18px' }} />
            Chat
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading sessions...</p>
          </div>
        ) : (
          <>
            {sessions.length === 0 ? (
              <div className="empty-state card">
                <ChatIcon style={{ fontSize: '64px', color: 'var(--color-text-tertiary)', marginBottom: '1rem' }} />
                <h3>No Sessions Found</h3>
                <p>Start a conversation to see data here.</p>
                <button onClick={() => navigate('/')} className="btn btn-primary">
                  <ChatIcon style={{ fontSize: '18px' }} />
                  Start Chat
                </button>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card card">
                    <div className="stat-value">{pagination?.total || 0}</div>
                    <div className="stat-label">Total Sessions</div>
                  </div>
                  <div className="stat-card card">
                    <div className="stat-value">
                      {sessions.filter(s => s.status === 'completed').length}
                    </div>
                    <div className="stat-label">Completed</div>
                  </div>
                  <div className="stat-card card">
                    <div className="stat-value">
                      {sessions.filter(s => s.status === 'in_progress').length}
                    </div>
                    <div className="stat-label">In Progress</div>
                  </div>
                </div>

                <div className="table-container card">
                  <table className="sessions-table">
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
                      {sessions.map((session) => (
                        <tr key={session.id}>
                          <td className="session-id">{session.id.substring(0, 8)}...</td>
                          <td>
                            <span className={getStatusBadgeClass(session.status)}>
                              {session.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="date-cell">
                            {new Date(session.created_at).toLocaleString()}
                          </td>
                          <td className="answers-count">{session.answers_count}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => navigate(`/admin/response/${session.id}`)}
                                className="btn btn-primary btn-sm"
                                title="View Details"
                              >
                                <VisibilityIcon style={{ fontSize: '18px' }} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(session.id)}
                                className="btn btn-error btn-sm"
                                title="Delete Session"
                              >
                                <DeleteIcon style={{ fontSize: '18px' }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pagination && pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn btn-secondary btn-sm"
                    >
                      Previous
                    </button>
                    <span className="pagination-info">
                      Page {page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= pagination.pages}
                      className="btn btn-secondary btn-sm"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <DeleteIcon style={{ fontSize: '48px', color: 'var(--color-error)', marginBottom: '1rem' }} />
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete this session? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn btn-error"
              >
                <DeleteIcon style={{ fontSize: '18px' }} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
