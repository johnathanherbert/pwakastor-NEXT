'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { showToast } from './Toast/ToastContainer';

/**
 * Componente que verifica e exibe mensagens de administrador para todos os usuários
 * Este componente deve ser adicionado ao layout principal para funcionar em todas as páginas
 * Também processa comandos especiais como forçar o recarregamento da página
 */
export default function AdminMessages() {
  const [lastMessageId, setLastMessageId] = useState(null);
  
  // Processar mensagem ou comando do administrador
  const processAdminMessage = (message) => {
    // Verificar se é uma mensagem de comando
    if (message.command) {
      switch (message.command) {
        case 'reload':
          // Mostrar uma mensagem toast informando sobre o recarregamento
          showToast(
            message.message || 'Atualizando aplicação...',
            'info',
            message.duration || 3000
          );
          
          // Aguardar um pouco para que o usuário possa ver a mensagem antes do recarregamento
          setTimeout(() => {
            window.location.reload();
          }, message.delay || 2000);
          break;
          
        // Outros comandos podem ser adicionados aqui no futuro
        default:
          // Se for um comando desconhecido, tratar como mensagem normal
          showToast(message.message, message.type, message.duration);
      }
    } else {
      // Mensagem normal
      showToast(message.message, message.type, message.duration);
    }
  };
  
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
          
          // Processar a mensagem (pode ser uma mensagem normal ou um comando)
          processAdminMessage(message);
          
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
    
    // Configurar um intervalo para verificar novas mensagens a cada 30 segundos
    const interval = setInterval(checkAdminMessages, 30000);
    
    // Configurar um listener em tempo real para novas mensagens
    const subscription = supabase
      .channel('admin-messages-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'admin_messages' }, 
        (payload) => {
          // Se uma nova mensagem for inserida e estiver ativa, processá-la
          const newMessage = payload.new;
          if (newMessage && newMessage.active) {
            processAdminMessage(newMessage);
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