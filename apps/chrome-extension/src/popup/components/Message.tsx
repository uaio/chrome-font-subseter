import React from 'react';

interface MessageProps {
  text: string;
  type: 'success' | 'error';
}

export const Message: React.FC<MessageProps> = ({ text, type }) => {
  return (
    <div className={`message ${type}`}>
      {text}
    </div>
  );
};