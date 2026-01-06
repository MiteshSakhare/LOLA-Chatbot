import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import './Message.css';

// ============================================
// CONSTANTS
// ============================================
const MESSAGE_TYPES = {
  USER: 'user',
  BOT: 'bot',
  SYSTEM: 'system',
};

const ANIMATION_VARIANTS = {
  message: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  avatar: {
    hover: { rotate: -10, scale: 1.1 },
    tap: { rotate: 0, scale: 0.95 },
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatMessageText = (text) => {
  if (typeof text !== 'string') {
    return JSON.stringify(text, null, 2);
  }
  return text;
};

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const renderTextWithLinks = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (isValidUrl(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="message-link"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

// ============================================
// SUB-COMPONENTS
// ============================================
const MessageAvatar = ({ type, sender }) => {
  const Icon = type === MESSAGE_TYPES.USER ? PersonIcon : SmartToyIcon;
  const ariaLabel = type === MESSAGE_TYPES.USER ? 'User message' : 'AI assistant message';

  return (
    <motion.div
      className="message-avatar"
      variants={ANIMATION_VARIANTS.avatar}
      whileHover="hover"
      whileTap="tap"
      aria-label={ariaLabel}
    >
      <Icon className="avatar-icon" />
    </motion.div>
  );
};

const MessageContent = ({ type, text, timestamp }) => {
  const formattedText = useMemo(() => formatMessageText(text), [text]);

  return (
    <div className="message-content">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {renderTextWithLinks(formattedText)}
      </motion.p>
      {timestamp && (
        <motion.time
          className="message-timestamp"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          dateTime={timestamp}
        >
          {new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </motion.time>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const Message = ({ 
  text, 
  type = MESSAGE_TYPES.BOT, 
  sender = 'AI', 
  timestamp,
  isTyping = false 
}) => {
  // ========== VALIDATION ==========
  if (!text && !isTyping) {
    console.warn('Message component: text prop is required');
    return null;
  }

  // ========== COMPUTED VALUES ==========
  const messageClass = useMemo(() => {
    return `chat-message message-${type}`;
  }, [type]);

  // ========== RENDER ==========
  // Typing indicator
  if (isTyping) {
    return (
      <motion.div
        className={`${messageClass} typing`}
        {...ANIMATION_VARIANTS.message}
      >
        <MessageAvatar type={MESSAGE_TYPES.BOT} sender="AI" />
        <div className="message-content">
          <div className="typing-indicator">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      </motion.div>
    );
  }

  // Regular message
  return (
    <motion.div
      className={messageClass}
      {...ANIMATION_VARIANTS.message}
      layout
    >
      <MessageAvatar type={type} sender={sender} />
      <MessageContent type={type} text={text} timestamp={timestamp} />
    </motion.div>
  );
};

// Named exports for flexibility
export { MESSAGE_TYPES };
export default Message;
