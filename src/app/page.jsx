// pages/index.js
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";
import ScaleIcon from "@mui/icons-material/Scale";
import { Collapse, Box, Chip, Divider } from "@mui/material";
import MedicationIcon from "@mui/icons-material/Medication";
import React from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import MenuIcon from "@mui/icons-material/Menu";
import {
  ThemeProvider,
  createTheme,
  alpha,
  styled,
} from "@mui/material/styles";
import Sidebar from "../components/Sidebar";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { v4 as uuidv4 } from "uuid"; // Importe a biblioteca uuid para gerar IDs únicos
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import UserMenu from "../components/UserMenu";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { CircularProgress } from "@mui/material";

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
    const { data, error } = await supabase
      .from("DataBase_ems")
      .select("*")
      .eq("Codigo_Receita", ativo);

    if (error) {
      alert(error.message);
    } else if (data.length > 0) {
      let newOP = "";
      if (autoIncrementOP) {
        if (initialOP) {
          newOP = initialOP;
          setInitialOP((parseInt(initialOP) + 1).toString());
        } else if (lastOP) {
          newOP = (lastOP + 1).toString();
          setLastOP(lastOP + 1);
        } else {
          newOP = "2213345";
          setLastOP(2213345);
        }
      }

      const newOrdem = {
        id: uuidv4(),
        codigo: ativo,
        nome: data[0].Ativo,
        op: newOP,
      };
      const newOrdens = [...ordens, newOrdem];
      setOrdens(newOrdens);
      calcularExcipientes(newOrdens);
    } else {
      alert("Receita não encontrada");
    }
  };

  const handleRemoveOrdem = (index) => {
    const newOrdens = [...ordens];
    newOrdens.splice(index, 1);
    setOrdens(newOrdens);
    calcularExcipientes(newOrdens);
  };

  const handleEditOrdem = (ordem) => {
    const ordemExcipientes = Object.entries(excipientes).reduce(
      (acc, [excipient, data]) => {
        const ordemData = data.ordens.find((o) => o.id === ordem.id);
        if (ordemData) {
          acc[excipient] = {
            quantidade: ordemData.quantidade,
            pesado: pesados[excipient]?.[ordem.id] || false,
          };
        }
        return acc;
      },
      {}
    );

    setEditingOrdemDialog(ordem);
    setEditingExcipientes(ordemExcipientes);
    setSelectAllChecked(Object.values(ordemExcipientes).every((e) => e.pesado));
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
        alert(error.message);
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
    if (!selectedOrdem) return excipientes;

    return Object.fromEntries(
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
  }, [selectedOrdem, excipientes]);

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
              <Box sx={{ display: "flex", alignItems: "center", mt: 2, mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoIncrementOP}
                      onChange={toggleAutoIncrementOP}
                      size="small"
                      color="primary"
                    />
                  }
                  label="Auto add OP"
                  sx={{ mr: 2 }}
                />
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
              {autoIncrementOP && (
                <>
                  <TextField
                    fullWidth
                    type="number"
                    label="OP Inicial"
                    value={initialOP}
                    onChange={(e) => setInitialOP(e.target.value)}
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
                    "&.Mui-selected": {
                      backgroundColor: theme.palette.secondary.light,
                      "&:hover": {
                        backgroundColor: theme.palette.secondary.main,
                      },
                    },
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {selectedOrdem && selectedOrdem.id === ordem.id && (
                          <CheckCircleOutlineIcon
                            color="primary"
                            fontSize="small"
                            sx={{ mr: 1 }}
                          />
                        )}
                        <Box>
                          {ordem.op && (
                            <Typography variant="body2" color="primary">
                              OP: {ordem.op}
                            </Typography>
                          )}
                          <Typography variant="body2">
                            {ordem.codigo}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {ordem.nome}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEditOrdem(ordem)}
                      size="small"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="add op"
                      onClick={() => handleOpenDialog(ordem.id)}
                      size="small"
                    >
                      <AddCircleOutlineIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleRemoveOrdem(ordem.id)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </SidebarContainer>
          <MainContent>
            <ContentCard>
              <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                {selectedOrdem ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1,
                      backgroundColor: alpha(theme.palette.primary.light, 0.1),
                      borderRadius: 1,
                      mr: 2,
                    }}
                  >
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{
                              fontWeight: "bold",
                              border: "none",
                              pr: 1,
                              pl: 0,
                            }}
                          >
                            Filtrando:
                          </TableCell>
                          <TableCell sx={{ border: "none", pl: 1 }}>
                            {selectedOrdem.nome}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{
                              fontWeight: "bold",
                              border: "none",
                              pr: 1,
                              pl: 0,
                            }}
                          >
                            OPs:
                          </TableCell>
                          <TableCell sx={{ border: "none", pl: 1 }}>
                            {getFilterInfo()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Paper>
                ) : (
                  <Typography variant="h6">Todos os itens</Typography>
                )}
              </Box>
              <StyledTableContainer>
                <Table size="small">
                  <StyledTableHead>
                    <TableRow>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={toggleAllExcipients}
                          sx={{ color: "inherit", marginRight: 1 }}
                        >
                          {allExpanded ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                        Excipiente
                      </TableCell>
                      <TableCell align="right">Qtd. Total (Kg)</TableCell>
                      <TableCell padding="checkbox">Detalhes</TableCell>
                    </TableRow>
                  </StyledTableHead>
                  <TableBody>
                    {Object.entries(filteredExcipientes).map(
                      ([excipient, { total, ordens, totalNaoPesado }]) => {
                        const allPesado = ordens.every((ordem) => ordem.pesado);
                        return (
                          <React.Fragment key={excipient}>
                            <StyledTableRow
                              hover
                              onClick={() => handleExcipientClick(excipient)}
                              sx={{
                                cursor: "pointer",
                                backgroundColor: allPesado
                                  ? "rgba(0, 0, 0, 0.1)"
                                  : "inherit",
                              }}
                            >
                              <TableCell component="th" scope="row">
                                <Typography
                                  variant="body2"
                                  color={
                                    allPesado
                                      ? "text.secondary"
                                      : [
                                          "LACTOSE (200)",
                                          "LACTOSE (50/70)",
                                          "AMIDO DE MILHO PREGELATINIZADO",
                                          "CELULOSE MIC (TIPO200)",
                                          "CELULOSE MIC.(TIPO102)",
                                          "FOSF.CAL.DIB.(COMPDIRETA)",
                                          "AMIDO",
                                          "CELULOSE+LACTOSE",
                                        ].includes(excipient)
                                      ? "secondary"
                                      : "primary"
                                  }
                                >
                                  {excipient}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">
                                  {allPesado ? (
                                    <Chip
                                      label="Pesado"
                                      size="small"
                                      color="default"
                                    />
                                  ) : (
                                    `${totalNaoPesado.toFixed(3)} kg`
                                  )}
                                </Typography>
                              </TableCell>
                              <TableCell padding="checkbox">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleToggleExpandExcipient(excipient)
                                  }
                                >
                                  {expandedExcipient === excipient ? (
                                    <ExpandLessIcon fontSize="small" />
                                  ) : (
                                    <ExpandMoreIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </TableCell>
                            </StyledTableRow>
                            <TableRow>
                              <TableCell
                                style={{ paddingBottom: 0, paddingTop: 0 }}
                                colSpan={3}
                              >
                                <Collapse
                                  in={
                                    expandedExcipient === excipient ||
                                    allExpanded
                                  }
                                  timeout="auto"
                                  unmountOnExit
                                >
                                  <Box sx={{ my: 1 }}>
                                    <Table size="small" aria-label="purchases">
                                      <TableHead>
                                        <TableRow
                                          sx={{
                                            backgroundColor:
                                              theme.palette.secondary.light,
                                          }}
                                        >
                                          <TableCell>OP</TableCell>
                                          <TableCell>Código</TableCell>
                                          <TableCell>Nome</TableCell>
                                          <TableCell align="right">
                                            Quantidade (kg)
                                          </TableCell>
                                          <TableCell align="center">
                                            Pesado
                                          </TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {ordens.map((ordem) => (
                                          <TableRow
                                            key={ordem.id}
                                            sx={{
                                              backgroundColor: ordem.pesado
                                                ? "rgba(0, 0, 0, 0.1)"
                                                : "inherit",
                                              "&:hover": {
                                                backgroundColor: ordem.pesado
                                                  ? "rgba(0, 0, 0, 0.2)"
                                                  : "rgba(0, 0, 0, 0.04)",
                                              },
                                            }}
                                          >
                                            <TableCell>
                                              <Typography variant="caption">
                                                {ordem.op || "-"}
                                              </Typography>
                                            </TableCell>
                                            <TableCell
                                              component="th"
                                              scope="row"
                                            >
                                              <Typography variant="caption">
                                                {ordem.codigo}
                                              </Typography>
                                            </TableCell>
                                            <TableCell>
                                              <Typography variant="caption">
                                                {ordem.nome}
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                              <Typography variant="caption">
                                                {ordem.quantidade.toFixed(3)} kg
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                              <IconButton
                                                size="small"
                                                onClick={() =>
                                                  togglePesado(
                                                    excipient,
                                                    ordem.id
                                                  )
                                                }
                                                color={
                                                  ordem.pesado
                                                    ? "primary"
                                                    : "default"
                                                }
                                              >
                                                <CheckCircleIcon fontSize="small" />
                                              </IconButton>
                                              {ordem.pesado && (
                                                <Chip
                                                  label="Pesado"
                                                  size="small"
                                                  color="primary"
                                                  sx={{ ml: 1 }}
                                                />
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      }
                    )}
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        sx={{
                          borderTop: `2px solid ${theme.palette.primary.main}`,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="primary"
                        >
                          Movimentação total:{" "}
                          {calcularMovimentacaoTotal().toFixed(3)} kg
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </StyledTableContainer>
            </ContentCard>
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
          Editar Ordem: {editingOrdemDialog?.nome} (OP:{" "}
          {editingOrdemDialog?.op || "N/A"})
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Button onClick={handleSelectAll} variant="outlined" sx={{ mr: 1 }}>
              {selectAllChecked ? "Desmarcar Todos" : "Selecionar Todos"}
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
