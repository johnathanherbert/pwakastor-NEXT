'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  CheckIcon,
  TrashIcon,
  PlusIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  ScaleIcon,
  CloudArrowUpIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import UserMenu from "@/components/UserMenu";
import Topbar from "../../components/Topbar";
import SearchBar from "../../components/SearchBar";
import { useRouter } from 'next/navigation';
import Calculator from '@/components/Calculator';
import ExcelUploader from '@/components/ExcelUploader';
import Sap from "../../components/Sap";

const Devolucao = () => {
  const router = useRouter();
  
  // Estados de UI
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

  const handleOpenSapDialog = () => {
    setSapDialogOpen(true);
  };

  const handleCloseSapDialog = () => {
    setSapDialogOpen(false);
    setDrawerOpen(false); // Close sidebar when SAP dialog closes
  };

  // Estados principais
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

  // Adicione este estado para controlar os valores restantes
  const [lotesRestantes, setLotesRestantes] = useState({});

  // Estado para o menu contextual
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    lote: null
  });

  // Ref para debounce
  const debounceTimeout = useRef(null);

  // Função de formatação atualizada
  const formatNumberBR = (number) => {
    if (number === null || number === undefined) return '';
    
    // Verifica se o número é inteiro
    if (Number.isInteger(number)) {
      return number.toLocaleString('pt-BR');
    }
    
    // Se não for inteiro, formata com 3 casas decimais
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  };

  // Função para converter string BR para número
  const parseBRNumber = (string) => {
    if (!string) return 0;
    return Number(string.replace(/\./g, '').replace(',', '.'));
  };

  // Função para ordenar itens
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

  // Função para alterar a ordenação
  const requestSort = useCallback((key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  // Função para ordenar lotes
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

  // Função para alterar ordenação dos lotes
  const handleLotesSort = (key) => {
    setLotesSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Efeito para carregar os dados do material quando houver searchTerm
  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    }
  }, [searchTerm]);

  // Efeito para atualizar lotes restantes quando materialData ou devolucaoItems mudar
  useEffect(() => {
    if (materialData) {
      updateLotesRestantes(devolucaoItems);
    }
  }, [materialData, devolucaoItems]);

  // Função para carregar o estado do Supabase
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

  // Função para salvar o estado no Supabase
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

  // Efeito para verificar o usuário e carregar o estado inicial
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await loadState(user.id);
      } else {
        router.push("/login");
      }
      setIsLoading(false);
    };
    checkUser();
  }, [router, loadState]);

  // Efeito para salvar o estado quando houver mudanças
  useEffect(() => {
    if (user && !isLoading) {
      saveState(user.id);
    }
  }, [devolucaoItems, materialInfo, materialData, searchTerm, tableFilter, isLoading, saveState, user]);

  // Função para atualizar materiais na área com debounce
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

  // Limpar timeout no unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Buscar material no SAP
  const handleSearch = async () => {
    if (!searchTerm) return;
    
    setLoading(true);
    setError(null);
    setMaterialData(null);
    setMaterialInfo(null);

    try {
      // Primeiro, buscar informações do material
      const { data: materialInfoData, error: materialInfoError } = await supabase
        .from('materials_database')
        .select('codigo_materia_prima, descricao')
        .eq('codigo_materia_prima', searchTerm)
        .limit(1)
        .single();

      if (materialInfoError) {
        setError("Material não encontrado.");
        return;
      }

      if (materialInfoData) {
        setMaterialInfo({
          codigo_materia_prima: materialInfoData.codigo_materia_prima,
          nome_materia_prima: materialInfoData.descricao
        });
        
        // Depois, buscar todos os lotes do material
        const { data: lotesData, error: lotesError } = await supabase
          .from('materials_database')
          .select('*')
          .eq('codigo_materia_prima', searchTerm)
          .order('data_validade', { ascending: true });

        if (lotesError) {
          setError("Erro ao buscar lotes do material.");
          return;
        }

        if (lotesData && lotesData.length > 0) {
          setMaterialData(lotesData);
        } else {
          setError("Nenhum lote encontrado para este material.");
        }
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      setError("Erro ao buscar material.");
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com o pressionamento de tecla
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (e.target.value.toLowerCase() === 'parcial') {
        handleAddDevolucaoItem(contextMenu.loteData);
      } else {
        handleSearch();
      }
    }
  };

  const handleOpenUploadDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setOpenDialog(false);
    setDrawerOpen(false); // Close sidebar when upload dialog closes
  };

  const handleDataUpdated = () => {
    handleSearch();
  };

  // Funções de manipulação da tabela de devolução
  const handleAddDevolucaoItem = (loteData, quantidade = null) => {
    // Se quantidade não for especificada, usar o valor restante disponível
    const valorDisponivel = lotesRestantes[loteData.lote]?.restante ?? loteData.qtd_materia_prima;
    const quantidadeDevolver = quantidade || valorDisponivel;
    const volumeInicial = "1";
    
    // Validar se ainda há quantidade disponível (considerando volume)
    const quantidadeTotal = quantidadeDevolver * parseFloat(volumeInicial);
    if (quantidadeTotal <= 0 || quantidadeTotal > valorDisponivel) {
      setError("Quantidade indisponível para devolução");
      return;
    }

    // Calcula o valor restante para este lote
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
    setError(null);
  };

  // Função para atualizar os valores restantes
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

  // Função para remover item
  const handleRemoveItem = (id) => {
    const newItems = devolucaoItems.filter(item => item.id !== id);
    setDevolucaoItems(newItems);
    updateLotesRestantes(newItems);
  };

  // Função para limpar tabela
  const handleClearTable = () => {
    setDevolucaoItems([]);
    updateLotesRestantes([]);
  };

  // Função para atualizar item
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

  // Adicione o useEffect para atualizar os lotes restantes quando materialData mudar
  useEffect(() => {
    updateLotesRestantes(devolucaoItems);
  }, [materialData, updateLotesRestantes]);

  // Funções de cópia atualizadas
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
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
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
      setCopyDevolucaoSuccess(true);
      setTimeout(() => setCopyDevolucaoSuccess(false), 2000);
    });
  };

  // Função para lidar com a confirmação da quantidade
  const handleConfirmQuantidade = () => {
    if (quantidadeDevolver) {
      handleAddDevolucaoItem(selectedLote, parseFloat(quantidadeDevolver));
      setShowQuantidadeModal(false);
      setSelectedLote(null);
      setQuantidadeDevolver("");
    }
  };

  // Função para lidar com o pressionamento de tecla no modal
  const handleQuantidadeKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmQuantidade();
    }
  };

  // Função para atualizar todos os valores do SAP
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

  // Função para fechar o menu contextual
  const closeContextMenu = useCallback((e) => {
    // Não fechar se o clique foi dentro do menu
    if (e?.target?.closest('.context-menu')) return;
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Efeito para fechar o menu ao clicar fora
  useEffect(() => {
    document.addEventListener('mousedown', closeContextMenu);
    return () => document.removeEventListener('mousedown', closeContextMenu);
  }, [closeContextMenu]);

  // Handler para o menu contextual
  const handleContextMenu = useCallback((e, lote) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calcula a posição do menu
    let x = e.clientX;
    let y = e.clientY;
    
    // Ajusta a posição para não ultrapassar os limites da tela
    const menuWidth = 144; // w-36 = 9rem = 144px
    const menuHeight = 80; // altura aproximada do menu
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth;
    }
    
    if (y - menuHeight < 0) {
      y = menuHeight;
    }
    
    // Atualiza o estado do menu contextual
    setContextMenu({
      visible: true,
      x,
      y,
      lote
    });
  }, []);

  // Função para calcular a cor baseada no valor usando escala logarítmica
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Topbar 
          user={user}
          drawerOpen={drawerOpen} 
          setDrawerOpen={setDrawerOpen}
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
          handleDataUpdated={handleDataUpdated}
        />




      {/* SearchBar */}
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        loading={loading}
        onSearch={handleSearch}
        onKeyPress={handleKeyPress}
      />

      {/* Conteúdo Principal */}
      <div className="pt-32 px-6">
        <div className="max-w-[2000px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Coluna Esquerda - Informações e Itens para Devolução */}
            <div className="lg:w-[400px] shrink-0 space-y-4">
              {/* Card de Informações do Material */}
              {materialInfo && (
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3">
                  <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    Informações do Material
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Código</label>
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {materialInfo.codigo_materia_prima}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Descrição</label>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {materialInfo.nome_materia_prima}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabela de Itens para Devolução */}
              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="p-2.5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          Itens para Devolução
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {devolucaoItems.length} {devolucaoItems.length === 1 ? 'item' : 'itens'} na lista
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleCopyDevolucaoTable}
                          className="flex items-center gap-1 px-2 py-1 text-xs
                                   text-gray-700 dark:text-gray-300 
                                   bg-white dark:bg-gray-700/50 
                                   border border-gray-200 dark:border-gray-600
                                   rounded hover:bg-gray-50 dark:hover:bg-gray-600/50 
                                   transition-all duration-200 font-medium"
                          disabled={!devolucaoItems.length}
                        >
                          {copyDevolucaoSuccess ? (
                            <>
                              <CheckIcon className="h-3 w-3 text-green-500" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <ClipboardDocumentIcon className="h-3 w-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleClearTable}
                          className="flex items-center gap-1 px-2 py-1 text-xs
                                   text-red-600 dark:text-red-400 
                                   hover:bg-red-50 dark:hover:bg-red-900/30 
                                   rounded transition-all duration-200
                                   border border-red-200 dark:border-red-800
                                   font-medium"
                        >
                          <TrashIcon className="h-3 w-3" />
                          <span>Limpar</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Quick Filters */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Filtros rápidos:</span>
                      <button
                        onClick={() => requestSort('lote')}
                        className={`px-2 py-0.5 rounded-full transition-colors duration-200
                                  ${sortConfig.key === 'lote' ? 
                                    'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 
                                    'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'}`}
                      >
                        Lote {sortConfig.key === 'lote' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => requestSort('quantidade')}
                        className={`px-2 py-0.5 rounded-full transition-colors duration-200
                                  ${sortConfig.key === 'quantidade' ? 
                                    'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 
                                    'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'}`}
                      >
                        Quantidade {sortConfig.key === 'quantidade' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-hidden">
                  <div className="max-h-[calc(100vh-24rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                        <tr>
                          <th className="px-2 py-1.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">Material</th>
                          <th className="px-2 py-1.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">Lote</th>
                          <th className="px-2 py-1.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">Qtd</th>
                          <th className="px-2 py-1.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">Vol</th>
                          <th className="px-2 py-1.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">Pal</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                        {sortItems(devolucaoItems).map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-75"
                          >
                            <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-400">
                              {item.material}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                              {item.lote}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs">
                              <input
                                type="text"
                                value={formatNumberBR(item.quantidade)}
                                onChange={(e) => {
                                  const value = parseBRNumber(e.target.value);
                                  if (!isNaN(value)) {
                                    handleUpdateItem(item.id, 'quantidade', value);
                                  }
                                }}
                                className="w-16 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 
                                         rounded bg-white dark:bg-gray-800 
                                         text-gray-900 dark:text-gray-100
                                         focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                                         text-xs"
                              />
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs">
                              <input
                                type="text"
                                value={item.volume}
                                onChange={(e) => handleUpdateItem(item.id, 'volume', e.target.value)}
                                className="w-12 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 
                                         rounded bg-white dark:bg-gray-800 
                                         text-gray-900 dark:text-gray-100
                                         focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                                         text-xs"
                                placeholder="1"
                              />
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs">
                              <input
                                type="text"
                                value={item.pallet}
                                onChange={(e) => handleUpdateItem(item.id, 'pallet', e.target.value)}
                                className="w-12 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 
                                         rounded bg-white dark:bg-gray-800 
                                         text-gray-900 dark:text-gray-100
                                         focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                                         text-xs"
                                placeholder="1"
                              />
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-xs text-center w-8">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300
                                         transition-colors duration-200 p-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Tabela de Lotes Disponíveis */}
            <div className="flex-1">
              {materialData && (
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <div className="p-2.5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            Lotes Disponíveis
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {materialData.length} {materialData.length === 1 ? 'lote encontrado' : 'lotes encontrados'}
                          </p>
                        </div>
                        <button
                          onClick={handleCopyTable}
                          className="flex items-center gap-1 px-2 py-1 text-xs
                                   text-gray-700 dark:text-gray-300 
                                   bg-white dark:bg-gray-700/50 
                                   border border-gray-200 dark:border-gray-600
                                   rounded hover:bg-gray-50 dark:hover:bg-gray-600/50 
                                   transition-all duration-200 font-medium"
                        >
                          {copySuccess ? (
                            <>
                              <CheckIcon className="h-3 w-3 text-green-500" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <ClipboardDocumentIcon className="h-3 w-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Quick Filters */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-gray-500 dark:text-gray-400">Ordenar por:</span>
                          <button
                            onClick={() => handleLotesSort('lote')}
                            className={`px-2 py-0.5 rounded-full transition-colors duration-200
                                      ${lotesSort.key === 'lote' ? 
                                        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 
                                        'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'}`}
                          >
                            Lote {lotesSort.key === 'lote' && (lotesSort.direction === 'asc' ? '↑' : '↓')}
                          </button>
                          <button
                            onClick={() => handleLotesSort('qtd_materia_prima')}
                            className={`px-2 py-0.5 rounded-full transition-colors duration-200
                                      ${lotesSort.key === 'qtd_materia_prima' ? 
                                        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 
                                        'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'}`}
                          >
                            Quantidade {lotesSort.key === 'qtd_materia_prima' && (lotesSort.direction === 'asc' ? '↑' : '↓')}
                          </button>
                          <button
                            onClick={() => handleLotesSort('data_validade')}
                            className={`px-2 py-0.5 rounded-full transition-colors duration-200
                                      ${lotesSort.key === 'data_validade' ? 
                                        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 
                                        'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/50'}`}
                          >
                            Validade {lotesSort.key === 'data_validade' && (lotesSort.direction === 'asc' ? '↑' : '↓')}
                          </button>
                        </div>
                        
                        {/* Barra de busca para a tabela */}
                        <div className="relative w-56">
                          <input
                            type="text"
                            value={tableFilter}
                            onChange={(e) => setTableFilter(e.target.value)}
                            placeholder="Buscar lotes..."
                            className="w-full px-2 py-1 pl-7 rounded-full border border-gray-300 dark:border-gray-600 
                                     bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100
                                     focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                                     placeholder-gray-500 dark:placeholder-gray-400
                                     text-xs"
                          />
                          <MagnifyingGlassIcon className="h-3.5 w-3.5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-hidden">
                    <div className="max-h-[calc(100vh-24rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                          <tr>
                            <th className="px-2 py-1.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">Lote</th>
                            <th className="px-2 py-1.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Quantidade</th>
                            <th className="px-2 py-1.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">Un</th>
                            <th className="px-2 py-1.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">Tipo</th>
                            <th className="px-2 py-1.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Validade</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                          {sortLotes(materialData)
                            .filter(lote => 
                              tableFilter === "" || 
                              lote.lote.toLowerCase().includes(tableFilter.toLowerCase()) ||
                              (lote.tipo_estoque && lote.tipo_estoque.toLowerCase().includes(tableFilter.toLowerCase())) ||
                              new Date(lote.data_validade).toLocaleDateString().includes(tableFilter)
                            )
                            .map((lote) => (
                              <tr
                                key={lote.lote}
                                onContextMenu={(e) => handleContextMenu(e, lote)}
                                onClick={(e) => {
                                  if (e.target.tagName !== 'BUTTON') {
                                    handleContextMenu(e, lote);
                                  }
                                }}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-75 cursor-pointer"
                              >
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-400">
                                  {lote.lote}
                                </td>
                                <td className={`px-2 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100 ${getColorForValue(parseFloat(lote.qtd_materia_prima), materialData)}`}>
                                  {formatNumberBR(lote.qtd_materia_prima)}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                  {lote.unidade_medida || 'KG'}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                  {lote.tipo_estoque || '-'}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                                  <div className="flex items-center gap-2">
                                  <span>{new Date(lote.data_validade).toLocaleDateString()}</span>
                                  {lotesRestantes[lote.lote] && lotesRestantes[lote.lote].restante !== lotesRestantes[lote.lote].total && (
                                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <ScaleIcon className="h-3 w-3" />
                                    <span>Restante: {formatNumberBR(lotesRestantes[lote.lote].restante)} KG</span>
                                    </div>
                                  )}
                                  </div>
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-center">
                                  <div className="flex justify-end">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLote(lote);
                                        setShowQuantidadeModal(true);
                                      }}
                                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300
                                               transition-colors duration-200 p-0.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                    >
                                      <PlusIcon className="h-3 w-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Menu Contextual */}
        {contextMenu.visible && contextMenu.lote && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 w-64 context-menu"
          style={{
          left: `${contextMenu.x}px`,
          top: `${contextMenu.y}px`,
          transform: 'translate(0, -100%)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Cabeçalho com informações do lote */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Lote: {contextMenu.lote.lote}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
            Total: {formatNumberBR(contextMenu.lote.qtd_materia_prima)} {contextMenu.lote.unidade_medida}
            </span>
            {lotesRestantes[contextMenu.lote.lote] && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Restante: {formatNumberBR(lotesRestantes[contextMenu.lote.lote].restante)} {contextMenu.lote.unidade_medida}
            </span>
            )}
          </div>
          </div>
          
          {/* Botões de ação */}
          <div className="py-2">
          <button
            onClick={(e) => {
            e.stopPropagation();
            const quantidadeTotal = lotesRestantes[contextMenu.lote.lote]
              ? lotesRestantes[contextMenu.lote.lote].restante
              : contextMenu.lote.qtd_materia_prima;
            handleAddDevolucaoItem(contextMenu.lote, parseFloat(quantidadeTotal));
            closeContextMenu();
            }}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700/50
                 text-gray-700 dark:text-gray-200 font-medium
                 transition-colors duration-200 flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <div>
            <div>Devolver Total</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {lotesRestantes[contextMenu.lote.lote] 
              ? `${formatNumberBR(lotesRestantes[contextMenu.lote.lote].restante)} ${contextMenu.lote.unidade_medida}`
              : `${formatNumberBR(contextMenu.lote.qtd_materia_prima)} ${contextMenu.lote.unidade_medida}`
              }
            </div>
            </div>
          </button>
          <button
            onClick={(e) => {
            e.stopPropagation();
            setSelectedLote(contextMenu.lote);
            setShowQuantidadeModal(true);
            closeContextMenu();
            }}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700/50
                 text-gray-700 dark:text-gray-200 font-medium
                 transition-colors duration-200 flex items-center gap-2"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            <div>
            <div>Devolver Parcial</div>
            {lotesRestantes[contextMenu.lote.lote] && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
              Até {formatNumberBR(lotesRestantes[contextMenu.lote.lote].restante)} {contextMenu.lote.unidade_medida}
              </div>
            )}
            </div>
          </button>
          </div>
        </div>
        )}


      {/* Modal de Quantidade */}
      {showQuantidadeModal && selectedLote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Quantidade para Devolução
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Lote: {selectedLote.lote}
              </p>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantidade Disponível
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {formatNumberBR(lotesRestantes[selectedLote.lote]?.restante ?? selectedLote.qtd_materia_prima)} {selectedLote.unidade_medida}
                  </p>
                </div>
                <div>
                  <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantidade para Devolver
                  </label>
                  <input
                    type="number"
                    id="quantidade"
                    value={quantidadeDevolver}
                    onChange={(e) => setQuantidadeDevolver(e.target.value)}
                    onKeyPress={handleQuantidadeKeyPress}
                    placeholder="Digite a quantidade..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                             placeholder-gray-500 dark:placeholder-gray-400
                             text-sm"
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowQuantidadeModal(false);
                  setSelectedLote(null);
                  setQuantidadeDevolver("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                         bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                         rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700
                         transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmQuantidade}
                disabled={!quantidadeDevolver}
                className="px-4 py-2 text-sm font-medium text-white
                         bg-blue-600 rounded-lg hover:bg-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-200"
              >
                Confirmar
              </button>
            </div>
            </div>
          </div>
          )}




            {/* Sap Modal */}
            <Sap
              open={sapDialogOpen}
              onClose={() => setSapDialogOpen(false)}
              user={user}
            />
            </div>
            );
          };

          export default Devolucao;