import { useState, useEffect } from 'react';

export default function Clock({ className = "" }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Clean up on unmount
    return () => {
      clearInterval(timer);
    };
  }, []);

  // Format time for Manaus timezone (GMT-4)
  const formatTimeForManaus = () => {
    // Create date with Manaus timezone (America/Manaus)
    const options = { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Manaus' 
    };
    
    return time.toLocaleTimeString('pt-BR', options);
  };

  return (
    <div className={`inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1 items-center gap-1 border border-gray-200 dark:border-gray-700 shadow-sm ${className}`} style={{display: 'flex !important'}}>
      <svg 
        className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
        {formatTimeForManaus()}
      </span>
    </div>
  );
}
