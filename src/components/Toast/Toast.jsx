'use client';
import { useEffect, useState } from 'react';

export function Toast({ message, type = 'info', onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Animation delay
    setIsVisible(true);
    
    // Setup auto-close
    return () => {
      setIsVisible(false);
    };
  }, []);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/30';
      case 'error': return 'bg-red-50 dark:bg-red-900/30';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/30';
      default: return 'bg-blue-50 dark:bg-blue-900/30';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'border-green-200 dark:border-green-800';
      case 'error': return 'border-red-200 dark:border-red-800';
      case 'warning': return 'border-yellow-200 dark:border-yellow-800';
      default: return 'border-blue-200 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success': return 'text-green-800 dark:text-green-200';
      case 'error': return 'text-red-800 dark:text-red-200';
      case 'warning': return 'text-yellow-800 dark:text-yellow-200';
      default: return 'text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div 
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`
        flex items-center p-4 mb-1 border rounded-lg shadow-md
        ${getBackgroundColor()}
        ${getBorderColor()}
      `}>
        <div className="inline-flex items-center justify-center flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className={`text-sm font-medium ${getTextColor()}`}>
          {message}
        </div>
        <button 
          type="button" 
          className={`ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 focus:ring-2 inline-flex h-8 w-8 ${getTextColor()} hover:bg-opacity-10 focus:outline-none`}
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
