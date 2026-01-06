/**
 * Simple state management for chat flow
 * Using vanilla JavaScript module pattern
 * Alternative to Redux/Zustand for lightweight apps
 */

let state = {
  sessionId: null,
  messages: [],
  currentQuestion: null,
  progress: { current: 0, total: 15, percentage: 0 },
  isLoading: false,
  isCompleted: false,
  error: null,
  summary: null,
};

const listeners = new Set();

const chatStore = {
  // Get current state
  getState: () => state,

  // Subscribe to state changes
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Update state and notify listeners
  setState: (updates) => {
    state = { ...state, ...updates };
    listeners.forEach(listener => listener(state));
  },

  // Actions
  actions: {
    setSessionId: (sessionId) => {
      chatStore.setState({ sessionId });
    },

    addMessage: (message) => {
      chatStore.setState({
        messages: [...state.messages, message]
      });
    },

    setCurrentQuestion: (question) => {
      chatStore.setState({ currentQuestion: question });
    },

    setProgress: (progress) => {
      chatStore.setState({ progress });
    },

    setLoading: (isLoading) => {
      chatStore.setState({ isLoading });
    },

    setCompleted: (isCompleted) => {
      chatStore.setState({ isCompleted });
    },

    setError: (error) => {
      chatStore.setState({ error });
    },

    setSummary: (summary) => {
      chatStore.setState({ summary });
    },

    reset: () => {
      chatStore.setState({
        sessionId: null,
        messages: [],
        currentQuestion: null,
        progress: { current: 0, total: 15, percentage: 0 },
        isLoading: false,
        isCompleted: false,
        error: null,
        summary: null,
      });
    }
  }
};

export default chatStore;

/**
 * React hook to use the store
 * Usage:
 * 
 * import { useChatStore } from '../store/chatStore';
 * 
 * const Component = () => {
 *   const { state, actions } = useChatStore();
 *   // Use state.messages, actions.addMessage(), etc.
 * }
 */
export const useChatStore = () => {
  const [localState, setLocalState] = React.useState(chatStore.getState());

  React.useEffect(() => {
    const unsubscribe = chatStore.subscribe(setLocalState);
    return unsubscribe;
  }, []);

  return {
    state: localState,
    actions: chatStore.actions
  };
};
