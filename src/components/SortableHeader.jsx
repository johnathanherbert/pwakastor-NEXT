import React from 'react';
import { HiArrowUp, HiArrowDown } from 'react-icons/hi';

/**
 * Componente SortableHeader para adicionar ordenação em cabeçalhos de tabela
 * 
 * @param {Object} props
 * @param {string} props.label - Texto do cabeçalho
 * @param {string} props.field - Campo usado para ordenação
 * @param {Object} props.sortConfig - Configuração atual de ordenação { key, direction }
 * @param {Function} props.onSort - Função chamada quando o cabeçalho é clicado
 * @param {string} props.className - Classes CSS adicionais
 */
const SortableHeader = ({ 
  label, 
  field, 
  sortConfig, 
  onSort,
  className = "" 
}) => {
  const isSorted = sortConfig.key === field;
  const direction = sortConfig.direction;
  
  const handleClick = () => {
    if (onSort) {
      if (isSorted) {
        // Inverte a direção se já estiver ordenado por este campo
        onSort(field, direction === 'asc' ? 'desc' : 'asc');
      } else {
        // Define como ascendente por padrão
        onSort(field, 'asc');
      }
    }
  };
  
  return (
    <div 
      className={`flex items-center gap-1 cursor-pointer select-none ${className}`}
      onClick={handleClick}
    >
      <span>{label}</span>
      {isSorted && (
        direction === 'asc' 
          ? <HiArrowUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          : <HiArrowDown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
      )}
    </div>
  );
};

export default SortableHeader;