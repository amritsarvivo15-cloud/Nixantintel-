import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      id="portfolio-toast"
      className="fixed left-1/2 bottom-5 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[var(--text)] text-[var(--bg)] text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce"
    >
      <span>{message}</span>
    </div>
  );
};
