"use client";
import React, { useState, useEffect, useMemo } from 'react';
import SortableTable from '@/components/SortableTable';
import TableFilter from '@/components/TableFilter';
import { Button, TextInput } from 'flowbite-react';
import { 
  HiMagnifyingGlass, 
  HiOutlineDocumentArrowDown, 
  HiArrowPath, 
  HiPlus 
} from 'react-icons/hi2';

export default function TabelaExemploPage() {
  // Estado para armazenar os dados da tabela
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para controlar a ordenação
  const [sortConfig, setSortConfig] = useState({
    key: 'nome',
    direction: 'asc'
  });
  
  // Estado para controlar os filtros
  const [filters, setFilters] = useState({
    status: 'all',
    tipo: 'all',
    busca: '',
    dataInicial: '',
    dataFinal: ''
  });
  
  // Opções de filtro disponíveis
  const filterOptions = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'ativo', label: 'Ativo' },
        { value: 'inativo', label: 'Inativo' },
        { value: 'pendente', label: 'Pendente' }
      ]
    },
    {
      id: 'tipo',
      label: 'Tipo',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'produto', label: 'Produto' },
        { value: 'serviço', label: 'Serviço' },
        { value: 'materia-prima', label: 'Matéria-prima' }
      ]
    },
    {
      id: 'dataInicial',
      label: 'Data Inicial',
      type: 'date',
      defaultValue: ''
    },
    {
      id: 'dataFinal',
      label: 'Data Final',
      type: 'date',
      defaultValue: ''
    }
  ];
  
  // Definindo as colunas da tabela
  const columns = [
    {
      key: 'codigo',
      label: 'Código',
      width: 'w-24',
      sortable: true
    },
    {
      key: 'nome',
      label: 'Nome',
      sortable: true
    },
    {
      key: 'tipo',
      label: 'Tipo',
      width: 'w-32',
      type: 'badge',
      sortable: true,
      badgeColors: {
        'produto': 'info',
        'serviço': 'purple',
        'materia-prima': 'warning'
      }
    },
    {
      key: 'quantidade',
      label: 'Quantidade',
      width: 'w-28',
      type: 'number',
      sortable: true,
      cellClassName: 'text-right'
    },
    {
      key: 'preco',
      label: 'Preço',
      width: 'w-32',
      type: 'currency',
      sortable: true,
      cellClassName: 'text-right'
    },
    {
      key: 'data_cadastro',
      label: 'Data Cadastro',
      width: 'w-36',
      type: 'date',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-28',
      type: 'badge',
      sortable: true,
      badgeColors: {
        'ativo': 'success',
        'inativo': 'failure',
        'pendente': 'warning'
      }
    },
    {
      key: 'acoes',
      label: 'Ações',
      width: 'w-20',
      sortable: false,
      render: (item) => (
        <div className="flex space-x-1">
          <Button size="xs" color="light" pill>
            <HiMagnifyingGlass className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];
  
  // Gerar dados de exemplo
  useEffect(() => {
    const gerarDadosExemplo = () => {
      setIsLoading(true);
      
      // Simular um atraso de carregamento
      setTimeout(() => {
        const tiposArray = ['produto', 'serviço', 'materia-prima'];
        const statusArray = ['ativo', 'inativo', 'pendente'];
        
        const dadosExemplo = Array.from({ length: 50 }, (_, i) => {
          const tipo = tiposArray[Math.floor(Math.random() * tiposArray.length)];
          const status = statusArray[Math.floor(Math.random() * statusArray.length)];
          const dataCadastro = new Date();
          dataCadastro.setDate(dataCadastro.getDate() - Math.floor(Math.random() * 365));
          
          return {
            id: i + 1,
            codigo: `ITEM${String(i + 1).padStart(4, '0')}`,
            nome: `Item de Exemplo ${i + 1}`,
            tipo,
            quantidade: Math.floor(Math.random() * 1000),
            preco: parseFloat((Math.random() * 1000).toFixed(2)),
            data_cadastro: dataCadastro.toISOString(),
            status
          };
        });
        
        setData(dadosExemplo);
        setIsLoading(false);
      }, 1000);
    };
    
    gerarDadosExemplo();
  }, []);
  
  // Função para aplicar a ordenação
  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };
  
  // Função para aplicar filtros
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };
  
  // Função para lidar com busca rápida
  const [quickSearch, setQuickSearch] = useState('');
  const handleQuickSearch = (e) => {
    setQuickSearch(e.target.value);
  };
  
  // Aplicar filtros e ordenação aos dados
  const filteredAndSortedData = useMemo(() => {
    // Primeiro aplicamos os filtros
    let filteredData = [...data];
    
    // Aplicar filtro de busca rápida
    if (quickSearch) {
      const searchTerm = quickSearch.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.codigo.toLowerCase().includes(searchTerm) ||
        item.nome.toLowerCase().includes(searchTerm)
      );
    }
    
    // Aplicar filtros avançados
    if (filters.status !== 'all') {
      filteredData = filteredData.filter(item => item.status === filters.status);
    }
    
    if (filters.tipo !== 'all') {
      filteredData = filteredData.filter(item => item.tipo === filters.tipo);
    }
    
    if (filters.dataInicial) {
      const dataInicial = new Date(filters.dataInicial);
      filteredData = filteredData.filter(item => new Date(item.data_cadastro) >= dataInicial);
    }
    
    if (filters.dataFinal) {
      const dataFinal = new Date(filters.dataFinal);
      // Ajustar para o final do dia
      dataFinal.setHours(23, 59, 59, 999);
      filteredData = filteredData.filter(item => new Date(item.data_cadastro) <= dataFinal);
    }
    
    if (filters.busca) {
      const searchTerm = filters.busca.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.codigo.toLowerCase().includes(searchTerm) ||
        item.nome.toLowerCase().includes(searchTerm)
      );
    }
    
    // Depois aplicamos a ordenação
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        // Verificar se os valores são numéricos
        if (typeof a[sortConfig.key] === 'number' && typeof b[sortConfig.key] === 'number') {
          return sortConfig.direction === 'asc' 
            ? a[sortConfig.key] - b[sortConfig.key]
            : b[sortConfig.key] - a[sortConfig.key];
        }
        
        // Verificar se são datas
        if (new Date(a[sortConfig.key]).toString() !== 'Invalid Date' && 
            new Date(b[sortConfig.key]).toString() !== 'Invalid Date') {
          return sortConfig.direction === 'asc'
            ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
            : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
        }
        
        // Ordenação padrão para strings
        return sortConfig.direction === 'asc'
          ? String(a[sortConfig.key]).localeCompare(String(b[sortConfig.key]))
          : String(b[sortConfig.key]).localeCompare(String(a[sortConfig.key]));
      });
    }
    
    return filteredData;
  }, [data, sortConfig, filters, quickSearch]);
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Exemplo de Tabela com Filtros e Ordenação
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Este exemplo demonstra recursos completos de filtragem e ordenação de tabelas.
        </p>
      </div>
      
      {/* Barra de ferramentas */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <TextInput
              type="search"
              placeholder="Buscar por código ou nome..."
              value={quickSearch}
              onChange={handleQuickSearch}
              className="pl-10"
            />
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <TableFilter 
            filters={filters}
            setFilters={setFilters}
            filterOptions={filterOptions}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" color="light">
            <HiOutlineDocumentArrowDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" color="light" onClick={() => window.location.reload()}>
            <HiArrowPath className="mr-2 h-4 w-4" />
            Recarregar
          </Button>
          <Button size="sm" color="blue">
            <HiPlus className="mr-2 h-4 w-4" />
            Novo Item
          </Button>
        </div>
      </div>
      
      {/* Status e estatísticas */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Exibindo {filteredAndSortedData.length} de {data.length} registros
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Total</p>
            <p className="text-lg font-bold text-blue-800 dark:text-blue-400">{data.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-md">
            <p className="text-xs text-green-700 dark:text-green-300 font-medium">Ativos</p>
            <p className="text-lg font-bold text-green-800 dark:text-green-400">
              {data.filter(item => item.status === 'ativo').length}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-md">
            <p className="text-xs text-red-700 dark:text-red-300 font-medium">Inativos</p>
            <p className="text-lg font-bold text-red-800 dark:text-red-400">
              {data.filter(item => item.status === 'inativo').length}
            </p>
          </div>
        </div>
      </div>
      
      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <SortableTable 
          data={filteredAndSortedData}
          columns={columns}
          sortConfig={sortConfig}
          onSort={handleSort}
          isLoading={isLoading}
          emptyMessage="Nenhum item encontrado com os filtros atuais"
          onRowClick={(item) => console.log('Clicou na linha:', item)}
        />
      </div>
      
      {/* Paginação (exemplo simplificado) */}
      <div className="mt-4 flex justify-end">
        <div className="flex items-center gap-2">
          <Button size="sm" color="light" disabled>Anterior</Button>
          <Button size="sm" color="blue">1</Button>
          <Button size="sm" color="light">2</Button>
          <Button size="sm" color="light">3</Button>
          <Button size="sm" color="light">Próximo</Button>
        </div>
      </div>
    </div>
  );
}