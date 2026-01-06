import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

// ============================================
// CONSTANTS
// ============================================
const BUTTON_VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  success: 'btn-success',
  error: 'btn-error',
  warning: 'btn-warning',
  ghost: 'btn-ghost',
};

const BUTTON_SIZES = {
  small: 'btn-small',
  medium: 'btn-medium',
  large: 'btn-large',
};

const ANIMATION_VARIANTS = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
  disabled: { opacity: 0.6, cursor: 'not-allowed' },
};

// ============================================
// MAIN COMPONENT
// ============================================
const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...rest
}) => {
  // ========== COMPUTED VALUES ==========
  const buttonClasses = [
    'btn',
    BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary,
    BUTTON_SIZES[size] || BUTTON_SIZES.medium,
    fullWidth && 'btn-full-width',
    loading && 'btn-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const isDisabled = disabled || loading;

  // ========== HANDLERS ==========
  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  // ========== RENDER ==========
  return (
    <motion.button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? ANIMATION_VARIANTS.hover : undefined}
      whileTap={!isDisabled ? ANIMATION_VARIANTS.tap : undefined}
      animate={isDisabled ? ANIMATION_VARIANTS.disabled : undefined}
      {...rest}
    >
      {loading && <span className="loading-spinner" />}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="btn-icon btn-icon-left" />
      )}
      
      <span className="btn-text">{children}</span>
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="btn-icon btn-icon-right" />
      )}
    </motion.button>
  );
};

export default Button;
