"use client";

import React, { useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';

const REACTIONS = [
  { emoji: '👍', name: 'thumbs_up' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '😂', name: 'laughing' },
  { emoji: '😮', name: 'wow' },
  { emoji: '😢', name: 'sad' },
  { emoji: '😠', name: 'angry' },
];

const MessageReactions = ({ message }) => {
  const { addReaction, removeReaction } = useChatContext();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  // Agrupar reações por tipo
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.reaction_type]) {
      acc[reaction.reaction_type] = [];
    }
    acc[reaction.reaction_type].push(reaction);
    return acc;
  }, {}) || {};
  
  const handleAddReaction = async (reactionType) => {
    try {
      await addReaction(message.id, reactionType);
      setShowReactionPicker(false);
    } catch (error) {
      console.error('Erro ao adicionar reação:', error);
    }
  };
  
  const handleRemoveReaction = async (reactionId) => {
    try {
      await removeReaction(reactionId);
    } catch (error) {
      console.error('Erro ao remover reação:', error);
    }
  };
  
  const ReactionButton = ({ reaction, count, userHasReacted, reactionId }) => {
    return (
      <button
        className={`px-1.5 py-0.5 text-xs rounded-full mr-1 ${
          userHasReacted 
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        onClick={() => userHasReacted ? handleRemoveReaction(reactionId) : handleAddReaction(reaction)}
      >
        <span>{REACTIONS.find(r => r.name === reaction)?.emoji || '👍'} {count}</span>
      </button>
    );
  };
  
  return (
    <div className="mt-1 flex flex-wrap">
      {/* Exibir reações existentes */}
      {Object.entries(groupedReactions).map(([reactionType, reactions]) => {
        // Verificar se o usuário atual já reagiu
        const userId = useChatContext().userId; // Assumindo que o ID do usuário está disponível no contexto
        const userReaction = reactions.find(r => r.user_id === userId);
        
        return (
          <ReactionButton
            key={reactionType}
            reaction={reactionType}
            count={reactions.length}
            userHasReacted={!!userReaction}
            reactionId={userReaction?.id}
          />
        );
      })}
      
      {/* Botão para abrir o seletor de reações */}
      <div className="relative inline-block">
        <button
          className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
          onClick={() => setShowReactionPicker(!showReactionPicker)}
        >
          <span>+</span>
        </button>
        
        {/* Seletor de reações */}
        {showReactionPicker && (
          <div className="absolute bottom-full mb-1 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-10">
            <div className="flex">
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.name}
                  className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleAddReaction(reaction.name)}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;