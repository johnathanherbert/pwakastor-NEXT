import React from 'react';

/**
 * Componente de botão reutilizável com diferentes variantes e tamanhos
 * 
 * @param {Object} props - Propriedades do componente
 * @param {'primary'|'secondary'|'outline'|'danger'|'success'|'ghost'} [props.variant='primary'] - Estilo do botão
 * @param {'sm'|'md'|'lg'|'icon'} [props.size='md'] - Tamanho do botão
 * @param {boolean} [props.fullWidth=false] - Ocupar toda a largura disponível
 * @param {boolean} [props.disabled=false] - Desabilitar o botão
 * @param {boolean} [props.isLoading=false] - Estado de carregamento
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  type = 'button',
  icon,
  className = '',
  ...props
}) => {
  // Variantes de estilo
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 shadow-sm hover:shadow',
    outline: 'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
  };
  
  // Tamanhos
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    icon: 'p-2',
  };
  
  // Largura
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Classes para estados desabilitado e carregando
  const disabledClass = disabled || isLoading ? 'opacity-60 cursor-not-allowed' : '';
  
  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center gap-2 
        font-medium rounded-lg transition-all duration-200
        focus:outline-none
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${widthClass} 
        ${disabledClass}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {icon && !isLoading && (
        <span className="flex-shrink-0">
          {icon}
        </span>
      )}
      
      {children}
    </button>
  );
};

export default Button;