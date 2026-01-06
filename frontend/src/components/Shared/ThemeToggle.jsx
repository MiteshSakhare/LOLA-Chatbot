import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import './ThemeToggle.css';

// ============================================
// CONSTANTS
// ============================================
const ANIMATION_VARIANTS = {
  icon: {
    initial: { rotate: -90, opacity: 0 },
    animate: { rotate: 0, opacity: 1 },
    exit: { rotate: 90, opacity: 0 },
  },
};

// ============================================
// MAIN COMPONENT
// ============================================
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      className="theme-toggle"
      onClick={toggleTheme}
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.9 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <motion.div
        key={theme}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={ANIMATION_VARIANTS.icon}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <DarkModeIcon className="theme-icon" />
        ) : (
          <LightModeIcon className="theme-icon" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;
