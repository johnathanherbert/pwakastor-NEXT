import React, { forwardRef } from 'react';

/**
 * Componente de entrada de texto reutilizável com suporte para diferentes variantes e estados
 * 
 * @param {Object} props - Propriedades do componente
 * @param {'default'|'filled'|'outlined'} [props.variant='default'] - Variante de estilo do input
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Tamanho do input
 * @param {boolean} [props.fullWidth=false] - Ocupar largura total disponível
 * @param {React.ReactNode} [props.startIcon] - Ícone para exibir no início do input
 * @param {React.ReactNode} [props.endIcon] - Ícone para exibir no final do input
 * @param {string} [props.label] - Rótulo para o input
 * @param {string} [props.error] - Mensagem de erro
 * @param {string} [props.helperText] - Texto de ajuda
 */
const Input = forwardRef(({
  type = 'text',
  variant = 'default',
  size = 'md',
  fullWidth = false,
  disabled = false,
  readOnly = false,
  startIcon,
  endIcon,
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  // ID único para associar label ao input
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // Variantes
  const variantClasses = {
    default: 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400',
    filled: 'bg-gray-100 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-blue-500',
    outlined: 'bg-transparent border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400',
  };
  
  // Tamanhos
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  };
  
  // Largura
  const widthClass = fullWidth ? 'w-full' : 'w-auto';
  
  // Ajuste de padding quando há ícones
  const paddingLeft = startIcon ? (
    size === 'sm' ? 'pl-8' : size === 'md' ? 'pl-10' : 'pl-12'
  ) : '';
  
  const paddingRight = endIcon ? (
    size === 'sm' ? 'pr-8' : size === 'md' ? 'pr-10' : 'pr-12'
  ) : '';
  
  // Estado de erro
  const errorClasses = error ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : '';
  
  return (
    <div className={`${widthClass}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className={`block mb-1.5 text-sm font-medium ${
            error 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {label}
        </label>
      )}
      
      {/* Container para posicionar ícones */}
      <div className="relative">
        {/* Ícone à esquerda */}
        {startIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
            {startIcon}
          </div>
        )}
        
        {/* Input */}
        <input
          ref={ref}
          type={type}
          id={inputId}
          disabled={disabled}
          readOnly={readOnly}
          className={`
            rounded-lg
            text-gray-900 dark:text-white 
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none 
            focus:ring-2
            transition-colors duration-200
            disabled:opacity-60 disabled:cursor-not-allowed
            ${variantClasses[variant]} 
            ${sizeClasses[size]} 
            ${paddingLeft} 
            ${paddingRight} 
            ${errorClasses}
            ${className}
          `}
          {...props}
        />
        
        {/* Ícone à direita */}
        {endIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 dark:text-gray-400">
            {endIcon}
          </div>
        )}
      </div>
      
      {/* Texto de erro ou ajuda */}
      {(error || helperText) && (
        <p className={`mt-1 text-xs ${
          error 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;