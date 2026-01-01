import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  type = 'button',
  fullWidth = false,
  loading = false,
  icon = null,
  className = ''
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger'
  };
  const sizeClasses = {
    small: 'btn-small',
    medium: 'btn-medium',
    large: 'btn-large'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'btn-full' : '',
    disabled || loading ? 'btn-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true"></span>
      )}
      {icon && !loading && (
        <span className="btn-icon">{icon}</span>
      )}
      <span className="btn-text">{children}</span>

      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
          font-weight: 500;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          white-space: nowrap;
          user-select: none;
        }

        .btn:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }

        /* Variants */
        .btn-primary {
          background-color: var(--primary-color);
          color: #ffffff;
        }

        .btn-primary:hover:not(.btn-disabled) {
          background-color: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .btn-primary:active:not(.btn-disabled) {
          transform: translateY(0);
        }

        .btn-secondary {
          background-color: var(--secondary-color);
          color: var(--text-primary);
        }

        .btn-secondary:hover:not(.btn-disabled) {
          background-color: #e5e7eb;
        }

        .btn-outline {
          background-color: transparent;
          border: 2px solid var(--primary-color);
          color: var(--primary-color);
        }

        .btn-outline:hover:not(.btn-disabled) {
          background-color: var(--primary-color);
          color: #ffffff;
        }

        .btn-ghost {
          background-color: transparent;
          color: var(--text-primary);
        }

        .btn-ghost:hover:not(.btn-disabled) {
          background-color: var(--secondary-color);
        }

        .btn-danger {
          background-color: var(--error-color);
          color: #ffffff;
        }

        .btn-danger:hover:not(.btn-disabled) {
          background-color: #dc2626;
        }

        /* Sizes */
        .btn-small {
          padding: 6px 12px;
          font-size: 13px;
        }

        .btn-medium {
          padding: 10px 20px;
          font-size: 15px;
        }

        .btn-large {
          padding: 14px 28px;
          font-size: 16px;
        }

        /* States */
        .btn-disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-full {
          width: 100%;
        }

        /* Loading spinner */
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .btn-icon {
          display: flex;
          align-items: center;
        }

        .btn-text {
          display: inline-block;
        }
      `}</style>
    </button>
  );
};

export default Button;
