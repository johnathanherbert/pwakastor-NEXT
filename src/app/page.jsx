// pages/index.js
"use client";
import { useState, useEffect } from "react";
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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import MenuIcon from "@mui/icons-material/Menu";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Sidebar from "../components/Sidebar";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
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

  useEffect(() => {
    // Recuperar dados do Local Storage ao carregar a página
    const savedState = localStorage.getItem("appState");
    if (savedState) {
      const { ordens, excipientes, expandedExcipient, selectedOrdem } =
        JSON.parse(savedState);
      setOrdens(ordens);
      setExcipientes(excipientes);
      setExpandedExcipient(expandedExcipient);
      setSelectedOrdem(selectedOrdem);
    }
  }, []);

  useEffect(() => {
    // Salvar dados no Local Storage sempre que o estado relevante mudar
    const stateToSave = {
      ordens,
      excipientes,
      expandedExcipient,
      selectedOrdem,
    };
    localStorage.setItem("appState", JSON.stringify(stateToSave));
  }, [ordens, excipientes, expandedExcipient, selectedOrdem]);

  const handleAddOrdem = async () => {
    const { data, error } = await supabase
      .from("DataBase_ems")
      .select("*")
      .eq("Codigo_Receita", ativo);

    if (error) {
      alert(error.message);
    } else if (data.length > 0) {
      const newOrdens = [...ordens, { codigo: ativo, nome: data[0].Ativo }];
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

  const calcularExcipientes = async (ordens) => {
    if (ordens.length === 0) {
      setExcipientes({});
      return;
    }

    let newExcipientes = {};

    for (let ordem of ordens) {
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
        newExcipientes[item.Excipiente].total += item.qtd_materia_prima;
        newExcipientes[item.Excipiente].ordens.push({
          codigo: ordem.codigo,
          quantidade: item.qtd_materia_prima,
          nome: ordem.nome,
        });
      });
    }

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

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Pesagem
          </Typography>
        </Toolbar>
      </AppBar>
      <Sidebar open={drawerOpen} toggleDrawer={toggleDrawer} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <ScaleIcon color="primary" fontSize="large" />
            </Grid>
            <Grid item xs>
              <Typography variant="h4" component="h1">
                Pesagem
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="subtitle1" color="textSecondary">
                by Johnathan Herbert
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Gestão de Ordens
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Código Receita"
                value={ativo}
                onChange={(e) => setAtivo(e.target.value)}
                onKeyPress={handleKeyPress}
                margin="normal"
              />
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleAddOrdem}
                sx={{ mt: 2 }}
              >
                Adicionar Ordem
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={handleUpdateTotal}
                sx={{ mt: 2 }}
              >
                Atualizar Tabela
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ordens Adicionadas
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Nome</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ordens.map((ordem, index) => (
                      <TableRow
                        key={index}
                        onClick={() => handleOrdemClick(ordem)}
                        sx={{
                          cursor: "pointer",
                          backgroundColor:
                            selectedOrdem &&
                            selectedOrdem.codigo === ordem.codigo
                              ? "rgba(0, 0, 0, 0.04)"
                              : "inherit",
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.08)",
                          },
                        }}
                      >
                        <TableCell>{ordem.codigo}</TableCell>
                        <TableCell>{ordem.nome}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveOrdem(index);
                            }}
                            color="secondary"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditOrdem(index);
                            }}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        <Paper elevation={2} sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Somatória de Excipientes
            {selectedOrdem && (
              <Typography variant="subtitle2" color="textSecondary">
                (Filtrado para a ordem: {selectedOrdem.codigo})
              </Typography>
            )}
          </Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item>
              <Paper sx={{ width: 16, height: 16, bgcolor: "primary.main" }} />
            </Grid>
            <Grid item>
              <Typography variant="caption">Manual</Typography>
            </Grid>
            <Grid item>
              <Paper
                sx={{ width: 16, height: 16, bgcolor: "secondary.main" }}
              />
            </Grid>
            <Grid item>
              <Typography variant="caption">Automática</Typography>
            </Grid>
          </Grid>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Excipiente</TableCell>
                  <TableCell align="right">Quantidade Total (Kg)</TableCell>
                  <TableCell>Ordens</TableCell>
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
                        <TableCell align="right">{total} kg</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleExpandExcipient(excipient);
                            }}
                          >
                            {expandedExcipient === excipient ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
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
                            <Box sx={{ margin: 1 }}>
                              {ordens.map((ordem, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    mb: 2,
                                    p: 2,
                                    bgcolor: "background.paper",
                                    borderRadius: 1,
                                    boxShadow: 1,
                                  }}
                                >
                                  <Grid
                                    container
                                    spacing={2}
                                    alignItems="center"
                                  >
                                    <Grid item>
                                      <MedicationIcon color="primary" />
                                    </Grid>
                                    <Grid item xs>
                                      <Typography
                                        variant="subtitle1"
                                        component="div"
                                      >
                                        {ordem.nome}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Código: {ordem.codigo}
                                      </Typography>
                                    </Grid>
                                    <Grid item>
                                      <Chip
                                        label={`${ordem.quantidade} kg`}
                                        color="primary"
                                        variant="outlined"
                                      />
                                    </Grid>
                                  </Grid>
                                </Box>
                              ))}
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
                    sx={{ borderTop: "2px solid rgba(224, 224, 224, 1)" }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      className="text-zinc-500"
                    >
                      Movimentação total:{" "}
                      {calcularMovimentacaoTotal().toFixed(3)} kg
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}
