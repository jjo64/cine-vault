import React from 'react';

interface NoticeBarProps {
  message: string | null;
  type: 'success' | 'error' | 'info';
}

export function NoticeBar({ message, type }: NoticeBarProps) {
  if (!message) return null;

  return (
    <div className={`md-notice-bar md-notice-bar--${type}`}>
      {message}
    </div>
  );
}
