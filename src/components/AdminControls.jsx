import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Componente de administração para manutenção do sistema
 * Permite que administradores realizem operações como limpar a tabela app_state
 * Apenas usuários autorizados têm acesso a estas funcionalidades
 */
const AdminControls = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [result, setResult] = useState({ type: '', message: '' });

  // Verificar se o usuário atual é administrador
  const isAdmin = useCallback(() => {
    const adminEmails = ['johnathan.herbert47@gmail.com', 'admin@pwakastor.com'];
    return user && adminEmails.includes(user.email);
  }, [user]);

  // Abrir o modal de confirmação
  const openModal = () => {
    setIsModalOpen(true);
    setResult({ type: '', message: '' });
    setConfirmText('');
  };

  // Fechar o modal
  const closeModal = () => {
    setIsModalOpen(false);
    setResult({ type: '', message: '' });
    setConfirmText('');
  };

  // Limpar a tabela app_state
  const clearAppStateTable = async () => {
    if (confirmText !== 'LIMPAR TABELA') {
      setResult({
        type: 'error',
        message: 'Digite "LIMPAR TABELA" para confirmar a operação'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('app_state')
        .delete()
        .not('id', 'is', null);

      if (error) throw error;

      setResult({
        type: 'success',
        message: 'Tabela app_state limpa com sucesso! O sistema entrará em estado inicial após o próximo login dos usuários.'
      });

      // Registrar a ação
      console.log('Tabela app_state limpa pelo administrador:', user.email);
    } catch (error) {
      console.error('Erro ao limpar a tabela app_state:', error);
      setResult({
        type: 'error',
        message: `Erro ao limpar a tabela: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Se não for administrador, não renderiza nada
  if (!isAdmin()) {
    return null;
  }

  return (
    <>
      {/* Botão para abrir o modal de administração */}
      <button
        onClick={openModal}
        className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 text-xs
                 text-red-600 dark:text-red-400 
                 bg-red-50 dark:bg-red-900/30 
                 hover:bg-red-100 dark:hover:bg-red-900/50 
                 border border-red-200 dark:border-red-700/50
                 rounded-lg transition-all duration-200
                 hover:shadow-md dark:hover:shadow-red-900/20"
        title="Administração"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.27-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.398-.165.71-.505.78-.929l.15-.894Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        <span className="hidden sm:inline">Admin</span>
      </button>

      {/* Modal Portal - Improved positioning to center in viewport */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[99999]"
          id="admin-modal-container"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '10vh', /* Added padding to move modal down a bit */
            height: '100vh',
            width: '100vw',
            overflow: 'auto'
          }}
        >
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Modal Content */}
          <div 
            className="relative bg-white dark:bg-gray-800/95 rounded-lg shadow-2xl w-full max-w-md mx-4 z-[100000] transform"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-panel-title"
            style={{ 
              position: 'relative',
              margin: 'auto auto', /* Center horizontally */
              maxHeight: '90vh'  /* Limit height to avoid overflow */
            }}
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700/50">
              <h3 
                id="admin-panel-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                Painel de Administração
              </h3>
            </div>

            <div className="p-6">
              {result.type ? (
                <div className={`mb-4 p-3 rounded-lg ${
                  result.type === "success" 
                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/30" 
                    : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/30"
                }`}>
                  <p>{result.message}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/30 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                      <div className="text-sm text-amber-700 dark:text-amber-300">
                        <p className="font-medium mb-1">ATENÇÃO: Manutenção do Sistema</p>
                        <p>Esta ação irá <strong>APAGAR TODOS</strong> os dados de estado do aplicativo para <strong>TODOS</strong> os usuários.</p>
                        <p className="mt-1">O aplicativo voltará ao estado inicial no próximo login de cada usuário.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/30 p-3 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Para confirmar, digite <strong>LIMPAR TABELA</strong> no campo abaixo:
                    </p>
                    <input 
                      type="text" 
                      className="mt-2 w-full px-3 py-2 
                        bg-white dark:bg-gray-700
                        border border-red-200 dark:border-red-600 
                        text-gray-900 dark:text-gray-100
                        placeholder-gray-400 dark:placeholder-gray-400
                        rounded-lg text-sm 
                        focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 
                        focus:border-transparent transition-colors"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Digite LIMPAR TABELA"
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm 
                text-gray-700 dark:text-gray-300 
                bg-white dark:bg-gray-700 
                border border-gray-200 dark:border-gray-600
                hover:bg-gray-50 dark:hover:bg-gray-600 
                rounded-lg transition-colors"
              >
                {result.type ? "Fechar" : "Cancelar"}
              </button>
              
              {!result.type && (
                <button
                  onClick={clearAppStateTable}
                  disabled={isLoading || confirmText !== 'LIMPAR TABELA'}
                  className={`px-4 py-2 text-sm text-white 
                    ${isLoading ? "bg-gray-400 dark:bg-gray-500" : "bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600"}
                    rounded-lg transition-colors 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </>
                  ) : (
                    "Limpar Tabela app_state"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminControls;
