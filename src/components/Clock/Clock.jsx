import { useState, useEffect } from 'react';

export default function Clock({ className = "", showDate = false, variant = "default", showSeconds = true }) {
  const [time, setTime] = useState(new Date());
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setTime(new Date());
      // Trigger subtle animation when seconds change
      setAnimate(true);
      setTimeout(() => setAnimate(false), 500);
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
      hour12: false,
      timeZone: 'America/Manaus' 
    };
    
    if (showSeconds) {
      options.second = '2-digit';
    }
    
    return time.toLocaleTimeString('pt-BR', options);
  };
  
  // Format date for display
  const formatDate = () => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Manaus'
    };
    
    return time.toLocaleDateString('pt-BR', options);
  };
  
  // Different styles based on variant
  const getClockStyles = () => {
    switch (variant) {
      case 'minimal':
        return 'bg-transparent px-1 py-0.5';
      case 'glass':
        return 'backdrop-blur-md bg-white/40 dark:bg-gray-800/40 shadow-lg border-white/20 dark:border-gray-700/50';
      case 'gradient':
        return 'bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-500 dark:to-brand-400 text-white border-brand-400/30';
      case 'outlined':
        return 'bg-transparent border-2';
      case 'elegant':
        return 'bg-gradient-to-br from-gray-900/90 to-gray-800 text-white border-gray-700/50 shadow-xl';
      case 'modern':
        return 'bg-white dark:bg-gray-800 shadow-lg border-0 ring-1 ring-gray-200/50 dark:ring-gray-700/30';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div 
      className={`inline-flex ${getClockStyles()} rounded-lg px-2.5 py-1.5 items-center gap-1.5 border shadow-sm hover:shadow transition-all duration-300 ${className}`} 
      style={{display: 'flex !important'}}
    >
      <svg 
        className={`h-3.5 w-3.5 ${variant === 'gradient' || variant === 'elegant' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
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
      <div className="flex flex-col">
        <span 
          className={`text-xs font-medium ${animate ? 'animate-pulse' : ''} ${
            variant === 'gradient' || variant === 'elegant' ? 'text-white' : 'text-gray-700 dark:text-gray-200'
          }`}
        >
          {formatTimeForManaus()}
        </span>
        {showDate && (
          <span className={`text-[10px] ${
            variant === 'gradient' || variant === 'elegant' ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {formatDate()}
          </span>
        )}
      </div>
    </div>
  );
}
