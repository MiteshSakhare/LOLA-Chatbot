import React from 'react';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Toggle theme"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '2px solid var(--color-border)',
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {theme === 'light' ? (
        <DarkModeIcon style={{ fontSize: '24px' }} />
      ) : (
        <LightModeIcon style={{ fontSize: '24px' }} />
      )}
    </button>
  );
};

export default ThemeToggle;
