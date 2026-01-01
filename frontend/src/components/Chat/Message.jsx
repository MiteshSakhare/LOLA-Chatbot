import React from 'react';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import './Message.css';

const Message = ({ type, content }) => {
  return (
    <div className={`message-wrapper message-${type}`}>
      <div className="message-avatar">
        {type === 'bot' ? (
          <SmartToyIcon style={{ fontSize: '24px' }} />
        ) : (
          <PersonIcon style={{ fontSize: '24px' }} />
        )}
      </div>
      <div className="message-bubble">
        {content}
      </div>
    </div>
  );
};

export default Message;
