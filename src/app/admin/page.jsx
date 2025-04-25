'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useRouter } from 'next/navigation';
import { showToast } from '../../components/Toast/ToastContainer';
import {
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [duration, setDuration] = useState(5000);
  const [messages, setMessages] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        // Verifica se o usuário é admin
        if (user.email !== 'johnathan.herbert47@gmail.com' && user.email !== 'admin@pwakastor.com') {
          showToast('Acesso negado. Esta página é restrita a administradores.', 'error');
          router.push('/');
          return;
        }
        
        setUser(user);
        fetchMessages();
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  const fetchMessages = async () => {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      showToast('Erro ao buscar mensagens', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      showToast('Digite uma mensagem', 'warning');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('admin_messages')
        .insert([{ 
          message, 
          type: messageType, 
          duration: parseInt(duration),
          active: true,
          created_by: user.email 
        }]);
      
      if (error) throw error;
      
      showToast('Mensagem enviada com sucesso!', 'success');
      setMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showToast('Erro ao enviar mensagem', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (id) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      showToast('Mensagem excluída com sucesso', 'success');
      fetchMessages();
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      showToast('Erro ao excluir mensagem', 'error');
    }
  };

  const toggleMessageStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update({ active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      showToast(`Mensagem ${currentStatus ? 'desativada' : 'ativada'} com sucesso`, 'success');
      fetchMessages();
    } catch (error) {
      console.error('Erro ao atualizar status da mensagem:', error);
      showToast('Erro ao atualizar status da mensagem', 'error');
    }
  };

  // Testar uma mensagem localmente
  const testMessage = (msg) => {
    showToast(msg.message, msg.type, msg.duration);
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">
            Verificando permissões de administrador...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Painel de Administração</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Envie mensagens de notificação para todos os usuários do sistema
              </p>
            </div>
          </div>

          <form onSubmit={sendMessage} className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mensagem
              </label>
              <textarea
                id="message"
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
                placeholder="Digite a mensagem que será exibida para os usuários..."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="messageType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Mensagem
                </label>
                <select
                  id="messageType"
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="info">Informação (Azul)</option>
                  <option value="success">Sucesso (Verde)</option>
                  <option value="warning">Aviso (Amarelo)</option>
                  <option value="error">Erro (Vermelho)</option>
                </select>
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duração (ms)
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="3000">3 segundos</option>
                  <option value="5000">5 segundos</option>
                  <option value="10000">10 segundos</option>
                  <option value="30000">30 segundos</option>
                  <option value="60000">1 minuto</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
                {isLoading ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mensagens Enviadas</h2>
            <button
              onClick={fetchMessages}
              disabled={isRefreshing}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Nenhuma mensagem enviada ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mensagem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duração</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {messages.map((msg) => (
                    <tr key={msg.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{msg.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          msg.type === 'success' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : msg.type === 'error' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : msg.type === 'warning'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {msg.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{msg.duration / 1000}s</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          msg.active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {msg.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(msg.created_at).toLocaleDateString('pt-BR')} {new Date(msg.created_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => testMessage(msg)}
                            className="p-1.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                            title="Testar mensagem"
                          >
                            <PaperAirplaneIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleMessageStatus(msg.id, msg.active)}
                            className={`p-1.5 rounded transition-colors ${
                              msg.active
                                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800/40'
                                : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/40'
                            }`}
                            title={msg.active ? 'Desativar mensagem' : 'Ativar mensagem'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {msg.active
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              }
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="p-1.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors"
                            title="Excluir mensagem"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}