"use client";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import {
  Typography,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  AppBar,
  Toolbar,
  Box,
  Menu,
  MenuItem,
  Select,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import UserMenu from "../../components/UserMenu";

const familias = [
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "L1",
  "L2",
  "L3",
  "L4",
  "L5",
  "L6",
  "L7",
  "L8",
  "S250",
  "K500",
  "T400",
  "Pam1",
  "Pam2",
  "Mg2",
  "Stinfer",
  "Total",
];

const turnos = ["3T", "1T", "2T"];

const theme = createTheme({
  palette: {
    primary: { main: "#175C7C" },
    secondary: { main: "#51A3E7" },
  },
  typography: { fontSize: 10 },
});

export default function RejunkaDashboard() {
  const [dados, setDados] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFamilia, setSelectedFamilia] = useState("");
  const [selectedTurno, setSelectedTurno] = useState("");
  const [novoMedicamento, setNovoMedicamento] = useState({
    tipo: "VS",
    quantidade: 0,
    remedio: "",
    descricao: "",
  });
  const [user, setUser] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFamiliaForColor, setSelectedFamiliaForColor] = useState(null);
  const [medicamentos, setMedicamentos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const carregarDados = async () => {
    const { data, error } = await supabase.from("rejunka").select("*");
    if (error) {
      console.error("Erro ao carregar dados:", error);
    } else {
      const dadosFormatados = data.reduce((acc, item) => {
        acc[item.familia] = item;
        return acc;
      }, {});
      setDados(dadosFormatados);
    }
  };

  useEffect(() => {
    carregarDados();
    carregarMedicamentos();
    checkUser();
  }, []);

  const carregarMedicamentos = async () => {
    try {
      const response = await fetch("/utils/medicamentos.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const listaMedicamentos = await response.json();
      console.log("Medicamentos carregados:", listaMedicamentos);
      setMedicamentos(listaMedicamentos);
    } catch (error) {
      console.error("Erro ao carregar medicamentos:", error);
      setMedicamentos([]);
    }
  };

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleStatusChange = async (familia, novoStatus) => {
    const { error } = await supabase
      .from("rejunka")
      .update({ status: novoStatus })
      .eq("familia", familia);

    if (error) {
      console.error("Erro ao atualizar status:", error);
    } else {
      setDados((prevDados) => ({
        ...prevDados,
        [familia]: { ...prevDados[familia], status: novoStatus },
      }));
    }
  };

  const handleCorChange = async (familia, novaCor) => {
    const { error } = await supabase
      .from("rejunka")
      .update({ cor: novaCor })
      .eq("familia", familia);

    if (error) {
      console.error("Erro ao atualizar cor:", error);
    } else {
      setDados((prevDados) => ({
        ...prevDados,
        [familia]: { ...prevDados[familia], cor: novaCor },
      }));
    }
  };

  const handleOpenDialog = (familia, turno, tipo) => {
    setSelectedFamilia(familia);
    setSelectedTurno(turno);
    setNovoMedicamento({ tipo, quantidade: 0, remedio: "" });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNovoMedicamento({ tipo: "VS", quantidade: 0, remedio: "" });
  };

  const handleAddMedicamento = async () => {
    // Buscar o nome do ativo na tabela DataBase_ems
    const { data, error } = await supabase
      .from("DataBase_ems")
      .select("Ativo")
      .eq("Codigo_Receita", novoMedicamento.remedio)
      .single();

    if (error) {
      console.error("Erro ao buscar o nome do ativo:", error);
      return;
    }

    const nomeAtivo = data?.Nome_Ativo || "";

    const dadosAtualizados = { ...dados[selectedFamilia] };
    if (!dadosAtualizados[selectedTurno]) {
      dadosAtualizados[selectedTurno] = {};
    }
    dadosAtualizados[selectedTurno][novoMedicamento.tipo] = {
      quantidade: novoMedicamento.quantidade,
      remedio: novoMedicamento.remedio,
      descricao: novoMedicamento.descricao,
      nomeAtivo: nomeAtivo, // Adicionando o nome do ativo
    };

    const { error: updateError } = await supabase
      .from("rejunka")
      .update({ [selectedTurno]: dadosAtualizados[selectedTurno] })
      .eq("familia", selectedFamilia);

    if (updateError) {
      console.error("Erro ao adicionar medicamento:", updateError);
    } else {
      setDados((prevDados) => ({
        ...prevDados,
        [selectedFamilia]: dadosAtualizados,
      }));
      handleCloseDialog();
    }
  };

  const handleContextMenu = useCallback((event, familia) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4 }
        : null
    );
    setSelectedFamiliaForColor(familia);
  }, []);

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleColorSelect = (cor) => {
    handleCorChange(selectedFamiliaForColor, cor);
    handleCloseContextMenu();
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const buscarProdutos = async (query) => {
    if (query.length < 3) return; // Só busca se tiver pelo menos 3 caracteres

    const { data, error } = await supabase
      .from("DataBase_ems")
      .select("Codigo_Receita, Descricao")
      .ilike("Codigo_Receita", `%${query}%`)
      .limit(10);

    if (error) {
      console.error("Erro ao buscar produtos:", error);
    } else {
      setProdutos(data);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dashboard Rejunka
          </Typography>
          {user && <UserMenu user={user} onUserUpdate={handleUserUpdate} />}
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 1, height: "calc(100vh - 64px)", overflow: "auto" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Família</TableCell>
                {turnos.map((turno) => (
                  <React.Fragment key={turno}>
                    <TableCell>{turno} VS</TableCell>
                    <TableCell>{turno} VU</TableCell>
                  </React.Fragment>
                ))}
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {familias.map((familia) => (
                <TableRow key={familia}>
                  <TableCell>{familia}</TableCell>
                  {turnos.map((turno) => (
                    <React.Fragment key={turno}>
                      {["VS", "VU"].map((tipo) => (
                        <TableCell key={`${turno}-${tipo}`}>
                          <Typography variant="body2" component="div">
                            {dados[familia]?.[turno]?.[tipo]?.quantidade || 0}{" "}
                            {dados[familia]?.[turno]?.[tipo]?.descricao || ""}{" "}
                            {dados[familia]?.[turno]?.[tipo]?.nomeAtivo && (
                              <span
                                style={{
                                  fontStyle: "italic",
                                  fontSize: "0.8em",
                                }}
                              >
                                ({dados[familia]?.[turno]?.[tipo]?.nomeAtivo})
                              </span>
                            )}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleOpenDialog(familia, turno, tipo)
                            }
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      ))}
                    </React.Fragment>
                  ))}
                  <TableCell>
                    <TextField
                      type="number"
                      value={dados[familia]?.status || ""}
                      onChange={(e) =>
                        handleStatusChange(familia, e.target.value)
                      }
                      onContextMenu={(e) => handleContextMenu(e, familia)}
                      size="small"
                      inputProps={{
                        style: {
                          padding: "2px",
                          width: "40px",
                          color: dados[familia]?.cor || "inherit",
                        },
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Adicionar Medicamento</DialogTitle>
        <DialogContent>
          <Select
            value={novoMedicamento.tipo}
            onChange={(e) =>
              setNovoMedicamento({ ...novoMedicamento, tipo: e.target.value })
            }
            fullWidth
            margin="dense"
          >
            <MenuItem value="VS">VS</MenuItem>
            <MenuItem value="VU">VU</MenuItem>
          </Select>
          <TextField
            autoFocus
            margin="dense"
            label="Quantidade"
            type="number"
            fullWidth
            value={novoMedicamento.quantidade}
            onChange={(e) =>
              setNovoMedicamento({
                ...novoMedicamento,
                quantidade: e.target.value,
              })
            }
          />
          <Autocomplete
            options={produtos}
            getOptionLabel={(option) =>
              `${option.Codigo_Receita} - ${option.Descricao}`
            }
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                label="Medicamento"
                fullWidth
                onChange={(e) => {
                  setInputValue(e.target.value);
                  buscarProdutos(e.target.value);
                }}
              />
            )}
            value={novoMedicamento.remedio}
            onChange={(event, newValue) =>
              setNovoMedicamento({
                ...novoMedicamento,
                remedio: newValue ? newValue.Codigo_Receita : "",
                descricao: newValue ? newValue.Descricao : "",
              })
            }
            onInputChange={(event, newInputValue) => {
              setInputValue(newInputValue);
              buscarProdutos(newInputValue);
            }}
            inputValue={inputValue}
            freeSolo
            autoComplete
            autoHighlight
            renderOption={(props, option) => (
              <li {...props} style={{ fontSize: "0.9rem" }}>
                {option.Codigo_Receita} - {option.Descricao}
              </li>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleAddMedicamento}>Adicionar</Button>
        </DialogActions>
      </Dialog>
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => handleColorSelect("azul")}>Azul</MenuItem>
        <MenuItem onClick={() => handleColorSelect("vermelho")}>
          Vermelho
        </MenuItem>
        <MenuItem onClick={() => handleColorSelect("verde")}>Verde</MenuItem>
      </Menu>
    </ThemeProvider>
  );
}
