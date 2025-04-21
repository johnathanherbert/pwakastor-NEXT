import React from 'react';

/**
 * Card component with consistent styling
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} [props.header] - Optional header content
 * @param {React.ReactNode} [props.footer] - Optional footer content
 * @param {boolean} [props.hover=false] - Whether to show hover effects
 * @param {string} [props.className=''] - Additional classes for the card
 * @param {string} [props.headerClassName=''] - Additional classes for the header
 * @param {string} [props.bodyClassName=''] - Additional classes for the body
 * @param {string} [props.footerClassName=''] - Additional classes for the footer
 * @param {Object} [props.rest] - Additional props
 * @returns {JSX.Element}
 */
const Card = ({
  children,
  header,
  footer,
  hover = false,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  ...rest
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-xl shadow-sm
        ${hover ? 'transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600' : ''}
        ${className}
      `}
      {...rest}
    >
      {header && (
        <div className={`border-b border-gray-200 dark:border-gray-700 px-4 py-3 ${headerClassName}`}>
          {header}
        </div>
      )}
      
      <div className={`${!bodyClassName.includes('p-') ? 'p-4' : ''} ${bodyClassName}`}>
        {children}
      </div>
      
      {footer && (
        <div className={`border-t border-gray-200 dark:border-gray-700 px-4 py-3 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;