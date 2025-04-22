"use client";

import React from 'react';
import { USER_STATUS } from '@/contexts/ChatContext';

const StatusIndicator = ({ status }) => {
  const statusColors = {
    [USER_STATUS.ONLINE]: 'bg-green-500',
    [USER_STATUS.AWAY]: 'bg-yellow-500',
    [USER_STATUS.BUSY]: 'bg-red-500',
    [USER_STATUS.OFFLINE]: 'bg-gray-500',
  };
  
  return (
    <span className={`absolute top-0 right-0 w-3 h-3 ${statusColors[status] || 'bg-gray-400'} rounded-full border-2 border-white dark:border-gray-800`}></span>
  );
};

const ChatBubble = ({ onClick, isOpen, unreadCount = 0, status = 'online', onlineCount = 0 }) => {
  return (
    <button
      onClick={onClick}
      className="relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
    >
      {/* Indicador de status do usuário */}
      <StatusIndicator status={status} />
      
      {/* Ícone do chat */}
      {isOpen ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
      )}
      
      {/* Badge com contagem de mensagens não lidas */}
      {!isOpen && unreadCount > 0 && (
        <span className="absolute -top-1 -left-1 bg-red-500 text-xs text-white font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      
      {/* Badge com contagem de usuários online */}
      {!isOpen && onlineCount > 0 && (
        <span className="absolute -bottom-1 -left-1 bg-green-500 text-xs text-white font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {onlineCount}
        </span>
      )}
    </button>
  );
};

export default ChatBubble;