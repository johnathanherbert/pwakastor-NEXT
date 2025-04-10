"use client";
import React from "react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// Custom components
import Autocomplete from "../components/Autocomplete";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import TabelaPrincipal from "../components/TabelaPrincipal";
import DetalhamentoMateriais from "../components/DetalhamentoMateriais";
import ExcelUploader, { fetchUpdateHistory } from "../components/ExcelUploader";
import Sap from "../components/Sap";
import AlmoxarifadoManager from "../components/AlmoxarifadoManager";
import DebugPanel from "../components/DebugPanel";
import AdminControls from "../components/AdminControls"; // Import the AdminControls component

// Supabase client
import { supabase } from "../supabaseClient";

// Icons
import {
  PlusCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  BeakerIcon,
  Bars3Icon,
  HashtagIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

import { RequestsProvider } from "../contexts/RequestsContext";
import { useTheme } from "@/contexts/ThemeContext";

const EXCIPIENTES_ESPECIAIS = [
  "LACTOSE (200)",
  "LACTOSE (50/70)",
  "AMIDO DE MILHO PREGELATINIZADO",
  "CELULOSE MIC (TIPO200)",
  "CELULOSE MIC.(TIPO102)",
  "FOSF.CAL.DIB.(COMPDIRETA)",
  "AMIDO",
  "CELULOSE+LACTOSE",
];

export default function Home() {
  const [ordens, setOrdens] = useState([]);
  const [ativo, setAtivo] = useState("");
  const [excipientes, setExcipientes] = useState({});
  const [editingOrdem, setEditingOrdem] = useState(null);
  const [expandedExcipient, setExpandedExcipient] = useState(null);
  const [editingExcipiente, setEditingExcipiente] = useState({});
  const [selectedOrdem, setSelectedOrdem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pesados, setPesados] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [currentOrdemId, setCurrentOrdemId] = useState(null);
  const [opNumber, setOpNumber] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // State declarations continue...
  const [editingOrdemDialog, setEditingOrdemDialog] = useState(null);
  const [editingExcipientes, setEditingExcipientes] = useState({});
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  const [allExpanded, setAllExpanded] = useState(false);

  const [autoIncrementOP, setAutoIncrementOP] = useState(false);
  const [lastOP, setLastOP] = useState(2213345);
  const [initialOP, setInitialOP] = useState("");

  const [filtrarExcipientesEspeciais, setFiltrarExcipientesEspeciais] =
    useState(false);

  const [addMode, setAddMode] = useState("codigo");

  const [materiaisNaArea, setMateriaisNaArea] = useState({});
  const [faltaSolicitar, setFaltaSolicitar] = useState({});

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedExcipientDetail, setSelectedExcipientDetail] = useState(null);
  const [excipientDetailDialogOpen, setExcipientDetailDialogOpen] =
    useState(false);
  const [selectedExcipientForDetail, setSelectedExcipientForDetail] =
    useState(null);

  const [inputValues, setInputValues] = useState({});

  const [showAnalysis, setShowAnalysis] = useState(false);

  // Usando o hook useTheme global em vez do estado local
  const { darkMode, toggleDarkMode } = useTheme();

  const inputRef = useRef(null);

  const [sapDialogOpen, setSapDialogOpen] = useState(false);

  const [updateHistory, setUpdateHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openUploadDialog, setOpenUploadDialog] = useState(false);

  const [inputType, setInputType] = useState("codigo");

  const [opModalOpen, setOpModalOpen] = useState(false);
  const [newOP, setNewOP] = useState("");
  const [selectedOrdemId, setSelectedOrdemId] = useState(null);

  const [sugestoes, setSugestoes] = useState([]);

  // Define loadState first - before it's used in fetchOrdens
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

      if (data) {
        const {
          ordens,
          excipientes,
          expandedExcipient,
          selectedOrdem,
          pesados,
          materiaisNaArea,
          inputValues,
        } = data.state;
        setOrdens(ordens || []);
        setExcipientes(excipientes || {});
        setExpandedExcipient(expandedExcipient || null);
        setSelectedOrdem(selectedOrdem || null);
        setPesados(pesados || {});
        setMateriaisNaArea(materiaisNaArea || {});
        setInputValues(inputValues || {});
        localStorage.setItem(`appState_${userId}`, JSON.stringify(data.state));
      } else {
        const storedState = localStorage.getItem(`appState_${userId}`);
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          setOrdens(parsedState.ordens || []);
          setExcipientes(parsedState.excipientes || {});
          setExpandedExcipient(parsedState.expandedExcipient || null);
          setSelectedOrdem(parsedState.selectedOrdem || null);
          setPesados(parsedState.pesados || {});
          setMateriaisNaArea(parsedState.materiaisNaArea || {});
          setInputValues(parsedState.inputValues || {});
        }
      }
    } catch (error) {
      console.error("Erro ao carregar o estado:", error);
      setOrdens([]);
      setExcipientes({});
      setExpandedExcipient(null);
      setSelectedOrdem(null);
      setPesados({});
      setMateriaisNaArea({});
      setInputValues({});
    }
  }, []);

  // Function to fetch orders - defined AFTER loadState
  const fetchOrdens = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await loadState(user.id);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar ordens:", error);
      setIsLoading(false);
    }
  }, [loadState]);

  // Now we can use loadState directly in our first useEffect
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
  }, [router, loadState]);

  // Define functions for handling upload dialog
  const handleOpenUploadDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setOpenDialog(false);
  };

  const saveState = useCallback(
    async (userId) => {
      const stateToSave = {
        ordens,
        excipientes,
        expandedExcipient,
        selectedOrdem,
        pesados,
        materiaisNaArea,
        inputValues, // Adicione esta linha
      };
      localStorage.setItem(`appState_${userId}`, JSON.stringify(stateToSave));
      try {
        await supabase
          .from("app_state")
          .upsert({ user_id: userId, state: stateToSave });
      } catch (error) {
        console.error("Erro ao salvar o estado no Supabase:", error);
      }
    },
    [
      ordens,
      excipientes,
      expandedExcipient,
      selectedOrdem,
      pesados,
      materiaisNaArea,
      inputValues,
    ] // Adicione inputValues aqui
  );

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

  useEffect(() => {
    if (user && !isLoading) {
      saveState(user.id);
    }
  }, [
    ordens,
    excipientes,
    expandedExcipient,
    selectedOrdem,
    pesados,
    materiaisNaArea,
    isLoading,
    saveState,
    user,
  ]);

  useEffect(() => {
    if (user && !isLoading) {
      saveState(user.id);
    }
  }, [materiaisNaArea, user, isLoading, saveState]);

  const handleAddOrdem = async () => {
    if (!ativo) return;

    let codigo, nome, excipientesData;

    // Busca baseada no modo de adição (código ou ativo)
    const { data, error } = await supabase
      .from("DataBase_ems")
      .select(
        "Codigo_Receita, Ativo, Excipiente, qtd_materia_prima, codigo_materia_prima"
      )
      .eq(addMode === "codigo" ? "Codigo_Receita" : "Ativo", ativo);

    if (error || !data || data.length === 0) {
      alert(
        addMode === "codigo" ? "Código não encontrado" : "Ativo não encontrado"
      );
      return;
    }

    // Se buscar por ativo, pega o primeiro resultado pois pode haver múltiplos registros
    const primeiroRegistro = data[0];
    codigo = primeiroRegistro.Codigo_Receita;
    nome = primeiroRegistro.Ativo;
    excipientesData = data;

    let op = null;
    if (autoIncrementOP) {
      op = initialOP ? parseInt(initialOP) : lastOP ? lastOP + 1 : 2213345;
      setLastOP(op);
      setInitialOP("");
    }

    const novaOrdem = {
      id: uuidv4(),
      codigo,
      nome,
      op,
      excipientes: excipientesData.reduce((acc, item) => {
        acc[item.Excipiente] = {
          quantidade: item.qtd_materia_prima,
          codigo: item.codigo_materia_prima,
        };
        return acc;
      }, {}),
    };

    setOrdens((prevOrdens) => [...prevOrdens, novaOrdem]);

    // Atualizar pesados
    const newPesados = { ...pesados };
    excipientesData.forEach((item) => {
      if (!newPesados[item.Excipiente]) {
        newPesados[item.Excipiente] = {};
      }
      newPesados[item.Excipiente][novaOrdem.id] = false;
    });
    setPesados(newPesados);

    // Recalcular excipientes
    await calcularExcipientes([...ordens, novaOrdem], newPesados);

    // Manter o foco no input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleRemoveOrdem = (index) => {
    const newOrdens = [...ordens];
    newOrdens.splice(index, 1);
    setOrdens(newOrdens);
    calcularExcipientes(newOrdens);
  };

  const handleEditOrdem = async (ordem) => {
    setEditingOrdemDialog(ordem);

    const { data, error } = await supabase
      .from("DataBase_ems")
      .select("Excipiente, qtd_materia_prima")
      .eq("Codigo_Receita", ordem.codigo);

    if (error) {
      console.error("Erro ao buscar excipientes:", error);
      return;
    }

    const ordemExcipientes = data.reduce((acc, item, index) => {
      const uniqueKey = `${item.Excipiente}_${index}`;
      acc[uniqueKey] = {
        nome: item.Excipiente,
        quantidade: item.qtd_materia_prima,
        pesado: pesados[item.Excipiente]?.[ordem.id] || false,
        // Adicione o status de PA, inicialmente false
        pa: false,
        // Flag para indicar se é um excipiente especial
        isEspecial: EXCIPIENTES_ESPECIAIS.includes(item.Excipiente),
      };
      return acc;
    }, {});

    setEditingExcipientes(ordemExcipientes);
  };

  const handleCloseEditDialog = () => {
    setEditingOrdemDialog(null);
    setEditingExcipientes({});
    setSelectAllChecked(false);
  };

  const handleToggleExcipiente = (excipient) => {
    setEditingExcipientes((prev) => ({
      ...prev,
      [excipient]: { ...prev[excipient], pesado: !prev[excipient].pesado },
    }));
  };

  const handleSelectAll = () => {
    const newSelectAllState = !selectAllChecked;
    setSelectAllChecked(newSelectAllState);
    setEditingExcipientes((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([excipient, data]) => [
          excipient,
          { ...data, pesado: newSelectAllState },
        ])
      )
    );
  };

  const handleSaveEditDialog = () => {
    const newPesados = { ...pesados };
    Object.entries(editingExcipientes).forEach(([key, data]) => {
      const excipient = data.nome;
      if (!newPesados[excipient]) newPesados[excipient] = {};
      newPesados[excipient][editingOrdemDialog.id] = data.pesado;
      // Salvar o status de PA em algum estado global se necessário
      // setPAStatus(prev => ({...prev, [excipient]: {...prev[excipient], [editingOrdemDialog.id]: data.pa}}));
    });
    setPesados(newPesados);
    calcularExcipientes(ordens, newPesados);
    handleCloseEditDialog();
  };

  const handleUpdateTotal = () => {
    calcularExcipientes(ordens);
  };

  const fetchOrdemExcipientes = async (codigo) => {
    const { data, error } = await supabase
      .from("DataBase_ems")
      .select("Excipiente, qtd_materia_prima")
      .eq("Codigo_Receita", codigo);

    if (error) {
      alert(error.message);
      return;
    }

    const excipientesData = data.reduce((acc, item) => {
      acc[item.Excipiente] = item.qtd_materia_prima;
      return acc;
    }, {});

    setEditingExcipiente(excipientesData);
  };

  const handleExcipientChange = (excipient, value) => {
    setEditingExcipiente({
      ...editingExcipiente,
      [excipient]: parseFloat(value),
    });
  };

  const handleRemoveExcipient = (excipient) => {
    const { [excipient]: _, ...rest } = editingExcipiente;
    setEditingExcipiente(rest);
  };

  const handleToggleExpandExcipient = (excipient) => {
    setExpandedExcipient(expandedExcipient === excipient ? null : excipient);
  };

  const togglePesado = (excipient, ordemId) => {
    setPesados((prev) => {
      const newPesados = {
        ...prev,
        [excipient]: {
          ...prev[excipient],
          [ordemId]: !prev[excipient]?.[ordemId],
        },
      };

      // Recalcular excipientes imediatamente após a atualização
      calcularExcipientes(ordens, newPesados);

      return newPesados;
    });
  };

  const calcularExcipientes = useCallback(
    async (ordensAtuais = [], pesadosAtuais = {}) => {
      if (!ordensAtuais || ordensAtuais.length === 0) {
        setExcipientes({});
        return;
      }

      let newExcipientes = {};

      for (let ordem of ordensAtuais) {
        const { data, error } = await supabase
          .from("DataBase_ems")
          .select("Excipiente, qtd_materia_prima, codigo_materia_prima")
          .eq("Codigo_Receita", ordem.codigo);

        if (error) {
          console.error("Erro ao buscar excipientes:", error);
          return;
        }

        data.forEach((item) => {
          const codigoMateriaPrima = String(item.codigo_materia_prima);
          const codigoExcipiente =
            codigoMateriaPrima && codigoMateriaPrima.startsWith("1")
              ? "0" + codigoMateriaPrima
              : codigoMateriaPrima;

          if (!newExcipientes[item.Excipiente]) {
            newExcipientes[item.Excipiente] = {
              total: 0,
              ordens: [],
              codigo: codigoExcipiente,
            };
          }

          // Verifica se o excipiente e a ordem existem em pesadosAtuais
          const isPesado = pesadosAtuais[item.Excipiente]?.[ordem.id] || false;

          // Só adiciona ao total se não estiver pesado
          if (!isPesado) {
            newExcipientes[item.Excipiente].total += item.qtd_materia_prima;
          }

          newExcipientes[item.Excipiente].ordens.push({
            id: ordem.id,
            codigo: ordem.codigo,
            quantidade: item.qtd_materia_prima,
            nome: ordem.nome,
            op: ordem.op,
            pesado: isPesado,
          });
        });
      }

      // Arredonda os totais para 3 casas decimais
      Object.keys(newExcipientes).forEach((key) => {
        newExcipientes[key].total = Number(
          newExcipientes[key].total.toFixed(3)
        );
      });

      setExcipientes(newExcipientes);
    },
    []
  );

  const testConnection = async () => {
    const { data, error } = await supabase
      .from("DataBase_ems")
      .select("*")
      .limit(1);

    console.log("Teste de conexão:", data, error);
  };

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    calcularExcipientes(ordens);
  }, [ordens]);

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleAddOrdem();
      // Adicione um foco no input após adicionar a ordem
      event.target.focus();
    }
  };

  const filteredExcipientes = useMemo(() => {
    let filtered = { ...excipientes };

    if (selectedOrdem) {
      filtered = Object.keys(selectedOrdem.excipientes).reduce(
        (acc, excipiente) => {
          if (excipientes[excipiente]) {
            acc[excipiente] = excipientes[excipiente];
          }
          return acc;
        },
        {}
      );
    }

    if (filtrarExcipientesEspeciais) {
      filtered = Object.entries(filtered).reduce((acc, [excipiente, dados]) => {
        if (EXCIPIENTES_ESPECIAIS.includes(excipiente)) {
          acc[excipiente] = dados;
        }
        return acc;
      }, {});
    }

    return filtered;
  }, [excipientes, selectedOrdem, filtrarExcipientesEspeciais]);

  const calcularMovimentacaoTotal = useCallback(() => {
    return Object.values(filteredExcipientes).reduce(
      (total, { totalNaoPesado }) => total + totalNaoPesado,
      0
    );
  }, [filteredExcipientes]);

  const handleOrdemClick = (ordem) => {
    // Se clicar na ordem já selecionada, remove o filtro
    if (selectedOrdem && selectedOrdem.id === ordem.id) {
      setSelectedOrdem(null);
      // Restaura todos os excipientes quando remove o filtro
      calcularExcipientes(ordens, pesados);
    } else {
      setSelectedOrdem(ordem);
      // Filtra os excipientes baseado na ordem selecionada
      const filteredByOrdem = Object.entries(excipientes).reduce(
        (acc, [excipient, data]) => {
          const ordensDoExcipiente = data.ordens.filter(
            (o) => o.nome === ordem.nome
          );
          if (ordensDoExcipiente.length > 0) {
            acc[excipient] = {
              ...data,
              ordens: ordensDoExcipiente,
              totalNaoPesado: ordensDoExcipiente.reduce(
                (sum, o) => sum + (o.pesado ? 0 : o.quantidade),
                0
              ),
            };
          }
          return acc;
        },
        {}
      );
    }
  };

  const handleExcipientClick = (excipient, event) => {
    // Impedir a expansão quando clicar no input de materiais na área
    if (event.target.tagName === "INPUT") {
      return;
    }
    handleToggleExpandExcipient(excipient);
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleOpenDialog = (ordemId) => {
    setCurrentOrdemId(ordemId);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentOrdemId(null);
    setOpNumber("");
  };

  const handleAddOP = () => {
    setOrdens((prevOrdens) => {
      const newOrdens = prevOrdens.map((ordem) =>
        ordem.id === currentOrdemId ? { ...ordem, op: opNumber } : ordem
      );

      // Recalcular excipientes imediatamente aps a atualização das ordens
      calcularExcipientes(newOrdens);

      return newOrdens;
    });
    handleCloseDialog();
  };

  const handleLogout = async () => {
    if (user) {
      try {
        await saveState(user.id); // Salva o estado final antes de deslogar
        localStorage.removeItem(`appState_${user.id}`);
        await supabase.auth.signOut();
        setUser(null); // Atualiza o estado local diretamente
        router.push("/login");
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }
    }
  };

  const getOPList = (ordens, nomeSelecionado) => {
    const opsRelacionadas = ordens
      .filter((ordem) => ordem.nome === nomeSelecionado && ordem.op)
      .map((ordem) => ordem.op);

    if (opsRelacionadas.length === 0) {
      return "Nenhuma OP adicionada";
    } else if (opsRelacionadas.length === 1) {
      return opsRelacionadas[0];
    } else {
      return opsRelacionadas.join(", ");
    }
  };

  const toggleAllExcipients = () => {
    setAllExpanded(!allExpanded);
    if (!allExpanded) {
      setExpandedExcipient(Object.keys(filteredExcipientes));
    } else {
      setExpandedExcipient(null);
    }
  };

  const toggleAutoIncrementOP = () => {
    setAutoIncrementOP(!autoIncrementOP);
  };

  const resetOP = () => {
    setLastOP(2213345);
    setInitialOP("");
  };

  const handleDeleteOrdem = (ordemId) => {
    setOrdens((prevOrdens) =>
      prevOrdens.filter((ordem) => ordem.id !== ordemId)
    );

    // Atualizar o estado de pesados
    setPesados((prevPesados) => {
      const newPesados = { ...prevPesados };
      Object.keys(newPesados).forEach((excipient) => {
        if (newPesados[excipient][ordemId]) {
          delete newPesados[excipient][ordemId];
        }
      });
      return newPesados;
    });

    // Se a ordem deletada for a selecionada, limpe a seleção
    if (selectedOrdem && selectedOrdem.id === ordemId) {
      setSelectedOrdem(null);
    }

    // Recalcular excipientes após a remoção
    calcularExcipientes(ordens.filter((ordem) => ordem.id !== ordemId));
  };

  const toggleAddMode = () => {
    const newMode = addMode === "codigo" ? "ativo" : "codigo";
    setAddMode(newMode);
    setInputType(newMode);
    setAtivo(""); // Limpa o input ao trocar
  };

  // Função para atualizar a quantidade de materiais na área
  const handleMateriaisNaAreaChange = useCallback(
    (excipient, value) => {
      setInputValues((prev) => ({
        ...prev,
        [excipient]: value,
      }));

      const formattedValue = value === "" ? null : parseFloat(value).toFixed(3);
      setMateriaisNaArea((prev) => {
        const newState = { ...prev };
        if (formattedValue === null) {
          delete newState[excipient];
        } else {
          newState[excipient] = parseFloat(formattedValue);
        }
        return newState;
      });

      if (user) {
        saveState(user.id);
      }
    },
    [user, saveState]
  );

  useEffect(() => {
    const timers = {};

    Object.entries(inputValues).forEach(([excipient, value]) => {
      if (timers[excipient]) {
        clearTimeout(timers[excipient]);
      }

      timers[excipient] = setTimeout(() => {
        if (value === "") {
          setMateriaisNaArea((prev) => {
            const newState = { ...prev };
            delete newState[excipient];
            return newState;
          });
        } else {
          const formattedValue = parseFloat(value).toFixed(3);
          setMateriaisNaArea((prev) => ({
            ...prev,
            [excipient]: parseFloat(formattedValue),
          }));
        }
      }, 500); // 500ms de atraso
    });

    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, [inputValues]);

  const calcularFaltaSolicitar = useCallback(() => {
    const novoFaltaSolicitar = {};
    Object.entries(filteredExcipientes).forEach(
      ([excipient, { totalNaoPesado }]) => {
        const naArea = materiaisNaArea[excipient] || 0;
        const falta = Math.max(totalNaoPesado - naArea, 0);
        if (falta > 0) {
          novoFaltaSolicitar[excipient] = falta.toFixed(3);
        }
      }
    );
    setFaltaSolicitar(novoFaltaSolicitar);
  }, [filteredExcipientes, materiaisNaArea]);

  useEffect(() => {
    calcularFaltaSolicitar();
  }, [calcularFaltaSolicitar]);

  const handleDetailClick = (ativo) => {
    setSelectedExcipientDetail(ativo);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedExcipientDetail(null);
  };

  const getOrdensAtendidas = useCallback(
    (excipient) => {
      if (!filteredExcipientes[excipient]) {
        console.warn(`Excipiente não encontrado: ${excipient}`);
        return { ordensAtendidas: [], ordensNaoAtendidas: [] };
      }

      const naArea = materiaisNaArea[excipient] || 0;
      let quantidadeRestante = naArea;
      const ordensAtendidas = [];
      const ordensNaoAtendidas = [];

      // Função auxiliar para comparar OPs de forma segura
      const compareOPs = (a, b) => {
        if (a.op && b.op) {
          return a.op.toString().localeCompare(b.op.toString());
        }
        if (a.op) return -1;
        if (b.op) return 1;
        return 0;
      };

      // Ordena as ordens de forma segura
      const ordensOrdenadas = [
        ...(filteredExcipientes[excipient].ordens || []),
      ].sort(compareOPs);

      ordensOrdenadas.forEach((ordem) => {
        if (ordem.pesado) {
          ordensAtendidas.push(ordem);
        } else if (quantidadeRestante >= ordem.quantidade) {
          ordensAtendidas.push(ordem);
          quantidadeRestante -= ordem.quantidade;
        } else {
          ordensNaoAtendidas.push(ordem);
        }
      });

      return { ordensAtendidas, ordensNaoAtendidas };
    },
    [filteredExcipientes, materiaisNaArea]
  );

  const getAtivoStatus = (ativo) => {
    const excipientes = Object.entries(filteredExcipientes).filter(
      ([_, data]) => data.ordens.some((ordem) => ordem.nome === ativo)
    );

    let totalNecessario = 0;
    let totalDisponivel = 0;

    excipientes.forEach(([excipient, data]) => {
      const ordensDoAtivo = data.ordens.filter((ordem) => ordem.nome === ativo);
      ordensDoAtivo.forEach((ordem) => {
        if (!ordem.pesado) {
          totalNecessario += ordem.quantidade;
          totalDisponivel += Math.min(
            materiaisNaArea[excipient] || 0,
            ordem.quantidade
          );
        }
      });
    });

    if (totalDisponivel >= totalNecessario) return "completo";
    if (totalDisponivel > 0) return "parcial";
    return "indisponivel";
  };

  const calcularPossibilidadesAtendimento = (excipient) => {
    const naArea = materiaisNaArea[excipient] || 0;
    const ordens = filteredExcipientes[excipient].ordens;

    const calcularCombinacoes = (
      quantidadeRestante,
      ordensRestantes,
      combinacaoAtual
    ) => {
      if (quantidadeRestante < 0) return [];
      if (ordensRestantes.length === 0 || quantidadeRestante === 0) {
        return [combinacaoAtual];
      }

      const todasCombinacoes = [];
      for (let i = 0; i < ordensRestantes.length; i++) {
        const ordemAtual = ordensRestantes[i];
        if (ordemAtual.quantidade <= quantidadeRestante) {
          const novaCombinacao = [...combinacaoAtual, ordemAtual];
          const novasOrdensRestantes = ordensRestantes.slice(i + 1);
          const combinacoes = calcularCombinacoes(
            quantidadeRestante - ordemAtual.quantidade,
            novasOrdensRestantes,
            novaCombinacao
          );
          todasCombinacoes.push(...combinacoes);
        }
      }
      return todasCombinacoes;
    };

    const todasCombinacoes = calcularCombinacoes(naArea, ordens, []);

    // Simplificar e formatar as combinações
    return todasCombinacoes
      .map((combinacao) => {
        const contagem = combinacao.reduce((acc, ordem) => {
          acc[ordem.nome] = (acc[ordem.nome] || 0) + 1;
          return acc;
        }, {});

        const descricao = Object.entries(contagem)
          .map(
            ([nome, quantidade]) =>
              `${quantidade} ${nome}${quantidade > 1 ? "s" : ""}`
          )
          .join(" ou ");

        return descricao;
      })
      .join("\n");
  };

  const handleToggleAnalysis = () => {
    setShowAnalysis(!showAnalysis);
  };

  const getExcipientStatus = (naArea, totalNaoPesado, ordens) => {
    if (naArea >= totalNaoPesado) return "ok";
    if (naArea > 0) return "partial";
    if (ordens.some((ordem) => !ordem.pesado)) return "warning";
    return "error";
  };

  const getFilterInfo = () => {
    if (!selectedOrdem) return null;

    const ops = ordens
      .filter((o) => o.nome === selectedOrdem.nome && o.op)
      .map((o) => o.op);

    return ops.length > 0 ? ops.join(", ") : "Nenhuma OP";
  };

  // Adicione esta nova função
  const getFilteredAtivos = () => {
    if (selectedOrdem) {
      return [selectedOrdem.nome];
    }
    return [...new Set(ordens.map((ordem) => ordem.nome))];
  };

  const handleOpenSapDialog = () => {
    setSapDialogOpen(true);
  };

  const handleCloseSapDialog = () => {
    setSapDialogOpen(false);
  };

  const handleDataUpdated = async () => {
    setLoading(true);
    try {
      console.log("Atualizando dados...");

      // Verifique se fetchExcipientes existe antes de chamá-la
      if (typeof fetchExcipientes === "function") {
        await fetchExcipientes();
      } else {
        console.log("fetchExcipientes não está definida, pulando esta etapa");
      }

      const history = await fetchUpdateHistory();
      setUpdateHistory(history);
      console.log("Dados atualizados com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      // Não lance o erro aqui, apenas registre-o
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleDataUpdated();
  }, []);

  const handleUpdateSAPValues = async (excipient, codigo) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("materials_database")
        .select("qtd_materia_prima")
        .eq("codigo_materia_prima", codigo);

      if (error) throw error;

      if (data && data.length > 0) {
        const saldoTotal = data.reduce(
          (total, item) => total + parseFloat(item.qtd_materia_prima || 0),
          0
        );

        // Atualizar o valor do input
        handleMateriaisNaAreaChange(excipient, saldoTotal.toFixed(3));
      } else {
        console.log("Nenhum dado encontrado para o código:", codigo);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do SAP:", error);
    }
  };

  const handleUpdateAllSAPValues = async () => {
    if (!user) return;

    setLoading(true);
    try {
      for (const [excipient, data] of Object.entries(filteredExcipientes)) {
        const codigo = data.codigo;
        if (codigo) {
          const { data: sapData, error } = await supabase
            .from("materials_database")
            .select("qtd_materia_prima")
            .eq("codigo_materia_prima", codigo);

          if (error) throw error;

          if (sapData && sapData.length > 0) {
            const saldoTotal = sapData.reduce(
              (total, item) => total + parseFloat(item.qtd_materia_prima || 0),
              0
            );
            handleMateriaisNaAreaChange(excipient, saldoTotal.toFixed(3));
          }
        }
      }
      console.log("Todos os valores do SAP foram atualizados com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar todos os valores do SAP:", error);
    } finally {
      setLoading(false);
    }
  };

  const isOrdemCompleta = useCallback(
    (ordem) => {
      if (!filteredExcipientes || !pesados) return false;
      return Object.entries(filteredExcipientes).every(([excipient, data]) => {
        const ordemData = data.ordens.find((o) => o.id === ordem.id);
        return ordemData && pesados[excipient]?.[ordem.id];
      });
    },
    [filteredExcipientes, pesados]
  );

  const ordensAgrupadas = useMemo(() => {
    const grupos = {
      emAndamento: [],
      pesadas: [],
    };

    ordens.forEach((ordem) => {
      if (isOrdemCompleta(ordem)) {
        grupos.pesadas.push(ordem);
      } else {
        grupos.emAndamento.push(ordem);
      }
    });

    return grupos;
  }, [ordens, isOrdemCompleta]);

  // Função para selecionar ordem
  const handleSelectOrdem = useCallback(
    (ordem) => {
      setSelectedOrdem(ordem);
      // Atualiza os excipientes filtrados baseado na ordem selecionada
      if (ordem) {
        const filteredByOrdem = Object.entries(excipientes).reduce(
          (acc, [excipient, data]) => {
            const ordensDoExcipiente = data.ordens.filter(
              (o) => o.nome === ordem.nome
            );
            if (ordensDoExcipiente.length > 0) {
              acc[excipient] = {
                ...data,
                ordens: ordensDoExcipiente,
                totalNaoPesado: ordensDoExcipiente.reduce(
                  (sum, o) => sum + (o.pesado ? 0 : o.quantidade),
                  0
                ),
              };
            }
            return acc;
          },
          {}
        );
      } else {
        // Se nenhuma ordem selecionada, restaura todos os excipientes
        calcularExcipientes(ordens, pesados);
      }
    },
    [excipientes, ordens, pesados, calcularExcipientes]
  );

  // Adicione esta função helper
  const isOrdemPesada = (ordem, pesados) => {
    // Verifica se todos os excipientes da ordem estão pesados
    return Object.keys(ordem.excipientes).every(
      (excipiente) => pesados[excipiente]?.[ordem.id]
    );
  };

  // Função para validar input numérico
  const handleInputChange = (value) => {
    if (addMode === "codigo") {
      // Permite apenas números
      const numericValue = value.replace(/\D/g, "");
      setAtivo(numericValue);
    } else {
      setAtivo(value);
    }
  };

  // Função para abrir o modal de OP
  const handleOpenOPModal = (ordemId) => {
    setSelectedOrdemId(ordemId);
    setNewOP("");
    setOpModalOpen(true);
  };

  // Função para salvar a OP
  const handleSaveOP = () => {
    if (newOP.length !== 7 || !/^\d+$/.test(newOP)) {
      alert("A OP deve conter exatamente 7 números");
      return;
    }

    setOrdens((prevOrdens) =>
      prevOrdens.map((ordem) =>
        ordem.id === selectedOrdemId ? { ...ordem, op: newOP } : ordem
      )
    );

    setOpModalOpen(false);
    setNewOP("");
    setSelectedOrdemId(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      completo: {
        className:
          "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/50",
        title: "Todos os excipientes necessários estão disponíveis na rea",
        text: "Completo",
      },
      parcial: {
        className:
          "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50",
        title: "Alguns excipientes estão disponíveis, mas não todos",
        text: "Parcial",
      },
      indisponivel: {
        className:
          "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50",
        title: "Nenhum excipiente necessário está disponível na área",
        text: "Indisponível",
      },
      pesado: {
        className:
          "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/50",
        title: "Todos os excipientes desta ordem foram pesados",
        text: "Pesado",
      },
    };

    return badges[status] || badges.indisponivel;
  };

  const buscarSugestoes = async (termo) => {
    if (!termo || termo.length < 3) {
      setSugestoes([]);
      return;
    }

    const { data, error } = await supabase
      .from("DataBase_ems")
      .select("Ativo")
      .ilike("Ativo", `%${termo}%`)
      .limit(10);

    if (error) {
      console.error("Erro ao buscar sugestões:", error);
      return;
    }

    // Remove duplicatas e ordena
    const sugestoesUnicas = [...new Set(data.map((item) => item.Ativo))].sort();
    setSugestoes(sugestoesUnicas);
  };

  // Adicione esta função de renderização do tooltip
  const renderOrdemTooltip = (ordem) => {
    return (
      <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 
        absolute left-full top-0 ml-2 z-50 w-80
        transition-all duration-200 transform scale-95 group-hover:scale-100
        pointer-events-none"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl 
          ring-1 ring-black/5 dark:ring-white/5
          border border-gray-100 dark:border-gray-700">
          {/* Cabeçalho */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {ordem.nome}
              </span>
              {ordem.op && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 
                  text-blue-800 dark:text-blue-300 rounded-full">
                  OP: {ordem.op}
                </span>
              )}
            </div>
          </div>

          {/* Lista de Excipientes */}
          <div className="p-3">
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-left">
                      Excipiente
                    </th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
                      Quantidade
                    </th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(ordem.excipientes).map(([excipiente, dados]) => {
                    const isPesado = pesados[excipiente]?.[ordem.id] || false;
                    return (
                      <tr key={excipiente}>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">
                          {excipiente}
                        </td>
                        <td className="px-3 py-2 text-xs text-right text-gray-900 dark:text-gray-300">
                          {dados.quantidade.toFixed(3)} kg
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                            ${isPesado 
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' 
                              : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'}`}
                          >
                            {isPesado ? 'Pesado' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-white dark:bg-gray-900">
        <div
          className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 
          border-blue-600 dark:border-blue-400"
        ></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <RequestsProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Navbar Superior Fixo */}
        <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800/95 border-b dark:border-gray-700/50 z-50 h-16 backdrop-blur-sm transition-all duration-200">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDrawerOpen(!drawerOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
              >
                <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                Pesagem
              </h1>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-4">
              {/* Botões de Ação */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenSapDialog}
                  className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 text-xs
                         text-blue-600 dark:text-blue-400 
                         bg-blue-50 dark:bg-blue-900/30 
                         hover:bg-blue-100 dark:hover:bg-blue-900/50 
                         border border-blue-200 dark:border-blue-700/50
                         rounded-lg transition-all duration-200
                         hover:shadow-md dark:hover:shadow-blue-900/20"
                  title="Consulta SAP"
                >
                  <MagnifyingGlassIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Consulta SAP</span>
                </button>

                {/* Admin Controls Component */}
                <AdminControls user={user} />

                <button
                  onClick={handleUpdateAllSAPValues}
                  className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 text-xs
                         text-green-600 dark:text-green-400 
                         bg-green-50 dark:bg-green-900/30 
                         hover:bg-green-100 dark:hover:bg-green-900/50 
                         border border-green-200 dark:border-green-700/50
                         rounded-lg transition-all duration-200
                         hover:shadow-md dark:hover:shadow-green-900/20"
                  title="Atualizar Dados"
                >
                  <ArrowPathIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Atualizar Dados</span>
                </button>

                <button
                  onClick={handleOpenUploadDialog}
                  className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 text-xs
                         text-purple-600 dark:text-purple-400 
                         bg-purple-50 dark:bg-purple-900/30 
                         hover:bg-purple-100 dark:hover:bg-purple-900/50 
                         border border-purple-200 dark:border-purple-700/50
                         rounded-lg transition-all duration-200
                         hover:shadow-md dark:hover:shadow-purple-900/20"
                  title="Upload Excel"
                >
                  <CloudArrowUpIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Upload Excel</span>
                </button>
              </div>
              <UserMenu
                user={user}
                onUserUpdate={setUser} // Passando a função setUser como onUserUpdate
              />
            </div>
          </div>
        </nav>

        {/* Layout Principal */}
        <div className="flex pt-16">
          <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

          {/* Conteúdo Principal */}
          <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
            <div className="grid grid-cols-12 gap-6">
              {/* Coluna Lateral Esquerda - 3 colunas */}
              <div className="col-span-12 lg:col-span-3 space-y-4">
                {/* Card de Estatísticas */}
                <div className="bg-white dark:bg-gray-800/90 rounded-xl shadow-sm border dark:border-gray-700/50 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Total de Ordens
                      </p>
                      <p className="text-xl font-semibold text-blue-700 dark:text-blue-300">
                        {ordens.length}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Ordens Pesadas
                      </p>
                      <p className="text-xl font-semibold text-green-700 dark:text-green-300">
                        {
                          ordens.filter((ordem) =>
                            isOrdemPesada(ordem, pesados)
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card de Adição de Ordens */}
                <div className="bg-white dark:bg-gray-800/90 rounded-xl shadow-sm border dark:border-gray-700/50 transition-colors">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-t-xl">
                    <h3 className="text-base font-semibold text-white dark:text-white/90 flex items-center gap-2">
                      <PlusCircleIcon className="w-4 h-4" />
                      Nova Ordem
                    </h3>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Input Principal - Alternando entre tipos */}
                    {addMode === "codigo" ? (
                      <div className="relative">
                        <input
                          type="number"
                          value={ativo}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onKeyPress={handleKeyPress}
                          ref={inputRef}
                          placeholder="Digite o código (Ex: 701171)"
                          className="w-full px-3 py-2 
                          bg-white dark:bg-gray-700
                          border border-gray-200 dark:border-gray-600 
                          text-gray-900 dark:text-gray-100
                          placeholder-gray-400 dark:placeholder-gray-400
                          rounded-lg text-sm 
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                          focus:border-transparent transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
                          Apenas números
                        </span>
                      </div>
                    ) : (
                      <Autocomplete
                        value={ativo}
                        onChange={(valor) => {
                          setAtivo(valor);
                          buscarSugestoes(valor);
                        }}
                        onKeyPress={handleKeyPress}
                        ref={inputRef}
                        placeholder="Digite o nome do ativo (Ex: AMOXICILINA)"
                        className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        sugestoes={sugestoes}
                      />
                    )}

                    {/* Input de OP - Aparece quando autoIncrementOP está ativo */}
                    {autoIncrementOP && (
                      <div className="relative">
                        <input
                          type="number"
                          value={initialOP}
                          onChange={(e) => setInitialOP(e.target.value)}
                          placeholder={`Próxima OP: ${lastOP + 1}`}
                          className="w-full px-3 py-2 
                          bg-white dark:bg-gray-700
                          border border-gray-200 dark:border-gray-600 
                          text-gray-900 dark:text-gray-100
                          placeholder-gray-400 dark:placeholder-gray-400
                          rounded-lg text-sm 
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                          focus:border-transparent transition-colors"
                        />
                      </div>
                    )}

                    {/* Botões */}
                    <div className="flex gap-2">
                      <button
                        onClick={toggleAddMode}
                        className={`px-3 py-2 text-sm rounded-lg flex-1 flex items-center justify-center gap-1
                                ${
                                  addMode === "codigo"
                                    ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-700"
                                    : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-700"
                                }`}
                      >
                        {addMode === "codigo" ? (
                          <>
                            <BeakerIcon className="w-4 h-4" />
                            Usar Ativo
                          </>
                        ) : (
                          <>
                            <HashtagIcon className="w-4 h-4" />
                            Usar Código
                          </>
                        )}
                      </button>

                      {/* Botão Auto OP */}
                      <button
                        onClick={toggleAutoIncrementOP}
                        className={`px-3 py-2 text-sm rounded-lg flex items-center justify-center gap-1
                        ${
                          autoIncrementOP
                            ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-700"
                            : "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
                        }`}
                        title={
                          autoIncrementOP
                            ? "Desativar Auto OP"
                            : "Ativar Auto OP"
                        }
                      >
                        {autoIncrementOP ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4" />
                            Auto OP
                          </>
                        ) : (
                          <>
                            <PlusCircleIcon className="w-4 h-4" />
                            Add OP
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleAddOrdem}
                        className="px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg 
                               hover:bg-blue-700 dark:hover:bg-blue-600 
                               flex items-center justify-center gap-1 flex-1 transition-colors"
                      >
                        <PlusCircleIcon className="w-4 h-4" />
                        <span className="text-sm">Adicionar</span>
                      </button>
                    </div>

                    {/* Mostrar botão de reset quando Auto OP estiver ativo */}
                    {autoIncrementOP && (
                      <button
                        onClick={resetOP}
                        className="w-full px-3 py-2 mt-2 text-sm text-gray-600 dark:text-gray-400 
                                bg-gray-50 dark:bg-gray-900/30 
                                hover:bg-gray-100 dark:hover:bg-gray-900/50 
                                border border-gray-200 dark:border-gray-700 
                                rounded-lg transition-colors"
                      >
                        Resetar OP para 2213345
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Ordens */}
                <div className="bg-white dark:bg-gray-800/90 rounded-xl shadow-md border dark:border-gray-700/50">
                  {/* Header mais compacto */}
                  <div className="px-2.5 py-2 border-b border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Ordens em Andamento
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {ordens.length}{" "}
                          {ordens.length === 1 ? "ordem" : "ordens"} no total
                        </p>
                      </div>
                      {selectedOrdem && (
                        <button
                          onClick={() => handleSelectOrdem(null)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500"
                        >
                          Limpar Filtro
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de Ordens - Layout mais compacto */}
                  <div className="divide-y dark:divide-gray-700/50">
                    {/* Ordens em Andamento */}
                    <div className="p-2 bg-gray-50 dark:bg-gray-800/50">
                      <div className="space-y-1 max-h-[calc(50vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {ordens
                          .filter(
                            (ordem) =>
                              !isOrdemPesada(ordem, pesados) &&
                              (!selectedOrdem ||
                                ordem.nome === selectedOrdem.nome)
                          )
                          .map((ordem) => (
                            <div
                              key={ordem.id}
                              onClick={() => handleOrdemClick(ordem)}
                              className={`group relative px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200
                              ${
                                selectedOrdem?.id === ordem.id
                                  ? "bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700/50"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {/* Informações principais em linha */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {ordem.nome}
                                    </span>
                                  </div>

                                  {/* Informações secundárias */}
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="inline-flex items-center text-[10px] text-gray-500 dark:text-gray-400">
                                      <span className="font-medium">OP:</span>
                                      <span className="ml-1 font-mono">
                                        {ordem.op
                                          ? String(ordem.op).padStart(7, "0")
                                          : "N/A"}
                                      </span>
                                    </span>

                                    {/* Contador de excipientes */}
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                      {Object.keys(ordem.excipientes).length}{" "}
                                      excipientes
                                    </span>
                                  </div>
                                </div>

                                {/* Ações - Visíveis apenas no hover */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!ordem.op && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenOPModal(ordem.id);
                                      }}
                                      className="p-1 text-blue-600 dark:text-blue-400 
                                      hover:bg-blue-50 dark:hover:bg-blue-900/30 
                                      rounded transition-colors"
                                      title="Adicionar OP"
                                    >
                                      <PlusCircleIcon className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditOrdem(ordem);
                                    }}
                                    className="p-1 text-blue-600 dark:text-blue-400 
                                    hover:bg-blue-50 dark:hover:bg-blue-900/30 
                                    rounded transition-colors"
                                    title="Editar Ordem"
                                  >
                                    <PencilIcon className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteOrdem(ordem.id);
                                    }}
                                    className="p-1 text-red-600 dark:text-red-400 
                                    hover:bg-red-50 dark:hover:bg-red-900/30 
                                    rounded transition-colors"
                                    title="Remover Ordem"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Ordens Pesadas - Layout similar */}
                    <div className="p-2 bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                        Pesadas
                      </h3>
                      <div className="space-y-1 max-h-[calc(50vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {ordens
                          .filter((ordem) => isOrdemPesada(ordem, pesados))
                          .map((ordem) => (
                            <div
                              key={ordem.id}
                              onClick={() => handleOrdemClick(ordem)}
                              className={`group relative px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200
                              ${
                                selectedOrdem?.id === ordem.id
                                  ? "bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700/50"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
                              }`}
                            >
                              {/* Similar ao layout acima, mas com status "Pesado" */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {ordem.nome}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="inline-flex items-center text-[20px] text-gray-500 dark:text-gray-400">
                                      <span className="font-medium">OP:</span>
                                      <span className="ml-1 font-mono">
                                        {ordem.op
                                          ? String(ordem.op).padStart(7, "0")
                                          : "N/A"}
                                      </span>
                                    </span>
                                    <span className="text-[20px] text-gray-500 dark:text-gray-400">
                                      {Object.keys(ordem.excipientes).length}{" "}
                                      excipientes
                                    </span>
                                  </div>
                                </div>

                                {/* Ações permancem as mesmas */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {/* ... mesmos botões de ação ... */}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna Principal - 6 colunas */}
              <div className="col-span-12 lg:col-span-6">
                <TabelaPrincipal
                  filteredExcipientes={filteredExcipientes}
                  materiaisNaArea={materiaisNaArea}
                  faltaSolicitar={faltaSolicitar}
                  inputValues={inputValues}
                  handleMateriaisNaAreaChange={handleMateriaisNaAreaChange}
                  handleDetailClick={handleDetailClick}
                  handleToggleExpandExcipient={handleToggleExpandExcipient}
                  expandedExcipient={expandedExcipient}
                  allExpanded={allExpanded}
                  togglePesado={togglePesado}
                  calcularMovimentacaoTotal={calcularMovimentacaoTotal}
                  getOrdensAtendidas={getOrdensAtendidas}
                  handleUpdateSAPValues={handleUpdateSAPValues}
                  handleUpdateAllSAPValues={handleUpdateAllSAPValues}
                  handleEditOrdem={handleEditOrdem}
                />
              </div>

              {/* Coluna de Detalhamento - 3 colunas */}
              <div className="col-span-12 lg:col-span-3 space-y-6">
                <DetalhamentoMateriais
                  getFilteredAtivos={getFilteredAtivos}
                  getAtivoStatus={getAtivoStatus}
                  ordens={ordens}
                  filteredExcipientes={filteredExcipientes}
                  materiaisNaArea={materiaisNaArea}
                />
                
                {/* Componente AlmoxarifadoManager sem passar props desnecessárias */}
                <AlmoxarifadoManager key={`almoxarifado-manager-${Date.now()}`} /> {/* Chave dinâmica para forçar re-render */}
              </div>
            </div>
          </div>
        </div>

        {/* Modais */}
        <ExcelUploader
          onDataUpdated={handleDataUpdated}
          openUploadDialog={openDialog}
          handleCloseUploadDialog={handleCloseUploadDialog}
        />

        <Sap
          open={sapDialogOpen}
          onClose={() => setSapDialogOpen(false)}
          user={user}
        />

        {/* Modal de Edição de Ordem - Versão Compacta */}
        {editingOrdemDialog && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />

              <div className="relative bg-white dark:bg-gray-800/95 rounded-lg shadow-xl w-full max-w-lg">
                {/* Header Compacto */}
                <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-white">
                      {editingOrdemDialog.nome}
                    </h3>
                    <button
                      onClick={handleCloseEditDialog}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <XCircleIcon className="w-5 h-5 text-white/80 hover:text-white" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-white/70 text-sm">
                    <span>OP: {editingOrdemDialog.op || "Não definida"}</span>
                    <span>•</span>
                    <span>
                      {
                        Object.values(editingExcipientes).filter(
                          (e) => e.pesado
                        ).length
                      }
                      /{Object.keys(editingExcipientes).length} pesados
                    </span>
                  </div>
                </div>

                {/* Lista de Excipientes Compacta */}
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Selecionar todos
                    </span>
                    <input
                      type="checkbox"
                      checked={selectAllChecked}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded text-blue-600 border-blue-300 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-2">
                    {Object.entries(editingExcipientes).map(([key, data]) => (
                      <div
                        key={key}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200
                        ${
                          data.pesado
                            ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                            : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={data.pesado}
                            onChange={() => handleToggleExcipiente(key)}
                            className="h-4 w-4 rounded text-blue-600 border-blue-300 focus:ring-blue-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {data.nome}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {data.quantidade.toFixed(3)} kg
                            </p>
                          </div>
                        </div>

                        {data.isEspecial && (
                          <button
                            disabled
                            className="px-2 py-1 text-xs font-medium rounded
                            bg-gray-100 dark:bg-gray-700 
                            text-gray-600 dark:text-gray-400 
                            border border-gray-200 dark:border-gray-600
                            opacity-50 cursor-not-allowed ml-2"
                          >
                            PA
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Compacto */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border-t border-gray-200 dark:border-gray-700/50">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCloseEditDialog}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 
                      bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 
                      rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEditDialog}
                      className="px-3 py-1.5 text-sm text-white 
                      bg-blue-600 dark:bg-blue-500 
                      hover:bg-blue-700 dark:hover:bg-blue-600 
                      rounded-md"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Adição de OP */}
        {opModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div
                className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
                onClick={() => setOpModalOpen(false)}
              />

              <div className="relative bg-white dark:bg-gray-800/95 rounded-lg shadow-xl">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700/50">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    Adicionar Ordem de Produção
                  </h3>
                </div>

                <div className="p-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número da OP
                  </label>
                  <input
                    type="text"
                    value={newOP}
                    onChange={(e) => setNewOP(e.target.value)}
                    placeholder="Digite os 7 números da OP"
                    className="w-full px-3 py-2 
                    bg-white dark:bg-gray-700
                    border border-gray-200 dark:border-gray-600 
                    text-gray-900 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-400
                    rounded-lg text-sm
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                    focus:border-transparent transition-colors"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    A OP deve conter exatamente 7 números
                  </p>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg flex justify-end gap-3">
                  <button
                    onClick={() => setOpModalOpen(false)}
                    className="px-4 py-2 text-sm 
                    text-gray-700 dark:text-gray-300 
                    bg-white dark:bg-gray-700 
                    border border-gray-200 dark:border-gray-600
                    hover:bg-gray-50 dark:hover:bg-gray-600 
                    rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveOP}
                    disabled={
                      !newOP || newOP.length !== 7 || !/^\d+$/.test(newOP)
                    }
                    className="px-4 py-2 text-sm text-white 
                    bg-blue-600 dark:bg-blue-500 
                    hover:bg-blue-700 dark:hover:bg-blue-600 
                    rounded-lg transition-colors 
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <DebugPanel />
    </RequestsProvider>
  );
}