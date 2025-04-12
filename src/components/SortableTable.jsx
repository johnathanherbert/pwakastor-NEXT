import React from 'react';
import { Table, Badge } from 'flowbite-react';
import SortableHeader from './SortableHeader';
import { HiOutlineArrowUp, HiOutlineArrowDown } from 'react-icons/hi';

/**
 * SortableTable é um componente de tabela genérico com capacidade de ordenação em todas as colunas
 * 
 * @param {Object} props
 * @param {Array} props.data - Dados a serem exibidos na tabela
 * @param {Array} props.columns - Definição das colunas
 * @param {Object} props.sortConfig - Configuração atual de ordenação { key, direction }
 * @param {Function} props.onSort - Função chamada quando um cabeçalho é clicado
 * @param {string} props.className - Classes CSS adicionais
 * @param {Function} props.onRowClick - Função chamada quando uma linha é clicada
 * @param {string} props.emptyMessage - Mensagem a ser exibida quando não há dados
 * @param {Boolean} props.isLoading - Indica se os dados estão sendo carregados
 */
const SortableTable = ({
  data = [],
  columns = [],
  sortConfig = { key: null, direction: 'asc' },
  onSort,
  className = "",
  onRowClick,
  emptyMessage = "Nenhum registro encontrado",
  isLoading = false
}) => {
  
  // Renderiza o valor da célula de acordo com o tipo de dado
  const renderCell = (item, column) => {
    // Se a coluna tiver um renderizador personalizado, use-o
    if (column.render) {
      return column.render(item);
    }
    
    // Se o valor for null ou undefined
    if (item[column.key] === null || item[column.key] === undefined) {
      return <span className="text-gray-400 dark:text-gray-500">-</span>;
    }
    
    // Verifica o tipo de dados e renderiza de acordo
    if (column.type === 'date') {
      return new Date(item[column.key]).toLocaleDateString('pt-BR');
    }
    
    if (column.type === 'datetime') {
      return new Date(item[column.key]).toLocaleString('pt-BR');
    }
    
    if (column.type === 'number') {
      return (
        <span className="tabular-nums">
          {typeof item[column.key] === 'number' 
            ? item[column.key].toLocaleString('pt-BR', { 
                minimumFractionDigits: column.fractionDigits || 0,
                maximumFractionDigits: column.fractionDigits || 2
              })
            : item[column.key]
          }
        </span>
      );
    }
    
    if (column.type === 'currency') {
      return (
        <span className="tabular-nums">
          {typeof item[column.key] === 'number' 
            ? `R$ ${item[column.key].toLocaleString('pt-BR', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`
            : item[column.key]
          }
        </span>
      );
    }
    
    if (column.type === 'percentage') {
      return (
        <span className="tabular-nums">
          {typeof item[column.key] === 'number' 
            ? `${item[column.key].toLocaleString('pt-BR', { 
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
              })}%`
            : item[column.key]
          }
        </span>
      );
    }
    
    if (column.type === 'badge') {
      return (
        <Badge 
          color={column.badgeColors?.[item[column.key]] || 'info'}
          className="whitespace-nowrap"
        >
          {item[column.key]}
        </Badge>
      );
    }
    
    // Valor padrão (texto)
    return item[column.key];
  };
  
  const handleSort = (field) => {
    if (!onSort) return;
    
    if (sortConfig.key === field) {
      onSort(field, sortConfig.direction === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(field, 'asc');
    }
  };
  
  return (
    <div className={`${className}`}>
      <div className="overflow-x-auto">
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
                className={`${column.width || ''} ${column.sortable !== false ? 'cursor-pointer' : ''}`}
                onClick={column.sortable !== false ? () => handleSort(column.key) : undefined}
              >
                {column.sortable !== false ? (
                  <SortableHeader 
                    label={column.label}
                    field={column.key}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                ) : (
                  <span>{column.label}</span>
                )}
              </Table.HeadCell>
            ))}
          </Table.Head>
          
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={columns.length} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando...</span>
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : data.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={columns.length} className="text-center py-8">
                  <span className="text-gray-500 dark:text-gray-400">{emptyMessage}</span>
                </Table.Cell>
              </Table.Row>
            ) : (
              data.map((item, index) => (
                <Table.Row 
                  key={item.id || index} 
                  className={`${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((column) => (
                    <Table.Cell 
                      key={`${item.id || index}-${column.key}`}
                      className={column.cellClassName}
                    >
                      {renderCell(item, column)}
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

export default SortableTable;