import { useState, useCallback, useEffect } from 'react';
import Toast from './Toast';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  // Listen for custom toast events
  useEffect(() => {
    const handleToast = (event) => {
      if (event.detail) {
        addToast(event.detail.message, event.detail.type, event.detail.duration);
      }
    };

    window.addEventListener('showToast', handleToast);
    
    return () => {
      window.removeEventListener('showToast', handleToast);
    };
  }, []);

  // Add a new toast
  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  // Remove a toast by id
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}

// Helper function to show a toast from anywhere in the app
export const showToast = (message, type = 'success', duration = 3000) => {
  window.dispatchEvent(new CustomEvent('showToast', {
    detail: { message, type, duration }
  }));
};
