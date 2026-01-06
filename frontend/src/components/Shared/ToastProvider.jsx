import { Toaster } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

const ToastProvider = () => {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: theme === 'dark' ? '#1e293b' : '#ffffff',
          color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
          border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow:
            theme === 'dark'
              ? '0 10px 40px rgba(0, 0, 0, 0.5)'
              : '0 10px 40px rgba(0, 0, 0, 0.1)',
          fontSize: '0.9375rem',
          fontWeight: '500',
          padding: '1rem 1.25rem',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
        loading: {
          iconTheme: {
            primary: '#6366f1',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
};

export default ToastProvider;
