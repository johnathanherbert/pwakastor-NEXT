import React, { useState } from 'react';
import { Button, TextInput, Select, Label } from 'flowbite-react';
import { HiOutlineFilter, HiX, HiChevronDown, HiCheck } from 'react-icons/hi';

/**
 * Componente de filtro avançado reutilizável para tabelas
 * 
 * @param {Object} props
 * @param {Object} props.filters - Estado atual dos filtros
 * @param {Function} props.setFilters - Função para atualizar os filtros
 * @param {Array} props.filterOptions - Opções de filtro disponíveis
 * @param {Function} props.onApplyFilters - Função chamada quando os filtros são aplicados
 * @param {Function} props.onResetFilters - Função chamada quando os filtros são resetados
 * @param {string} props.className - Classes CSS adicionais
 */
const TableFilter = ({ 
  filters, 
  setFilters, 
  filterOptions, 
  onApplyFilters, 
  onResetFilters,
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  
  const handleToggleFilters = () => {
    setIsOpen(!isOpen);
    setTempFilters(filters); // Reset temp filters quando abrir
  };
  
  const handleApplyFilters = () => {
    setFilters(tempFilters);
    if (onApplyFilters) onApplyFilters(tempFilters);
    setIsOpen(false);
  };
  
  const handleResetFilters = () => {
    const defaultFilters = filterOptions.reduce((acc, option) => {
      acc[option.id] = option.defaultValue || '';
      return acc;
    }, {});
    
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    if (onResetFilters) onResetFilters();
    setIsOpen(false);
  };
  
  const handleFilterChange = (id, value) => {
    setTempFilters(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Verificar se há filtros ativos
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    // Verificar se é diferente do valor padrão
    const option = filterOptions.find(opt => opt.id === key);
    return value !== (option?.defaultValue || '');
  });
  
  return (
    <div className={`relative ${className}`}>
      <Button
        size="sm"
        color={hasActiveFilters ? "info" : "light"}
        onClick={handleToggleFilters}
        className={`flex items-center ${hasActiveFilters ? "ring-2 ring-blue-300" : ""}`}
      >
        <HiOutlineFilter className="mr-2 h-4 w-4" />
        Filtros
        {hasActiveFilters && (
          <span className="ml-1.5 flex items-center justify-center bg-blue-600 text-white rounded-full w-5 h-5 text-xs">
            {Object.values(filters).filter(v => v !== '' && v !== 'all' && v !== null).length}
          </span>
        )}
        <HiChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>
      
      {isOpen && (
        <div className="absolute z-10 mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[300px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros avançados</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <HiX className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {filterOptions.map((option) => (
              <div key={option.id}>
                <Label 
                  htmlFor={`filter-${option.id}`} 
                  value={option.label} 
                  className="text-xs text-gray-600 dark:text-gray-400 mb-1"
                />
                
                {option.type === 'select' ? (
                  <Select
                    id={`filter-${option.id}`}
                    value={tempFilters[option.id] || ''}
                    onChange={(e) => handleFilterChange(option.id, e.target.value)}
                    theme={{
                      field: {
                        select: {
                          base: "block w-full rounded-lg border disabled:cursor-not-allowed disabled:opacity-50 text-sm border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 p-2.5"
                        }
                      }
                    }}
                  >
                    {option.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                ) : option.type === 'date' ? (
                  <TextInput
                    id={`filter-${option.id}`}
                    type="date"
                    value={tempFilters[option.id] || ''}
                    onChange={(e) => handleFilterChange(option.id, e.target.value)}
                    theme={{
                      field: {
                        input: {
                          base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                        }
                      }
                    }}
                  />
                ) : option.type === 'number' ? (
                  <TextInput
                    id={`filter-${option.id}`}
                    type="number"
                    value={tempFilters[option.id] || ''}
                    onChange={(e) => handleFilterChange(option.id, e.target.value)}
                    theme={{
                      field: {
                        input: {
                          base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                        }
                      }
                    }}
                  />
                ) : (
                  <TextInput
                    id={`filter-${option.id}`}
                    placeholder={option.placeholder || `Filtrar por ${option.label.toLowerCase()}...`}
                    value={tempFilters[option.id] || ''}
                    onChange={(e) => handleFilterChange(option.id, e.target.value)}
                    theme={{
                      field: {
                        input: {
                          base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                        }
                      }
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2 mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button size="xs" color="light" onClick={handleResetFilters}>
              Limpar
            </Button>
            <Button size="xs" color="blue" onClick={handleApplyFilters}>
              <HiCheck className="mr-1 h-3 w-3" />
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFilter;