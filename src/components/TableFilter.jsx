import { useState, useEffect, useRef } from 'react';
import { HiChevronDown, HiX, HiCheck, HiOutlineFilter } from 'react-icons/hi';
import { Button, Label, TextInput, Select } from 'flowbite-react';

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
export default function TableFilter({ filters, setFilters, filterOptions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({ ...filters });
  const dropdownRef = useRef(null);
  
  // Determine if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== '' && value !== 'all'
  );

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== '' && value !== 'all'
  ).length;

  useEffect(() => {
    // Update tempFilters when the parent filters change
    setTempFilters({ ...filters });
  }, [filters]);

  useEffect(() => {
    // Handle clicks outside the dropdown
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Apply filters
  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setIsOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    const resetFilters = {};
    
    // Reset each filter to its default value
    filterOptions.forEach((option) => {
      resetFilters[option.id] = option.defaultValue;
    });
    
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    setIsOpen(false);
  };

  // Cancelar e retornar aos filtros originais
  const cancelChanges = () => {
    setTempFilters({ ...filters });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="xs"
        className={`flex items-center gap-1 ${
          hasActiveFilters 
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50' 
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
        }`}
      >
        <HiOutlineFilter className="mr-1 h-4 w-4" />
        Filtros
        {hasActiveFilters && (
          <span className="ml-1.5 flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white rounded-full w-5 h-5 text-xs">
            {activeFilterCount}
          </span>
        )}
        <HiChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>
      
      {isOpen && (
        <div className="absolute z-20 mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[300px] animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros avançados</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <HiX className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {filterOptions.map((option) => (
              <div key={option.id} className="space-y-1">
                <Label htmlFor={`filter-${option.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {option.label}
                </Label>
                
                {option.type === 'select' && (
                  <Select
                    id={`filter-${option.id}`}
                    value={tempFilters[option.id] || option.defaultValue}
                    onChange={(e) => setTempFilters({ ...tempFilters, [option.id]: e.target.value })}
                    className="w-full text-sm"
                  >
                    {option.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                )}
                
                {option.type === 'text' && (
                  <TextInput
                    id={`filter-${option.id}`}
                    type="text"
                    value={tempFilters[option.id] || ''}
                    onChange={(e) => setTempFilters({ ...tempFilters, [option.id]: e.target.value })}
                    placeholder={option.placeholder || ''}
                    className="w-full text-sm"
                  />
                )}
                
                {option.type === 'date' && (
                  <TextInput
                    id={`filter-${option.id}`}
                    type="date"
                    value={tempFilters[option.id] || ''}
                    onChange={(e) => setTempFilters({ ...tempFilters, [option.id]: e.target.value })}
                    className="w-full text-sm"
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              Limpar
            </button>
            <button
              onClick={cancelChanges}
              className="px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={applyFilters}
              className="px-3 py-1.5 text-xs text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 rounded transition-colors"
            >
              <HiCheck className="inline-block mr-1 h-3 w-3" />
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}