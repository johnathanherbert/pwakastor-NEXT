// pages/index.js
"use client";
import { useState, useEffect, useCallback } from "react";
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
import { ThemeProvider, createTheme } from "@mui/material/styles";
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

const theme = createTheme({
  palette: {
    primary: {
      main: "#175C7C",
    },
    secondary: {
      main: "#51A3E7",
    },
    tertiary: {
      main: "#227582",
    },
  },
  typography: {
    fontSize: 12,
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
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        loadState(user.id);
      } else {
        router.push("/login");
      }
    };
    checkUser();
  }, [router]);

  const loadState = async (userId) => {
    const { data, error } = await supabase
      .from("app_state")
      .select("state")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Erro ao carregar o estado:", error);
      return;
    }

    if (data) {
      const { ordens, excipientes, expandedExcipient, selectedOrdem, pesados } =
        data.state;
      setOrdens(ordens);
      setExcipientes(excipientes);
      setExpandedExcipient(expandedExcipient);
      setSelectedOrdem(selectedOrdem);
      setPesados(pesados);
    }
  };

  const saveState = useCallback(
    debounce(async () => {
      if (!user) return;

      const stateToSave = {
        ordens,
        excipientes,
        expandedExcipient,
        selectedOrdem,
        pesados,
      };

      const { error } = await supabase
        .from("app_state")
        .insert({ user_id: user.id, state: stateToSave })
        .select();

      if (error) {
        console.error("Erro ao salvar o estado:", error);
      }
    }, 1000),
    [user, ordens, excipientes, expandedExcipient, selectedOrdem, pesados]
  );

  useEffect(() => {
    saveState();
  }, [
    ordens,
    excipientes,
    expandedExcipient,
    selectedOrdem,
    pesados,
    saveState,
  ]);

  const handleAddOrdem = async () => {
    const { data, error } = await supabase
      .from("DataBase_ems")
      .select("*")
      .eq("Codigo_Receita", ativo);

    if (error) {
      alert(error.message);
    } else if (data.length > 0) {
      const newOrdem = {
        id: uuidv4(), // Gera um ID único para cada ordem
        codigo: ativo,
        nome: data[0].Ativo,
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

  const handleEditOrdem = (index) => {
    setEditingOrdem(ordens[index]);
    fetchOrdemExcipientes(ordens[index].codigo);
  };

  const handleCloseEdit = () => {
    setEditingOrdem(null);
    setEditingExcipiente({});
  };

  const handleSaveEdit = () => {
    const updatedOrdens = ordens.map((ordem) =>
      ordem.codigo === editingOrdem.codigo
        ? { ...ordem, excipientes: editingExcipiente }
        : ordem
    );
    setOrdens(updatedOrdens);
    handleCloseEdit();
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
          newExcipientes[item.Excipiente] = { total: 0, ordens: [] };
        }
        if (!pesadosAtual[item.Excipiente]?.[ordem.id]) {
          newExcipientes[item.Excipiente].total += item.qtd_materia_prima;
        }
        newExcipientes[item.Excipiente].ordens.push({
          id: ordem.id,
          codigo: ordem.codigo,
          quantidade: item.qtd_materia_prima,
          nome: ordem.nome,
          op: ordem.op, // Incluímos a OP aqui
          pesado: pesadosAtual[item.Excipiente]?.[ordem.id] || false,
        });
      });
    }

    // Arredonda o total para 3 casas decimais
    Object.keys(newExcipientes).forEach((key) => {
      newExcipientes[key].total = Number(newExcipientes[key].total.toFixed(3));
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
    }
  };

  // Função para calcular a movimentação total
  const calcularMovimentacaoTotal = () => {
    return Object.values(excipientes).reduce(
      (total, { total: quantidade }) => total + quantidade,
      0
    );
  };

  const handleOrdemClick = (ordem) => {
    if (selectedOrdem && selectedOrdem.codigo === ordem.codigo) {
      setSelectedOrdem(null);
    } else {
      setSelectedOrdem(ordem);
    }
  };

  const filteredExcipientes = selectedOrdem
    ? Object.fromEntries(
        Object.entries(excipientes).filter(([excipient, { ordens }]) =>
          ordens.some((o) => o.codigo === selectedOrdem.codigo)
        )
      )
    : excipientes;

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
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  if (!user) {
    return null; // ou um componente de carregamento
  }

  return (
    <ThemeProvider theme={theme}>
      <AppBar
        position="static"
        sx={{ backgroundColor: theme.palette.primary.main }}
      >
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            size="small"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" component="div" sx={{ flexGrow: 1 }}>
            Pesagem
          </Typography>
          <UserMenu user={user} onUserUpdate={handleUserUpdate} />
        </Toolbar>
      </AppBar>
      <Sidebar open={drawerOpen} toggleDrawer={toggleDrawer} />
      <Box sx={{ display: "flex", height: "calc(100vh - 48px)" }}>
        <Box
          sx={{
            width: "20%",
            overflowY: "auto",
            borderRight: `1px solid ${theme.palette.primary.light}`,
          }}
        >
          <Box sx={{ p: 1, backgroundColor: "#fafafa" }}>
            <Typography variant="subtitle2" gutterBottom>
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
            />
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              onClick={handleAddOrdem}
              size="small"
              sx={{ mt: 1, mb: 1, color: "#fff" }}
            >
              Adicionar Ordem
            </Button>
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
                    backgroundColor: theme.palette.tertiary.light,
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box>
                      {ordem.op && (
                        <Typography variant="body2" color="primary">
                          OP: {ordem.op}
                        </Typography>
                      )}
                      <Typography variant="body2">{ordem.codigo}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {ordem.nome}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
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
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: 1,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Typography variant="subtitle2" gutterBottom color="primary">
            Somatória de Excipientes
            {selectedOrdem && (
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ ml: 1 }}
              >
                (Filtrado para a ordem: {selectedOrdem.codigo})
              </Typography>
            )}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="excipientes table">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: theme.palette.primary.light,
                    color: "#fff",
                  }}
                >
                  <TableCell>Excipiente</TableCell>
                  <TableCell align="right">Qtd. Total (Kg)</TableCell>
                  <TableCell padding="checkbox">Detalhes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(filteredExcipientes).map(
                  ([excipient, { total, ordens }]) => (
                    <React.Fragment key={excipient}>
                      <TableRow
                        hover
                        onClick={() => handleExcipientClick(excipient)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell component="th" scope="row">
                          <Typography
                            variant="body2"
                            color={
                              [
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
                            {total.toFixed(3)} kg
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
                      </TableRow>
                      <TableRow>
                        <TableCell
                          style={{ paddingBottom: 0, paddingTop: 0 }}
                          colSpan={3}
                        >
                          <Collapse
                            in={expandedExcipient === excipient}
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
                                    <TableCell align="center">Pesado</TableCell>
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
                                      <TableCell component="th" scope="row">
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
                                            togglePesado(excipient, ordem.id)
                                          }
                                          color={
                                            ordem.pesado ? "primary" : "default"
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
                  )
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
          </TableContainer>
        </Box>
      </Box>

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
    </ThemeProvider>
  );
}
