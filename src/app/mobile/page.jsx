// pages/index.js
"use client";
import React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// Material-UI imports
import {
  alpha,
  createTheme,
  styled,
  ThemeProvider,
} from "@mui/material/styles";
import {
  AppBar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";

// Material-UI icons
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MedicationIcon from "@mui/icons-material/Medication";
import MenuIcon from "@mui/icons-material/Menu";
import NumbersIcon from "@mui/icons-material/Numbers";

// Custom components
import Autocomplete from "../../components/Autocomplete";
import Sidebar from "../../components/Sidebar";
import UserMenu from "../../components/UserMenu";

// Supabase client
import { supabase } from "../../supabaseClient";

// Estilos personalizados atualizados para mobile
const AppContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  backgroundColor: theme.palette.background.default,
}));

const AppHeader = styled(AppBar)(({ theme }) => ({
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(10px)",
  boxShadow: "none",
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  color: theme.palette.text.primary,
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  overflowY: "auto",
  backgroundColor: theme.palette.background.default,
}));

const ContentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: "none",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  "& th": {
    color: theme.palette.primary.contrastText,
    fontWeight: "bold",
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
  },
}));

// Atualize o tema
const theme = createTheme({
  palette: {
    primary: {
      main: "#004B5F",
    },
    secondary: {
      main: "#0a4064",
    },
    background: {
      default: "#F2F2F7",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 20,
          padding: "8px 16px",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
          },
        },
      },
    },
  },
});

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

  const [ordensPesadas, setOrdensPesadas] = useState([]);

  const loadState = useCallback(async (userId) => {
    try {
      // Primeiro, tenta carregar do Supabase
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
        } = data.state;
        setOrdens(ordens || []);
        setExcipientes(excipientes || {});
        setExpandedExcipient(expandedExcipient || null);
        setSelectedOrdem(selectedOrdem || null);
        setPesados(pesados || {});
        // Atualiza o localStorage com o estado do Supabase
        localStorage.setItem(`appState_${userId}`, JSON.stringify(data.state));
      } else {
        // Se não houver dados no Supabase, tenta carregar do localStorage
        const storedState = localStorage.getItem(`appState_${userId}`);
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          setOrdens(parsedState.ordens || []);
          setExcipientes(parsedState.excipientes || {});
          setExpandedExcipient(parsedState.expandedExcipient || null);
          setSelectedOrdem(parsedState.selectedOrdem || null);
          setPesados(parsedState.pesados || {});
        }
      }
    } catch (error) {
      console.error("Erro ao carregar o estado:", error);
      // Inicialize com valores padrão em caso de erro
      setOrdens([]);
      setExcipientes({});
      setExpandedExcipient(null);
      setSelectedOrdem(null);
      setPesados({});
    }
  }, []);

  const saveState = useCallback(
    async (userId) => {
      const stateToSave = {
        ordens,
        excipientes,
        expandedExcipient,
        selectedOrdem,
        pesados,
      };
      // Salva no localStorage
      localStorage.setItem(`appState_${userId}`, JSON.stringify(stateToSave));
      // Salva no Supabase
      try {
        await supabase
          .from("app_state")
          .upsert({ user_id: userId, state: stateToSave });
      } catch (error) {
        console.error("Erro ao salvar o estado no Supabase:", error);
      }
    },
    [ordens, excipientes, expandedExcipient, selectedOrdem, pesados]
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
    isLoading,
    saveState,
    user,
  ]);

  const handleAddOrdem = async () => {
    if (!ativo) return;

    let codigo, nome, excipientesData;

    if (addMode === "codigo") {
      // Busca por código
      const { data, error } = await supabase
        .from("DataBase_ems")
        .select("Codigo_Receita, Ativo, Excipiente, qtd_materia_prima")
        .eq("Codigo_Receita", ativo);

      if (error || !data || data.length === 0) {
        alert("Código não encontrado");
        return;
      }

      codigo = data[0].Codigo_Receita;
      nome = data[0].Ativo;
      excipientesData = data;
    } else {
      // Busca por ativo
      const { data, error } = await supabase
        .from("DataBase_ems")
        .select("Codigo_Receita, Ativo, Excipiente, qtd_materia_prima")
        .ilike("Ativo", `%${ativo}%`);

      if (error || !data || data.length === 0) {
        alert("Ativo não encontrado");
        return;
      }

      codigo = data[0].Codigo_Receita;
      nome = data[0].Ativo;
      excipientesData = data;
    }

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
        acc[item.Excipiente] = item.qtd_materia_prima;
        return acc;
      }, {}),
    };

    setOrdens((prevOrdens) => [...prevOrdens, novaOrdem]);
    // Removemos a linha que limpa o input
    // setAtivo("");

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
  };

  const handleRemoveOrdem = (index) => {
    const newOrdens = [...ordens];
    newOrdens.splice(index, 1);
    setOrdens(newOrdens);
    calcularExcipientes(newOrdens);
  };

  const handleEditOrdem = async (ordem) => {
    setEditingOrdemDialog(ordem);

    // Buscar os excipientes específicos para esta ordem
    const { data, error } = await supabase
      .from("DataBase_ems")
      .select("Excipiente, qtd_materia_prima")
      .eq("Codigo_Receita", ordem.codigo);

    if (error) {
      console.error("Erro ao buscar excipientes:", error);
      return;
    }

    const ordemExcipientes = data.reduce((acc, item) => {
      acc[item.Excipiente] = {
        quantidade: item.qtd_materia_prima,
        pesado: pesados[item.Excipiente]?.[ordem.id] || false,
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
    Object.entries(editingExcipientes).forEach(([excipient, { pesado }]) => {
      if (!newPesados[excipient]) newPesados[excipient] = {};
      newPesados[excipient][editingOrdemDialog.id] = pesado;
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

  const calcularExcipientes = async (
    ordensAtuais = ordens,
    pesadosAtual = pesados
  ) => {
    if (ordensAtuais.length === 0) {
      setExcipientes({});
      return;
    }

    let newExcipientes = {};

    for (let ordem of ordensAtuais) {
      const { data, error } = await supabase
        .from("DataBase_ems")
        .select("Excipiente, qtd_materia_prima")
        .eq("Codigo_Receita", ordem.codigo);

      if (error) {
        alert("Erro ao calcular excipientes: " + error.message);
        return;
      }

      data.forEach((item) => {
        if (!newExcipientes[item.Excipiente]) {
          newExcipientes[item.Excipiente] = {
            total: 0,
            totalNaoPesado: 0,
            ordens: [],
          };
        }
        newExcipientes[item.Excipiente].total += item.qtd_materia_prima;
        if (!pesadosAtual[item.Excipiente]?.[ordem.id]) {
          newExcipientes[item.Excipiente].totalNaoPesado +=
            item.qtd_materia_prima;
        }
        newExcipientes[item.Excipiente].ordens.push({
          id: ordem.id,
          codigo: ordem.codigo,
          quantidade: item.qtd_materia_prima,
          nome: ordem.nome,
          op: ordem.op,
          pesado: pesadosAtual[item.Excipiente]?.[ordem.id] || false,
        });
      });
    }

    // Arredonda os totais para 3 casas decimais
    Object.keys(newExcipientes).forEach((key) => {
      newExcipientes[key].total = Number(newExcipientes[key].total.toFixed(3));
      newExcipientes[key].totalNaoPesado = Number(
        newExcipientes[key].totalNaoPesado.toFixed(3)
      );
    });

    setExcipientes(newExcipientes);
  };

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
    let filtered = excipientes;

    if (selectedOrdem) {
      filtered = Object.fromEntries(
        Object.entries(excipientes)
          .map(([excipient, data]) => {
            const filteredOrdens = data.ordens.filter(
              (o) => o.nome === selectedOrdem.nome
            );
            const filteredTotal = filteredOrdens.reduce(
              (sum, o) => sum + o.quantidade,
              0
            );
            const filteredTotalNaoPesado = filteredOrdens.reduce(
              (sum, o) => (o.pesado ? sum : sum + o.quantidade),
              0
            );
            return [
              excipient,
              {
                ...data,
                ordens: filteredOrdens,
                total: filteredTotal,
                totalNaoPesado: filteredTotalNaoPesado,
              },
            ];
          })
          .filter(([_, data]) => data.ordens.length > 0)
      );
    }

    if (filtrarExcipientesEspeciais) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([excipient]) =>
          EXCIPIENTES_ESPECIAIS.includes(excipient)
        )
      );
    }

    return filtered;
  }, [selectedOrdem, excipientes, filtrarExcipientesEspeciais]);

  const calcularMovimentacaoTotal = useCallback(() => {
    return Object.values(filteredExcipientes).reduce(
      (total, { totalNaoPesado }) => total + totalNaoPesado,
      0
    );
  }, [filteredExcipientes]);

  const handleOrdemClick = (ordem) => {
    if (selectedOrdem && selectedOrdem.codigo === ordem.codigo) {
      setSelectedOrdem(null);
    } else {
      setSelectedOrdem(ordem);
    }
  };

  const handleExcipientClick = (excipient) => {
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

      // Recalcular excipientes imediatamente após a atualização das ordens
      calcularExcipientes(newOrdens);

      return newOrdens;
    });
    handleCloseDialog();
  };

  const handleLogout = async () => {
    if (user) {
      await saveState(user.id); // Salva o estado final antes de deslogar
      localStorage.removeItem(`appState_${user.id}`);
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const getOPList = useCallback(
    (nomeSelecionado) => {
      if (!ordens || ordens.length === 0) return "Nenhuma OP adicionada";

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
    },
    [ordens]
  );

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

  const getFilterInfo = () => {
    if (!selectedOrdem) return null;

    const ops = ordens
      .filter((o) => o.nome === selectedOrdem.nome && o.op)
      .map((o) => o.op);

    return ops.length > 0 ? ops.join(", ") : "Nenhuma OP";
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
    setAddMode((prevMode) => (prevMode === "codigo" ? "ativo" : "codigo"));
    setAtivo(""); // Limpar o campo ao mudar o modo
  };

  // Adicione esta função para buscar ativos
  const fetchAtivos = async (searchTerm) => {
    const { data, error } = await supabase
      .from("DataBase_ems")
      .select("Ativo")
      .ilike("Ativo", `%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error("Erro ao buscar ativos:", error);
      return [];
    }

    return data.map((item) => item.Ativo);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{ color: theme.palette.primary.main }}
        />
      </Box>
    );
  }

  if (!user) {
    return null; // ou um componente de carregamento
  }

  return (
    <ThemeProvider theme={theme}>
      <AppContainer>
        <AppHeader position="static">
          <Toolbar variant="dense">
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              size="small"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, fontWeight: "bold", color: "inherit" }}
            >
              Pesagem
            </Typography>
            <UserMenu user={user} onUserUpdate={handleUserUpdate} />
          </Toolbar>
        </AppHeader>
        <Sidebar open={drawerOpen} toggleDrawer={toggleDrawer} />
        <MainContent>
          <ContentCard>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Gestão de Ordens
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  mb: 2,
                  width: "100%",
                }}
              >
                <Box sx={{ mb: 1 }}>
                  {addMode === "codigo" ? (
                    <TextField
                      fullWidth
                      type="number"
                      label="Código Receita"
                      value={ativo}
                      onChange={(e) => setAtivo(e.target.value)}
                      onKeyPress={handleKeyPress}
                      size="small"
                      margin="dense"
                      variant="outlined"
                    />
                  ) : (
                    <Autocomplete
                      label="Ativo"
                      value={ativo}
                      onChange={setAtivo}
                      onKeyPress={handleKeyPress}
                      size="small"
                      margin="dense"
                      variant="outlined"
                      fullWidth
                    />
                  )}
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Button
                    variant="outlined"
                    onClick={toggleAddMode}
                    size="small"
                    sx={{ mr: 1, flexGrow: 1 }}
                  >
                    {addMode === "codigo"
                      ? "Buscar por Ativo"
                      : "Buscar por Código"}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddOrdem}
                    size="small"
                    sx={{ flexGrow: 1 }}
                  >
                    Adicionar Ordem
                  </Button>
                </Box>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Ordens Adicionadas
            </Typography>
            <List dense component="nav" aria-label="ordens adicionadas">
              {ordens.map((ordem) => (
                <ListItem
                  key={ordem.id}
                  button
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: alpha(theme.palette.background.paper, 0.7),
                  }}
                >
                  <ListItemText
                    primary={
                      <>
                        {ordem.op && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: "bold",
                              color: theme.palette.primary.main,
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.1
                              ),
                              padding: "2px 6px",
                              borderRadius: "4px",
                              display: "inline-block",
                              mb: 0.5,
                            }}
                          >
                            OP: {ordem.op}
                          </Typography>
                        )}
                        <Typography variant="body2" component="div">
                          {ordem.nome}
                        </Typography>
                      </>
                    }
                    secondary={`Código: ${ordem.codigo}`}
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      edge="end"
                      onChange={() => handleToggleOrdemPesada(ordem)}
                      checked={false}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Ordens Pesadas
            </Typography>
            <List dense component="nav" aria-label="ordens pesadas">
              {ordensPesadas.map((ordem) => (
                <ListItem
                  key={ordem.id}
                  button
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                  }}
                >
                  <ListItemText
                    primary={
                      <>
                        {ordem.op && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: "bold",
                              color: theme.palette.success.main,
                              backgroundColor: alpha(
                                theme.palette.success.main,
                                0.1
                              ),
                              padding: "2px 6px",
                              borderRadius: "4px",
                              display: "inline-block",
                              mb: 0.5,
                            }}
                          >
                            OP: {ordem.op}
                          </Typography>
                        )}
                        <Typography variant="body2" component="div">
                          {ordem.nome}
                        </Typography>
                      </>
                    }
                    secondary={`Código: ${ordem.codigo}`}
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      edge="end"
                      onChange={() => handleToggleOrdemPesada(ordem)}
                      checked={true}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </ContentCard>
        </MainContent>
      </AppContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Adicionar OP</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="op"
            label="Número da OP"
            type="text"
            fullWidth
            variant="standard"
            value={opNumber}
            onChange={(e) => setOpNumber(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleAddOP}>Adicionar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editingOrdemDialog}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              Editar Ordem: {editingOrdemDialog?.nome}
            </Typography>
            {editingOrdemDialog?.op && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  padding: "2px 6px",
                  borderRadius: "4px",
                  display: "inline-block",
                }}
              >
                OP: {editingOrdemDialog?.op}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleSelectAll}
              startIcon={
                selectAllChecked ? (
                  <CheckCircleIcon />
                ) : (
                  <CheckCircleOutlineIcon />
                )
              }
            >
              {selectAllChecked ? "Desmarcar Todos" : "Marcar Todos"}
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Excipiente</TableCell>
                  <TableCell align="right">Quantidade (kg)</TableCell>
                  <TableCell align="center">Pesado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(editingExcipientes).map(
                  ([excipient, { quantidade, pesado }]) => (
                    <TableRow key={excipient}>
                      <TableCell>{excipient}</TableCell>
                      <TableCell align="right">
                        {quantidade.toFixed(3)}
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={pesado}
                          onChange={() => handleToggleExcipiente(excipient)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancelar</Button>
          <Button
            onClick={handleSaveEditDialog}
            variant="contained"
            color="primary"
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
