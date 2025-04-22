"use client";

import React from 'react';
import { useChatContext } from '@/contexts/ChatContext';

const UsersList = () => {
  const { 
    onlineUsers, 
    setActiveChat, 
    activeChat, 
    unreadMessages,
    USER_STATUS
  } = useChatContext();

  // Cores para os diferentes status dos usuários
  const statusColors = {
    [USER_STATUS.ONLINE]: 'bg-green-500',
    [USER_STATUS.AWAY]: 'bg-yellow-500',
    [USER_STATUS.BUSY]: 'bg-red-500',
    [USER_STATUS.OFFLINE]: 'bg-gray-500',
  };
  
  // Função para iniciar um chat com um usuário
  const startChat = (userId) => {
    // Cria ou recupera o ID do chat (formato userId1_userId2 ordenados)
    const chatId = [userId].sort().join('_');
    setActiveChat(chatId);
  };
  
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <div className="bg-gray-50 dark:bg-gray-900 p-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-medium text-gray-800 dark:text-gray-200">
          Usuários Online ({onlineUsers.length})
        </h2>
      </div>
      
      <div className="overflow-y-auto max-h-60">
        {onlineUsers.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {onlineUsers.map((user) => {
              // Determina o ID do chat para este usuário
              const chatId = [user.user_id].sort().join('_');
              // Quantidade de mensagens não lidas deste usuário
              const unreadCount = unreadMessages[chatId] || 0;
              
              return (
                <li 
                  key={user.user_id}
                  className={`px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                    activeChat === chatId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => startChat(user.user_id)}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 ${statusColors[user.status]} rounded-full border-2 border-white dark:border-gray-800`}></span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.name || user.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.status === USER_STATUS.ONLINE ? 'Online' : 
                       user.status === USER_STATUS.AWAY ? 'Ausente' : 
                       user.status === USER_STATUS.BUSY ? 'Ocupado' : 'Offline'}
                    </p>
                  </div>
                  
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-6 px-4 text-center text-gray-500 dark:text-gray-400">
            <p>Nenhum usuário online no momento</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersList;