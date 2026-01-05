import React from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonIcon from '@mui/icons-material/Person';
import './Message.css';

const Message = ({ type, content }) => {
  return (
    <div className={`chat-message message-${type}`}>
      <div className="message-avatar">
        {type === 'bot' ? (
          <AutoAwesomeIcon className="avatar-icon" />
        ) : (
          <PersonIcon className="avatar-icon" />
        )}
      </div>
      <div className="message-content">
        <p>{content}</p>
      </div>
    </div>
  );
};

export default Message;
