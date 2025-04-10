'use client';
import { useState, useEffect } from 'react';
import { Toast } from './Toast';

// Toast context to manage toast state globally
let showToastFn = () => {};

export function showToast(message, type = 'info', duration = 3000) {
  showToastFn(message, type, duration);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const [count, setCount] = useState(0);

  // Expose the function to show toasts
  showToastFn = (message, type, duration) => {
    const id = count;
    setCount(prevCount => prevCount + 1);
    
    const newToast = {
      id,
      message,
      type,
      duration,
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 min-w-[300px]">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
