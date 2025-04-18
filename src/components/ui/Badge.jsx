import React from 'react';

/**
 * Componente Badge para exibir status, contadores, e indicadores
 * 
 * @param {Object} props 
 * @param {'primary'|'secondary'|'success'|'warning'|'danger'|'info'|'gray'} [props.variant='primary'] - Estilo da badge
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Tamanho da badge
 * @param {boolean} [props.outline=false] - Exibir apenas contorno
 * @param {boolean} [props.rounded='pill'] - Estilo do arredondamento ('pill' | 'rounded' | 'square')
 * @param {React.ReactNode} [props.icon] - Ícone opcional para a badge
 */
const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  outline = false,
  rounded = 'pill',
  icon,
  className = '',
  ...props
}) => {
  // Variantes de cores para badges sólidos
  const variantClasses = {
    primary: outline 
      ? 'bg-transparent border border-blue-500 text-blue-700 dark:text-blue-400' 
      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 ring-1 ring-blue-600/20 dark:ring-blue-500/30',
    secondary: outline 
      ? 'bg-transparent border border-purple-500 text-purple-700 dark:text-purple-400' 
      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 ring-1 ring-purple-600/20 dark:ring-purple-500/30',
    success: outline 
      ? 'bg-transparent border border-green-500 text-green-700 dark:text-green-400' 
      : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ring-1 ring-green-600/20 dark:ring-green-500/30',
    warning: outline 
      ? 'bg-transparent border border-yellow-500 text-yellow-700 dark:text-yellow-400' 
      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 ring-1 ring-yellow-600/20 dark:ring-yellow-500/30',
    danger: outline 
      ? 'bg-transparent border border-red-500 text-red-700 dark:text-red-400' 
      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 ring-1 ring-red-600/20 dark:ring-red-500/30',
    info: outline 
      ? 'bg-transparent border border-sky-500 text-sky-700 dark:text-sky-400' 
      : 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 ring-1 ring-sky-600/20 dark:ring-sky-500/30',
    gray: outline 
      ? 'bg-transparent border border-gray-500 text-gray-700 dark:text-gray-400' 
      : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 ring-1 ring-gray-600/20 dark:ring-gray-500/30',
  };
  
  // Tamanhos
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };
  
  // Estilos de arredondamento
  const roundedClasses = {
    pill: 'rounded-full',
    rounded: 'rounded-md',
    square: 'rounded-none',
  };
  
  return (
    <span
      className={`
        inline-flex items-center justify-center 
        font-medium whitespace-nowrap
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${roundedClasses[rounded]}
        ${className}
      `}
      {...props}
    >
      {icon && (
        <span className="mr-1 -ml-0.5 flex-shrink-0">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
};

export default Badge;