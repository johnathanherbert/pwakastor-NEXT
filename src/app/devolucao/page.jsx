'use client'
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import Sidebar from '../../components/Sidebar';
// Keep using showToast but remove ToastContainer import
import { showToast } from '../../components/Toast/ToastContainer';
import ExcelUploader from '../../components/ExcelUploader';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon,
  TrashIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  ClipboardIcon,
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';

// Importando componentes UI consistentes
import { Loading, Card, Button } from '@/components/ui';
import Topbar from '@/components/Topbar';

const Devolucao = () => {
  const router = useRouter();
  
  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [materialData, setMaterialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [devolucaoItems, setDevolucaoItems] = useState([]);
  const [showQuantidadeModal, setShowQuantidadeModal] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  const [quantidadeDevolver, setQuantidadeDevolver] = useState("");
  const [materialInfo, setMaterialInfo] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyDevolucaoSuccess, setCopyDevolucaoSuccess] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [sapDialogOpen, setSapDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Main states
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devolucoes, setDevolucoes] = useState([]);
  const [materiaisDevolvidos, setMateriaisDevolvidos] = useState({});
  const [selectedDevolucao, setSelectedDevolucao] = useState(null);
  const [materiaisNaArea, setMateriaisNaArea] = useState({});
  const [inputValues, setInputValues] = useState({});
  const [filtroAtivo, setFiltroAtivo] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [lotesSort, setLotesSort] = useState({ key: 'data_validade', direction: 'asc' });
  const [filterColumn, setFilterColumn] = useState('lote');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // State to control remaining values
  const [lotesRestantes, setLotesRestantes] = useState({});

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    lote: null
  });

  // Debounce ref
  const debounceTimeout = useRef(null);

  // Using the global theme context instead of local darkMode state
  const { darkMode, toggleDarkMode } = useTheme();

  // Formatting function
  const formatNumberBR = (number) => {
    if (number === null || number === undefined) return '';
    
    // Always format with 3 decimal places for consistency
    return Number(number).toLocaleString('pt-BR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
      useGrouping: true, // Enable thousands separators for large numbers
    });
  };

  // Function to convert BR string to number
  const parseBRNumber = (string) => {
    if (!string) return 0;
    // Remove all dots (thousand separators) and replace comma with dot for decimal point
    return Number(string.replace(/\./g, '').replace(',', '.'));
  };

  // Adicionando estado para controlar o feedback visual
  const [showDevolutionFeedback, setShowDevolutionFeedback] = useState(false);
  const [feedbackItem, setFeedbackItem] = useState(null);
  const feedbackTimeoutRef = useRef(null);
  
  // Adicionar estado para controlar a célula que está tendo feedback visual
  const [activeLoteKey, setActiveLoteKey] = useState(null);

  // Function to sort items
  const sortItems = useCallback((items) => {
    if (!sortConfig.key) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Handle numeric sorting for quantidade
      if (sortConfig.key === 'quantidade') {
        return sortConfig.direction === 'asc' 
          ? parseFloat(aValue) - parseFloat(bValue)
          : parseFloat(bValue) - parseFloat(aValue);
      }
      
      // String comparison for other fields
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [sortConfig]);

  // Function to change sort order
  const requestSort = useCallback((key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  // Function to sort lots
  const sortLotes = useCallback((lotes) => {
    if (!lotes) return [];
    
    return [...lotes].sort((a, b) => {
      const aValue = lotesSort.key === 'qtd_materia_prima' ? 
        parseFloat(a[lotesSort.key]) : 
        lotesSort.key === 'data_validade' ? 
          new Date(a[lotesSort.key]) : 
          a[lotesSort.key];
          
      const bValue = lotesSort.key === 'qtd_materia_prima' ? 
        parseFloat(b[lotesSort.key]) : 
        lotesSort.key === 'data_validade' ? 
          new Date(b[lotesSort.key]) : 
          b[lotesSort.key];

      if (aValue < bValue) {
        return lotesSort.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return lotesSort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [lotesSort]);

  // Function to change lot sort order
  const handleLotesSort = useCallback((key) => {
    setLotesSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Functions to handle the devolucao table
  const handleAddDevolucaoItem = (loteData, quantidade = null) => {
    // Add check for 11 items limit
    if (devolucaoItems.length >= 11) {
      showToast("Limite de 11 itens atingido. Não é possível adicionar mais itens.", "warning");
      return;
    }

    // Criar chave única que inclui o lote e o tipo_estoque para diferenciar lotes com o mesmo nome
    const loteKey = `${loteData.lote}${loteData.tipo_estoque ? `_${loteData.tipo_estoque}` : ''}`;
    
    const valorDisponivel = lotesRestantes[loteKey]?.restante ?? loteData.qtd_materia_prima;
    const quantidadeDevolver = quantidade || valorDisponivel;
    const volumeInicial = "1";
    
    // Validate if quantity is available
    const quantidadeTotal = quantidadeDevolver * parseFloat(volumeInicial);
    if (quantidadeTotal <= 0 || quantidadeTotal > valorDisponivel) {
      showToast("Quantidade indisponível para devolução", "error");
      return;
    }

    // Calculate remaining value for this lot
    setLotesRestantes(prev => ({
      ...prev,
      [loteKey]: {
        original: loteData.qtd_materia_prima,
        restante: (prev[loteKey]?.restante ?? loteData.qtd_materia_prima) - quantidadeTotal
      }
    }));

    const newItem = {
      id: Date.now(),
      material: loteData.codigo_materia_prima,
      lote: loteData.lote,
      tipo_estoque: loteData.tipo_estoque || '',  // Armazenamos o tipo_estoque para diferenciar lotes
      loteKey: loteKey,  // Armazena a chave composta como referência
      quantidade: quantidadeDevolver,
      volume: volumeInicial,
      pallet: "1",
      data_validade: loteData.data_validade,
      unidade_medida: loteData.unidade_medida || 'KG'
    };
    
    setDevolucaoItems([...devolucaoItems, newItem]);
    setShowQuantidadeModal(false);
    setQuantidadeDevolver("");
    
    // Mostrar o feedback visual
    setFeedbackItem({
      ...newItem,
      material_nome: materialInfo.nome_materia_prima
    });
    setShowDevolutionFeedback(true);
    setActiveLoteKey(loteKey);
    
    // Limpar o feedback após alguns segundos
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setShowDevolutionFeedback(false);
      setActiveLoteKey(null);
    }, 3000);
    
    showToast(`Item ${loteData.lote} ${loteData.tipo_estoque ? `(${loteData.tipo_estoque})` : ''} adicionado à devolução.`, "success");
  };

  // Function to update remaining values
  const updateLotesRestantes = useCallback((items) => {
    const newLotesRestantes = {};
    
    // Inicializa com os valores originais do materialData
    materialData?.forEach(lote => {
      // Criar chave única que inclui lote e tipo_estoque
      const loteKey = `${lote.lote}${lote.tipo_estoque ? `_${lote.tipo_estoque}` : ''}`;
      newLotesRestantes[loteKey] = {
        total: parseFloat(lote.qtd_materia_prima),
        restante: parseFloat(lote.qtd_materia_prima)
      };
    });

    // Subtrai as quantidades dos itens de devolução considerando o volume
    items.forEach(item => {
      // Usar loteKey existente ou criar novo formato compatível
      const loteKey = item.loteKey || `${item.lote}${item.tipo_estoque ? `_${item.tipo_estoque}` : ''}`;
      
      if (newLotesRestantes[loteKey]) {
        const quantidadeTotal = parseFloat(item.quantidade) * parseFloat(item.volume || 1);
        newLotesRestantes[loteKey].restante -= quantidadeTotal;
      }
    });

    setLotesRestantes(newLotesRestantes);
  }, [materialData]);

  // Function to remove item
  const handleRemoveItem = (id) => {
    const itemToRemove = devolucaoItems.find(item => item.id === id);
    const newItems = devolucaoItems.filter(item => item.id !== id);
    setDevolucaoItems(newItems);
    
    // Atualiza os lotes restantes
    if (itemToRemove) {
      // Usar a loteKey correta para atualizar os valores corretamente
      updateLotesRestantes(newItems);
      showToast(`Item ${itemToRemove.lote} ${itemToRemove.tipo_estoque ? `(${itemToRemove.tipo_estoque})` : ''} removido da devolução.`, "info");
    }
  };

  // Function to clear table
  const handleClearTable = () => {
    setDevolucaoItems([]);
    updateLotesRestantes([]);
    showToast("Lista de devolução limpa.", "info");
  };

  // Function to update item
  const handleUpdateItem = (id, field, value) => {
    const newItems = devolucaoItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Se o campo for volume ou quantidade, recalcula a quantidade total
        if (field === 'volume' || field === 'quantidade') {
          const baseQuantidade = field === 'quantidade' ? value : item.quantidade;
          const volume = field === 'volume' ? value : item.volume;
          updatedItem.quantidade = baseQuantidade;
        }
        return updatedItem;
      }
      return item;
    });
    setDevolucaoItems(newItems);
    updateLotesRestantes(newItems);
  };

  // Add useEffect to update remaining lots when materialData changes
  useEffect(() => {
    updateLotesRestantes(devolucaoItems);
  }, [materialData, updateLotesRestantes]);

  // Effect to load material data when there's a searchTerm
  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    }
  }, [searchTerm]);

  // Function to handle quantidade confirmation
  const handleConfirmQuantidade = () => {
    if (quantidadeDevolver && selectedLote) {
      // Parse the input value correctly to handle decimal comma
      const parsedQuantidade = parseBRNumber(quantidadeDevolver);
      handleAddDevolucaoItem(selectedLote, parsedQuantidade);
      setShowQuantidadeModal(false);
      setSelectedLote(null);
      setQuantidadeDevolver("");
    }
  };

  // Function to handle key press in modal
  const handleQuantidadeKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmQuantidade();
    }
  };

  // Load dark mode from localStorage on component mount
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await loadState(user.id);
      } else {
        router.push("/login");
      }
      setIsLoading(false);
    };
    
    checkUser();
  }, [router]);
  
  // Search function
  const handleSearch = async () => {
    if (!searchTerm) return;
    
    setLoading(true);
    setError(null);
    setMaterialData(null);
    setMaterialInfo(null);

    try {
      // First, search for material information
      const { data: materialInfoData, error: materialInfoError } = await supabase
        .from('materials_database')
        .select('codigo_materia_prima, descricao')
        .eq('codigo_materia_prima', searchTerm)
        .limit(1)
        .single();

      if (materialInfoError) {
        setError("Material não encontrado.");
        if (searchTerm.length >= 6) {
          showToast("Material não encontrado em PES.", "error");
        }
        return;
      }

      if (materialInfoData) {
        setMaterialInfo({
          codigo_materia_prima: materialInfoData.codigo_materia_prima,
          nome_materia_prima: materialInfoData.descricao
        });
        
        // Then, search for all lots of the material
        const { data: lotesData, error: lotesError } = await supabase
          .from('materials_database')
          .select('*')
          .eq('codigo_materia_prima', searchTerm)
          .order('data_validade', { ascending: true });

        if (lotesError) {
          setError("Erro ao buscar lotes do material.");
          if (searchTerm.length >= 6) {
            showToast("Erro ao buscar lotes do material.", "error");
          }
          return;
        }

        if (lotesData && lotesData.length > 0) {
          setMaterialData(lotesData);
          showToast(`${lotesData.length} lotes encontrados para o material ${searchTerm}`, "success");
        } else {
          setError("Nenhum lote encontrado para este material.");
          showToast("Nenhum lote encontrado para este material.", "warning");
        }
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      setError("Erro ao buscar material.");
      if (searchTerm.length >= 6) {
        showToast("Erro ao buscar material.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Only trigger search if search term has at least 6 digits
      if (searchTerm.length >= 6) {
        handleSearch();
      } else if (searchTerm) {
        // Show hint that code is incomplete
        setError("Código do material incompleto.");
      }
    }
  };
  
  // Load and save state functions
  const loadState = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from("app_state")
        .select("state")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data?.state?.devolucao) {
        const {
          devolucaoItems,
          materialInfo,
          materialData,
          searchTerm: savedSearchTerm,
          tableFilter: savedTableFilter
        } = data.state.devolucao;

        setDevolucaoItems(devolucaoItems || []);
        
        if (materialInfo) {
          setMaterialInfo(materialInfo);
          setSearchTerm(savedSearchTerm || "");
          
          const response = await supabase
            .from("materiais_disponiveis")
            .select("*")
            .eq("codigo_materia_prima", materialInfo.codigo_materia_prima);

          if (response.data) {
            setMaterialData(response.data);
            
            const newLotesRestantes = {};
            response.data.forEach((lote) => {
              const loteKey = `${lote.lote}${lote.tipo_estoque ? `_${lote.tipo_estoque}` : ''}`;
              newLotesRestantes[loteKey] = {
                total: parseFloat(lote.qtd_materia_prima),
                restante: parseFloat(lote.qtd_materia_prima)
              };
            });

            devolucaoItems.forEach((item) => {
              if (newLotesRestantes[item.loteKey]) {
                newLotesRestantes[item.loteKey].restante -= parseFloat(item.quantidade);
              }
            });

            setLotesRestantes(newLotesRestantes);
          }
        }

        setTableFilter(savedTableFilter || "");
        
        localStorage.setItem(`devolucaoState_${userId}`, JSON.stringify(data.state.devolucao));
      } else {
        const storedState = localStorage.getItem(`devolucaoState_${userId}`);
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          setDevolucaoItems(parsedState.devolucaoItems || []);
          if (parsedState.materialInfo) {
            setMaterialInfo(parsedState.materialInfo);
            setSearchTerm(parsedState.searchTerm || "");
            
            const response = await supabase
              .from("materiais_disponiveis")
              .select("*")
              .eq("codigo_materia_prima", parsedState.materialInfo.codigo_materia_prima);

            if (response.data) {
              setMaterialData(response.data);
              
              const newLotesRestantes = {};
              response.data.forEach((lote) => {
                const loteKey = `${lote.lote}${lote.tipo_estoque ? `_${lote.tipo_estoque}` : ''}`;
                newLotesRestantes[loteKey] = {
                  total: parseFloat(lote.qtd_materia_prima),
                  restante: parseFloat(lote.qtd_materia_prima)
                };
              });

              parsedState.devolucaoItems.forEach((item) => {
                if (newLotesRestantes[item.loteKey]) {
                  newLotesRestantes[item.loteKey].restante -= parseFloat(item.quantidade);
                }
              });

              setLotesRestantes(newLotesRestantes);
            }
          }
          setTableFilter(parsedState.tableFilter || "");
        }
      }
    } catch (error) {
      console.error("Erro ao carregar o estado:", error);
      setDevolucaoItems([]);
      setMaterialInfo(null);
      setMaterialData(null);
      setLotesRestantes({});
      setSearchTerm("");
      setTableFilter("");
    }
  }, []);

  const saveState = useCallback(async (userId) => {
    try {
      const { data: currentData } = await supabase
        .from("app_state")
        .select("state")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const devolucaoState = {
        devolucaoItems,
        materialInfo,
        materialData,
        searchTerm,
        tableFilter
      };

      const newState = {
        ...(currentData?.state || {}),
        devolucao: devolucaoState
      };

      localStorage.setItem(`devolucaoState_${userId}`, JSON.stringify(devolucaoState));

      await supabase
        .from("app_state")
        .upsert({
          user_id: userId,
          state: newState,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error("Erro ao salvar o estado no Supabase:", error);
    }
  }, [devolucaoItems, materialInfo, materialData, searchTerm, tableFilter]);

  useEffect(() => {
    if (user && !isLoading) {
      saveState(user.id);
    }
  }, [devolucaoItems, materialInfo, materialData, searchTerm, tableFilter, isLoading, saveState, user]);

  // Function to update materiaisNaArea with debounce
  const handleMateriaisNaAreaChange = useCallback((material, value) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setInputValues((prev) => ({
        ...prev,
        [material]: value,
      }));

      const formattedValue = value === "" ? null : parseFloat(value).toFixed(3);
      setMateriaisNaArea((prev) => {
        const newState = { ...prev };
        if (formattedValue === null) {
          delete newState[material];
        } else {
          newState[material] = parseFloat(formattedValue);
        }
        return newState;
      });
    }, 500);
  }, []);

  const handleDataUpdated = () => {
    handleSearch();
  };

  // Effect to close menu when clicking outside
  useEffect(() => {
    document.addEventListener('mousedown', closeContextMenu);
    return () => document.removeEventListener('mousedown', closeContextMenu);
  }, []);
  
  // Function to close context menu
  const closeContextMenu = useCallback((e) => {
    if (e?.target?.closest('.context-menu')) return;
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  if (isLoading) {
    return <Loading fullScreen={true} message="Carregando dados..." />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Topbar
        user={user}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        handleDataUpdated={handleDataUpdated}
        title="Devolução de Materiais"
      />
      
      <main className="p-6 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Buscar material por código..."
                className="pl-9 pr-3 py-2 w-full bg-white dark:bg-gray-700/80 border border-gray-200 dark:border-gray-700
                       rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                       focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              /> 
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setOpenDialog(true)}
                className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Upload Excel"
              >
                <DocumentDuplicateIcon className="h-5 w-5" />
                <span className="sr-only">Upload Excel</span>
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors
                  ${showFilters 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                title="Filtros"
              >
                <FunnelIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleSearch}
                className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Buscar material"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              
              <Button
                onClick={handleSearch}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                variant="primary"
              >
                <span className="hidden sm:inline">Buscar Material</span>
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <Card className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros avançados</h3>
                <button 
                  onClick={() => {
                    setShowFilters(false);
                    setTableFilter("");
                  }} 
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Filtrar tabela de lotes
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tableFilter}
                      onChange={(e) => setTableFilter(e.target.value)}
                      placeholder="Ex: BLM2768 ou tipo de estoque"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                             rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                             focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {materialInfo && (
            <Card className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{materialInfo.nome_materia_prima}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Código: {materialInfo.codigo_materia_prima}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(materialInfo.codigo_materia_prima);
                        showToast("Código copiado para a área de transferência!", "success");
                      }}
                      className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full transition-colors"
                    >
                      <DocumentDuplicateIcon className="h-3 w-3 mr-0.5" />
                      Copiar código
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => {
                      // Implementação da função de cópia
                      if (!materialData) return;
                      
                      const headers = ['Lote', 'Quantidade', 'Tipo', 'Data Validade'];
                      const rows = materialData.map(lote => [
                        lote.lote,
                        formatNumberBR(lote.qtd_materia_prima),
                        lote.tipo_estoque || '-',
                        new Date(lote.data_validade).toLocaleDateString()
                      ]);

                      const tableText = [headers, ...rows].map(row => row.join('\t')).join('\n');

                      navigator.clipboard.writeText(tableText).then(() => {
                        showToast("Tabela copiada para a área de transferência!", "success");
                      });
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/30"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                    Copiar Tabela
                  </button>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            {/* Seções de conteúdo principal */}
            {!materialData && (
              <div className="lg:col-span-7">
                <Card className="p-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhum material selecionado</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Digite um código de material e clique em "Buscar Material"</p>
                </Card>
              </div>
            )}

            {/* Tabelas quando materialData estiver disponível */}
            {materialData && (
              <>
                {/* Tabela de Itens de Devolução - Agora ocupa 3/7 no desktop (aumentada) */}
                <div className="lg:col-span-3">
                  <Card className="h-full">
                    <div className="p-2.5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Itens para Devolução</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {devolucaoItems.length} {devolucaoItems.length === 1 ? 'item' : 'itens'} na lista
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            // Implementação da função de cópia
                            if (!devolucaoItems.length) return;
                            
                            const rows = devolucaoItems.map(item => [
                              item.material,
                              item.lote,
                              formatNumberBR(item.quantidade),
                              '',
                              item.volume,
                              item.pallet
                            ]);
                            
                            const tableText = rows.map(row => row.join('\t')).join('\n');
                            navigator.clipboard.writeText(tableText).then(() => {
                              showToast("Tabela de devolução copiada para a área de transferência!", "success");
                            });
                          }}
                          disabled={devolucaoItems.length === 0}
                          className={`inline-flex items-center px-1.5 py-0.5 text-[10px] rounded ${
                            devolucaoItems.length === 0
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30'
                          }`}
                        >
                          <DocumentDuplicateIcon className="h-2.5 w-2.5 mr-0.5" />
                          Copiar
                        </button>
                        <button
                          onClick={handleClearTable}
                          disabled={devolucaoItems.length === 0}
                          className={`inline-flex items-center px-1.5 py-0.5 text-[10px] rounded ${
                            devolucaoItems.length === 0
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/30'
                          }`}
                        >
                          <XMarkIcon className="h-2.5 w-2.5 mr-0.5" />
                          Limpar
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                          <tr>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Material
                            </th>
                            <th onClick={() => requestSort('lote')} className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer">
                              Lote {sortConfig.key === 'lote' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => requestSort('quantidade')} className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer">
                              Qtd {sortConfig.key === 'quantidade' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Vol
                            </th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Pal
                            </th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                          {devolucaoItems.length > 0 ? (
                            devolucaoItems.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                                  {item.material}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-400">
                                  {item.lote}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={formatNumberBR(item.quantidade)}
                                    onChange={(e) => {
                                      const value = parseBRNumber(e.target.value);
                                      if (!isNaN(value)) {
                                        handleUpdateItem(item.id, 'quantidade', value);
                                      }
                                    }}
                                    className="w-20 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-right text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                                  />
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={item.volume}
                                    onChange={(e) => {
                                      handleUpdateItem(item.id, 'volume', e.target.value);
                                    }}
                                    className="w-10 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                                  />
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={item.pallet}
                                    onChange={(e) => {
                                      handleUpdateItem(item.id, 'pallet', e.target.value);
                                    }}
                                    className="w-10 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                                  />
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                                  <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-800/30"
                                  >
                                    <XMarkIcon className="h-2.5 w-2.5 mr-0.5" />
                                    Remov
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="px-2 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                Sem itens para devolução. Selecione lotes da tabela ao lado.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                {/* Tabela de Lotes Disponíveis - Agora ocupa 4/7 no desktop (reduzida) */}
                <div className="lg:col-span-4">
                  <Card className="h-full flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Lotes Disponíveis</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {materialData.length} {materialData.length === 1 ? 'lote encontrado' : 'lotes encontrados'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="flex">
                            <div className="relative">
                              <button
                                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                                className="z-10 inline-flex items-center py-1.5 px-4 text-sm font-medium text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                                type="button"
                              >
                                {filterColumn === 'lote' ? 'Lote' : 
                                 filterColumn === 'tipo_estoque' ? 'Tipo' : 
                                 filterColumn === 'data_validade' ? 'Validade' : 'Filtrar por'} 
                                <ChevronDownIcon className="w-4 h-4 ml-2" />
                              </button>
                              {filterDropdownOpen && (
                                <div className="absolute top-full left-0 z-50 mt-1 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 dark:divide-gray-600">
                                  <ul className="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdown-button">
                                    <li>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFilterColumn('lote');
                                          setFilterDropdownOpen(false);
                                        }}
                                        className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                      >
                                        Lote
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFilterColumn('tipo_estoque');
                                          setFilterDropdownOpen(false);
                                        }}
                                        className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                      >
                                        Tipo
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFilterColumn('data_validade');
                                          setFilterDropdownOpen(false);
                                        }}
                                        className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                      >
                                        Validade
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div className="relative w-full">
                              <input
                                type="search"
                                value={tableFilter}
                                onChange={(e) => setTableFilter(e.target.value)}
                                className="block pl-3 pr-8 py-1.5 w-full z-20 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-r-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder={`Filtrar por ${filterColumn === 'lote' ? 'lote' : filterColumn === 'tipo_estoque' ? 'tipo' : 'validade'}...`}
                              />
                              <button 
                                onClick={() => setTableFilter("")}
                                type="button" 
                                className={`absolute right-0 top-0 p-1.5 h-full text-sm font-medium ${tableFilter ? 'text-gray-700 dark:text-gray-300' : 'text-transparent'}`}
                              >
                                {tableFilter && <XMarkIcon className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-auto flex-1" style={{ maxHeight: "calc(100vh - 320px)" }}>
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                          <tr>
                            <th onClick={() => handleLotesSort('lote')} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/70">
                              <div className="flex items-center">
                                <span>Lote</span>
                                <span className="ml-1">
                                  {lotesSort.key === 'lote' && 
                                   (lotesSort.direction === 'asc' ? 
                                    <ChevronDownIcon className="h-4 w-4" /> : 
                                    <ChevronDownIcon className="h-4 w-4 transform rotate-180" />)}
                                </span>
                              </div>
                            </th>
                            <th onClick={() => handleLotesSort('qtd_materia_prima')} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/70">
                              <div className="flex items-center">
                                <span>Quantidade</span>
                                <span className="ml-1">
                                  {lotesSort.key === 'qtd_materia_prima' && 
                                   (lotesSort.direction === 'asc' ? 
                                    <ChevronDownIcon className="h-4 w-4" /> : 
                                    <ChevronDownIcon className="h-4 w-4 transform rotate-180" />)}
                                </span>
                              </div>
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Un.
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th onClick={() => handleLotesSort('data_validade')} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/70">
                              <div className="flex items-center">
                                <span>Validade</span>
                                <span className="ml-1">
                                  {lotesSort.key === 'data_validade' && 
                                   (lotesSort.direction === 'asc' ? 
                                    <ChevronDownIcon className="h-4 w-4" /> : 
                                    <ChevronDownIcon className="h-4 w-4 transform rotate-180" />)}
                                </span>
                              </div>
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                          {materialData && sortLotes(materialData)
                            .filter(lote => {
                              if (!tableFilter) return true;
                              
                              if (filterColumn === 'lote') {
                                return lote.lote.toLowerCase().includes(tableFilter.toLowerCase());
                              } else if (filterColumn === 'tipo_estoque') {
                                return (lote.tipo_estoque || '').toLowerCase().includes(tableFilter.toLowerCase());
                              } else if (filterColumn === 'data_validade') {
                                return new Date(lote.data_validade).toLocaleDateString().includes(tableFilter);
                              }
                              
                              return (
                                lote.lote.toLowerCase().includes(tableFilter.toLowerCase()) ||
                                (lote.tipo_estoque && lote.tipo_estoque.toLowerCase().includes(tableFilter.toLowerCase())) ||
                                new Date(lote.data_validade).toLocaleDateString().includes(tableFilter)
                              );
                            })
                            .map((lote) => {
                              const loteKey = `${lote.lote}${lote.tipo_estoque ? `_${lote.tipo_estoque}` : ''}`;
                              const restante = lotesRestantes[loteKey]?.restante ?? lote.qtd_materia_prima;
                              const isZero = restante <= 0;
                              
                              return (
                                <tr 
                                  key={lote.id || loteKey} 
                                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                                    isZero ? 'opacity-50 bg-gray-50 dark:bg-gray-800/20' : ''
                                  } ${activeLoteKey === loteKey ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    setContextMenu({
                                      visible: true,
                                      x: e.clientX,
                                      y: e.clientY,
                                      lote
                                    });
                                  }}
                                >
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {lote.lote}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                    <div className="flex items-center gap-2">
                                      <span>{formatNumberBR(restante)}</span>
                                      {/* Indicador visual de porcentagem - mostrar enquanto o lote estiver na lista de devolução */}
                                      {lote.qtd_materia_prima > 0 && 
                                        (activeLoteKey === loteKey || devolucaoItems.some(item => item.loteKey === loteKey)) && (
                                        <div className="flex items-center">
                                          <div className="h-1.5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full rounded-full ${
                                                restante / lote.qtd_materia_prima > 0.5 
                                                  ? 'bg-emerald-500 dark:bg-emerald-500' 
                                                  : restante / lote.qtd_materia_prima > 0.2
                                                    ? 'bg-yellow-500 dark:bg-yellow-500'
                                                    : 'bg-red-500 dark:bg-red-500'
                                              }`}
                                              style={{ width: `${(restante / lote.qtd_materia_prima) * 100}%` }}
                                            />
                                          </div>
                                          <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
                                            {Math.round((restante / lote.qtd_materia_prima) * 100)}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                    {lote.unidade_medida || 'KG'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                    {lote.tipo_estoque || '-'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                    {new Date(lote.data_validade).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                    <button
                                      onClick={() => {
                                        setSelectedLote(lote);
                                        setQuantidadeDevolver("");
                                        setShowQuantidadeModal(true);
                                      }}
                                      disabled={isZero}
                                      className={`inline-flex items-center px-2 py-1 text-xs rounded-md ${
                                        isZero
                                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30'
                                      }`}
                                    >
                                      <PlusIcon className="h-3 w-3 mr-1" />
                                      Devolver
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 py-1 w-56 context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Lote: {contextMenu.lote?.lote} {contextMenu.lote?.tipo_estoque ? `(${contextMenu.lote.tipo_estoque})` : ''}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {contextMenu.lote && formatNumberBR(contextMenu.lote.qtd_materia_prima)} {contextMenu.lote?.unidade_medida || 'KG'}
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedLote(contextMenu.lote);
              setQuantidadeDevolver("");
              setShowQuantidadeModal(true);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 flex items-center"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Devolver Parcial
          </button>
          <button
            onClick={() => {
              handleAddDevolucaoItem(contextMenu.lote);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Devolver Tudo
          </button>
        </div>
      )}

      {/* Quantidade Modal */}
      {showQuantidadeModal && selectedLote && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowQuantidadeModal(false)}>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"></div>
            
            <div className="relative bg-white dark:bg-gray-800/95 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quantidade para Devolução
                </h3>
                <button 
                  onClick={() => setShowQuantidadeModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lote:</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{selectedLote.lote}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Material:</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{materialInfo?.nome_materia_prima}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Quantidade Disponível: <span className="font-medium">{formatNumberBR(selectedLote.qtd_materia_prima)} {selectedLote.unidade_medida || 'KG'}</span>
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantidade para Devolução:
                  </label>
                  <input
                    type="text"
                    value={quantidadeDevolver}
                    onChange={(e) => setQuantidadeDevolver(e.target.value)}
                    placeholder={`Ex: ${formatNumberBR(selectedLote.qtd_materia_prima)}`}
                    className="w-full px-3 py-2 
                      bg-white dark:bg-gray-700
                      border border-gray-200 dark:border-gray-600 
                      rounded-lg text-gray-900 dark:text-gray-100
                      placeholder-gray-400 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                      focus:border-transparent transition-colors"
                    autoFocus
                    onKeyDown={handleQuantidadeKeyPress}
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setShowQuantidadeModal(false)}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmQuantidade}
                    variant="primary"
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Visual Aprimorado */}
      {showDevolutionFeedback && feedbackItem && (
        <div 
          className="fixed bottom-4 right-4 z-50 animate-slide-up-fade"
          onClick={() => setShowDevolutionFeedback(false)}
        >
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden w-72 border-l-4 border-emerald-500 dark:border-emerald-400 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600 rounded-full p-2 shadow-inner">
                  <ArrowDownTrayIcon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3 w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                    Material Adicionado
                    <span className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </p>
                  <div className="mt-1.5 text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                    <p className="truncate font-medium">{feedbackItem.material_nome}</p>
                    <div className="flex justify-between">
                      <span>Código: <span className="font-medium">{feedbackItem.material}</span></span>
                      <span>Lote: <span className="font-medium">{feedbackItem.lote}</span></span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span>Quantidade:</span> 
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatNumberBR(feedbackItem.quantidade)} {feedbackItem.unidade_medida}</span>
                    </div>
                    {feedbackItem.tipo_estoque && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          Tipo: {feedbackItem.tipo_estoque}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0 flex">
                  <button
                    type="button"
                    className="bg-transparent rounded-md text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDevolutionFeedback(false);
                    }}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="relative">
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-1.5 bg-emerald-500 rounded-full" 
                      style={{ width: '100%', animationName: 'progress', animationDuration: '3s', animationTimingFunction: 'linear' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 py-2 px-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center">
                  <CheckIcon className="h-3.5 w-3.5 mr-1" />
                  Adicionado à lista de devolução
                </p>
              </div>
            </div>
          </div>
          <style jsx global>{`
            @keyframes slideUp {
              from {
                transform: translateY(20px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            
            @keyframes progress {
              0% { width: 100%; }
              100% { width: 0%; }
            }
            
            .animate-slide-up-fade {
              animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            
            .animate-ping {
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            }
            
            @keyframes ping {
              75%, 100% {
                transform: scale(2);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Devolucao;