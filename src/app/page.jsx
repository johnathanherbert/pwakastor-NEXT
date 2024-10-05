// pages/index.js
"use client";
import React from "react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Autocomplete as MuiAutocomplete,
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
  InputAdornment,
  TextareaAutosize,
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
import WarningIcon from "@mui/icons-material/Warning";
import CheckIcon from "@mui/icons-material/Check";
import ErrorIcon from "@mui/icons-material/Error";
import ScaleIcon from "@mui/icons-material/Scale";

// Custom components
import Autocomplete from "../components/Autocomplete";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import TabelaPrincipal from "../components/TabelaPrincipal";
import DetalhamentoMateriais from "../components/DetalhamentoMateriais";

// Supabase client
import { supabase } from "../supabaseClient";

// Estilos personalizados
const AppContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  backgroundColor: theme.palette.background.default,
}));

const AppHeader = styled(AppBar)(({ theme }) => ({
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(10px)",
  boxShadow: "none",
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  color: theme.palette.text.primary, // Adicione esta linha
}));

const SidebarContainer = styled(Paper)(({ theme }) => ({
  width: "25%",
  overflowY: "auto",
  borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  backgroundColor: theme.palette.background.paper,
  boxShadow: "none",
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  overflowY: "auto",
  backgroundColor: theme.palette.background.default,
}));

const ContentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
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
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.light, 0.1),
  },
}));

const StyledExpandedRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.secondary.light, 0.05),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    borderRadius: 8,
    transition: "all 0.3s",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
    "&.Mui-focused": {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiInputLabel-outlined": {
    color: alpha(theme.palette.text.primary, 0.7),
  },
  "& .MuiInputBase-input": {
    color: theme.palette.text.primary,
  },
}));

const StyledFilledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiFilledInput-root": {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    borderRadius: 4,
    transition: "background-color 0.3s, box-shadow 0.3s",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
    "&.Mui-focused": {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
  "& .MuiFilledInput-input": {
    padding: "10px 12px",
  },
  "& .MuiInputLabel-filled": {
    transform: "translate(12px, 12px) scale(1)",
  },
  "& .MuiInputLabel-filled.MuiInputLabel-shrink": {
    transform: "translate(12px, -9px) scale(0.75)",
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
            backgroundColor: "rgba(255, 255, 255, 0.09)",
            borderRadius: 8,
            transition: "all 0.3s",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.13)",
            },
            "&.Mui-focused": {
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              boxShadow: "0 0 0 2px rgba(0, 75, 95, 0.2)",
            },
          },
          "& .MuiOutlinedInput-notchedOutline": {
            border: "none",
          },
          "& .MuiInputLabel-outlined": {
            color: "rgba(0, 0, 0, 0.6)",
          },
          "& .MuiInputBase-input": {
            color: "rgba(0, 0, 0, 0.87)",
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

// Adicione este estilo CSS personalizado no início do seu arquivo, junto com os outros estilos
const removeArrows = {
  "& input[type=number]": {
    MozAppearance: "textfield",
    "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
      WebkitAppearance: "none",
      margin: 0,
    },
  },
};

// Atualize o StyledFilledTextField ou crie um novo estilo específico para este input
const StyledMaterialInput = styled(TextField)(({ theme }) => ({
  "& .MuiFilledInput-root": {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    borderRadius: 4,
    transition: "background-color 0.3s, box-shadow 0.3s",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
    "&.Mui-focused": {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
  "& .MuiFilledInput-input": {
    padding: "10px 12px",
    fontSize: "0.875rem",
    textAlign: "right",
  },
  "& .MuiInputAdornment-root": {
    marginLeft: 0,
  },
}));

// Atualize o DetailTable para se parecer mais com a tabela principal
const DetailTable = styled(Table)(({ theme }) => ({
  "& .MuiTableCell-head": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: "bold",
    padding: "12px 16px",
  },
  "& .MuiTableCell-body": {
    fontSize: "0.875rem",
    padding: "10px 16px",
  },
}));

// Adicione este novo componente estilizado para as linhas da tabela
const StyledDetailTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
  },
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.light, 0.1),
  },
}));

const StatusCell = styled(TableCell)(({ status, theme }) => ({
  backgroundColor:
    status === "completo"
      ? alpha(theme.palette.success.main, 0.2)
      : status === "parcial"
      ? alpha(theme.palette.warning.main, 0.2)
      : alpha(theme.palette.grey[300], 0.5),
  color:
    status === "completo"
      ? theme.palette.success.dark
      : status === "parcial"
      ? theme.palette.warning.dark
      : theme.palette.text.secondary,
  fontWeight: "bold",
}));

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

  const [materiaisNaArea, setMateriaisNaArea] = useState({});
  const [faltaSolicitar, setFaltaSolicitar] = useState({});

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedExcipientDetail, setSelectedExcipientDetail] = useState(null);
  // ... outros estados ...
  const [excipientDetailDialogOpen, setExcipientDetailDialogOpen] =
    useState(false);
  const [selectedExcipientForDetail, setSelectedExcipientForDetail] =
    useState(null);

  const [inputValues, setInputValues] = useState({});

  const [showAnalysis, setShowAnalysis] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode) {
      setDarkMode(JSON.parse(savedMode));
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#004B5F",
      },
      secondary: {
        main: "#0a4064",
      },
      background: {
        default: darkMode ? "#121212" : "#F2F2F7",
        paper: darkMode ? "#1E1E1E" : "#FFFFFF",
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
              backgroundColor: "rgba(255, 255, 255, 0.09)",
              borderRadius: 8,
              transition: "all 0.3s",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.13)",
              },
              "&.Mui-focused": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                boxShadow: "0 0 0 2px rgba(0, 75, 95, 0.2)",
              },
            },
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "& .MuiInputLabel-outlined": {
              color: "rgba(0, 0, 0, 0.6)",
            },
            "& .MuiInputBase-input": {
              color: "rgba(0, 0, 0, 0.87)",
            },
          },
        },
      },
    },
  });

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
          inputValues, // Adicione esta linha
        } = data.state;
        setOrdens(ordens || []);
        setExcipientes(excipientes || {});
        setExpandedExcipient(expandedExcipient || null);
        setSelectedOrdem(selectedOrdem || null);
        setPesados(pesados || {});
        setMateriaisNaArea(materiaisNaArea || {});
        setInputValues(inputValues || {}); // Adicione esta linha
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
          setInputValues(parsedState.inputValues || {}); // Adicione esta linha
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
      setInputValues({}); // Adicione esta linha
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
    [ordens, excipientes, expandedExcipient, selectedOrdem, pesados, materiaisNaArea, inputValues] // Adicione inputValues aqui
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
        // Só adiciona ao total e totalNaoPesado se não estiver pesado
        if (!pesadosAtual[item.Excipiente]?.[ordem.id]) {
          newExcipientes[item.Excipiente].total += item.qtd_materia_prima;
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
    setAddMode((prevMode) => (prevMode === "codigo" ? "ativo" : "codigo"));
    setAtivo(""); // Limpar o campo ao mudar o modo
  };

  // Função para atualizar a quantidade de materiais na área
  const handleMateriaisNaAreaChange = useCallback((excipient, value) => {
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
  }, [user, saveState]);

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

  const getStatusColor = (status) => {
    switch (status) {
      case "pesado":
        return alpha(theme.palette.success.main, 0.1);
      case "ok":
        return alpha(theme.palette.success.main, 0.1);
      case status.startsWith("atende") ? status : "":
        return alpha(theme.palette.warning.main, 0.1);
      case "warning":
        return alpha(theme.palette.warning.main, 0.1);
      case "error":
        return alpha(theme.palette.error.main, 0.1);
      default:
        return alpha(theme.palette.grey[300], 0.1);
    }
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
              color="inherit" // Mude para "inherit"
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
              sx={{ flexGrow: 1, fontWeight: "bold", color: "inherit" }} // Mude para "inherit"
            >
              Pesagem
            </Typography>
            {/* <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  icon={<Brightness7Icon />}
                  checkedIcon={<Brightness4Icon />}
                />
              }
              label={darkMode ? "Modo Escuro" : "Modo Claro"}
            /> */}
            <UserMenu user={user} onUserUpdate={handleUserUpdate} />
          </Toolbar>
        </AppHeader>
        <Sidebar open={drawerOpen} toggleDrawer={toggleDrawer} />
        <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
          <SidebarContainer>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Gestão de Ordens
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  width: "100%",
                }}
              >
                <Box sx={{ flexGrow: 1, position: "relative" }}>
                  {addMode === "codigo" ? (
                    <StyledTextField
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
                      fullWidth
                      label="Ativo"
                      value={ativo}
                      onChange={setAtivo}
                      onKeyPress={handleKeyPress}
                      size="small"
                      margin="dense"
                      variant="outlined"
                      TextFieldComponent={StyledTextField}
                    />
                  )}
                </Box>
                <IconButton onClick={toggleAddMode} sx={{ ml: 1 }}>
                  {addMode === "codigo" ? <MedicationIcon /> : <NumbersIcon />}
                </IconButton>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mt: 2,
                  mb: 2,
                  gap: 1,
                }}
              >
                <Button
                  variant="contained"
                  color={autoIncrementOP ? "primary" : "inherit"}
                  onClick={toggleAutoIncrementOP}
                  size="small"
                  sx={{
                    flexGrow: 1,
                    whiteSpace: "nowrap",
                    padding: "6px 8px",
                    minWidth: "auto",
                  }}
                  startIcon={
                    autoIncrementOP ? (
                      <CheckCircleIcon />
                    ) : (
                      <CheckCircleOutlineIcon />
                    )
                  }
                >
                  Auto OP
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddOrdem}
                  size="small"
                  sx={{
                    flexGrow: 1,
                    whiteSpace: "nowrap",
                    padding: "6px 8px",
                    minWidth: "auto",
                  }}
                >
                  Add Ordem
                </Button>
              </Box>
              {autoIncrementOP && (
                <>
                  <StyledTextField
                    fullWidth
                    type="number"
                    label="OP Inicial"
                    value={initialOP}
                    onChange={(e) => setInitialOP(e.target.value)}
                    onKeyPress={handleKeyPress}
                    size="small"
                    margin="dense"
                    variant="outlined"
                  />
                  <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                    <Typography variant="caption" sx={{ flexGrow: 1 }}>
                      Próxima OP:{" "}
                      {initialOP
                        ? parseInt(initialOP) + 1
                        : lastOP
                        ? lastOP + 1
                        : 2213345}
                    </Typography>
                    <Button size="small" onClick={resetOP}>
                      Reset
                    </Button>
                  </Box>
                </>
              )}
            </Box>
            <Divider />
            <List dense component="nav" aria-label="ordens adicionadas">
              {ordens.map((ordem) => (
                <ListItem
                  key={ordem.id}
                  button
                  selected={selectedOrdem && selectedOrdem.id === ordem.id}
                  onClick={() => handleOrdemClick(ordem)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    "&.Mui-selected": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
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
                    {!ordem.op && (
                      <IconButton
                        edge="end"
                        aria-label="add-op"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(ordem.id);
                        }}
                      >
                        <AddCircleOutlineIcon />
                      </IconButton>
                    )}
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditOrdem(ordem);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOrdem(ordem.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </SidebarContainer>
          <MainContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              >
                Gestão de Materiais
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: "4px", // Reduzido o arredondamento
                  overflow: "visible", // Alterado para 'visible' para evitar cortes
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box sx={{ width: "65%", p: 1 }}>
                  {" "}
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.text.secondary,
                      p: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    Tabela Principal
                  </Typography>
                  <Box sx={{ p: 2 }}>
                    <TabelaPrincipal
                      filteredExcipientes={filteredExcipientes}
                      materiaisNaArea={materiaisNaArea}
                      faltaSolicitar={faltaSolicitar}
                      inputValues={inputValues} // Certifique-se de que esta linha está presente
                      handleMateriaisNaAreaChange={handleMateriaisNaAreaChange}
                      handleDetailClick={handleDetailClick}
                      handleToggleExpandExcipient={handleToggleExpandExcipient}
                      expandedExcipient={expandedExcipient}
                      allExpanded={allExpanded}
                      togglePesado={togglePesado}
                      theme={theme}
                      calcularMovimentacaoTotal={calcularMovimentacaoTotal}
                      getOrdensAtendidas={getOrdensAtendidas}
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: "35%",
                    borderLeft: `1px solid ${theme.palette.divider}`,
                    p: 1,
                  }}
                >
                  {" "}
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.text.secondary,
                      p: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    Detalhamento de Materiais
                  </Typography>
                  <Box sx={{ p: 2 }}>
                    <DetalhamentoMateriais
                      getFilteredAtivos={getFilteredAtivos}
                      getAtivoStatus={getAtivoStatus}
                      handleDetailClick={handleDetailClick}
                      theme={theme}
                      ordens={ordens}
                      filteredExcipientes={filteredExcipientes}
                      materiaisNaArea={materiaisNaArea}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </MainContent>
        </Box>
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

      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
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
            <Typography
              variant="h5"
              component="span"
              sx={{ fontWeight: "bold" }}
            >
              Detalhes do Ativo: {selectedExcipientDetail}
            </Typography>
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
              OPs: {getOPList(ordens, selectedExcipientDetail)}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedExcipientDetail && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: theme.palette.primary.main }}
                >
                  Excipientes Disponíveis para Pesar
                </Typography>
                <StyledTableContainer>
                  <DetailTable size="small">
                    <StyledTableHead>
                      <TableRow>
                        <TableCell>Excipiente</TableCell>
                        <TableCell align="right">
                          Quantidade Necessária (kg)
                        </TableCell>
                        <TableCell align="right">
                          Quantidade na Área (kg)
                        </TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </StyledTableHead>
                    <TableBody>
                      {Object.entries(filteredExcipientes)
                        .filter(([_, data]) =>
                          data.ordens.some(
                            (ordem) => ordem.nome === selectedExcipientDetail
                          )
                        )
                        .map(([excipient, data]) => {
                          const quantidadeNecessaria = data.ordens
                            .filter(
                              (ordem) => ordem.nome === selectedExcipientDetail
                            )
                            .reduce((sum, ordem) => {
                              // Só adiciona à quantidade necessária se não estiver pesado
                              return (
                                sum + (ordem.pesado ? 0 : ordem.quantidade)
                              );
                            }, 0);
                          const quantidadeNaArea =
                            materiaisNaArea[excipient] || 0;
                          const status =
                            quantidadeNaArea >= quantidadeNecessaria
                              ? "completo"
                              : quantidadeNaArea > 0
                              ? "parcial"
                              : "indisponivel";
                          return (
                            <StyledDetailTableRow key={excipient}>
                              <TableCell>{excipient}</TableCell>
                              <TableCell align="right">
                                {quantidadeNecessaria.toFixed(3) + " Kg"}
                              </TableCell>
                              <TableCell align="right">
                                {quantidadeNaArea.toFixed(3) + " Kg"}
                              </TableCell>
                              <StatusCell align="center" status={status}>
                                {status === "completo"
                                  ? "Disponível"
                                  : status === "parcial"
                                  ? "Parcial"
                                  : "Indisponível"}
                              </StatusCell>
                            </StyledDetailTableRow>
                          );
                        })}
                    </TableBody>
                  </DetailTable>
                </StyledTableContainer>
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: theme.palette.error.main }}
                >
                  Excipientes Faltando Solicitar
                </Typography>
                <StyledTableContainer>
                  <DetailTable size="small">
                    <StyledTableHead>
                      <TableRow>
                        <TableCell>Excipiente</TableCell>
                        <TableCell align="right">
                          Quantidade Faltante (kg)
                        </TableCell>
                      </TableRow>
                    </StyledTableHead>
                    <TableBody>
                      {Object.entries(filteredExcipientes)
                        .filter(([_, data]) =>
                          data.ordens.some(
                            (ordem) => ordem.nome === selectedExcipientDetail
                          )
                        )
                        .map(([excipient, data]) => {
                          const quantidadeNecessaria = data.ordens
                            .filter(
                              (ordem) => ordem.nome === selectedExcipientDetail
                            )
                            .reduce((sum, ordem) => {
                              // Só adiciona à quantidade necessária se não estiver pesado
                              return (
                                sum + (ordem.pesado ? 0 : ordem.quantidade)
                              );
                            }, 0);
                          const quantidadeNaArea =
                            materiaisNaArea[excipient] || 0;
                          const quantidadeFaltante = Math.max(
                            quantidadeNecessaria - quantidadeNaArea,
                            0
                          );
                          if (quantidadeFaltante > 0) {
                            return (
                              <StyledDetailTableRow key={excipient}>
                                <TableCell>{excipient}</TableCell>
                                <TableCell align="right">
                                  {quantidadeFaltante.toFixed(3) + " Kg"}
                                </TableCell>
                              </StyledDetailTableRow>
                            );
                          }
                          return null;
                        })
                        .filter(Boolean)}
                    </TableBody>
                  </DetailTable>
                </StyledTableContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDetailDialog}
            variant="contained"
            color="primary"
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
