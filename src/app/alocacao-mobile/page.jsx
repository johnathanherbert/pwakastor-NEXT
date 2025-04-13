"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { Button, TextInput, Modal, Label, Spinner, Badge, Card } from "flowbite-react";
import { HiSearch, HiPlus, HiX, HiOutlineRefresh, HiChevronRight, HiCamera, HiQrcode } from "react-icons/hi";
import MobileOcrScanner from "@/components/MobileOcrScanner";
import QrCodeScanner from "@/components/QrCodeScanner";

export default function AlocacaoMobilePage() {
  // Estado para armazenar salas e vagas
  const [rooms, setRooms] = useState([]);
  const [emptySpaces, setEmptySpaces] = useState([]);
  const [filteredSpaces, setFilteredSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estado para scanner OCR
  const [isOcrScannerOpen, setIsOcrScannerOpen] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  
  // Estado para scanner QR Code de vaga
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  
  // Estado para controlar a seleção de sala
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomsStats, setRoomsStats] = useState({});
  
  // Estados para o modal de alocação
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [allocationData, setAllocationData] = useState({
    op: "",
    recipeCode: "",
    weighingDate: "",
    signature: "",
  });
  
  // Estado para controlar o fluxo em etapas do modal
  const [allocationStep, setAllocationStep] = useState(1); // 1: dados do material, 2: escanear vaga
  
  // Estado para o material selecionado
  const [activeMaterial, setActiveMaterial] = useState(null);
  
  // Estado para materiais do banco de dados
  const [materials, setMaterials] = useState([]);
  
  // Estado para feedback ao usuário
  const [feedback, setFeedback] = useState({ show: false, message: "", type: "" });

  // Carregar dados ao iniciar
  useEffect(() => {
    fetchRooms();
    fetchMaterials();
  }, []);
  
  // Atualizar materiais quando o código da receita é alterado
  useEffect(() => {
    if (allocationData.recipeCode) {
      const recipeCodeNumber = parseInt(allocationData.recipeCode);
      const material = materials.find(m => {
        const materialRecipeCode = parseInt(m.Codigo_Receita);
        return !isNaN(materialRecipeCode) && materialRecipeCode === recipeCodeNumber;
      });
      setActiveMaterial(material);
    } else {
      setActiveMaterial(null);
    }
  }, [allocationData.recipeCode, materials]);
  
  // Filtrar vagas com base na busca
  useEffect(() => {
    if (!selectedRoom) return;
    
    if (searchQuery.trim() === "") {
      setFilteredSpaces(emptySpaces);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = emptySpaces.filter(space => {
      const spaceName = space.name?.toLowerCase() || "";
      const spacePosition = space.position?.toLowerCase() || "";
      
      // Verificar se o query é um padrão de "nome-posição" (ex: A-1)
      if (query.includes('-')) {
        const [vagaNome, vagaPosicao] = query.split('-');
        return (
          spaceName.startsWith(vagaNome) && 
          spacePosition.includes(vagaPosicao)
        );
      }
      
      return (
        spaceName.includes(query) ||
        spacePosition.includes(query)
      );
    });
    
    setFilteredSpaces(filtered);
  }, [searchQuery, emptySpaces, selectedRoom]);

  // Buscar todas as salas de armazenamento
  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("storage_rooms")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      
      // Buscar estatísticas para cada sala
      const roomsWithStats = {};
      for (const room of data || []) {
        const stats = await fetchRoomStats(room.id);
        roomsWithStats[room.id] = stats;
      }
      
      setRoomsStats(roomsWithStats);
      setRooms(data || []);
    } catch (error) {
      console.error("Erro ao carregar salas:", error);
      showFeedback("Erro ao carregar salas de armazenamento", "error");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar estatísticas para uma sala específica
  const fetchRoomStats = async (roomId) => {
    try {
      // Total de vagas na sala
      const { data: totalSpaces, error: totalError } = await supabase
        .from("storage_spaces")
        .select("id")
        .eq("room_id", roomId);
      
      if (totalError) throw totalError;
      
      // Vagas vazias na sala
      const { data: emptySpaces, error: emptyError } = await supabase
        .from("storage_spaces")
        .select("id")
        .eq("room_id", roomId)
        .eq("status", "empty");
      
      if (emptyError) throw emptyError;
      
      return {
        total: totalSpaces?.length || 0,
        empty: emptySpaces?.length || 0,
        percentage: totalSpaces?.length ? (emptySpaces?.length / totalSpaces?.length) * 100 : 0
      };
    } catch (error) {
      console.error(`Erro ao buscar estatísticas para sala ${roomId}:`, error);
      return { total: 0, empty: 0, percentage: 0 };
    }
  };
  
  // Buscar vagas vazias para uma sala específica
  const fetchEmptySpacesByRoom = async (roomId) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("storage_spaces")
        .select("*")
        .eq("room_id", roomId)
        .eq("status", "empty")
        .order("name");
      
      if (error) throw error;
      
      setEmptySpaces(data || []);
      setFilteredSpaces(data || []);
      setSelectedRoom(roomId);
      setSearchQuery("");
    } catch (error) {
      console.error("Erro ao carregar vagas vazias:", error);
      showFeedback("Erro ao carregar vagas vazias", "error");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar materiais do banco de dados
  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("DataBase_ems")
        .select("*");
      
      if (error) throw error;
      
      setMaterials(data || []);
    } catch (error) {
      console.error("Erro ao carregar base de materiais:", error);
    }
  };
  
  // Buscar material específico pelo código da receita
  const findMaterialByRecipeCode = async (recipeCode) => {
    if (!recipeCode) return null;
    
    try {
      // Consulta direta ao banco para encontrar o material exato pelo código da receita
      const { data, error } = await supabase
        .from("DataBase_ems")
        .select("*")
        .eq("Codigo_Receita", recipeCode);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return data[0];
      }
      
      // Tentar com conversão numérica
      const recipeCodeNumber = parseInt(recipeCode);
      if (!isNaN(recipeCodeNumber)) {
        const { data: numericData, error: numericError } = await supabase
          .from("DataBase_ems")
          .select("*")
          .eq("Codigo_Receita", recipeCodeNumber);
        
        if (numericError) throw numericError;
        
        if (numericData && numericData.length > 0) {
          return numericData[0];
        }
      }
      
      return null;
    } catch (error) {
      console.error("Erro ao buscar material por código:", error);
      return null;
    }
  };
  
  // Abrir modal de alocação para uma vaga específica
  const openAllocationModal = (space, data = null) => {
    setSelectedSpace(space);
    
    if (data) {
      // Se temos dados escaneados, pré-preencher o formulário
      setAllocationData({
        op: data.ordem || "",
        recipeCode: data.codigoReceita || "",
        weighingDate: 
          // Converter data no formato DD/MM/YYYY para YYYY-MM-DD (formato esperado pelo input date)
          data.data ? formatDateForInput(data.data) : new Date().toISOString().split('T')[0],
        signature: "",
      });
    } else {
      // Caso contrário, apenas inicializar com a data atual
      setAllocationData({
        op: "",
        recipeCode: "",
        weighingDate: new Date().toISOString().split('T')[0],
        signature: "",
      });
    }
    
    setIsAllocateModalOpen(true);
  };
  
  // Função para formatar data de DD/MM/YYYY para YYYY-MM-DD
  const formatDateForInput = (dateString) => {
    try {
      const parts = dateString.split('/');
      if (parts.length !== 3) return new Date().toISOString().split('T')[0];
      
      let year = parts[2];
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      
      // Se o ano tem apenas 2 dígitos, assumir 20XX
      if (year.length === 2) {
        year = `20${year}`;
      }
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return new Date().toISOString().split('T')[0];
    }
  };
  
  // Validar dados antes de passar para escaneamento
  const handleValidateAndMoveToQrScan = () => {
    const { op, recipeCode, weighingDate, signature } = allocationData;
    
    // Validações básicas
    if (!op || !recipeCode || !weighingDate || !signature) {
      showFeedback("Preencha todos os campos obrigatórios", "error");
      return;
    }

    if (signature.length !== 5) {
      showFeedback("A assinatura deve conter 5 dígitos", "error");
      return;
    }

    // Verificar se o material existe no banco
    findMaterialByRecipeCode(recipeCode).then(material => {
      if (!material) {
        showFeedback("Material não encontrado. Verifique o código da receita.", "error");
        return;
      }
      
      // Todos os dados estão válidos, avançar para escaneamento
      setAllocationStep(2);
      
      // Se já tiver uma vaga selecionada, pular o escaneamento
      if (selectedSpace) {
        // Continuar com a alocação usando a vaga já selecionada
        handleAllocatePallet();
      } else {
        // Abrir scanner de QR code
        setIsQrScannerOpen(true);
      }
    });
  };
  
  // Processar alocação de palete
  const handleAllocatePallet = async () => {
    const { op, recipeCode, weighingDate, signature } = allocationData;
    
    // Validações básicas
    if (!op || !recipeCode || !weighingDate || !signature) {
      showFeedback("Preencha todos os campos obrigatórios", "error");
      return;
    }

    if (signature.length !== 5) {
      showFeedback("A assinatura deve conter 5 dígitos", "error");
      return;
    }

    try {
      // Buscar material direto no banco para garantir que encontramos o correto
      const material = await findMaterialByRecipeCode(recipeCode);
      
      if (!material) {
        showFeedback("Material não encontrado. Verifique o código da receita.", "error");
        return;
      }
      
      // Obter o nome do material pelo campo Ativo da tabela Database_ems
      const materialName = material ? material.Ativo : "Material não encontrado";
      
      // Atualizar a vaga para status ocupado
      const { error: updateError } = await supabase
        .from("storage_spaces")
        .update({
          status: "occupied",
          current_op: op,
          recipe_code: recipeCode,
          material_name: materialName,
          weighing_date: weighingDate,
          last_updated: new Date().toISOString(),
          updated_by: signature,
        })
        .eq("id", selectedSpace.id);
      
      if (updateError) throw updateError;
      
      // Registrar a alocação no log
      const { error: logError } = await supabase
        .from("storage_logs")
        .insert([{
          space_id: selectedSpace.id,
          room_id: selectedSpace.room_id,
          action: "allocated",
          op: op,
          recipe_code: recipeCode,
          material_name: materialName,
          weighing_date: weighingDate,
          user_id: signature,
          timestamp: new Date().toISOString(),
        }]);
      
      if (logError) throw logError;
      
      // Fechar o modal e atualizar a lista de vagas
      setIsAllocateModalOpen(false);
      showFeedback("Palete alocado com sucesso!", "success");
      
      // Atualizar a lista de vagas vazias e estatísticas da sala
      fetchEmptySpacesByRoom(selectedRoom);
      
      // Atualizar as estatísticas de todas as salas
      fetchRooms();
      
    } catch (error) {
      console.error("Erro ao alocar palete:", error);
      showFeedback("Erro ao alocar palete. Tente novamente.", "error");
    }
  };
  
  // Mostrar feedback ao usuário
  const showFeedback = (message, type = "success") => {
    setFeedback({ show: true, message, type });
    setTimeout(() => setFeedback({ show: false, message: "", type: "" }), 5000);
  };
  
  // Voltar para a seleção de salas
  const handleBackToRooms = () => {
    setSelectedRoom(null);
    setEmptySpaces([]);
    setFilteredSpaces([]);
  };
  
  // Abrir scanner para uma vaga específica
  const openScannerForSpace = (space) => {
    setSelectedSpace(space);
    setIsOcrScannerOpen(true);
  };
  
  // Processar resultado do scanner
  const handleOcrResult = (data) => {
    setScannedData(data);
    if (selectedSpace) {
      openAllocationModal(selectedSpace, data);
    }
  };

  // Abrir scanner QR code temporariamente fechando o modal de alocação
  const openQrScanner = () => {
    // Fechar temporariamente o modal de alocação
    setIsAllocateModalOpen(false);
    // Abrir o scanner de QR code
    setIsQrScannerOpen(true);
  };

  // Processar scan de QR code para detectar vaga
  const handleQrCodeResult = async (qrData) => {
    try {
      setIsQrScannerOpen(false);
      
      // Verificar se o QR code contém um link ou um ID direto da vaga
      let spaceId;
      
      // Verificar se é um URL completo (ex: https://exemplo.com/vaga/123)
      if (qrData.includes('/vaga/')) {
        const urlParts = qrData.split('/vaga/');
        spaceId = urlParts[1].split('/')[0]; // Extrai o ID da vaga da URL
      } 
      // Verificar se é apenas o ID da vaga
      else if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(qrData)) {
        spaceId = qrData;
      }
      // Manter o formato antigo como fallback (sala/posição)
      else {
        const qrParts = qrData.split('/');
        if (qrParts.length !== 2) {
          showFeedback("QR code em formato inválido. Deve ser uma URL da vaga ou ID", "error");
          // Reabrir o modal de alocação
          setIsAllocateModalOpen(true);
          return;
        }
        
        const [sala, posicao] = qrParts;
        
        // Buscar a sala pelo nome
        const { data: roomData, error: roomError } = await supabase
          .from("storage_rooms")
          .select("id")
          .ilike("name", sala);
        
        if (roomError) throw roomError;
        
        if (!roomData || roomData.length === 0) {
          showFeedback(`Sala "${sala}" não encontrada`, "error");
          // Reabrir o modal de alocação
          setIsAllocateModalOpen(true);
          return;
        }
        
        const roomId = roomData[0].id;
        
        // Buscar a vaga específica pela sala e posição
        const { data: spaceData, error: spaceError } = await supabase
          .from("storage_spaces")
          .select("*")
          .eq("room_id", roomId)
          .or(`name.ilike.%${posicao}%,position.ilike.%${posicao}%`)
          .eq("status", "empty");
        
        if (spaceError) throw spaceError;
        
        if (!spaceData || spaceData.length === 0) {
          showFeedback(`Vaga "${posicao}" não encontrada ou não está vazia`, "error");
          // Reabrir o modal de alocação
          setIsAllocateModalOpen(true);
          return;
        }
        
        // Selecionar a vaga escaneada
        setSelectedSpace(spaceData[0]);
        showFeedback(`Vaga ${spaceData[0].name} selecionada com sucesso!`, "success");
        
        // Reabrir o modal de alocação com a vaga selecionada
        setIsAllocateModalOpen(true);
        return;
      }
      
      // Se chegou aqui, é porque identificamos o spaceId de um link ou ID direto
      // Buscar a vaga diretamente pelo ID
      const { data: spaceData, error: spaceError } = await supabase
        .from("storage_spaces")
        .select("*")
        .eq("id", spaceId)
        .eq("status", "empty");
      
      if (spaceError) throw spaceError;
      
      if (!spaceData || spaceData.length === 0) {
        showFeedback(`Vaga com ID "${spaceId}" não encontrada ou não está vazia`, "error");
        // Reabrir o modal de alocação
        setIsAllocateModalOpen(true);
        return;
      }
      
      // Selecionar a vaga escaneada
      setSelectedSpace(spaceData[0]);
      showFeedback(`Vaga ${spaceData[0].name} selecionada com sucesso!`, "success");
      
      // Reabrir o modal de alocação com a vaga selecionada
      setIsAllocateModalOpen(true);
      
    } catch (error) {
      console.error("Erro ao processar QR code:", error);
      showFeedback("Erro ao processar QR code", "error");
      
      // Reabrir o modal de alocação mesmo em caso de erro
      setIsAllocateModalOpen(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      {/* Feedback ao usuário */}
      {feedback.show && (
        <div className={`p-4 mb-4 rounded-lg ${
          feedback.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {feedback.message}
        </div>
      )}
      
      {/* Barra de navegação fixa no rodapé */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-20 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-center">
          <Button
            color="success"
            className="p-3 rounded-none w-full flex items-center justify-center"
            onClick={() => openAllocationModal(null)}
          >
            <HiPlus className="mr-2 h-5 w-5" />
            Alocar
          </Button>
        </div>
      </div>
      
      {/* Scanner OCR (só aparece quando ativado) */}
      {isOcrScannerOpen && (
        <MobileOcrScanner 
          onResult={handleOcrResult} 
          onClose={() => setIsOcrScannerOpen(false)} 
        />
      )}
      
      {isQrScannerOpen && (
        <QrCodeScanner
          onResult={handleQrCodeResult}
          onClose={() => setIsQrScannerOpen(false)}
        />
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner size="xl" />
        </div>
      ) : !selectedRoom ? (
        // Tela de seleção de sala
        <>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Selecione uma Sala
          </h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => {
              const stats = roomsStats[room.id] || { total: 0, empty: 0, percentage: 0 };
              return (
                <Card 
                  key={room.id} 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => fetchEmptySpacesByRoom(room.id)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {room.name}
                    </h3>
                    <HiChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="flex justify-between pt-2">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Vagas vazias: </span>
                      <span className="font-medium text-gray-900 dark:text-white">{stats.empty} de {stats.total}</span>
                    </div>
                    
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      stats.empty === 0 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {stats.empty === 0 
                        ? 'Sem vagas' 
                        : `${Math.round(stats.percentage)}% livre`}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        // Tela de vagas vazias de uma sala específica
        <>
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <div className="flex items-center mb-4 md:mb-0">
              <Button 
                color="light" 
                size="sm" 
                onClick={handleBackToRooms}
                className="mr-2"
              >
                <HiX className="mr-1 h-4 w-4" />
                Voltar
              </Button>
              
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {rooms.find(r => r.id === selectedRoom)?.name || "Sala Selecionada"}
              </h1>
            </div>
            
            <div className="flex gap-2">
              <Button color="light" onClick={() => fetchEmptySpacesByRoom(selectedRoom)}>
                <HiOutlineRefresh className="mr-2 h-5 w-5" />
                Atualizar
              </Button>
              
              <Button 
                color="info" 
                onClick={() => setIsOcrScannerOpen(true)}
                className="text-white"
              >
                <HiCamera className="mr-2 h-5 w-5" />
                Escanear Etiqueta
              </Button>
            </div>
          </div>
          
          {/* Barra de busca otimizada para mobile */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <HiSearch className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <TextInput
              type="text"
              className="pl-10"
              placeholder="Buscar vaga por nome ou posição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Contador de vagas */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {filteredSpaces.length} {filteredSpaces.length === 1 ? 'vaga vazia encontrada' : 'vagas vazias encontradas'}
            </p>
          </div>
          
          {/* Lista de vagas vazias */}
          {filteredSpaces.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery.trim() 
                  ? 'Nenhuma vaga vazia encontrada com os critérios de busca' 
                  : 'Não há vagas vazias disponíveis nesta sala'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSpaces.map(space => (
                <div 
                  key={space.id} 
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {space.name || "—"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Posição: {space.position || "—"}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => openAllocationModal(space)}
                    >
                      <HiPlus className="mr-2 h-5 w-5" />
                      Alocar Palete
                    </Button>
                    
                    <Button
                      color="info"
                      className="text-white"
                      onClick={() => openScannerForSpace(space)}
                    >
                      <HiCamera className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Modal de alocação */}
      <Modal show={isAllocateModalOpen} onClose={() => {
        setIsAllocateModalOpen(false);
        setAllocationStep(1); // Reset para a primeira etapa ao fechar
      }}>
        <Modal.Header>
          {allocationStep === 1 
            ? "Preencha os Dados do Material" 
            : selectedSpace 
              ? `Vaga Selecionada: ${selectedSpace.name}` 
              : "Escaneie o QR Code da Vaga"}
        </Modal.Header>
        <Modal.Body>
          {allocationStep === 1 ? (
            // Etapa 1: Preenchimento dos dados do material
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Preencha os detalhes do material para alocação. Após confirmar, você poderá escanear o QR code da vaga.
              </p>
            
              {scannedData && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg mb-4">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 flex justify-between items-center">
                    <span>Dados lidos da etiqueta</span>
                    <Button 
                      size="xs" 
                      color="light" 
                      onClick={() => setScannedData(null)}
                    >
                      <HiX className="h-4 w-4" />
                    </Button>
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="op" value="Ordem de Produção (OP)" className="mb-1 text-gray-700 dark:text-gray-300" />
                <TextInput
                  id="op"
                  placeholder="Ex: 2284465"
                  value={allocationData.op}
                  onChange={(e) => setAllocationData({...allocationData, op: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="recipe-code" value="Código da Receita" className="mb-1 text-gray-700 dark:text-gray-300" />
                <TextInput
                  id="recipe-code"
                  placeholder="Ex: 123456"
                  value={allocationData.recipeCode}
                  onChange={(e) => setAllocationData({...allocationData, recipeCode: e.target.value})}
                />
              </div>
              
              {activeMaterial && (
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Material: {activeMaterial.Ativo || "Material não encontrado"}
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="weighing-date" value="Data da Pesagem" className="mb-1 text-gray-700 dark:text-gray-300" />
                <TextInput
                  id="weighing-date"
                  type="date"
                  value={allocationData.weighingDate}
                  onChange={(e) => setAllocationData({...allocationData, weighingDate: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="signature" value="Assinatura (ID de 5 dígitos)" className="mb-1 text-gray-700 dark:text-gray-300" />
                <TextInput
                  id="signature"
                  placeholder="Ex: 12345"
                  maxLength={5}
                  value={allocationData.signature}
                  onChange={(e) => setAllocationData({...allocationData, signature: e.target.value})}
                />
              </div>
            </div>
          ) : (
            // Etapa 2: Seleção/confirmação da vaga
            <div className="space-y-4">
              {selectedSpace ? (
                // Mostrar detalhes da vaga selecionada via QR code
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                      Vaga selecionada com sucesso!
                    </h3>
                    <Button 
                      size="xs" 
                      color="light" 
                      onClick={() => setSelectedSpace(null)}
                    >
                      <HiX className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm mb-2 text-green-800 dark:text-green-200">
                    <span className="font-medium">Nome:</span> {selectedSpace.name}
                  </p>
                  <p className="text-sm mb-2 text-green-800 dark:text-green-200">
                    <span className="font-medium">Sala:</span> {rooms.find(r => r.id === selectedSpace.room_id)?.name || ''}
                  </p>
                  <p className="text-sm mb-2 text-green-800 dark:text-green-200">
                    <span className="font-medium">Posição:</span> {selectedSpace.position || ''}
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Clique em "Confirmar Alocação" para concluir o processo.
                  </p>
                </div>
              ) : (
                // Instruções para escanear QR code
                <div className="text-center p-4">
                  <div className="mb-4">
                    <HiQrcode className="mx-auto h-16 w-16 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
                    Escaneie o QR Code da Vaga
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Use o botão abaixo para abrir a câmera e escanear o QR code da vaga onde deseja alocar o material.
                  </p>
                  <Button
                    onClick={openQrScanner}
                    color="info"
                    className="text-white"
                  >
                    <HiQrcode className="mr-2 h-5 w-5" />
                    Escanear QR Code
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {allocationStep === 1 ? (
            // Botões para a etapa 1
            <>
              <Button 
                onClick={handleValidateAndMoveToQrScan} 
                color="success"
              >
                Próximo Passo
              </Button>
              <Button 
                color="gray" 
                onClick={() => {
                  setIsAllocateModalOpen(false);
                  setAllocationStep(1);
                }}
              >
                Cancelar
              </Button>
            </>
          ) : (
            // Botões para a etapa 2
            <>
              {selectedSpace ? (
                // Se já tiver selecionado uma vaga, mostrar botão de confirmar
                <Button 
                  onClick={handleAllocatePallet} 
                  color="success"
                >
                  Confirmar Alocação
                </Button>
              ) : (
                // Caso contrário, botão para abrir scanner
                <Button
                  onClick={openQrScanner}
                  color="info"
                  className="text-white"
                >
                  <HiQrcode className="mr-2 h-5 w-5" />
                  Escanear QR Code
                </Button>
              )}
              <Button 
                color="light" 
                onClick={() => setAllocationStep(1)}
              >
                Voltar
              </Button>
              <Button 
                color="gray" 
                onClick={() => {
                  setIsAllocateModalOpen(false);
                  setAllocationStep(1);
                }}
              >
                Cancelar
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}