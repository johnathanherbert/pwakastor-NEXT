"use client";

import React, { useState, useMemo } from 'react';
import { useChatContext, USER_STATUS } from '@/contexts/ChatContext';
import { Tooltip } from '@/components/ui/tooltip';

const statusColors = {
  [USER_STATUS.ONLINE]: 'bg-green-500',
  [USER_STATUS.AWAY]: 'bg-yellow-500',
  [USER_STATUS.BUSY]: 'bg-red-500',
  [USER_STATUS.OFFLINE]: 'bg-gray-500'
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const formatLastSeen = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}m atrás`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export default function OnlineUsers({ maxDisplayed = 5, showOffline = false }) {
  const { onlineUsers } = useChatContext();
  const [expanded, setExpanded] = useState(false);
  
  const filteredUsers = useMemo(() => {
    return onlineUsers
      .filter(user => showOffline || user.status !== USER_STATUS.OFFLINE)
      .sort((a, b) => {
        // Ordenar por status (online primeiro)
        const statusOrder = {
          [USER_STATUS.ONLINE]: 0,
          [USER_STATUS.AWAY]: 1,
          [USER_STATUS.BUSY]: 2,
          [USER_STATUS.OFFLINE]: 3
        };
        
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        
        // Se status igual, ordenar por nome
        return a.name.localeCompare(b.name);
      });
  }, [onlineUsers, showOffline]);
  
  const displayedUsers = expanded ? filteredUsers : filteredUsers.slice(0, maxDisplayed);
  const hasMore = filteredUsers.length > maxDisplayed;
  
  return (
    <div className="flex flex-col space-y-2 p-3 bg-background border rounded-lg shadow-sm">
      <h3 className="text-sm font-medium mb-2 flex items-center">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
        Usuários Ativos ({filteredUsers.length})
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {displayedUsers.map(user => (
          <Tooltip 
            key={user.user_id}
            content={
              <div className="text-xs">
                <div className="font-medium">{user.name || user.email}</div>
                <div className="flex items-center mt-1">
                  <div className={`w-2 h-2 rounded-full ${statusColors[user.status]} mr-1`}></div>
                  <span className="capitalize">{user.status}</span>
                </div>
                {user.last_seen && (
                  <div className="text-muted-foreground mt-1">
                    Visto: {formatLastSeen(user.last_seen)}
                  </div>
                )}
              </div>
            }
          >
            <div 
              className="relative group flex items-center justify-center w-9 h-9 rounded-full 
                      bg-primary/10 text-xs font-semibold cursor-pointer hover:bg-primary/20 
                      transition-colors"
            >
              {getInitials(user.name || user.email)}
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full 
                            ${statusColors[user.status]} border-2 border-background`}>
              </div>
            </div>
          </Tooltip>
        ))}
        
        {hasMore && !expanded && (
          <div 
            className="flex items-center justify-center w-9 h-9 rounded-full 
                     bg-muted text-xs font-semibold cursor-pointer hover:bg-muted/80 
                     transition-colors"
            onClick={() => setExpanded(true)}
          >
            +{filteredUsers.length - maxDisplayed}
          </div>
        )}
        
        {expanded && hasMore && (
          <div 
            className="flex items-center justify-center w-9 h-9 rounded-full 
                     bg-muted text-xs font-semibold cursor-pointer hover:bg-muted/80 
                     transition-colors"
            onClick={() => setExpanded(false)}
          >
            -
          </div>
        )}
      </div>
    </div>
  );
}