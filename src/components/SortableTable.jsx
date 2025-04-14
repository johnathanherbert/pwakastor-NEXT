import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Spinner } from 'flowbite-react';
import { HiArrowUp, HiArrowDown, HiSearch } from 'react-icons/hi';

/**
 * Componente de tabela ordenável com recursos avançados
 * 
 * @param {Object} props
 * @param {Array} props.data - Dados a serem exibidos na tabela
 * @param {Array} props.columns - Definição das colunas
 * @param {Object} props.sortConfig - Configuração de ordenação (key, direction)
 * @param {Function} props.onSort - Função chamada quando o usuário clica em uma coluna ordenável
 * @param {boolean} props.isLoading - Indica se a tabela está carregando dados
 * @param {string} props.emptyMessage - Mensagem a ser exibida quando não há dados
 * @param {Function} props.onRowClick - Função chamada quando o usuário clica em uma linha
 * @param {number} props.highlightRow - ID da linha a ser destacada
 */
const SortableTable = ({
  data = [],
  columns = [],
  sortConfig = { key: null, direction: 'asc' },
  onSort,
  isLoading = false,
  emptyMessage = 'Nenhum dado encontrado',
  onRowClick,
  highlightRow
}) => {
  const [quickFilter, setQuickFilter] = useState('');
  const [filteredData, setFilteredData] = useState(data);

  // Atualizar dados filtrados quando mudar o filtro rápido ou os dados
  useEffect(() => {
    if (!quickFilter.trim()) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(item => {
      // Busca em todas as propriedades do item que são strings ou números
      return Object.keys(item).some(key => {
        const value = item[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(quickFilter.toLowerCase());
        }
        if (typeof value === 'number') {
          return value.toString().includes(quickFilter);
        }
        return false;
      });
    });

    setFilteredData(filtered);
  }, [quickFilter, data]);

  const handleHeaderClick = (column) => {
    if (!column.sortable) return;
    if (onSort) {
      onSort(column.key, sortConfig.key === column.key 
        ? (sortConfig.direction === 'asc' ? 'desc' : 'asc')
        : 'asc'
      );
    }
  };

  const renderSortIcon = (column) => {
    if (!column.sortable) return null;
    if (sortConfig.key !== column.key) {
      return <span className="opacity-0 group-hover:opacity-50 ml-1">↕</span>;
    }
    return sortConfig.direction === 'asc' 
      ? <HiArrowUp className="ml-1 inline-block h-4 w-4" /> 
      : <HiArrowDown className="ml-1 inline-block h-4 w-4" />;
  };

  const renderCellContent = (item, column) => {
    // Se a coluna tem um renderizador personalizado, use-o
    if (column.render) {
      return column.render(item);
    }

    // Renderização padrão baseada no tipo
    const value = item[column.key];
    
    if (value === null || value === undefined) {
      return '-';
    }

    if (column.type === 'date' && value) {
      try {
        return new Date(value).toLocaleDateString();
      } catch (e) {
        return value;
      }
    }

    if (column.type === 'currency' && !isNaN(value)) {
      return value.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      });
    }

    if (column.type === 'number' && !isNaN(value)) {
      return value.toLocaleString('pt-BR');
    }

    if (column.type === 'badge' && column.badgeColors && column.badgeColors[value]) {
      const colorMap = {
        'success': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
        'failure': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
        'warning': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
        'info': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      };
      const badgeColor = colorMap[column.badgeColors[value]] || colorMap.info;
      return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
          {value}
        </span>
      );
    }

    return value;
  };

  const getRowClassName = (item) => {
    let className = "transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 group/row cursor-pointer";
    
    // Adicionar classe para linhas destacadas
    if (highlightRow && item.id === highlightRow) {
      className += " bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500";
    }
    
    return className;
  };

  return (
    <div>
      {/* Filtro rápido para a tabela */}
      {data.length > 0 && (
        <div className="mb-4 flex">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              placeholder="Filtro rápido..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                       rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                       focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          {quickFilter && (
            <div className="ml-2 flex items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredData.length} de {data.length} {data.length === 1 ? 'resultado' : 'resultados'}
              </span>
              <Button 
                size="xs" 
                color="light" 
                onClick={() => setQuickFilter('')}
                className="ml-2"
              >
                Limpar
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <Table theme={{
          root: {
            base: "w-full text-left text-sm text-gray-500 dark:text-gray-400",
            shadow: "absolute bg-white dark:bg-gray-800 hidden group-hover:block right-0 top-0 h-full w-1.5 rounded-tr-lg rounded-br-lg"
          },
          head: {
            base: "group/head text-xs uppercase text-gray-700 dark:text-gray-400",
            cell: {
              base: "bg-gray-50 dark:bg-gray-700 px-4 py-2 text-xs"
            }
          },
          body: {
            base: "divide-y divide-gray-200 dark:divide-gray-700",
            cell: {
              base: "px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
            }
          },
          row: {
            base: "group/row border-b border-gray-200 dark:border-gray-700 dark:bg-gray-800 bg-white",
            hovered: "hover:bg-gray-50 dark:hover:bg-gray-700"
          }
        }}>
          <Table.Head>
            {columns.map((column) => (
              <Table.HeadCell 
                key={column.key} 
                className={`${column.width || ''} ${column.sortable ? 'cursor-pointer' : ''} group`}
                onClick={() => handleHeaderClick(column)}
              >
                <div className="flex items-center">
                  <span>{column.label}</span>
                  {renderSortIcon(column)}
                </div>
              </Table.HeadCell>
            ))}
          </Table.Head>
          
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={columns.length} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Spinner size="xl" />
                    <p className="text-gray-500 dark:text-gray-400">Carregando dados...</p>
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : filteredData.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={columns.length} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center h-32">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 16h.01M9 14a3 3 0 100-6 3 3 0 000 6zm6 0a3 3 0 100-6 3 3 0 000 6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7.497a5.507 5.507 0 018-4.76M20 7.497a5.507 5.507 0 00-8-4.76" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">{emptyMessage}</p>
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredData.map((item, index) => (
                <Table.Row 
                  key={item.id || index} 
                  className={getRowClassName(item)}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((column) => (
                    <Table.Cell 
                      key={`${item.id || index}-${column.key}`}
                      className={`${column.cellClassName || ''}`}
                    >
                      {renderCellContent(item, column)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>
    </div>
  );
};

/**
 * Componente para o cabeçalho da tabela com ícone de ordenação
 */
export const SortableHeader = ({ label, field, sortConfig, onSort }) => {
  const handleClick = () => {
    if (onSort) {
      onSort(field);
    }
  };
  
  return (
    <div 
      onClick={handleClick}
      className="flex items-center cursor-pointer select-none"
    >
      <span>{label}</span>
      {sortConfig.key === field ? (
        <span className="ml-1.5">
          {sortConfig.direction === "asc" ? "↑" : "↓"}
        </span>
      ) : (
        <span className="ml-1.5 opacity-0 group-hover:opacity-30">↕</span>
      )}
    </div>
  );
};

export default SortableTable;