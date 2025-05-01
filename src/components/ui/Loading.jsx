import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Componente de Loading reutilizável
 * 
 * @param {Object} props
 * @param {string} [props.size='default'] - Tamanho do loader: 'small', 'default', 'large'
 * @param {string} [props.message='Carregando...'] - Mensagem exibida durante o carregamento
 * @param {boolean} [props.fullScreen=false] - Se deve ocupar toda a tela
 * @param {boolean} [props.logoVisible=false] - Se deve exibir o logo durante o carregamento
 * @param {boolean} [props.hasBackground=true] - Se deve exibir o background do loading
 * @param {string} [props.className=''] - Classes adicionais para o container
 */
const Loading = ({
  size = 'default',
  message = 'Carregando...',
  fullScreen = false,
  logoVisible = true,
  hasBackground = false,
  className = ''
}) => {
  const { darkMode } = useTheme();
  
  // Configuração de tamanhos
  const sizes = {
    small: {
      container: 'h-10 w-10',
      outer: 'h-8 w-8',
      middle: 'h-5 w-5',
      inner: 'h-3 w-3',
      message: 'text-xs'
    },
    default: {
      container: 'h-16 w-16',
      outer: 'h-12 w-12',
      middle: 'h-8 w-8',
      inner: 'h-5 w-5',
      message: 'text-sm'
    },
    large: {
      container: 'h-24 w-24',
      outer: 'h-20 w-20',
      middle: 'h-14 w-14',
      inner: 'h-9 w-9',
      message: 'text-base'
    }
  };
  
  const currentSize = sizes[size] || sizes.default;

  return (
    <div className={`
      ${fullScreen ? 'fixed inset-0 z-50' : 'relative w-full h-full'} 
      flex flex-col items-center justify-center 
      ${hasBackground ? 
        `${darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-950' : 'bg-gradient-to-b from-white to-gray-50'}` 
        : ''}
      ${className}
    `}>
      <div className={`flex flex-col items-center ${message ? 'mb-6' : ''}`}>
        {logoVisible && (
          <div className="mb-4">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              PWA Kastor
            </h1>
          </div>
        )}
        
        <div className={`relative ${currentSize.container}`}>
          <div className={`absolute inset-0 rounded-full border-t-2 border-blue-500 dark:border-blue-400 animate-spin ${currentSize.outer}`}></div>
          <div className={`absolute inset-0 flex items-center justify-center`}>
            <div className={`rounded-full border-r-2 border-indigo-600 dark:border-indigo-500 animate-spin animation-delay-150 ${currentSize.middle}`}></div>
          </div>
          <div className={`absolute inset-0 flex items-center justify-center`}>
            <div className={`rounded-full border-b-2 border-purple-500 dark:border-purple-400 animate-spin animation-delay-300 ${currentSize.inner}`}></div>
          </div>
        </div>
        
        {message && (
          <p className={`mt-4 ${currentSize.message} text-gray-600 dark:text-gray-400`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loading;