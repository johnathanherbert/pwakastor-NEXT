"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { Button, Modal, Label, TextInput, Table, Tabs, Select, Spinner, Badge } from "flowbite-react";
import { 
  HiPlus, 
  HiSearch, 
  HiTrash, 
  HiPencil, 
  HiSave, 
  HiX,
  HiMenu,
  HiFilter,
  HiOutlineRefresh,
  HiOutlineDocumentReport,
  HiCalendar,
  HiArrowDown,
  HiArrowUp,
  HiAdjustments
} from "react-icons/hi";
import { Toast } from "@/components/Toast/Toast";
import ToastContainer, { showToast } from "@/components/Toast/ToastContainer";
import { StorageStats } from "@/components/PaleteSystem/StorageStats";
import Sidebar from "@/components/Sidebar";
import HeaderClock from "@/components/Clock/HeaderClock";
import { useTheme } from "@/contexts/ThemeContext";
import TableFilter from "@/components/TableFilter";
import SortableHeader from "@/components/SortableHeader";

// Definição das opções de filtro
const filterOptions = [
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    defaultValue: 'all',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'empty', label: 'Vazios' },
      { value: 'occupied', label: 'Ocupados' }
    ]
  },
  {
    id: 'spaceName',
    label: 'Nome da Vaga',
    type: 'text',
    defaultValue: '',
    placeholder: 'Ex: A ou A-1'
  },
  {
    id: 'searchText',
    label: 'Buscar',
    type: 'text',
    defaultValue: '',
    placeholder: 'Nome, posição, OP ou material...'
  },
  {
    id: 'startDate',
    label: 'Data Inicial',
    type: 'date',
    defaultValue: ''
  },
  {
    id: 'endDate',
    label: 'Data Final',
    type: 'date',
    defaultValue: ''
  },
  {
    id: 'materialType',
    label: 'Tipo de Material',
    type: 'select',
    defaultValue: 'all',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'materia_prima', label: 'Matéria-prima' },
      { value: 'produto_acabado', label: 'Produto Acabado' }
    ]
  }
];

export default function GestaoPage() {
  // State for rooms
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  
  // State for spaces
  const [spaces, setSpaces] = useState([]);
  const [filteredSpaces, setFilteredSpaces] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isAddingSpace, setIsAddingSpace] = useState(false);
  const [newSpace, setNewSpace] = useState({ name: "", position: "" });
  
  // Estados para autenticação de adição de salas e vagas
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState(""); // "room" ou "space"
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedSpaces, setPaginatedSpaces] = useState([]);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: "all", // empty, occupied, all
    searchText: "",
    dateRange: { start: "", end: "" },
    materialType: "all"
  });
  
  // Estados para ordenação
  const [sortConfig, setSortConfig] = useState({
    key: "position", 
    direction: "asc"
  });
  const [occupiedSortConfig, setSortOccupiedConfig] = useState({
    key: "weighing_date", 
    direction: "desc"
  });
  const [logSortConfig, setLogSortConfig] = useState({
    key: "timestamp", 
    direction: "desc"
  });
  
  // Filtros avançados
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Paletes ocupados (para mostrar holding time global)
  const [occupiedPallets, setOccupiedPallets] = useState([]);
  
  // State for pallet allocation
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [allocationData, setAllocationData] = useState({
    op: "",
    recipeCode: "",
    weighingDate: "",
    signature: "",
  });
  
  // State for searching
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Remove allocation dialog
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removalSignature, setRemovalSignature] = useState("");
  
  // Materials data
  const [materials, setMaterials] = useState([]);
  const [activeMaterial, setActiveMaterial] = useState(null);

  // Toast notification
  const [toast, setToast] = useState({ visible: false, message: "", type: "" });

  // Statistics data
  const [roomStats, setRoomStats] = useState([]);
  const [topMaterials, setTopMaterials] = useState([]);
  const [expiredPallets, setExpiredPallets] = useState([]);
  const [allSpaces, setAllSpaces] = useState([]);
  
  // Estado para controlar a sidebar
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Estados para logs e movimentações
  const [storageLogs, setStorageLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logFilters, setLogFilters] = useState({
    actionType: "all",
    startDate: "",
    endDate: "",
    op: "",
    userId: "",
    roomId: "all"
  });
  
  // Usando o hook useTheme para acessar o dark mode global
  const { darkMode, toggleDarkMode } = useTheme();

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "" }), 3000);
  };

  // Fetch storage logs from Supabase
  const fetchStorageLogs = async () => {
    setIsLoadingLogs(true);
    
    try {
      let query = supabase
        .from("storage_logs")
        .select("*, storage_rooms(name), storage_spaces(name, position)")
        .order("timestamp", { ascending: false });
      
      // Apply filters
      if (logFilters.actionType !== "all") {
        query = query.eq("action", logFilters.actionType);
      }
      
      if (logFilters.startDate) {
        query = query.gte("timestamp", `${logFilters.startDate}T00:00:00`);
      }
      
      if (logFilters.endDate) {
        query = query.lte("timestamp", `${logFilters.endDate}T23:59:59`);
      }
      
      if (logFilters.op) {
        query = query.ilike("op", `%${logFilters.op}%`);
      }
      
      if (logFilters.userId) {
        query = query.eq("user_id", logFilters.userId);
      }
      
      if (logFilters.roomId !== "all") {
        query = query.eq("room_id", logFilters.roomId);
      }
      
      // Limitar a 100 resultados para evitar sobrecarga
      query = query.limit(100);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setStorageLogs(data || []);
    } catch (error) {
      console.error("Error fetching storage logs:", error);
      showToast("Não foi possível carregar os logs de movimentação.", "error");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Resetar filtros de logs
  const resetLogFilters = () => {
    setLogFilters({
      actionType: "all",
      startDate: "",
      endDate: "",
      op: "",
      userId: "",
      roomId: "all"
    });
  };

  // Load dark mode from localStorage on component mount
  useEffect(() => {
    fetchRooms();
    fetchMaterials();
    fetchAllSpaces();
    fetchOccupiedPallets();
    fetchStorageLogs(); // Carregar logs iniciais
  }, []);

  // Fetch all storage spaces for statistics
  const fetchAllSpaces = async () => {
    try {
      const { data, error } = await supabase
        .from("storage_spaces")
        .select("*, storage_rooms(name)")
        .order("position", { ascending: true });
      
      if (error) throw error;
      setAllSpaces(data || []);
      
      // Calcular estatísticas após carregar os espaços
      calculateStats(data || [], rooms);
    } catch (error) {
      console.error("Error fetching all spaces:", error);
    }
  };

  // Fetch all occupied pallets for global view
  const fetchOccupiedPallets = async () => {
    try {
      const { data, error } = await supabase
        .from("storage_spaces")
        .select("*, storage_rooms(name)")
        .eq("status", "occupied")
        .order("weighing_date", { ascending: true });
      
      if (error) throw error;
      setOccupiedPallets(data || []);
    } catch (error) {
      console.error("Error fetching occupied pallets:", error);
      showToast("Não foi possível carregar os paletes ocupados.", "error");
    }
  };

  // Calculate statistics from spaces data
  const calculateStats = (spaces, rooms) => {
    if (!spaces.length || !rooms.length) return;

    // Room statistics
    const stats = rooms.map(room => {
      const roomSpaces = spaces.filter(space => space.room_id === room.id);
      const occupiedSpaces = roomSpaces.filter(space => space.status === 'occupied');
      
      return {
        id: room.id,
        name: room.name,
        total: roomSpaces.length,
        occupied: occupiedSpaces.length,
        percentage: roomSpaces.length ? (occupiedSpaces.length / roomSpaces.length) * 100 : 0
      };
    });
    setRoomStats(stats);

    // Top materials
    const materialsCount = {};
    spaces.forEach(space => {
      if (space.status === 'occupied' && space.recipe_code && space.material_name) {
        const key = `${space.recipe_code}`;
        if (!materialsCount[key]) {
          materialsCount[key] = {
            code: space.recipe_code,
            name: space.material_name,
            count: 0
          };
        }
        materialsCount[key].count += 1;
      }
    });

    const sortedMaterials = Object.values(materialsCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 materials
    
    setTopMaterials(sortedMaterials);

    // Expired pallets (holding time > 20 days)
    const currentDate = new Date();
    const MAX_DAYS = 20; // Dias máximos permitidos
    
    const expired = spaces
      .filter(space => {
        if (space.status !== 'occupied' || !space.weighing_date) return false;
        
        const weighingDate = new Date(space.weighing_date);
        const daysSince = Math.floor((currentDate - weighingDate) / (1000 * 60 * 60 * 24));
        return daysSince > MAX_DAYS;
      })
      .map(space => {
        const weighingDate = new Date(space.weighing_date);
        const daysSince = Math.floor((currentDate - weighingDate) / (1000 * 60 * 60 * 24));
        
        return {
          id: space.id,
          name: space.name,
          roomName: space.storage_rooms?.name || 'Desconhecido',
          current_op: space.current_op,
          material_name: space.material_name,
          days: daysSince
        };
      });
    
    setExpiredPallets(expired);
  };

  // Fetch storage rooms from Supabase
  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("storage_rooms")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      setRooms(data || []);
      
      // Re-calculate statistics whenever rooms change
      if (allSpaces.length) {
        calculateStats(allSpaces, data || []);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      showToast("Não foi possível carregar as salas de armazenamento.", "error");
    }
  };

  // Fetch materials database for recipe lookup with improved query
  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("DataBase_ems")
        .select("*");
      
      if (error) throw error;
      console.log("Materiais carregados:", data?.length || 0);
      setMaterials(data || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
      showToast("Erro ao carregar base de materiais", "error");
    }
  };

  // Fetch spaces for a selected room
  const fetchSpaces = async (roomId) => {
    try {
      const { data, error } = await supabase
        .from("storage_spaces")
        .select("*")
        .eq("room_id", roomId)
        .order("position", { ascending: true });
      
      if (error) throw error;
      setSpaces(data || []);
      setSelectedRoom(roomId);
      
      // Refresh all spaces for statistics whenever we fetch spaces
      fetchAllSpaces();
    } catch (error) {
      console.error("Error fetching spaces:", error);
      showToast("Não foi possível carregar as vagas de armazenamento.", "error");
    }
  };

  // Add a new storage room
  const addRoom = async () => {
    if (!newRoom.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from("storage_rooms")
        .insert([{ name: newRoom.trim() }])
        .select();
      
      if (error) throw error;
      
      const updatedRooms = [...rooms, data[0]];
      setRooms(updatedRooms);
      setNewRoom("");
      setIsAddingRoom(false);
      
      // Refresh statistics
      calculateStats(allSpaces, updatedRooms);
      
      showToast("Sala de armazenamento adicionada com sucesso.");
    } catch (error) {
      console.error("Error adding room:", error);
      showToast("Não foi possível adicionar a sala de armazenamento.", "error");
    }
  };

  // Add a new storage space
  const addSpace = async () => {
    if (!newSpace.name.trim() || !newSpace.position.trim() || !selectedRoom) return;
    
    try {
      const { data, error } = await supabase
        .from("storage_spaces")
        .insert([{
          name: newSpace.name.trim(),
          position: newSpace.position.trim(),
          room_id: selectedRoom,
          status: "empty",
        }])
        .select();
      
      if (error) throw error;
      
      const updatedSpaces = [...spaces, data[0]];
      setSpaces(updatedSpaces);
      setNewSpace({ name: "", position: "" });
      setIsAddingSpace(false);
      
      // Refresh all spaces for statistics
      fetchAllSpaces();
      
      showToast("Vaga de armazenamento adicionada com sucesso.");
    } catch (error) {
      console.error("Error adding space:", error);
      showToast("Não foi possível adicionar a vaga de armazenamento.", "error");
    }
  };

  // Handle pallet allocation
  const allocatePallet = async () => {
    const { op, recipeCode, weighingDate, signature } = allocationData;
    
    if (!op || !recipeCode || !weighingDate || !signature || !selectedSpace) {
      showToast("Preencha todos os campos obrigatórios.", "error");
      return;
    }

    if (signature.length !== 5) {
      showToast("A assinatura deve conter 5 dígitos.", "error");
      return;
    }

    // Buscar material direto no banco para garantir que encontramos o correto
    const material = await findMaterialByRecipeCode(recipeCode);
    
    // Obter o nome do material pelo campo Ativo da tabela Database_ems
    const materialName = material ? material.Ativo : "Material não encontrado";
    console.log("Material encontrado para alocação:", material, "Nome:", materialName);

    try {
      // Update the space status
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
      
      // Log the allocation
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
      
      // Refresh spaces list and statistics
      fetchSpaces(selectedRoom);
      setAllocateDialogOpen(false);
      setAllocationData({ op: "", recipeCode: "", weighingDate: "", signature: "" });
      
      showToast("Palete alocado com sucesso.");
    } catch (error) {
      console.error("Error allocating pallet:", error);
      showToast("Não foi possível alocar o palete.", "error");
    }
  };

  // Handle pallet removal
  const removePallet = async () => {
    if (!removalSignature || removalSignature.length !== 5) {
      showToast("A assinatura deve conter 5 dígitos.", "error");
      return;
    }

    try {
      // Log the removal
      const { error: logError } = await supabase
        .from("storage_logs")
        .insert([{
          space_id: selectedSpace.id,
          room_id: selectedSpace.room_id,
          action: "removed",
          op: selectedSpace.current_op,
          recipe_code: selectedSpace.recipe_code,
          material_name: selectedSpace.material_name,
          user_id: removalSignature,
          timestamp: new Date().toISOString(),
        }]);
      
      if (logError) throw logError;
      
      // Update the space status
      const { error: updateError } = await supabase
        .from("storage_spaces")
        .update({
          status: "empty",
          current_op: null,
          recipe_code: null,
          material_name: null,
          weighing_date: null,
          last_updated: new Date().toISOString(),
          updated_by: removalSignature,
        })
        .eq("id", selectedSpace.id);
      
      if (updateError) throw updateError;
      
      // Refresh spaces list and statistics
      fetchSpaces(selectedRoom);
      setRemoveDialogOpen(false);
      setRemovalSignature("");
      
      showToast("Palete removido com sucesso.");
    } catch (error) {
      console.error("Error removing pallet:", error);
      showToast("Não foi possível remover o palete.", "error");
    }
  };

  // Search for pallets by OP or material name
  const searchPallets = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Search by OP
      let { data: opResults, error: opError } = await supabase
        .from("storage_spaces")
        .select("*, storage_rooms(name)")
        .ilike("current_op", `%${searchQuery}%`)
        .eq("status", "occupied");
      
      if (opError) throw opError;
      
      // Search by material name
      let { data: materialResults, error: materialError } = await supabase
        .from("storage_spaces")
        .select("*, storage_rooms(name)")
        .ilike("material_name", `%${searchQuery}%`)
        .eq("status", "occupied");
      
      if (materialError) throw materialError;
      
      // Combine results and remove duplicates
      const combinedResults = [...(opResults || []), ...(materialResults || [])];
      const uniqueResults = combinedResults.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );
      
      setSearchResults(uniqueResults);
    } catch (error) {
      console.error("Error searching pallets:", error);
      showToast("Ocorreu um erro durante a busca.", "error");
    } finally {
      setIsSearching(false);
    }
  };

  // Effects
  useEffect(() => {
    if (allocationData.recipeCode) {
      // Aplicando a mesma correção para garantir comparação correta de tipos
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

  // Effect para aplicar filtros sempre que espaços ou filtros mudarem
  useEffect(() => {
    if (!spaces.length) {
      setFilteredSpaces([]);
      setPaginatedSpaces([]);
      setCurrentPage(1);
      return;
    }
    
    let filtered = [...spaces];
    
    // Filtrar por status
    if (filters.status !== "all") {
      filtered = filtered.filter(space => space.status === filters.status);
    }
    
    // Filtrar por nome de vaga (nova funcionalidade)
    if (filters.spaceName) {
      const nameQuery = filters.spaceName.toLowerCase().trim();
      
      // Verificar se é um padrão de "nome-posição" (ex: A-1)
      if (nameQuery.includes('-')) {
        const [vagaNome, vagaPosicao] = nameQuery.split('-');
        filtered = filtered.filter(space => 
          space.name && 
          space.name.toLowerCase() === vagaNome.toLowerCase() && 
          space.position && 
          space.position.toLowerCase().includes(vagaPosicao.toLowerCase())
        );
      } 
      // Caso contrário, buscar todas as vagas que começam com o nome especificado
      else {
        filtered = filtered.filter(space => 
          space.name && 
          space.name.toLowerCase().startsWith(nameQuery)
        );
      }
    }
    
    // Filtrar por texto de busca geral
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        space => 
          (space.name && space.name.toLowerCase().includes(searchLower)) ||
          (space.position && space.position.toLowerCase().includes(searchLower)) ||
          (space.current_op && space.current_op.toLowerCase().includes(searchLower)) ||
          (space.material_name && space.material_name.toLowerCase().includes(searchLower))
      );
    }
    
    // Aplicar ordenação usando a função genérica
    filtered = applySorting(filtered, sortConfig);
    
    setFilteredSpaces(filtered);
    
    // Resetar para a primeira página quando os filtros ou ordenação mudam
    setCurrentPage(1);
    
    // Aplicar paginação
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedSpaces(filtered.slice(startIndex, endIndex));
    
  }, [spaces, filters, sortConfig, itemsPerPage]); // Adicionar sortConfig como dependência
  
  // Effect para aplicar paginação quando a página atual muda
  useEffect(() => {
    if (filteredSpaces.length > 0) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setPaginatedSpaces(filteredSpaces.slice(startIndex, endIndex));
    }
  }, [currentPage, filteredSpaces, itemsPerPage]);

  // Calcular holding time para um espaço
  const calculateHoldingTime = (space) => {
    if (space.status !== 'occupied' || !space.weighing_date) return null;
    
    const currentDate = new Date();
    const weighingDate = new Date(space.weighing_date);
    const daysSince = Math.floor((currentDate - weighingDate) / (1000 * 60 * 60 * 24));
    
    return {
      days: daysSince,
      isExpired: daysSince > 20,
    };
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
        console.log(`Material encontrado para código ${recipeCode}:`, data[0]);
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
          console.log(`Material encontrado para código numérico ${recipeCodeNumber}:`, numericData[0]);
          return numericData[0];
        }
      }
      
      console.log(`Nenhum material encontrado para código ${recipeCode}`);
      return null;
    } catch (error) {
      console.error("Erro ao buscar material por código:", error);
      return null;
    }
  };

  // Handle password verification for creating rooms or spaces
  const handlePasswordVerification = (action) => {
    setPasswordAction(action);
    setPassword("");
    setPasswordError("");
    setPasswordDialogOpen(true);
  };
  
  // Verify password and trigger the appropriate action
  const verifyPassword = () => {
    const correctPassword = "@06291"; // Senha padrão conforme solicitado
    
    if (password === correctPassword) {
      setPasswordDialogOpen(false);
      setPasswordError("");
      
      // Trigger the correct action based on passwordAction
      if (passwordAction === "room") {
        setIsAddingRoom(true);
      } else if (passwordAction === "space") {
        setIsAddingSpace(true);
      }
    } else {
      setPasswordError("Senha incorreta. Tente novamente.");
    }
  };

  // Function to handle sorting for main spaces table
  const handleSort = (key) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSortConfig({
        key,
        direction: 'asc'
      });
    }
  };

  // Function to handle sorting for occupied pallets
  const handleOccupiedSort = (key) => {
    if (occupiedSortConfig.key === key) {
      setSortOccupiedConfig({
        key,
        direction: occupiedSortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSortOccupiedConfig({
        key,
        direction: 'asc'
      });
    }
  };

  // Function to handle sorting for logs table
  const handleLogSort = (key) => {
    if (logSortConfig.key === key) {
      setLogSortConfig({
        key,
        direction: logSortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setLogSortConfig({
        key,
        direction: 'asc'
      });
    }
  };

  // Function to apply sorting to arrays of data
  const applySorting = (data, sortConfig) => {
    const sortableData = [...data];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        // Handle numerical values
        if (typeof a[sortConfig.key] === 'number' && typeof b[sortConfig.key] === 'number') {
          return sortConfig.direction === 'asc' 
            ? a[sortConfig.key] - b[sortConfig.key]
            : b[sortConfig.key] - a[sortConfig.key];
        }
        
        // Handle date values
        if (a[sortConfig.key] && b[sortConfig.key] && 
            !isNaN(new Date(a[sortConfig.key])) && !isNaN(new Date(b[sortConfig.key]))) {
          const dateA = new Date(a[sortConfig.key]);
          const dateB = new Date(b[sortConfig.key]);
          return sortConfig.direction === 'asc' 
            ? dateA - dateB 
            : dateB - dateA;
        }
        
        // Handle string values (case insensitive)
        if (a[sortConfig.key] && b[sortConfig.key]) {
          return sortConfig.direction === 'asc'
            ? a[sortConfig.key].toString().localeCompare(b[sortConfig.key].toString())
            : b[sortConfig.key].toString().localeCompare(a[sortConfig.key].toString());
        }
        
        // Handle null/undefined values (null values go last)
        if (a[sortConfig.key] === null || a[sortConfig.key] === undefined) return 1;
        if (b[sortConfig.key] === null || b[sortConfig.key] === undefined) return -1;
        
        return 0;
      });
    }
    return sortableData;
  };

  // Render component
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      {/* Add ToastContainer to the top level */}
      <ToastContainer />
      
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header com topbar unificada */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <HiMenu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Gestão de Armazenamento</h1>
            </div>
            
            <div className="flex items-center">
              <HeaderClock />
              
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                title={darkMode ? "Modo claro" : "Modo escuro"}
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
          
          {/* Painel de Estatísticas */}
          <StorageStats 
            roomStats={roomStats}
            topMaterials={topMaterials}
            expiredPallets={expiredPallets}
          />
          
          <Tabs theme={{
            base: "flex flex-col gap-2",
            tablist: {
              base: "flex text-center border-b border-gray-200 dark:border-gray-700",
              tabitem: {
                base: "flex items-center justify-center p-4 text-sm font-medium first:ml-0 disabled:cursor-not-allowed disabled:text-gray-400 disabled:dark:text-gray-500 focus:outline-none",
                styles: {
                  default: {
                    base: "rounded-t-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300",
                    active: {
                      on: "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-500 rounded-t-lg border-b-2 border-blue-600 dark:border-blue-500 active",
                      off: "border-b-2 border-transparent"
                    }
                  }
                }
              }
            },
            tabpanel: "py-3"
          }}>
            <Tabs.Item active title="Salas e Vagas">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Rooms Section */}
                <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Salas de Armazenamento</h2>
                    <Button
                    className="font-bold text-black dark:text-white" 
                      size="sm" 
                      onClick={() => handlePasswordVerification("room")}
                      disabled={isAddingRoom}
                    >
                      <HiPlus className="mr-1 h-4 w-4 font-bold text-black dark:text-white" /> Adicionar
                    </Button>
                  </div>
                  
                  {isAddingRoom && (
                    <div className="flex items-center mb-4 space-x-2">
                      <TextInput
                        placeholder="Nome da sala"
                        value={newRoom}
                        onChange={(e) => setNewRoom(e.target.value)}
                        className="flex-grow"
                        theme={{
                          field: {
                            input: {
                              base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                            }
                          }
                        }}
                      />
                      <Button size="sm" onClick={addRoom} color="green">
                        <HiSave className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        color="light" 
                        onClick={() => {
                          setIsAddingRoom(false);
                          setNewRoom("");
                        }}
                      >
                        <HiX className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {rooms.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        Nenhuma sala cadastrada
                      </p>
                    ) : (
                      rooms.map((room) => (
                        <Button
                          key={room.id}
                          color={selectedRoom === room.id ? "blue" : "light"}
                          className="w-full justify-start"
                          onClick={() => fetchSpaces(room.id)}
                        >
                          {room.name}
                        </Button>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Spaces Section */}
                <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-4">
                  {!selectedRoom ? (
                    <>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-md p-3 mb-4">
                        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          Selecione uma sala ao lado para gerenciar suas vagas específicas
                        </p>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
                        Visão Geral de Todos os Paletes Ocupados
                      </h3>
                      
                      {occupiedPallets.length === 0 ? (
                        <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                          Não há paletes ocupados no momento
                        </p>
                      ) : (
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
                              <Table.HeadCell className="w-16">Sala</Table.HeadCell>
                              <Table.HeadCell className="w-16">Vaga</Table.HeadCell>
                              <Table.HeadCell className="w-24">Posição</Table.HeadCell>
                              <Table.HeadCell className="w-20">OP</Table.HeadCell>
                              <Table.HeadCell>Material</Table.HeadCell>
                              <Table.HeadCell className="w-24">Holding</Table.HeadCell>
                              <Table.HeadCell className="w-16">Ações</Table.HeadCell>
                            </Table.Head>
                            <Table.Body className="divide-y divide-gray-200 dark:divide-gray-700">
                              {occupiedPallets.map((pallet) => {
                                const holdingTime = calculateHoldingTime(pallet);
                                return (
                                  <Table.Row 
                                    key={pallet.id} 
                                    className={`bg-white dark:bg-gray-800 dark:border-gray-700 ${
                                      holdingTime?.isExpired ? 'bg-red-50 dark:bg-red-900/10' : ''
                                    }`}
                                  >
                                    <Table.Cell className="text-xs">{pallet.storage_rooms?.name || '-'}</Table.Cell>
                                    <Table.Cell className="text-xs">{pallet.name}</Table.Cell>
                                    <Table.Cell className="text-xs">{pallet.position}</Table.Cell>
                                    <Table.Cell className="text-xs">{pallet.current_op}</Table.Cell>
                                    <Table.Cell className="text-xs truncate max-w-[150px]" title={pallet.material_name}>
                                      {pallet.material_name}
                                    </Table.Cell>
                                    <Table.Cell className="text-xs">
                                      {holdingTime ? (
                                        <span className={`${
                                          holdingTime.isExpired 
                                            ? 'text-red-600 dark:text-red-400 font-semibold' 
                                            : 'text-gray-600 dark:text-gray-400'
                                        }`}>
                                          {holdingTime.days} dias
                                          {holdingTime.isExpired && (
                                            <span className="ml-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs px-1 py-0.5 rounded">
                                              Exp
                                            </span>
                                          )}
                                        </span>
                                      ) : '-'}
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Button 
                                        size="xs"
                                        color="failure"
                                        className="py-1 px-2 text-xs"
                                        onClick={() => {
                                          setSelectedSpace(pallet);
                                          setRemoveDialogOpen(true);
                                        }}
                                      >
                                        Remover
                                      </Button>
                                    </Table.Cell>
                                  </Table.Row>
                                );
                              })}
                            </Table.Body>
                          </Table>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                          {selectedRoom 
                            ? `Vagas - ${rooms.find(r => r.id === selectedRoom)?.name}`
                            : "Vagas de Armazenamento"}
                        </h2>
                        {selectedRoom && (
                          <Button
                            className="font-bold text-black dark:text-white" 
                            size="sm" 
                            onClick={() => handlePasswordVerification("space")}
                            disabled={isAddingSpace}
                          >
                            <HiPlus className="mr-1 h-4 w-4 font-bold text-black dark:text-white" /> Adicionar Vaga
                          </Button>
                        )}
                      </div>
                      
                      {isAddingSpace && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <Label htmlFor="space-name" value="Nome da Vaga" className="text-gray-700 dark:text-gray-300" />
                            <TextInput
                              id="space-name"
                              placeholder="Ex: A1, B2, etc."
                              value={newSpace.name}
                              onChange={(e) => setNewSpace({...newSpace, name: e.target.value})}
                              theme={{
                                field: {
                                  input: {
                                    base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                                  }
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor="space-position" value="Posição" className="text-gray-700 dark:text-gray-300" />
                            <TextInput
                              id="space-position"
                              placeholder="Ex: Corredor 1, Prateleira 2"
                              value={newSpace.position}
                              onChange={(e) => setNewSpace({...newSpace, position: e.target.value})}
                              theme={{
                                field: {
                                  input: {
                                    base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                                  }
                                }
                              }}
                            />
                          </div>
                          <div className="col-span-2 flex justify-end space-x-2">
                            <Button size="sm" onClick={addSpace} color="success">
                              Salvar
                            </Button>
                            <Button 
                              size="sm" 
                              color="light" 
                              onClick={() => {
                                setIsAddingSpace(false);
                                setNewSpace({ name: "", position: "" });
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Barra de filtros - Removido título duplicado */}
                      <div className="mb-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {filteredSpaces.length} vagas encontradas
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <TableFilter 
                            filters={filters}
                            setFilters={setFilters}
                            filterOptions={filterOptions}
                            onApplyFilters={() => {
                              console.log("Filtros aplicados:", filters);
                            }}
                            onResetFilters={() => {
                              console.log("Filtros resetados");
                              setFilters({
                                status: "all",
                                searchText: "",
                                startDate: "",
                                endDate: "",
                                materialType: "all"
                              });
                            }}
                          />
                        </div>
                      </div>
                      
                      {spaces.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          Nenhuma vaga cadastrada para esta sala
                        </p>
                      ) : filteredSpaces.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          Nenhuma vaga encontrada com os filtros atuais
                        </p>
                      ) : (
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
                              <Table.HeadCell 
                                className="w-16 cursor-pointer" 
                                onClick={() => handleSort("name")}
                              >
                                <div className="flex items-center">
                                  <span>Vaga</span>
                                  {sortConfig.key === "name" && (
                                    <span className="ml-1.5">
                                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </Table.HeadCell>
                              <Table.HeadCell 
                                className="w-24 cursor-pointer"
                                onClick={() => handleSort("position")}
                              >
                                <div className="flex items-center">
                                  <span>Posição</span>
                                  {sortConfig.key === "position" && (
                                    <span className="ml-1.5">
                                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </Table.HeadCell>
                              <Table.HeadCell 
                                className="w-16 cursor-pointer"
                                onClick={() => handleSort("status")}
                              >
                                <div className="flex items-center">
                                  <span>Status</span>
                                  {sortConfig.key === "status" && (
                                    <span className="ml-1.5">
                                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </Table.HeadCell>
                              <Table.HeadCell 
                                className="w-20 cursor-pointer"
                                onClick={() => handleSort("current_op")}
                              >
                                <div className="flex items-center">
                                  <span>OP</span>
                                  {sortConfig.key === "current_op" && (
                                    <span className="ml-1.5">
                                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </Table.HeadCell>
                              <Table.HeadCell 
                                className="cursor-pointer"
                                onClick={() => handleSort("material_name")}
                              >
                                <div className="flex items-center">
                                  <span>Material</span>
                                  {sortConfig.key === "material_name" && (
                                    <span className="ml-1.5">
                                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </Table.HeadCell>
                              <Table.HeadCell 
                                className="w-24 cursor-pointer"
                                onClick={() => handleSort("weighing_date")}
                              >
                                <div className="flex items-center">
                                  <span>Holding</span>
                                  {sortConfig.key === "weighing_date" && (
                                    <span className="ml-1.5">
                                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </Table.HeadCell>
                              <Table.HeadCell className="w-16">Ações</Table.HeadCell>
                            </Table.Head>
                            <Table.Body className="divide-y divide-gray-200 dark:divide-gray-700">
                              {paginatedSpaces.map((space) => {
                                const holdingTime = calculateHoldingTime(space);
                                return (
                                  <Table.Row 
                                    key={space.id} 
                                    className={`bg-white dark:bg-gray-800 dark:border-gray-700 ${
                                      holdingTime?.isExpired ? 'bg-red-50 dark:bg-red-900/10' : ''
                                    }`}
                                  >
                                    <Table.Cell className="text-xs">{space.name}</Table.Cell>
                                    <Table.Cell className="text-xs">{space.position}</Table.Cell>
                                    <Table.Cell>
                                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                        space.status === 'empty' 
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                      }`}>
                                        {space.status === 'empty' ? 'Vazio' : 'Ocupado'}
                                      </span>
                                    </Table.Cell>
                                    <Table.Cell className="text-xs">{space.current_op || '-'}</Table.Cell>
                                    <Table.Cell className="text-xs truncate max-w-[150px]" title={space.material_name || '-'}>
                                      {space.material_name || '-'}
                                    </Table.Cell>
                                    <Table.Cell className="text-xs">
                                      {holdingTime ? (
                                        <span className={`${
                                          holdingTime.isExpired 
                                            ? 'text-red-600 dark:text-red-400 font-semibold' 
                                            : 'text-gray-600 dark:text-gray-400'
                                        }`}>
                                          {holdingTime.days} dias
                                          {holdingTime.isExpired && (
                                            <span className="ml-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs px-1 py-0.5 rounded">
                                              Exp
                                            </span>
                                          )}
                                        </span>
                                      ) : '-'}
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Button 
                                        size="xs"
                                        color={space.status === 'empty' ? "light" : "failure"}
                                        className="py-1 px-2 text-xs"
                                        onClick={() => {
                                          setSelectedSpace(space);
                                          if (space.status === 'empty') {
                                            setAllocateDialogOpen(true);
                                          } else {
                                            setRemoveDialogOpen(true);
                                          }
                                        }}
                                      >
                                        {space.status === 'empty' ? 'Alocar' : 'Remover'}
                                      </Button>
                                    </Table.Cell>
                                  </Table.Row>
                                );
                              })}
                            </Table.Body>
                          </Table>
                          
                          {/* Paginação */}
                          {filteredSpaces.length > 0 && (
                            <div className="mt-4 flex justify-between items-center">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Exibindo {paginatedSpaces.length} de {filteredSpaces.length} vagas
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  color="light" 
                                  disabled={currentPage === 1}
                                  onClick={() => setCurrentPage(prevPage => Math.max(prevPage - 1, 1))}
                                >
                                  Anterior
                                </Button>
                                
                                {/* Numeração das páginas */}
                                {Array.from({ length: Math.min(5, Math.ceil(filteredSpaces.length / itemsPerPage)) }).map((_, index) => {
                                  // Lógica para mostrar páginas ao redor da atual
                                  const totalPages = Math.ceil(filteredSpaces.length / itemsPerPage);
                                  let pageNum;
                                  
                                  if (totalPages <= 5) {
                                    // Se temos 5 ou menos páginas, mostramos todas
                                    pageNum = index + 1;
                                  } else if (currentPage <= 3) {
                                    // Se estamos nas primeiras 3 páginas, mostramos 1-5
                                    pageNum = index + 1;
                                  } else if (currentPage >= totalPages - 2) {
                                    // Se estamos nas últimas 3 páginas, mostramos as últimas 5
                                    pageNum = totalPages - 4 + index;
                                  } else {
                                    // Caso contrário, mostramos 2 antes e 2 depois da atual
                                    pageNum = currentPage - 2 + index;
                                  }
                                  
                                  return (
                                    <Button
                                      key={pageNum}
                                      size="sm"
                                      color={currentPage === pageNum ? "blue" : "light"}
                                      onClick={() => setCurrentPage(pageNum)}
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}
                                
                                <Button 
                                  size="sm" 
                                  color="light" 
                                  disabled={currentPage >= Math.ceil(filteredSpaces.length / itemsPerPage)}
                                  onClick={() => setCurrentPage(prevPage => Math.min(prevPage + 1, Math.ceil(filteredSpaces.length / itemsPerPage)))}
                                >
                                  Próximo
                                </Button>
                                
                                {/* Seletor de itens por página */}
                                <Select
                                  size="sm"
                                  value={itemsPerPage}
                                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                  className="ml-4 w-24"
                                >
                                  <option value="5">5</option>
                                  <option value="10">10</option>
                                  <option value="20">20</option>
                                  <option value="50">50</option>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Tabs.Item>
            
            <Tabs.Item title="Buscar Paletes">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-4">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Buscar Paletes</h2>
                
                <div className="flex space-x-2 mb-6">
                  <TextInput
                    placeholder="Buscar por OP ou nome do material"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchPallets()}
                    className="flex-grow"
                    theme={{
                      field: {
                        input: {
                          base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                        }
                      }
                    }}
                  />
                  <Button onClick={searchPallets} disabled={isSearching}>
                    <HiSearch className="mr-1 h-4 w-4" />
                    Buscar
                  </Button>
                </div>
                
                {searchResults.length > 0 ? (
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
                        <Table.HeadCell className="w-16">Sala</Table.HeadCell>
                        <Table.HeadCell className="w-16">Vaga</Table.HeadCell>
                        <Table.HeadCell className="w-24">Posição</Table.HeadCell>
                        <Table.HeadCell className="w-20">OP</Table.HeadCell>
                        <Table.HeadCell>Material</Table.HeadCell>
                        <Table.HeadCell className="w-24">Holding</Table.HeadCell>
                        <Table.HeadCell className="w-16">Ações</Table.HeadCell>
                      </Table.Head>
                      <Table.Body className="divide-y divide-gray-200 dark:divide-gray-700">
                        {searchResults.map((result) => {
                          const holdingTime = calculateHoldingTime(result);
                          return (
                            <Table.Row 
                              key={result.id} 
                              className={`bg-white dark:bg-gray-800 dark:border-gray-700 ${
                                holdingTime?.isExpired ? 'bg-red-50 dark:bg-red-900/10' : ''
                              }`}
                            >
                              <Table.Cell className="text-xs">{result.storage_rooms.name}</Table.Cell>
                              <Table.Cell className="text-xs">{result.name}</Table.Cell>
                              <Table.Cell className="text-xs">{result.position}</Table.Cell>
                              <Table.Cell className="text-xs">{result.current_op}</Table.Cell>
                              <Table.Cell className="text-xs truncate max-w-[150px]" title={result.material_name || '-'}>
                                {result.material_name || '-'}
                              </Table.Cell>
                              <Table.Cell className="text-xs">
                                {holdingTime ? (
                                  <span className={`${
                                    holdingTime.isExpired 
                                      ? 'text-red-600 dark:text-red-400 font-semibold' 
                                      : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {holdingTime.days} dias
                                    {holdingTime.isExpired && (
                                      <span className="ml-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs px-1 py-0.5 rounded">
                                        Exp
                                      </span>
                                    )}
                                  </span>
                                ) : '-'}
                              </Table.Cell>
                              <Table.Cell>
                                <Button 
                                  size="xs"
                                  color="failure"
                                  className="py-1 px-2 text-xs"
                                  onClick={() => {
                                    setSelectedSpace(result);
                                    setRemoveDialogOpen(true);
                                  }}
                                >
                                  Remover
                                </Button>
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table>
                  </div>
                ) : (
                  isSearching ? (
                    <p className="text-center py-4 text-gray-600 dark:text-gray-400">Buscando...</p>
                  ) : searchQuery ? (
                    <p className="text-center py-4 text-gray-600 dark:text-gray-400">Nenhum resultado encontrado</p>
                  ) : (
                    <p className="text-center py-4 text-gray-600 dark:text-gray-400">Digite um termo para buscar</p>
                  )
                )}
              </div>
            </Tabs.Item>
            
            <Tabs.Item 
              title="Movimentações e Logs" 
              icon={HiOutlineDocumentReport}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-4">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Histórico de Movimentações</h2>
                
                {/* Filtros de logs */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros</h3>
                    <Button 
                      size="xs" 
                      color="light" 
                      onClick={resetLogFilters}
                      className="text-xs py-1"
                    >
                      <HiX className="mr-1 h-3 w-3" /> Limpar filtros
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="action-type" value="Tipo de Movimentação" className="text-xs text-gray-600 dark:text-gray-400 mb-1" />
                      <Select
                        id="action-type"
                        value={logFilters.actionType}
                        onChange={(e) => setLogFilters({...logFilters, actionType: e.target.value})}
                        theme={{
                          field: {
                            select: {
                              base: "block w-full rounded-lg border disabled:cursor-not-allowed disabled:opacity-50 text-sm border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 p-2.5"
                            }
                          }
                        }}
                      >
                        <option value="all">Todas as ações</option>
                        <option value="allocated">Alocação de palete</option>
                        <option value="removed">Remoção de palete</option>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="start-date" value="Data Inicial" className="text-xs text-gray-600 dark:text-gray-400 mb-1" />
                      <TextInput
                        id="start-date"
                        type="date"
                        value={logFilters.startDate}
                        onChange={(e) => setLogFilters({...logFilters, startDate: e.target.value})}
                        theme={{
                          field: {
                            input: {
                              base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                            }
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="end-date" value="Data Final" className="text-xs text-gray-600 dark:text-gray-400 mb-1" />
                      <TextInput
                        id="end-date"
                        type="date"
                        value={logFilters.endDate}
                        onChange={(e) => setLogFilters({...logFilters, endDate: e.target.value})}
                        theme={{
                          field: {
                            input: {
                              base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                            }
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="op-filter" value="Ordem de Produção (OP)" className="text-xs text-gray-600 dark:text-gray-400 mb-1" />
                      <TextInput
                        id="op-filter"
                        placeholder="Filtrar por OP"
                        value={logFilters.op}
                        onChange={(e) => setLogFilters({...logFilters, op: e.target.value})}
                        theme={{
                          field: {
                            input: {
                              base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                            }
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="user-id-filter" value="ID de Usuário" className="text-xs text-gray-600 dark:text-gray-400 mb-1" />
                      <TextInput
                        id="user-id-filter"
                        placeholder="ID de 5 dígitos"
                        value={logFilters.userId}
                        onChange={(e) => setLogFilters({...logFilters, userId: e.target.value})}
                        theme={{
                          field: {
                            input: {
                              base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                            }
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="room-filter" value="Sala" className="text-xs text-gray-600 dark:text-gray-400 mb-1" />
                      <Select
                        id="room-filter"
                        value={logFilters.roomId}
                        onChange={(e) => setLogFilters({...logFilters, roomId: e.target.value})}
                        theme={{
                          field: {
                            select: {
                              base: "block w-full rounded-lg border disabled:cursor-not-allowed disabled:opacity-50 text-sm border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 p-2.5"
                            }
                          }
                        }}
                      >
                        <option value="all">Todas as salas</option>
                        {rooms.map(room => (
                          <option key={room.id} value={room.id}>{room.name}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button 
                      size="sm" 
                      onClick={fetchStorageLogs}
                      disabled={isLoadingLogs}
                    >
                      {isLoadingLogs ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          <HiOutlineRefresh className="mr-2 h-4 w-4" />
                          Atualizar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Tabela de logs */}
                {isLoadingLogs ? (
                  <div className="flex justify-center items-center h-40">
                    <Spinner size="xl" />
                  </div>
                ) : storageLogs.length > 0 ? (
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
                        <Table.HeadCell className="w-32">
                          <SortableHeader 
                            label="Data/Hora"
                            field="timestamp"
                            sortConfig={logSortConfig}
                            onSort={handleLogSort}
                          />
                        </Table.HeadCell>
                        <Table.HeadCell className="w-24">
                          <SortableHeader 
                            label="Ação"
                            field="action"
                            sortConfig={logSortConfig}
                            onSort={handleLogSort}
                          />
                        </Table.HeadCell>
                        <Table.HeadCell className="w-24">
                          <SortableHeader 
                            label="OP"
                            field="op"
                            sortConfig={logSortConfig}
                            onSort={handleLogSort}
                          />
                        </Table.HeadCell>
                        <Table.HeadCell>
                          <SortableHeader 
                            label="Material"
                            field="material_name"
                            sortConfig={logSortConfig}
                            onSort={handleLogSort}
                          />
                        </Table.HeadCell>
                        <Table.HeadCell className="w-24">
                          <SortableHeader 
                            label="Sala"
                            field="room_id"
                            sortConfig={logSortConfig}
                            onSort={handleLogSort}
                          />
                        </Table.HeadCell>
                        <Table.HeadCell className="w-24">
                          <SortableHeader 
                            label="Vaga"
                            field="space_id"
                            sortConfig={logSortConfig}
                            onSort={handleLogSort}
                          />
                        </Table.HeadCell>
                        <Table.HeadCell className="w-24">
                          <SortableHeader 
                            label="Usuário"
                            field="user_id"
                            sortConfig={logSortConfig}
                            onSort={handleLogSort}
                          />
                        </Table.HeadCell>
                      </Table.Head>
                      <Table.Body className="divide-y divide-gray-200 dark:divide-gray-700">
                        {applySorting(storageLogs, logSortConfig).map((log) => (
                          <Table.Row key={log.id} className="bg-white dark:bg-gray-800 dark:border-gray-700">
                            <Table.Cell className="text-xs">
                              {new Date(log.timestamp).toLocaleString('pt-BR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Table.Cell>
                            <Table.Cell>
                              <Badge 
                                color={log.action === 'allocated' ? 'success' : 'failure'}
                                className="px-2.5 py-0.5"
                              >
                                {log.action === 'allocated' ? 'Alocação' : 'Remoção'}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell className="text-xs">{log.op || '-'}</Table.Cell>
                            <Table.Cell className="text-xs truncate max-w-[150px]" title={log.material_name || '-'}>
                              {log.material_name || '-'}
                            </Table.Cell>
                            <Table.Cell className="text-xs">{log.storage_rooms?.name || '-'}</Table.Cell>
                            <Table.Cell className="text-xs">
                              {log.storage_spaces?.name ? 
                                `${log.storage_spaces.name} (${log.storage_spaces.position})` : 
                                '-'}
                            </Table.Cell>
                            <Table.Cell className="text-xs">{log.user_id || '-'}</Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                    
                    {storageLogs.length === 100 && (
                      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                        * Mostrando apenas os 100 registros mais recentes. Use filtros para refinar a busca.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-10 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhum registro de movimentação encontrado com os filtros atuais.
                    </p>
                  </div>
                )}
              </div>
            </Tabs.Item>
          </Tabs>
          
          {/* Allocate Pallet Modal */}
          <Modal theme={{
            root: {
              base: "fixed top-0 right-0 left-0 z-50 h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
              show: {
                on: "flex bg-gray-900 bg-opacity-50 dark:bg-opacity-80",
                off: "hidden"
              }
            },
            content: {
              base: "relative h-full w-full p-4 md:h-auto",
              inner: "relative rounded-lg bg-white shadow dark:bg-gray-800 flex flex-col max-h-[90vh]"
            }
          }} show={allocateDialogOpen} onClose={() => setAllocateDialogOpen(false)}>
            <Modal.Header theme={{
              base: "flex items-start justify-between rounded-t border-b p-5 dark:border-gray-700",
              title: "text-xl font-medium text-gray-900 dark:text-white",
              close: {
                base: "ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
              }
            }}>
              Alocar Palete
            </Modal.Header>
            <Modal.Body className="dark:text-gray-300">
              <div className="space-y-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Preencha os detalhes para alocar um palete na vaga {selectedSpace?.name}.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="op" value="Ordem de Produção (OP)" className="text-gray-700 dark:text-gray-300" />
                    <TextInput
                      id="op"
                      placeholder="Ex: 2284465"
                      value={allocationData.op}
                      onChange={(e) => setAllocationData({...allocationData, op: e.target.value})}
                      theme={{
                        field: {
                          input: {
                            base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                          }
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipe-code" value="Código da Receita" className="text-gray-700 dark:text-gray-300" />
                    <TextInput
                      id="recipe-code"
                      placeholder="Ex: 123456"
                      value={allocationData.recipeCode}
                      onChange={(e) => setAllocationData({...allocationData, recipeCode: e.target.value})}
                      theme={{
                        field: {
                          input: {
                            base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                
                {activeMaterial && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Material: {activeMaterial.Ativo || "Material não encontrado"}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weighing-date" value="Data da Pesagem" className="text-gray-700 dark:text-gray-300" />
                    <TextInput
                      id="weighing-date"
                      type="date"
                      value={allocationData.weighingDate}
                      onChange={(e) => setAllocationData({...allocationData, weighingDate: e.target.value})}
                      theme={{
                        field: {
                          input: {
                            base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                          }
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signature" value="Assinatura (ID de 5 dígitos)" className="text-gray-700 dark:text-gray-300" />
                    <TextInput
                      id="signature"
                      placeholder="Ex: 12345"
                      maxLength={5}
                      value={allocationData.signature}
                      onChange={(e) => setAllocationData({...allocationData, signature: e.target.value})}
                      theme={{
                        field: {
                          input: {
                            base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer theme={{
              base: "flex items-center space-x-2 rounded-b border-t border-gray-200 p-6 dark:border-gray-700"
            }}>
              <Button className="text-black dark:text-white" onClick={allocatePallet} color="success">Confirmar</Button>
              <Button color="gray" onClick={() => setAllocateDialogOpen(false)}>
                Cancelar
              </Button>
            </Modal.Footer>
          </Modal>
          
          {/* Remove Pallet Modal */}
          <Modal theme={{
            root: {
              base: "fixed top-0 right-0 left-0 z-50 h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
              show: {
                on: "flex bg-gray-900 bg-opacity-50 dark:bg-opacity-80",
                off: "hidden"
              }
            },
            content: {
              base: "relative h-full w-full p-4 md:h-auto",
              inner: "relative rounded-lg bg-white shadow dark:bg-gray-800 flex flex-col max-h-[90vh]"
            }
          }} show={removeDialogOpen} onClose={() => setRemoveDialogOpen(false)}>
            <Modal.Header theme={{
              base: "flex items-start justify-between rounded-t border-b p-5 dark:border-gray-700",
              title: "text-xl font-medium text-gray-900 dark:text-white",
              close: {
                base: "ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
              }
            }}>
              Remover Palete
            </Modal.Header>
            <Modal.Body className="dark:text-gray-300">
              <div className="space-y-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Você está removendo o palete da vaga {selectedSpace?.name}.
                </p>
                
                {selectedSpace && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-md space-y-2">
                      <p className="text-amber-800 dark:text-amber-200"><strong>OP:</strong> {selectedSpace.current_op}</p>
                      <p className="text-amber-800 dark:text-amber-200"><strong>Material:</strong> {selectedSpace.material_name}</p>
                      <p className="text-amber-800 dark:text-amber-200"><strong>Data da Pesagem:</strong> {selectedSpace.weighing_date}</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="removal-signature" value="Confirme sua assinatura (ID de 5 dígitos)" className="text-gray-700 dark:text-gray-300" />
                      <TextInput
                        id="removal-signature"
                        placeholder="Ex: 12345"
                        maxLength={5}
                        value={removalSignature}
                        onChange={(e) => setRemovalSignature(e.target.value)}
                        theme={{
                          field: {
                            input: {
                              base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer theme={{
              base: "flex items-center space-x-2 rounded-b border-t border-gray-200 p-6 dark:border-gray-700"
            }}>
              <Button 
                color="failure" 
                onClick={removePallet}
              >
                Confirmar Remoção
              </Button>
              <Button color="gray" onClick={() => setRemoveDialogOpen(false)}>
                Cancelar
              </Button>
            </Modal.Footer>
          </Modal>
          
          {/* Password Verification Modal */}
          <Modal theme={{
            root: {
              base: "fixed top-0 right-0 left-0 z-50 h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
              show: {
                on: "flex bg-gray-900 bg-opacity-50 dark:bg-opacity-80",
                off: "hidden"
              }
            },
            content: {
              base: "relative h-full w-full p-4 md:h-auto",
              inner: "relative rounded-lg bg-white shadow dark:bg-gray-800 flex flex-col max-h-[90vh]"
            }
          }} show={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
            <Modal.Header theme={{
              base: "flex items-start justify-between rounded-t border-b p-5 dark:border-gray-700",
              title: "text-xl font-medium text-gray-900 dark:text-white",
              close: {
                base: "ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
              }
            }}>
              Verificação de Senha
            </Modal.Header>
            <Modal.Body className="dark:text-gray-300">
              <div className="space-y-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Digite a senha para confirmar a ação.
                </p>
                
                <div>
                  <Label htmlFor="password" value="Senha" className="text-gray-700 dark:text-gray-300" />
                  <TextInput
                    id="password"
                    type="password"
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    theme={{
                      field: {
                        input: {
                          base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                        }
                      }
                    }}
                  />
                  {passwordError && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-2">{passwordError}</p>
                  )}
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer theme={{
              base: "flex items-center space-x-2 rounded-b border-t border-gray-200 p-6 dark:border-gray-700"
            }}>
              <Button onClick={verifyPassword} color="success">Confirmar</Button>
              <Button color="gray" onClick={() => setPasswordDialogOpen(false)}>
                Cancelar
              </Button>
            </Modal.Footer>
          </Modal>
          
          {/* Toast notification */}
          {toast.visible && (
            <div className="fixed bottom-5 right-5 z-50">
              <Toast message={toast.message} type={toast.type} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
