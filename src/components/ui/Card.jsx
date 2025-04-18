import React from 'react';

/**
 * Um componente de card reutilizável com suporte para diferentes variantes de estilo.
 * @param {Object} props - Propriedades do componente
 * @param {'default'|'glass'|'elevated'|'border'|'gradient'} [props.variant='default'] - Variante visual do card
 * @param {'sm'|'md'|'lg'|'none'} [props.padding='md'] - Tamanho do padding interno
 * @param {boolean} [props.hover=false] - Aplicar efeito de hover
 * @param {string} [props.className=''] - Classes CSS adicionais
 */
const Card = ({ 
  children, 
  title, 
  subtitle,
  icon,
  variant = 'default', 
  padding = 'md', 
  hover = false,
  footer,
  className = '',
  onClick,
  ...props 
}) => {
  // Define as classes de base para cada variante
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50',
    glass: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/20 dark:border-gray-700/30',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-800',
    border: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700',
    gradient: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50'
  };

  // Define as classes de padding
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    none: ''
  };
  
  // Efeito de hover
  const hoverClasses = hover ? 
    'hover:shadow-md dark:hover:shadow-gray-900/20 transform hover:-translate-y-0.5 transition-all duration-200' : '';
  
  // Cursor pointer se tiver onClick
  const cursorClass = onClick ? 'cursor-pointer' : '';

  return (
    <div 
      className={`rounded-xl ${variantClasses[variant]} ${cursorClass} ${hoverClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {/* Cabeçalho com título, subtítulo e ícone (opcional) */}
      {(title || icon) && (
        <div className={`flex items-center justify-between border-b border-gray-200 dark:border-gray-700/50 ${paddingClasses[padding]}`}>
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                {icon}
              </div>
            )}
            <div>
              {title && <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
          </div>
          
          {/* Slot para ações no cabeçalho */}
          {props.headerActions && (
            <div className="flex items-center gap-2">
              {props.headerActions}
            </div>
          )}
        </div>
      )}
      
      {/* Conteúdo principal */}
      <div className={title || icon ? paddingClasses[padding] : paddingClasses[padding]}>
        {children}
      </div>
      
      {/* Rodapé opcional */}
      {footer && (
        <div className={`border-t border-gray-200 dark:border-gray-700/50 ${paddingClasses[padding]}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;