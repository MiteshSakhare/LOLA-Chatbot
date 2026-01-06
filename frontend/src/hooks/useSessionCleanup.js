import { useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const PENDING_SESSION_KEY = 'pending_session_id';

export const useSessionCleanup = (sessionId, isCompleted) => {
  const isCleaningUp = useRef(false);

  // Store session ID in localStorage when it's created
  useEffect(() => {
    if (sessionId && !isCompleted) {
      localStorage.setItem(PENDING_SESSION_KEY, sessionId);
      console.log('[SESSION] Stored pending session:', sessionId);
    }
  }, [sessionId, isCompleted]);

  // Clean up previous pending session on mount
  useEffect(() => {
    const cleanupPreviousSession = async () => {
      const pendingSessionId = localStorage.getItem(PENDING_SESSION_KEY);
      
      if (pendingSessionId && pendingSessionId !== sessionId) {
        console.log('[CLEANUP] Found previous incomplete session:', pendingSessionId);
        try {
          await axios.delete(`${API_BASE_URL}/session/${pendingSessionId}`);
          console.log('[CLEANUP] Deleted previous session:', pendingSessionId);
          localStorage.removeItem(PENDING_SESSION_KEY);
        } catch (error) {
          console.warn('[CLEANUP] Could not delete previous session:', error.message);
          // Remove from localStorage anyway
          localStorage.removeItem(PENDING_SESSION_KEY);
        }
      }
    };

    cleanupPreviousSession();
  }, []); // Run only once on mount

  // Remove from localStorage when session is completed
  useEffect(() => {
    if (isCompleted && sessionId) {
      const pendingSessionId = localStorage.getItem(PENDING_SESSION_KEY);
      if (pendingSessionId === sessionId) {
        localStorage.removeItem(PENDING_SESSION_KEY);
        console.log('[SESSION] Completed - removed from pending:', sessionId);
      }
    }
  }, [isCompleted, sessionId]);

  // Handle page unload/navigation away
  useEffect(() => {
    if (!sessionId || isCompleted) {
      return;
    }

    const handleBeforeUnload = () => {
      if (isCleaningUp.current) return;
      isCleaningUp.current = true;

      const pendingSessionId = localStorage.getItem(PENDING_SESSION_KEY);
      if (pendingSessionId === sessionId) {
        // Use sendBeacon for reliable delivery during page unload
        const url = `${API_BASE_URL}/session/${sessionId}`;
        
        if (navigator.sendBeacon) {
          // sendBeacon with DELETE requires a workaround
          // We'll send a POST with _method=DELETE
          const formData = new FormData();
          formData.append('_method', 'DELETE');
          navigator.sendBeacon(url, formData);
          console.log('[CLEANUP] Sent beacon to delete session:', sessionId);
        } else {
          // Fallback: synchronous XMLHttpRequest (deprecated but works in unload)
          const xhr = new XMLHttpRequest();
          xhr.open('DELETE', url, false); // false = synchronous
          try {
            xhr.send();
            console.log('[CLEANUP] Sent sync request to delete session:', sessionId);
          } catch (e) {
            console.warn('[CLEANUP] Sync request failed:', e);
          }
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [sessionId, isCompleted]);
};
