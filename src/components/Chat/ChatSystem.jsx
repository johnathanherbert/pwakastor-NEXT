"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useChatContext } from '@/contexts/ChatContext';
import ChatBubble from './ChatBubble';
import ChatWindow from './ChatWindow';

const ChatSystem = () => {
  const { 
    isChatOpen, 
    setIsChatOpen, 
    activeChat, 
    userStatus, 
    setUserStatus,
    unreadMessages
  } = useChatContext();
  
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {isChatOpen && (
        <ChatWindow 
          onClose={() => setIsChatOpen(false)} 
          isMobile={windowWidth < 768}
        />
      )}
      
      <ChatBubble 
        onClick={toggleChat} 
        unreadCount={unreadMessages.length}
        status={userStatus}
        onStatusChange={setUserStatus}
      />
    </div>
  );
};

export default ChatSystem;