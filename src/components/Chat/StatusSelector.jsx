"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '@/contexts/ChatContext';

const StatusSelector = () => {
  const { userStatus, toggleStatus, USER_STATUS } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Status disponíveis para seleção e suas configurações
  const statusOptions = [
    { id: USER_STATUS.ONLINE, label: 'Disponível', color: 'bg-green-500', icon: '✓' },
    { id: USER_STATUS.AWAY, label: 'Ausente', color: 'bg-yellow-500', icon: '⌛' },
    { id: USER_STATUS.BUSY, label: 'Ocupado', color: 'bg-red-500', icon: '✗' },
  ];
  
  // Status atual selecionado
  const currentStatus = statusOptions.find(option => option.id === userStatus) || statusOptions[0];
  
  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Alterna o dropdown
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  // Seleciona um novo status
  const selectStatus = (statusId) => {
    toggleStatus(statusId);
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        aria-label="Alterar status"
      >
        <span className={`w-3 h-3 ${currentStatus.color} rounded-full`}></span>
      </button>
      
      {/* Dropdown do status */}
      {isOpen && (
        <div className="absolute bottom-12 mb-1 right-0 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
          {statusOptions.map(option => (
            <button
              key={option.id}
              onClick={() => selectStatus(option.id)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 ${
                option.id === userStatus ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <span className={`w-3 h-3 ${option.color} rounded-full inline-block`} />
              <span className="text-sm text-gray-800 dark:text-gray-200">{option.label}</span>
              {option.id === userStatus && (
                <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusSelector;