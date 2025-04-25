'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { showToast } from './Toast/ToastContainer';

/**
 * Componente que verifica e exibe mensagens de administrador para todos os usuários
 * Este componente deve ser adicionado ao layout principal para funcionar em todas as páginas
 */
export default function AdminMessages() {
  const [lastMessageId, setLastMessageId] = useState(null);
  
  // Verificar mensagens ativas periodicamente
  useEffect(() => {
    // Função para verificar mensagens ativas
    const checkAdminMessages = async () => {
      try {
        // Obter a data atual para comparar com a data da última mensagem exibida
        const currentDate = new Date().toISOString();
        
        // Obter mensagens ativas mais recentes
        const { data, error } = await supabase
          .from('admin_messages')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error) throw error;
        
        // Se encontramos uma mensagem e ela não foi exibida antes (ou é nova)
        if (data && data.length > 0 && data[0].id !== lastMessageId) {
          const message = data[0];
          
          // Mostrar a mensagem
          showToast(message.message, message.type, message.duration);
          
          // Atualizar o ID da última mensagem exibida
          setLastMessageId(message.id);
          
          // Armazenar o ID da última mensagem exibida no localStorage para não exibir novamente se o usuário atualizar a página
          localStorage.setItem('lastAdminMessageId', message.id);
          localStorage.setItem('lastAdminMessageTime', currentDate);
        }
      } catch (error) {
        console.error('Erro ao verificar mensagens do administrador:', error);
      }
    };

    // Recuperar o ID da última mensagem exibida do localStorage
    const savedLastMessageId = localStorage.getItem('lastAdminMessageId');
    if (savedLastMessageId) {
      setLastMessageId(savedLastMessageId);
    }

    // Verificar mensagens ao montar o componente
    checkAdminMessages();
    
    // Configurar um intervalo para verificar novas mensagens a cada 60 segundos
    const interval = setInterval(checkAdminMessages, 60000);
    
    // Configurar um listener em tempo real para novas mensagens
    const subscription = supabase
      .channel('admin-messages-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'admin_messages' }, 
        (payload) => {
          // Se uma nova mensagem for inserida e estiver ativa, exibi-la
          const newMessage = payload.new;
          if (newMessage && newMessage.active) {
            showToast(newMessage.message, newMessage.type, newMessage.duration);
            setLastMessageId(newMessage.id);
            localStorage.setItem('lastAdminMessageId', newMessage.id);
            localStorage.setItem('lastAdminMessageTime', new Date().toISOString());
          }
        }
      )
      .subscribe();
    
    // Limpar intervalo e inscrição ao desmontar
    return () => {
      clearInterval(interval);
      supabase.removeChannel(subscription);
    };
  }, []);

  // Este componente não renderiza nada visualmente
  return null;
}