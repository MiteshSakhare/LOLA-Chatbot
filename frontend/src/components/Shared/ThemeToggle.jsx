import React from 'react';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="theme-toggle-track">
        <div className={`theme-toggle-thumb ${theme}`}>
          {theme === 'light' ? (
            <LightModeIcon className="theme-icon" />
          ) : (
            <DarkModeIcon className="theme-icon" />
          )}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
