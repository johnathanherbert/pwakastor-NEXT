"use client";

import React, { useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';

const ForwardMessage = ({ message, onClose }) => {
  const { users, forwardMessage } = useChatContext();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) && 
    user.id !== message.sender_id
  ) || [];

  const toggleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  const handleForward = () => {
    if (selectedUsers.length === 0) return;
    
    selectedUsers.forEach(userId => {
      forwardMessage(message, userId);
    });
    
    onClose();
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-white dark:bg-gray-800 z-20 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Forward Message</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
          <p className="text-sm text-gray-800 dark:text-gray-200">{message.content}</p>
        </div>
      </div>
      
      <input
        type="text"
        placeholder="Search users..."
        className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div className="flex-1 overflow-y-auto mb-4">
        {filteredUsers.length > 0 ? (
          <ul className="space-y-2">
            {filteredUsers.map(user => (
              <li 
                key={user.id}
                className={`flex items-center p-2 rounded-lg cursor-pointer ${
                  selectedUsers.includes(user.id) 
                    ? 'bg-blue-100 dark:bg-blue-900' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => toggleSelectUser(user.id)}
              >
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  user.status === 'online' ? 'bg-green-500' : 
                  user.status === 'away' ? 'bg-yellow-500' : 
                  user.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                <span className="flex-1 text-gray-800 dark:text-white">{user.username}</span>
                {selectedUsers.includes(user.id) && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">No users found</p>
        )}
      </div>
      
      <button
        onClick={handleForward}
        disabled={selectedUsers.length === 0}
        className={`w-full py-2 rounded-lg text-white ${
          selectedUsers.length > 0 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        Forward to {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
      </button>
    </div>
  );
};

export default ForwardMessage;