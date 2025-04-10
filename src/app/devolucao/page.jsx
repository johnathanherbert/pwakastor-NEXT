'use client'
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import Sidebar from '../../components/Sidebar';
import HeaderClock from '../../components/Clock/HeaderClock';
import ToastContainer from '../../components/Toast/ToastContainer';
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
  ArrowUpTrayIcon // Add this import for the upload icon
} from '@heroicons/react/24/outline';

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
  const [darkMode, setDarkMode] = useState(false);
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
  const [filterColumn, setFilterColumn] = useState('lote'); // Add this state for filter column selection
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false); // Add this state for filter dropdown

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

  // Load dark mode from localStorage on component mount
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(JSON.parse(savedMode));
    }

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
  const handleLotesSort = (key) => {
    setLotesSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Effect to load material data when there's a searchTerm
  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    }
  }, [searchTerm]);

  // Effect to update remaining lots when materialData or devolucaoItems change
  useEffect(() => {
    if (materialData) {
      updateLotesRestantes(devolucaoItems);
    }
  }, [materialData, devolucaoItems]);

  // Function to load state from Supabase
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

        // Primeiro setamos os itens de devolução
        setDevolucaoItems(devolucaoItems || []);
        
        // Se temos um material salvo, vamos recarregar seus dados
        if (materialInfo) {
          setMaterialInfo(materialInfo);
          setSearchTerm(savedSearchTerm || "");
          // Recarrega os dados do material
          const response = await supabase
            .from("materiais_disponiveis")
            .select("*")
            .eq("codigo_materia_prima", materialInfo.codigo_materia_prima);

          if (response.data) {
            setMaterialData(response.data);
            // Recalcula os lotes restantes com os dados atualizados
            const newLotesRestantes = {};
            response.data.forEach((lote) => {
              newLotesRestantes[lote.lote] = {
                total: parseFloat(lote.qtd_materia_prima),
                restante: parseFloat(lote.qtd_materia_prima)
              };
            });

            // Atualiza as quantidades restantes baseado nos itens de devolução
            devolucaoItems.forEach((item) => {
              if (newLotesRestantes[item.lote]) {
                newLotesRestantes[item.lote].restante -= parseFloat(item.quantidade);
              }
            });

            setLotesRestantes(newLotesRestantes);
          }
        }

        setTableFilter(savedTableFilter || "");
        
        // Salva no localStorage como backup
        localStorage.setItem(`devolucaoState_${userId}`, JSON.stringify(data.state.devolucao));
      } else {
        // Se não houver dados no Supabase, tenta carregar do localStorage
        const storedState = localStorage.getItem(`devolucaoState_${userId}`);
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          setDevolucaoItems(parsedState.devolucaoItems || []);
          if (parsedState.materialInfo) {
            setMaterialInfo(parsedState.materialInfo);
            setSearchTerm(parsedState.searchTerm || "");
            // Recarrega os dados do material
            const response = await supabase
              .from("materiais_disponiveis")
              .select("*")
              .eq("codigo_materia_prima", parsedState.materialInfo.codigo_materia_prima);

            if (response.data) {
              setMaterialData(response.data);
              // Recalcula os lotes restantes
              const newLotesRestantes = {};
              response.data.forEach((lote) => {
                newLotesRestantes[lote.lote] = {
                  total: parseFloat(lote.qtd_materia_prima),
                  restante: parseFloat(lote.qtd_materia_prima)
                };
              });

              // Atualiza as quantidades restantes
              parsedState.devolucaoItems.forEach((item) => {
                if (newLotesRestantes[item.lote]) {
                  newLotesRestantes[item.lote].restante -= parseFloat(item.quantidade);
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
      // Reseta os estados em caso de erro
      setDevolucaoItems([]);
      setMaterialInfo(null);
      setMaterialData(null);
      setLotesRestantes({});
      setSearchTerm("");
      setTableFilter("");
    }
  }, []);

  // Function to save state to Supabase
  const saveState = useCallback(async (userId) => {
    try {
      // Primeiro busca o estado atual
      const { data: currentData } = await supabase
        .from("app_state")
        .select("state")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Prepara o novo estado da página de devolução
      const devolucaoState = {
        devolucaoItems,
        materialInfo,
        materialData,
        searchTerm,
        tableFilter
      };

      // Combina com o estado existente ou cria um novo
      const newState = {
        ...(currentData?.state || {}),
        devolucao: devolucaoState
      };

      // Salva no localStorage como backup
      localStorage.setItem(`devolucaoState_${userId}`, JSON.stringify(devolucaoState));

      // Salva no Supabase
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

  // Effect to save state when there are changes
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

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Search material in SAP
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
        // Only show toast if the search term has at least 6 digits (valid code)
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
          // Only show toast if the search term has at least 6 digits
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
      // Only show toast if the search term has at least 6 digits
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
        // No toast here to avoid annoying the user
      }
    }
  };

  const handleOpenUploadDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setOpenDialog(false);
  };

  const handleDataUpdated = () => {
    handleSearch();
  };

  const handleOpenExcelUploadDialog = () => {
    setOpenDialog(true);
  };

  // Functions to handle the devolucao table
  const handleAddDevolucaoItem = (loteData, quantidade = null) => {
    // Add check for 11 items limit
    if (devolucaoItems.length >= 11) {
      showToast("Limite de 11 itens atingido. Não é possível adicionar mais itens.", "warning");
      return;
    }

    const valorDisponivel = lotesRestantes[loteData.lote]?.restante ?? loteData.qtd_materia_prima;
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
      [loteData.lote]: {
        original: loteData.qtd_materia_prima,
        restante: (prev[loteData.lote]?.restante ?? loteData.qtd_materia_prima) - quantidadeTotal
      }
    }));

    const newItem = {
      id: Date.now(),
      material: loteData.codigo_materia_prima,
      lote: loteData.lote,
      quantidade: quantidadeDevolver,
      volume: volumeInicial,
      pallet: "1"
    };
    
    setDevolucaoItems([...devolucaoItems, newItem]);
    setShowQuantidadeModal(false);
    setQuantidadeDevolver("");
    showToast(`Item ${loteData.lote} adicionado à devolução.`, "success");
  };

  // Function to update remaining values
  const updateLotesRestantes = useCallback((items) => {
    const newLotesRestantes = {};
    
    // Inicializa com os valores originais do materialData
    materialData?.forEach(lote => {
      newLotesRestantes[lote.lote] = {
        total: parseFloat(lote.qtd_materia_prima),
        restante: lote.qtd_materia_prima
      };
    });

    // Subtrai as quantidades dos itens de devolução considerando o volume
    items.forEach(item => {
      if (newLotesRestantes[item.lote]) {
        const quantidadeTotal = parseFloat(item.quantidade) * parseFloat(item.volume || 1);
        newLotesRestantes[item.lote].restante -= quantidadeTotal;
      }
    });

    setLotesRestantes(newLotesRestantes);
  }, [materialData]);

  // Function to remove item
  const handleRemoveItem = (id) => {
    const itemToRemove = devolucaoItems.find(item => item.id === id);
    const newItems = devolucaoItems.filter(item => item.id !== id);
    setDevolucaoItems(newItems);
    updateLotesRestantes(newItems);
    
    if (itemToRemove) {
      showToast(`Item ${itemToRemove.lote} removido da devolução.`, "info");
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

  // Copy functions
  const handleCopyTable = () => {
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
  };

  const handleCopyDevolucaoTable = () => {
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
  };

  // Function to handle quantidade confirmation
  const handleConfirmQuantidade = () => {
    if (quantidadeDevolver) {
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

  // Function to update all SAP values
  const handleUpdateAllSAPValues = async () => {
    if (!user || !materialData || !materialInfo) return;

    setLoading(true);
    try {
      const { data: sapData, error } = await supabase
        .from("materials_database")
        .select("*")
        .eq("codigo_materia_prima", materialInfo.codigo_materia_prima);

      if (error) throw error;

      if (sapData && sapData.length > 0) {
        setMaterialData(sapData);
        // Recalcular os lotes restantes com os dados atualizados
        const newLotesRestantes = {};
        sapData.forEach((lote) => {
          newLotesRestantes[lote.lote] = {
            total: parseFloat(lote.qtd_materia_prima),
            restante: parseFloat(lote.qtd_materia_prima)
          };
        });

        // Atualizar as quantidades restantes baseado nos itens de devolução
        devolucaoItems.forEach((item) => {
          if (newLotesRestantes[item.lote]) {
            const quantidadeTotal = parseFloat(item.quantidade) * parseFloat(item.volume || 1);
            newLotesRestantes[item.lote].restante -= quantidadeTotal;
          }
        });

        setLotesRestantes(newLotesRestantes);
      }
      console.log("Dados do SAP atualizados com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar dados do SAP:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to close context menu
  const closeContextMenu = useCallback((e) => {
    // Don't close if click was inside the menu
    if (e?.target?.closest('.context-menu')) return;
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Effect to close menu when clicking outside
  useEffect(() => {
    document.addEventListener('mousedown', closeContextMenu);
    return () => document.removeEventListener('mousedown', closeContextMenu);
  }, [closeContextMenu]);

  // Handler for context menu
  const handleContextMenu = useCallback((e, lote) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate menu position
    let x = e.clientX;
    let y = e.clientY;
    
    // Adjust position to avoid edge overflow
    const menuWidth = 200; 
    const menuHeight = 150;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth;
    }
    
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight;
    }
    
    // Update context menu state
    setContextMenu({
      visible: true,
      x,
      y,
      lote
    });
  }, []);

  // Function to calculate color based on value 
  const getColorForValue = useCallback((value, data) => {
    if (!data || data.length === 0) return '';
    
    // Encontra o menor e maior valor
    const values = data.map(item => parseFloat(item.qtd_materia_prima));
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Se min e max forem iguais, retorna amarelo
    if (min === max) return 'bg-yellow-50 dark:bg-yellow-900/20';
    
    // Usa escala logarítmica para lidar melhor com grandes variações
    const logValue = Math.log(value + 1); // +1 para evitar log(0)
    const logMin = Math.log(min + 1);
    const logMax = Math.log(max + 1);
    
    // Calcula a posição do valor atual na escala logarítmica (0 a 1)
    const position = (logValue - logMin) / (logMax - logMin);
    
    // Define as cores para diferentes faixas com limites ajustados
    if (position < 0.25) {
      return 'bg-red-50 dark:bg-red-900/20';
    } else if (position < 0.75) {
      return 'bg-yellow-50 dark:bg-yellow-900/20';
    } else {
      return 'bg-green-50 dark:bg-green-900/20';
    }
  }, []);

  // Function to handle table filter change
  const handleTableFilterChange = (e) => {
    setTableFilter(e.target.value);
  };

  // Function to select filter column
  const handleFilterColumnSelect = (column) => {
    setFilterColumn(column);
    setFilterDropdownOpen(false);
  };

  // Function to clear filter
  const handleClearFilter = () => {
    setTableFilter("");
    setFilterColumn("lote");
  };

  // Function to calculate return percentage for a lot
  const calculateReturnPercentage = useCallback((lote) => {
    if (!lotesRestantes[lote.lote]) return 0;
    
    const total = parseFloat(lote.qtd_materia_prima);
    const restante = parseFloat(lotesRestantes[lote.lote].restante);
    
    if (total <= 0) return 0;
    
    const devolvido = total - restante;
    return Math.min(100, Math.max(0, (devolvido / total) * 100));
  }, [lotesRestantes]);

  // Function to get progress bar color based on return percentage
  const getProgressBarColor = (percentage) => {
    if (percentage >= 75) return 'bg-emerald-500 dark:bg-emerald-500';
    if (percentage >= 25) return 'bg-amber-500 dark:bg-amber-500';
    if (percentage > 0) return 'bg-blue-500 dark:bg-blue-500';
    return 'bg-gray-300 dark:bg-gray-600';
  };

  // Function to get text color for percentage
  const getPercentageTextColor = (percentage) => {
    if (percentage >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (percentage >= 25) return 'text-amber-600 dark:text-amber-400';
    if (percentage > 0) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex justify-center items-center h-screen w-screen bg-white dark:bg-gray-900">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      {/* Add ToastContainer to the top level */}
      <ToastContainer />

      {/* Excel Uploader Dialog */}
      <ExcelUploader 
        onDataUpdated={handleDataUpdated}
        openUploadDialog={openDialog}
        handleCloseUploadDialog={() => setOpenDialog(false)}
      />
      
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Devolução de Materiais</h1>
            </div>
            
            <div className="flex items-center">
              {/* Adicionar o componente HeaderClock aqui */}
              <HeaderClock />
              
              <button
                onClick={() => {
                  const newMode = !darkMode;
                  setDarkMode(newMode);
                  localStorage.setItem('darkMode', JSON.stringify(newMode));
                }}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              >
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
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
                onClick={handleOpenExcelUploadDialog}
                className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Upload Excel"
              >
                <ArrowUpTrayIcon className="h-5 w-5" />
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
              
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Buscar Material</span>
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 animate-fadeIn">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros avançados</h3>
                <button onClick={() => {
                  setShowFilters(false);
                  setTableFilter("");
                }} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
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
            </div>
          )}
          
          {/* Material Info Card */}
          {materialInfo && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
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
                    onClick={handleCopyTable}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/30"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                    Copiar Tabela
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Return Items */}
            <div className="w-full lg:w-2/5 space-y-6">
              {/* Return Items Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-2.5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Itens para Devolução</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {devolucaoItems.length} {devolucaoItems.length === 1 ? 'item' : 'itens'} na lista
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyDevolucaoTable}
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
                        <th onClick={() => requestSort('lote')} className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer">
                          Lote {sortConfig.key === 'lote' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Material
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
                        sortItems(devolucaoItems).map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-400">
                              {item.lote}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                              {item.material}
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
                                onChange={(e) => handleUpdateItem(item.id, 'volume', e.target.value)}
                                className="w-10 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                              />
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap">
                              <input
                                type="text"
                                value={item.pallet}
                                onChange={(e) => handleUpdateItem(item.id, 'pallet', e.target.value)}
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
                            Sem itens para devolução. Selecione lotes da tabela à direita.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {devolucaoItems.length === 11 && (
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800/50">
                    <div className="flex items-start gap-1.5">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-[10px] text-yellow-700 dark:text-yellow-400">
                        <p className="font-medium">Limite de itens atingido</p>
                        <p>O SAP tem uma limitação de 11 itens por operação.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Available Lots */}
            <div className="w-full lg:w-3/5">
              {materialData ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Lotes Disponíveis</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {materialData.length} {materialData.length === 1 ? 'lote encontrado' : 'lotes encontrados'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Replace the original filter input with Flowbite-style filter */}
                      <div className="relative">
                        <div className="flex">
                          <div className="relative">
                            <button
                              id="dropdown-button"
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
                                      onClick={() => handleFilterColumnSelect('lote')}
                                      className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                    >
                                      Lote
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      type="button"
                                      onClick={() => handleFilterColumnSelect('tipo_estoque')}
                                      className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                    >
                                      Tipo
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      type="button"
                                      onClick={() => handleFilterColumnSelect('data_validade')}
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
                              onChange={handleTableFilterChange}
                              className="block pl-3 pr-8 py-1.5 w-full z-20 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-r-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              placeholder={`Filtrar por ${filterColumn === 'lote' ? 'lote' : filterColumn === 'tipo_estoque' ? 'tipo' : 'validade'}...`}
                            />
                            <button 
                              onClick={handleClearFilter}
                              type="button" 
                              className={`absolute right-0 top-0 p-1.5 h-full text-sm font-medium ${tableFilter ? 'text-gray-700 dark:text-gray-300' : 'text-transparent'}`}
                            >
                              {tableFilter && <XMarkIcon className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        {tableFilter && (
                          <div className="inline-flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>Filtro aplicado: </span>
                            <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">
                              {filterColumn === 'lote' ? 'Lote' : filterColumn === 'tipo_estoque' ? 'Tipo' : 'Validade'}: "{tableFilter}"
                            </span>
                            <button 
                              onClick={handleClearFilter}
                              className="ml-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th onClick={() => handleLotesSort('lote')} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer">
                            Lote {lotesSort.key === 'lote' && (lotesSort.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th onClick={() => handleLotesSort('qtd_materia_prima')} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer">
                            Quantidade {lotesSort.key === 'qtd_materia_prima' && (lotesSort.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Un.
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th onClick={() => handleLotesSort('data_validade')} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer">
                            Validade {lotesSort.key === 'data_validade' && (lotesSort.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                        {sortLotes(materialData)
                          .filter(lote => {
                            if (tableFilter === "") return true;
                            
                            if (filterColumn === 'lote') {
                              return lote.lote.toLowerCase().includes(tableFilter.toLowerCase());
                            } else if (filterColumn === 'tipo_estoque') {
                              return (lote.tipo_estoque || '').toLowerCase().includes(tableFilter.toLowerCase());
                            } else if (filterColumn === 'data_validade') {
                              return new Date(lote.data_validade).toLocaleDateString().includes(tableFilter);
                            }
                            
                            // Fallback to original filter behavior
                            return (
                              lote.lote.toLowerCase().includes(tableFilter.toLowerCase()) ||
                              (lote.tipo_estoque && lote.tipo_estoque.toLowerCase().includes(tableFilter.toLowerCase())) ||
                              new Date(lote.data_validade).toLocaleDateString().includes(tableFilter)
                            );
                          })
                          .map((lote) => {
                            const restante = lotesRestantes[lote.lote]?.restante ?? lote.qtd_materia_prima;
                            const isZero = restante <= 0;
                            const originalValue = parseFloat(lote.qtd_materia_prima);
                            const returnedValue = originalValue - restante;
                            const returnPercentage = calculateReturnPercentage(lote);
                            const progressBarColor = getProgressBarColor(returnPercentage);
                            
                            return (
                              <tr 
                                key={lote.lote} 
                                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                                  isZero ? 'opacity-50 bg-gray-50 dark:bg-gray-800/20' : ''
                                }`}
                                onContextMenu={(e) => handleContextMenu(e, lote)}
                              >
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {lote.lote}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {formatNumberBR(restante)}
                                      </span>
                                      {returnPercentage > 0 && (
                                        <span className={`text-xs font-semibold ${getPercentageTextColor(returnPercentage)}`}>
                                          {returnPercentage.toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                    {returnPercentage > 0 && (
                                      <div className="relative w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                          className={`absolute top-0 left-0 h-full ${progressBarColor} transition-all duration-300 rounded-full`} 
                                          style={{ width: `${returnPercentage}%` }}
                                        ></div>
                                        <div className="absolute inset-0 shadow-inner rounded-full"></div>
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
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhum material selecionado</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Digite um código de material e clique em "Buscar Material"</p>
                </div>
              )}
            </div>
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
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Lote: {contextMenu.lote.lote}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumberBR(lotesRestantes[contextMenu.lote.lote]?.restante ?? contextMenu.lote.qtd_materia_prima)} {contextMenu.lote.unidade_medida || 'KG'}</p>
          </div>
          <button
            onClick={() => {
              setSelectedLote(contextMenu.lote);
              setQuantidadeDevolver("");
              setShowQuantidadeModal(true);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 flex items-center"
            disabled={!contextMenu.lote || (lotesRestantes[contextMenu.lote.lote]?.restante || contextMenu.lote.qtd_materia_prima) <= 0}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Devolver Parcial
          </button>
          <button
            onClick={() => {
              if (contextMenu.lote) {
                // Use max available quantity
                handleAddDevolucaoItem(contextMenu.lote, lotesRestantes[contextMenu.lote.lote]?.restante || contextMenu.lote.qtd_materia_prima);
              }
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 flex items-center"
            disabled={!contextMenu.lote || (lotesRestantes[contextMenu.lote.lote]?.restante || contextMenu.lote.qtd_materia_prima) <= 0}
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
                    Quantidade Disponível: <span className="font-medium">{formatNumberBR(lotesRestantes[selectedLote.lote]?.restante ?? selectedLote.qtd_materia_prima)} {selectedLote.unidade_medida || 'KG'}</span>
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantidade para Devolução:
                  </label>
                  <input
                    type="text"
                    value={quantidadeDevolver}
                    onChange={(e) => {
                      // Allow typing with comma as decimal separator
                      setQuantidadeDevolver(e.target.value);
                    }}
                    onKeyDown={handleQuantidadeKeyPress}
                    placeholder={`Ex: ${formatNumberBR(lotesRestantes[selectedLote.lote]?.restante ?? selectedLote.qtd_materia_prima)}`}
                    className="w-full px-3 py-2 
                      bg-white dark:bg-gray-700
                      border border-gray-200 dark:border-gray-600 
                      rounded-lg text-gray-900 dark:text-gray-100
                      placeholder-gray-400 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                      focus:border-transparent transition-colors"
                    autoFocus
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowQuantidadeModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmQuantidade}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devolucao;