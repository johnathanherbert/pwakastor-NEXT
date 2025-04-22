"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// Definindo os status possíveis
export const USER_STATUS = {
  ONLINE: 'online',
  AWAY: 'away',
  BUSY: 'busy',
  OFFLINE: 'offline'
};

const ChatContext = createContext();

export const useChatContext = () => useContext(ChatContext);

export const ChatProvider = ({ children, userId, userEmail, userName }) => {
  // Estado para usuários online
  const [onlineUsers, setOnlineUsers] = useState([]);
  // Estado para as mensagens
  const [messages, setMessages] = useState([]);
  // Estado para o chat atual selecionado
  const [activeChat, setActiveChat] = useState(null);
  // Estado para controlar se o painel de chat está aberto
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Estado para controlar o status do usuário
  const [userStatus, setUserStatus] = useState(USER_STATUS.ONLINE);
  // Estado para novas mensagens não lidas
  const [unreadMessages, setUnreadMessages] = useState({});
  // Estado para saber se está digitando
  const [typingUsers, setTypingUsers] = useState({});
  // Estado para reações às mensagens
  const [messageReactions, setMessageReactions] = useState({});
  // Estado para controle do canal de presença
  const [presenceChannel, setPresenceChannel] = useState(null);

  // Função para marcar o usuário como online/ausente no Supabase
  const updateUserPresence = useCallback(async (status) => {
    try {
      if (!userId) return;
      
      await supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          email: userEmail,
          name: userName || userEmail.split('@')[0],
          status,
          last_seen: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
      setUserStatus(status);
      
      // Se temos um canal de presença ativo, atualizamos o status lá também
      if (presenceChannel) {
        presenceChannel.track({
          user_id: userId,
          email: userEmail,
          name: userName || userEmail.split('@')[0],
          status,
          online_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
    }
  }, [userId, userEmail, userName, presenceChannel]);

  // Inscrever para atualizações de presença quando o componente montar
  useEffect(() => {
    if (!userId) return;

    console.log('Inicializando sistema de presença para usuário:', userId);
    
    // Configurar canal para atualizações de presença
    const channel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, (syncEvent) => {
        console.log('Evento de presença sincronizado:', syncEvent);
        // Atualiza a lista de usuários online com os dados da presença
        const presenceState = channel.presenceState();
        console.log('Estado atual de presença:', presenceState);
        
        // Transforma o estado de presença em uma lista de usuários online
        const onlineUsersList = Object.values(presenceState).flatMap(presence => {
          return presence.map(p => ({
            user_id: p.user_id,
            email: p.email,
            name: p.name,
            status: p.status,
            last_seen: p.online_at
          }));
        });
        
        console.log('Lista processada de usuários online:', onlineUsersList);
        setOnlineUsers(onlineUsersList);
      })
      .on('presence', { event: 'join' }, (joinEvent) => {
        console.log('Usuário entrou:', joinEvent);
        // Vamos aproveitar o evento de sync para atualizar a lista
      })
      .on('presence', { event: 'leave' }, (leaveEvent) => {
        console.log('Usuário saiu:', leaveEvent);
        // Vamos aproveitar o evento de sync para atualizar a lista
      })
      .on('system', { event: 'disconnect' }, () => {
        console.log('Desconectado do canal de presença. Tentando reconectar...');
      })
      .on('system', { event: 'reconnect' }, () => {
        console.log('Reconectado ao canal de presença');
        // Atualiza a presença ao reconectar
        updateUserPresence(userStatus);
      });

    // Tentar se inscrever e rastrear presença
    channel.subscribe(async (status) => {
      console.log('Status da inscrição do canal de presença:', status);
      
      if (status === 'SUBSCRIBED') {
        // Começar a rastrear a presença do usuário atual
        channel.track({
          user_id: userId,
          email: userEmail,
          name: userName || userEmail.split('@')[0],
          status: USER_STATUS.ONLINE,
          online_at: new Date().toISOString()
        });
        
        // Salvar referência ao canal
        setPresenceChannel(channel);
      }
    });

    // Configura canal para atualizações de mensagens em tempo real
    const messagesChannel = supabase
      .channel('messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        handleNewMessage(payload.new);
      })
      .subscribe();

    // Inscrever-se para atualizações de reações em tempo real
    const reactionsChannel = supabase
      .channel('message-reactions')
      .on('postgres_changes', { 
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public', 
        table: 'message_reactions' 
      }, (payload) => {
        handleReactionChange(payload);
      })
      .subscribe();

    // Configura deteção de inatividade para marcar como ausente após 5 minutos
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    let inactivityTimer;
    
    const resetInactivityTimer = () => {
      if (userStatus === USER_STATUS.AWAY) {
        updateUserPresence(USER_STATUS.ONLINE);
      }
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        updateUserPresence(USER_STATUS.AWAY);
      }, 5 * 60 * 1000); // 5 minutos
    };

    activityEvents.forEach(eventName => {
      window.addEventListener(eventName, resetInactivityTimer);
    });
    
    resetInactivityTimer();

    // Backup: ainda buscar usuários online do banco de dados
    // para cobrir casos onde a presença em tempo real falha
    fetchOnlineUsers();
    
    // Fetch initial messages if there's an active chat
    if (activeChat) {
      fetchMessages(activeChat);
    }

    // Cleanup function
    return () => {
      activityEvents.forEach(eventName => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
      clearTimeout(inactivityTimer);
      
      // Antes de desmontar, atualiza status para offline
      updateUserPresence(USER_STATUS.OFFLINE);
      
      // Desinscreve dos canais
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
      }
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [userId, activeChat, userStatus, updateUserPresence, userEmail, userName]);

  // Função para buscar usuários online
  const fetchOnlineUsers = async () => {
    try {
      console.log('Buscando usuários online do banco de dados...');
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .not('status', 'eq', USER_STATUS.OFFLINE)
        .order('name');

      if (error) throw error;
      console.log('Usuários online encontrados no banco de dados:', data);
      
      // Se já temos dados de presença em tempo real, vamos evitar sobrescrever
      if (onlineUsers.length === 0) {
        setOnlineUsers(data);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários online:', error);
    }
  };

  // Função para buscar mensagens
  const fetchMessages = async (chatId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      
      // Atualiza as mensagens
      setMessages(data);
      
      // Busca as reações para esse chat
      fetchReactions(chatId);
      
      // Limpa contagem de não lidas para este chat
      setUnreadMessages(prev => ({
        ...prev,
        [chatId]: 0
      }));
      
      // Marca mensagens como lidas no banco de dados
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', userId)
        .eq('chat_id', chatId);
        
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  // Função para lidar com novas mensagens
  const handleNewMessage = (message) => {
    // Atualiza o estado das mensagens
    setMessages(prev => [...prev, message]);
    
    // Se a mensagem for para o usuário atual e não for do chat ativo
    if (message.receiver_id === userId && (!activeChat || activeChat !== message.chat_id)) {
      // Incrementa contador de mensagens não lidas
      setUnreadMessages(prev => ({
        ...prev,
        [message.chat_id]: (prev[message.chat_id] || 0) + 1
      }));
    }
  };

  // Função para buscar reações às mensagens
  const fetchReactions = async (chatId) => {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('chat_id', chatId);

      if (error) throw error;
      
      // Organizar reações por message_id
      const reactions = {};
      data.forEach(reaction => {
        if (!reactions[reaction.message_id]) {
          reactions[reaction.message_id] = [];
        }
        reactions[reaction.message_id].push(reaction);
      });
      
      setMessageReactions(reactions);
    } catch (error) {
      console.error('Erro ao buscar reações:', error);
    }
  };

  // Função para adicionar uma reação a uma mensagem
  const addReaction = async (messageId, emoji) => {
    try {
      // Verificar se o usuário já reagiu com este emoji
      const existingReactions = messageReactions[messageId] || [];
      const alreadyReacted = existingReactions.some(
        r => r.user_id === userId && r.emoji === emoji
      );
      
      if (alreadyReacted) {
        // Se já reagiu, remover a reação
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .match({ user_id: userId, message_id: messageId, emoji });
          
        if (error) throw error;
        
        // Atualizar o estado local
        setMessageReactions(prev => {
          const updated = {...prev};
          updated[messageId] = prev[messageId].filter(
            r => !(r.user_id === userId && r.emoji === emoji)
          );
          return updated;
        });
      } else {
        // Se não reagiu, adicionar a reação
        const message = messages.find(m => m.id === messageId);
        if (!message) return;
        
        const { data, error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: userId,
            emoji: emoji,
            chat_id: message.chat_id
          })
          .select();
          
        if (error) throw error;
        
        // Atualizar o estado local
        setMessageReactions(prev => {
          const updated = {...prev};
          if (!updated[messageId]) {
            updated[messageId] = [];
          }
          updated[messageId].push(data[0]);
          return updated;
        });
      }
    } catch (error) {
      console.error('Erro ao reagir à mensagem:', error);
    }
  };

  // Função para tratar mudanças nas reações
  const handleReactionChange = (payload) => {
    // Baseado no tipo de evento (INSERT, UPDATE, DELETE)
    const { eventType, new: newReaction, old: oldReaction } = payload;
    
    setMessageReactions(prev => {
      const updated = {...prev};
      
      if (eventType === 'INSERT') {
        if (!updated[newReaction.message_id]) {
          updated[newReaction.message_id] = [];
        }
        updated[newReaction.message_id].push(newReaction);
      } 
      else if (eventType === 'DELETE') {
        const messageId = oldReaction.message_id;
        if (updated[messageId]) {
          updated[messageId] = updated[messageId].filter(
            r => !(r.user_id === oldReaction.user_id && r.emoji === oldReaction.emoji)
          );
        }
      }
      
      return updated;
    });
  };

  // Função para enviar uma mensagem
  const sendMessage = async (receiverId, content) => {
    try {
      // Criamos ou obtemos um ID de chat
      let chatId = [userId, receiverId].sort().join('_');
      
      // Enviamos a mensagem
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: receiverId,
          content,
          chat_id: chatId,
          read: false
        })
        .select();
        
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return null;
    }
  };

  // Função para atualizar status de "está digitando"
  const updateTypingStatus = (receiverId, isTyping) => {
    const chatId = [userId, receiverId].sort().join('_');
    
    // Emitir evento para o Supabase
    supabase.channel('typing')
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { chatId, userId, isTyping }
      });
      
    // Atualizar estado local
    if (isTyping) {
      setTypingUsers(prev => ({ ...prev, [chatId]: true }));
      
      // Remover após 3 segundos
      setTimeout(() => {
        setTypingUsers(prev => {
          const newState = { ...prev };
          delete newState[chatId];
          return newState;
        });
      }, 3000);
    }
  };

  // Função para alternar manualmente o status
  const toggleStatus = (newStatus) => {
    updateUserPresence(newStatus);
  };

  // Objeto de valor para o contexto
  const contextValue = {
    onlineUsers,
    messages,
    userStatus,
    activeChat,
    isChatOpen,
    unreadMessages,
    typingUsers,
    messageReactions,
    
    // Actions
    setIsChatOpen,
    setActiveChat,
    fetchMessages,
    sendMessage,
    updateTypingStatus,
    toggleStatus,
    addReaction,
    
    // Constants
    USER_STATUS
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;