import React from 'react';
import './Button.css';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
}) => {
  const buttonClasses = [
    'button-modern',
    `button-${variant}`,
    `button-${size}`,
    fullWidth && 'button-full',
    isLoading && 'button-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={buttonClasses}
    >
      {isLoading ? (
        <>
          <span className="button-spinner"></span>
          <span className="button-text">Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className="button-icon button-icon-left" />
          )}
          <span className="button-text">{children}</span>
          {Icon && iconPosition === 'right' && (
            <Icon className="button-icon button-icon-right" />
          )}
        </>
      )}
    </button>
  );
};

export default Button;
