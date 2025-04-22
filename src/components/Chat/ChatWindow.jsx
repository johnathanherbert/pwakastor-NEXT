"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import MessageReactions from './MessageReactions';

const MessageBubble = ({ message, isOwn }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div 
        className={`rounded-lg px-3 py-2 max-w-[80%] ${
          isOwn 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <div className="text-xs mt-1 text-right">
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <MessageReactions message={message} />
      </div>
    </div>
  );
};

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-1 px-4 py-2 max-w-[70%] bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg rounded-bl-none mb-2">
      <span className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
      <span className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
      <span className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
    </div>
  );
};

const ChatHeader = ({ activeChat, onlineUsers, onClose }) => {
  // Encontra o usuário atual do chat
  const chatUserId = activeChat?.split('_').find(Boolean);
  const activeUser = onlineUsers.find(user => user.user_id === chatUserId);
  
  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-500',
  };
  
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {activeUser ? (
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
            <span className={`absolute bottom-0 right-0 w-3 h-3 ${statusColors[activeUser.status]} rounded-full border-2 border-white dark:border-gray-800`}></span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {activeUser.name || activeUser.email.split('@')[0]}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeUser.status === 'online' ? 'Online' : 
               activeUser.status === 'away' ? 'Ausente' : 
               activeUser.status === 'busy' ? 'Ocupado' : 'Offline'}
            </p>
          </div>
        </div>
      ) : (
        <div className="h-10 flex items-center">
          <span className="text-gray-500 dark:text-gray-400">Selecione um usuário para conversar</span>
        </div>
      )}
      
      <button 
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  );
};

const ChatWindow = ({ onClose }) => {
  const { 
    activeChat, 
    messages, 
    sendMessage, 
    fetchMessages,
    onlineUsers,
    updateTypingStatus,
    currentUser
  } = useChatContext();
  
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Identificar nosso próprio ID a partir do currentUser no contexto
  const userId = currentUser?.id;
  
  // Determinar o ID do outro usuário no chat ativo
  const getReceiverId = () => {
    if (!activeChat || !userId) return null;
    const userIds = activeChat.split('_');
    // O receiver é o outro usuário no chat
    return userIds.find(id => id !== userId);
  };
  
  const receiverId = getReceiverId();
  
  // Efeito para buscar mensagens quando muda o chat ativo
  useEffect(() => {
    if (activeChat) {
      setLoading(true);
      fetchMessages(activeChat).finally(() => {
        setLoading(false);
      });
    }
  }, [activeChat, fetchMessages]);
  
  // Efeito para rolar para o final quando as mensagens mudam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Função para enviar mensagem
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !receiverId) return;
    
    try {
      await sendMessage(receiverId, messageInput);
      setMessageInput('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };
  
  // Filtrar mensagens para o chat atual
  const chatMessages = messages.filter(msg => msg.chat_id === activeChat);
  
  // Lidar com digitação
  const handleTyping = () => {
    if (receiverId) {
      updateTypingStatus(receiverId, true);
    }
  };
  
  // Determinar o nome do destinatário
  const receiver = onlineUsers.find(user => user.user_id === receiverId);
  const receiverName = receiver ? (receiver.name || receiver.email.split('@')[0]) : 'Usuário';
  
  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho do chat */}
      <div className="bg-white dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <div className="flex-1">
          <h3 className="font-medium text-gray-800 dark:text-white">
            {receiverName}
          </h3>
          {receiver && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {receiver.status === 'online' ? 'Online' : 
              receiver.status === 'away' ? 'Ausente' : 
              receiver.status === 'busy' ? 'Ocupado' : 'Offline'}
            </p>
          )}
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-900">
        {loading ? (
          <div className="flex justify-center py-10">
            <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : chatMessages.length > 0 ? (
          chatMessages.map(message => (
            <MessageBubble 
              key={message.id}
              message={message}
              isOwn={message.sender_id === userId}
            />
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <p>Nenhuma mensagem ainda. Comece uma conversa!</p>
          </div>
        )}
        
        {/* Indicador de digitação */}
        {receiver?.isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input de mensagem */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Digite uma mensagem..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleTyping}
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-300 transition-colors"
            disabled={!messageInput.trim() || !receiverId}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;