'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  TrashIcon,
  PlusIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import UserMenu from "@/components/UserMenu";
import Sidebar from "@/components/Sidebar";
import { useRouter } from 'next/navigation';
import Calculator from '@/components/Calculator';

const Devolucao = () => {
  const router = useRouter();
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState("");
  const [materialData, setMaterialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [devolucaoItems, setDevolucaoItems] = useState([]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    loteData: null
  });
  const [quantidadeDevolver, setQuantidadeDevolver] = useState("");
  const [showQuantidadeModal, setShowQuantidadeModal] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  const [materialInfo, setMaterialInfo] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyDevolucaoSuccess, setCopyDevolucaoSuccess] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Estados principais
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devolucoes, setDevolucoes] = useState([]);
  const [materiaisDevolvidos, setMateriaisDevolvidos] = useState({});
  const [selectedDevolucao, setSelectedDevolucao] = useState(null);
  const [materiaisNaArea, setMateriaisNaArea] = useState({});
  const [inputValues, setInputValues] = useState({});
  const [filtroAtivo, setFiltroAtivo] = useState("");

  // Adicione este estado para controlar os valores restantes
  const [lotesRestantes, setLotesRestantes] = useState({});

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

  // Função para carregar o estado inicial
  const loadInitialState = useCallback(async (userId) => {
    try {
      // Primeiro tenta carregar do localStorage
      const localState = localStorage.getItem(`appState_devolucao_${userId}`);
      if (localState) {
        const parsedState = JSON.parse(localState);
        setDevolucoes(parsedState.devolucoes || []);
        setMateriaisDevolvidos(parsedState.materiaisDevolvidos || {});
        setSelectedDevolucao(parsedState.selectedDevolucao || null);
        setMateriaisNaArea(parsedState.materiaisNaArea || {});
        setInputValues(parsedState.inputValues || {});
        setFiltroAtivo(parsedState.filtroAtivo || "");
      }

      // Então busca do Supabase
      const { data, error } = await supabase
        .from("app_state")
        .select("state")
        .eq("user_id", userId)
        .eq("page", "devolucao")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data?.state) {
        setDevolucoes(data.state.devolucoes || []);
        setMateriaisDevolvidos(data.state.materiaisDevolvidos || {});
        setSelectedDevolucao(data.state.selectedDevolucao || null);
        setMateriaisNaArea(data.state.materiaisNaArea || {});
        setInputValues(data.state.inputValues || {});
        setFiltroAtivo(data.state.filtroAtivo || "");
        
        localStorage.setItem(`appState_devolucao_${userId}`, JSON.stringify(data.state));
      }
    } catch (error) {
      console.error("Erro ao carregar o estado:", error);
    }
  }, []);

  // Função para salvar o estado
  const saveState = useCallback(async (userId) => {
    if (!userId) return;

    const stateToSave = {
      devolucoes,
      materiaisDevolvidos,
      selectedDevolucao,
      materiaisNaArea,
      inputValues,
      filtroAtivo,
      timestamp: new Date().toISOString()
    };

    // Salva no localStorage primeiro (mais rápido)
    localStorage.setItem(`appState_devolucao_${userId}`, JSON.stringify(stateToSave));

    try {
      // Então salva no Supabase
      await supabase
        .from("app_state")
        .upsert({
          user_id: userId,
          page: "devolucao",
          state: stateToSave,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error("Erro ao salvar o estado:", error);
    }
  }, [devolucoes, materiaisDevolvidos, selectedDevolucao, materiaisNaArea, inputValues, filtroAtivo]);

  // Efeito para carregar o estado inicial
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;

        if (user) {
          setUser(user);
          await loadInitialState(user.id);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router, loadInitialState]);

  // Efeito para salvar alterações
  useEffect(() => {
    if (!user || isLoading) return;

    const saveTimeout = setTimeout(() => {
      saveState(user.id);
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [user, isLoading, saveState]);

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
      const { data: materialInfo, error: materialInfoError } = await supabase
        .from('materials_database')
        .select('codigo_materia_prima, descricao')
        .eq('codigo_materia_prima', searchTerm)
        .limit(1)
        .single();

      if (materialInfoError) {
        setError("Material não encontrado.");
        return;
      }

      if (materialInfo) {
        setMaterialInfo({
          codigo_materia_prima: materialInfo.codigo_materia_prima,
          nome_materia_prima: materialInfo.descricao
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

  // Funções de manipulação da tabela de devolução
  const handleLoteClick = (e, loteData) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      loteData
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, loteData: null });
  };

  const handleAddDevolucaoItem = (loteData, quantidade = null) => {
    // Se quantidade não for especificada, usar o valor restante disponível
    const valorDisponivel = lotesRestantes[loteData.lote]?.restante ?? loteData.qtd_materia_prima;
    const quantidadeDevolver = quantidade || valorDisponivel;
    
    // Validar se ainda há quantidade disponível
    if (quantidadeDevolver <= 0 || quantidadeDevolver > valorDisponivel) {
      setError("Quantidade indisponível para devolução");
      return;
    }

    // Calcula o valor restante para este lote
    setLotesRestantes(prev => ({
      ...prev,
      [loteData.lote]: {
        original: loteData.qtd_materia_prima,
        restante: (prev[loteData.lote]?.restante ?? loteData.qtd_materia_prima) - quantidadeDevolver
      }
    }));

    const newItem = {
      id: Date.now(),
      material: loteData.codigo_materia_prima,
      lote: loteData.lote,
      quantidade: quantidadeDevolver,
      volume: "1",
      pallet: "1"
    };
    
    setDevolucaoItems([...devolucaoItems, newItem]);
    handleCloseContextMenu();
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
        original: lote.qtd_materia_prima,
        restante: lote.qtd_materia_prima
      };
    });

    // Subtrai as quantidades dos itens de devolução
    items.forEach(item => {
      if (newLotesRestantes[item.lote]) {
        newLotesRestantes[item.lote].restante -= item.quantidade;
      }
    });

    setLotesRestantes(newLotesRestantes);
  }, [materialData]);

  // Função atualizada para remover item
  const handleRemoveItem = (id) => {
    const newItems = devolucaoItems.filter(item => item.id !== id);
    setDevolucaoItems(newItems);
    updateLotesRestantes(newItems);
  };

  // Função atualizada para limpar tabela
  const handleClearTable = () => {
    setDevolucaoItems([]);
    updateLotesRestantes([]);
  };

  // Função atualizada para atualizar item
  const handleUpdateItem = (id, field, value) => {
    const newItems = devolucaoItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setDevolucaoItems(newItems);
    
    // Só atualiza os lotes restantes se o campo for quantidade
    if (field === 'quantidade') {
      updateLotesRestantes(newItems);
    }
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Navbar mais compacta */}
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 z-40">
        <div className="flex items-center h-14"> {/* Reduzido de h-16 para h-14 */}
          <div className="flex items-center gap-2 px-3"> {/* Reduzido padding */}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              <Bars3Icon className="h-5 w-5" /> {/* Reduzido tamanho do ícone */}
            </button>
            <span className="text-base font-medium text-blue-600"> {/* Reduzido tamanho da fonte */}
              Devolução
            </span>
          </div>

          <div className="flex-1 flex items-center justify-end gap-3 px-3">
            <Calculator />
            <UserMenu user={user} onUserUpdate={setUser} />
          </div>
        </div>
      </nav>

      {/* Layout Principal - Ajustado padding top para navbar menor */}
      <div className="flex pt-14">
        <Sidebar
          open={drawerOpen}
          toggleDrawer={(state) => setDrawerOpen(state)}
        />

        {/* Conteúdo Principal - Espaçamentos reduzidos */}
        <div className="flex-1 p-3 md:p-4">
          {/* Cabeçalho da Página - Mais compacto */}
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-1">
              Devolução de Materiais
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Busque materiais por código e gerencie devoluções
            </p>
          </div>

          {/* Layout em duas colunas - Gaps reduzidos */}
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
            {/* Coluna Esquerda - Mais compacta */}
            <div className="w-full lg:w-1/3 space-y-3">
              {/* Card de Pesquisa */}
              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3">
                <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400 mb-3">
                  Buscar Material
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite o código do material..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                               placeholder-gray-500 dark:placeholder-gray-400
                               text-sm font-medium"
                    />
                    <MagnifyingGlassIcon className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg 
                             hover:from-blue-700 hover:to-blue-600
                             disabled:opacity-50 flex items-center gap-2
                             transition-all duration-200 justify-center font-medium
                             shadow-md hover:shadow-lg text-sm"
                  >
                    {loading ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <MagnifyingGlassIcon className="h-4 w-4" />
                    )}
                    <span>Buscar</span>
                  </button>
                </div>
              </div>

              {/* Informações do Material - Mais compacto */}
              {materialInfo && (
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3">
                  <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400 mb-3">
                    Informações do Material
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Código</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {materialInfo.codigo_materia_prima}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Descrição</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {materialInfo.nome_materia_prima}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Direita - Tabelas mais compactas */}
            <div className="flex-1">
              {/* Resultados da Busca */}
              {materialData && (
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 mb-3">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400">
                          Lotes Disponíveis
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          Clique em um lote para adicionar à devolução
                        </p>
                      </div>
                      <button
                        onClick={handleCopyTable}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs
                                 text-gray-700 dark:text-gray-300 
                                 bg-white dark:bg-gray-700/50 
                                 border border-gray-200 dark:border-gray-600
                                 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600/50 
                                 transition-all duration-200 font-medium"
                      >
                        {copySuccess ? (
                          <>
                            <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                            <span>Copiar Tabela</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Lote
                          </th>
                          <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Quantidade
                          </th>
                          <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Data Validade
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900/20 divide-y divide-gray-200 dark:divide-gray-700">
                        {materialData.map((lote) => (
                          <tr
                            key={lote.lote}
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors duration-200"
                            onClick={(e) => handleLoteClick(e, lote)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                              {lote.lote}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 dark:text-gray-100">
                                  {formatNumberBR(lote.qtd_materia_prima)} {lote.unidade_medida}
                                </span>
                                {lotesRestantes[lote.lote] && lotesRestantes[lote.lote].restante !== lote.qtd_materia_prima && (
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    (Restante: {formatNumberBR(lotesRestantes[lote.lote].restante)} {lote.unidade_medida})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {lote.tipo_estoque || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {new Date(lote.data_validade).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tabela de Devolução - Mais compacta */}
              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400">
                        Itens para Devolução
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {devolucaoItems.length} {devolucaoItems.length === 1 ? 'item' : 'itens'} na lista
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyDevolucaoTable}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm 
                                 text-gray-700 dark:text-gray-300 
                                 bg-white dark:bg-gray-700/50 
                                 border border-gray-200 dark:border-gray-600
                                 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600/50 
                                 transition-all duration-200 font-medium shadow-sm hover:shadow"
                        disabled={!devolucaoItems.length}
                      >
                        {copyDevolucaoSuccess ? (
                          <>
                            <CheckIcon className="h-4 w-4 text-green-500" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <ClipboardDocumentIcon className="h-4 w-4" />
                            <span>Copiar Tabela</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleClearTable}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm 
                                 text-red-600 dark:text-red-400 
                                 hover:bg-red-50 dark:hover:bg-red-900/30 
                                 rounded-lg transition-all duration-200
                                 border border-red-200 dark:border-red-800
                                 font-medium shadow-sm hover:shadow"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Limpar Lista</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Material</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lote</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantidade</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">UM</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Volume</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pallet</th>
                        <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900/20 divide-y divide-gray-200 dark:divide-gray-700">
                      {devolucaoItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                            {item.material}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {item.lote}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <input
                              type="text"
                              value={formatNumberBR(item.quantidade)}
                              onChange={(e) => {
                                const value = parseBRNumber(e.target.value);
                                if (!isNaN(value)) {
                                  handleUpdateItem(item.id, 'quantidade', value);
                                }
                              }}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 
                                       rounded bg-white dark:bg-gray-800 
                                       text-gray-900 dark:text-gray-100
                                       focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm"></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <input
                              type="text"
                              value={item.volume}
                              onChange={(e) => handleUpdateItem(item.id, 'volume', e.target.value)}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 
                                       rounded bg-white dark:bg-gray-800 
                                       text-gray-900 dark:text-gray-100
                                       focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                              placeholder="1"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <input
                              type="text"
                              value={item.pallet}
                              onChange={(e) => handleUpdateItem(item.id, 'pallet', e.target.value)}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 
                                       rounded bg-white dark:bg-gray-800 
                                       text-gray-900 dark:text-gray-100
                                       focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                              placeholder="1"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300
                                       transition-colors duration-200"
                            >
                              <TrashIcon className="h-5 w-5" />
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
        </div>
      </div>

      {/* Menu Contextual */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/30 
                   rounded-lg py-2 z-50 border border-gray-200 dark:border-gray-700"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {(lotesRestantes[contextMenu.loteData?.lote]?.restante ?? contextMenu.loteData?.qtd_materia_prima) > 0 ? (
            <>
              <button
                className="w-full px-4 py-2 text-left text-gray-900 dark:text-gray-100 
                         hover:bg-gray-100 dark:hover:bg-gray-700/50
                         transition-colors duration-200"
                onClick={() => handleAddDevolucaoItem(contextMenu.loteData)}
              >
                Devolver Lote Restante ({formatNumberBR(lotesRestantes[contextMenu.loteData?.lote]?.restante ?? contextMenu.loteData?.qtd_materia_prima)})
              </button>
              <button
                className="w-full px-4 py-2 text-left text-gray-900 dark:text-gray-100 
                         hover:bg-gray-100 dark:hover:bg-gray-700/50
                         transition-colors duration-200"
                onClick={() => {
                  setSelectedLote(contextMenu.loteData);
                  setShowQuantidadeModal(true);
                  handleCloseContextMenu();
                }}
              >
                Devolver Parcial
              </button>
            </>
          ) : (
            <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
              Lote já devolvido completamente
            </div>
          )}
        </div>
      )}

      {/* Modal de Quantidade */}
      {showQuantidadeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-xl dark:shadow-gray-900/30">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Quantidade para Devolução
            </h3>
            <div className="mb-4">
              <input
                type="text"
                value={quantidadeDevolver}
                onChange={(e) => {
                  // Permite apenas números, vírgula e ponto
                  const value = e.target.value.replace(/[^\d.,]/g, '');
                  // Garante apenas uma vírgula ou ponto
                  if ((value.match(/[.,]/g) || []).length <= 1) {
                    setQuantidadeDevolver(value);
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseBRNumber(quantidadeDevolver);
                    if (!isNaN(value) && value > 0 && value <= (lotesRestantes[selectedLote?.lote]?.restante ?? selectedLote?.qtd_materia_prima)) {
                      handleAddDevolucaoItem(selectedLote, value);
                    }
                  }
                }}
                placeholder="Digite a quantidade..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-lg bg-white dark:bg-gray-800 
                         text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                         mb-2"
                max={selectedLote?.qtd_materia_prima}
              />
              {selectedLote && (
                <div className="text-sm text-green-600 dark:text-green-400">
                  Quantidade disponível: {
                    formatNumberBR(lotesRestantes[selectedLote.lote]?.restante ?? selectedLote.qtd_materia_prima)
                  } {selectedLote.unidade_medida}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowQuantidadeModal(false);
                  setQuantidadeDevolver("");
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg
                         transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const value = parseBRNumber(quantidadeDevolver);
                  handleAddDevolucaoItem(selectedLote, value);
                }}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg 
                         hover:bg-blue-700 dark:hover:bg-blue-600
                         disabled:opacity-50 transition-colors duration-200"
                disabled={
                  !quantidadeDevolver || 
                  isNaN(parseBRNumber(quantidadeDevolver)) || 
                  parseBRNumber(quantidadeDevolver) <= 0 || 
                  parseBRNumber(quantidadeDevolver) > (lotesRestantes[selectedLote?.lote]?.restante ?? selectedLote?.qtd_materia_prima)
                }
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para fechar menu contextual */}
      {contextMenu.visible && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleCloseContextMenu}
        />
      )}
    </div>
  );
};

export default Devolucao;