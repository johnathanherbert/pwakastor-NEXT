"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Paper,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Select,
  MenuItem,
  Grid,
  AppBar,
  Toolbar,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";

const cabines = [
  "Cabine 1",
  "Cabine 2",
  "Cabine 3",
  "Cabine 4",
  "Cabine 5",
  "Cabine 6",
];
const turnos = ["1º Turno", "2º Turno", "3º Turno"];

export default function PlanejadorProducao() {
  const [ordens, setOrdens] = useState([]);
  const [cabineOrdens, setCabineOrdens] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [openOPDialog, setOpenOPDialog] = useState(false);
  const [novaOrdem, setNovaOrdem] = useState({
    codigo: "",
    quantidade: 1,
    cabine: "",
  });
  const [selectedOrdem, setSelectedOrdem] = useState(null);
  const [novaOP, setNovaOP] = useState("");
  const [turnoSelecionado, setTurnoSelecionado] = useState("1º Turno");

  useEffect(() => {
    carregarDados();
  }, [turnoSelecionado]);

  const carregarDados = async () => {
    try {
      const [ordensData, cabineOrdensData] = await Promise.all([
        supabase.from("ordens_producao").select("*").is("cabine", null),
        supabase
          .from("ordens_producao")
          .select("*")
          .not("cabine", "is", null)
          .eq("turno", turnoSelecionado),
      ]);

      if (ordensData.error) throw ordensData.error;
      if (cabineOrdensData.error) throw cabineOrdensData.error;

      setOrdens(ordensData.data);

      const ordensFormatadas = cabineOrdensData.data.reduce((acc, item) => {
        if (!acc[item.cabine]) acc[item.cabine] = [];
        acc[item.cabine].push(item);
        return acc;
      }, {});
      setCabineOrdens(ordensFormatadas);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados. Por favor, tente novamente.");
    }
  };

  const handleAddOrdem = async () => {
    try {
      const { data, error } = await supabase
        .from("DataBase_ems")
        .select("*")
        .eq("Codigo_Receita", novaOrdem.codigo)
        .single();

      if (error) throw error;

      const ordensParaAdicionar = Array(parseInt(novaOrdem.quantidade)).fill({
        codigo: data.Codigo_Receita,
        descricao: data.Descricao,
        nome: data.Nome,
        op: null,
        turno: turnoSelecionado,
        cabine: novaOrdem.cabine,
      });

      const { error: insertError } = await supabase
        .from("ordens_producao")
        .insert(ordensParaAdicionar);

      if (insertError) throw insertError;

      await carregarDados();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao adicionar ordem:", error);
      alert(error.message);
    }
  };

  const handleAddOP = async () => {
    try {
      const { error } = await supabase
        .from("ordens_producao")
        .update({ op: novaOP, turno: turnoSelecionado })
        .eq("id", selectedOrdem.id);

      if (error) throw error;

      await carregarDados();
      handleCloseOPDialog();
    } catch (error) {
      console.error("Erro ao adicionar OP:", error);
      alert(error.message);
    }
  };

  const handleDeleteOrdem = async (id) => {
    try {
      const { error } = await supabase
        .from("ordens_producao")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await carregarDados();
    } catch (error) {
      console.error("Erro ao deletar ordem:", error);
      alert(error.message);
    }
  };

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const handleOpenOPDialog = (ordem) => {
    setSelectedOrdem(ordem);
    setOpenOPDialog(true);
  };
  const handleCloseOPDialog = () => setOpenOPDialog(false);

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    try {
      const ordem = JSON.parse(draggableId);
      const { error } = await supabase
        .from("ordens_producao")
        .update({
          cabine:
            destination.droppableId === "ordens"
              ? null
              : destination.droppableId,
          turno: destination.droppableId === "ordens" ? null : turnoSelecionado,
        })
        .eq("id", ordem.id);

      if (error) throw error;

      await carregarDados();
    } catch (error) {
      console.error("Erro ao mover ordem:", error);
      alert(error.message);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Planejador de Produção
          </Typography>
          <Select
            value={turnoSelecionado}
            onChange={(e) => setTurnoSelecionado(e.target.value)}
            sx={{ mr: 2, color: "white" }}
          >
            {turnos.map((turno) => (
              <MenuItem key={turno} value={turno}>
                {turno}
              </MenuItem>
            ))}
          </Select>
        </Toolbar>
      </AppBar>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
          <Box
            sx={{
              width: "20%",
              p: 2,
              overflowY: "auto",
              borderRight: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Ordens Pendentes
            </Typography>
            <Button
              onClick={handleOpenDialog}
              startIcon={<AddIcon />}
              fullWidth
              variant="contained"
              sx={{ mb: 2 }}
            >
              Adicionar Ordem
            </Button>
            <Droppable droppableId="ordens">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {ordens.map((ordem, index) => (
                    <Draggable
                      key={ordem.id}
                      draggableId={JSON.stringify(ordem)}
                      index={index}
                    >
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{ mb: 2 }}
                        >
                          <CardContent>
                            <Typography variant="h6">{ordem.codigo}</Typography>
                            <Typography variant="body2">
                              {ordem.nome}
                            </Typography>
                            <Typography variant="body2">
                              {ordem.descricao}
                            </Typography>
                            <Typography variant="body2">
                              OP: {ordem.op || "N/A"}
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <IconButton
                              onClick={() => handleOpenOPDialog(ordem)}
                            >
                              <LinkIcon />
                            </IconButton>
                          </CardActions>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </Box>
          <Box sx={{ flexGrow: 1, p: 2, overflowY: "auto" }}>
            <Grid container spacing={2}>
              {cabines.map((cabine) => (
                <Grid item xs={4} key={cabine}>
                  <Droppable droppableId={cabine}>
                    {(provided) => (
                      <Paper
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        sx={{ p: 2, minHeight: 200 }}
                      >
                        <Typography variant="subtitle1">{cabine}</Typography>
                        {cabineOrdens[cabine]?.map((ordem, index) => (
                          <Draggable
                            key={ordem.id}
                            draggableId={JSON.stringify(ordem)}
                            index={index}
                          >
                            {(provided) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{ mb: 2 }}
                              >
                                <CardContent>
                                  <Typography variant="h6">
                                    {ordem.codigo}
                                  </Typography>
                                  <Typography variant="body2">
                                    {ordem.nome}
                                  </Typography>
                                  <Typography variant="body2">
                                    {ordem.descricao}
                                  </Typography>
                                  <Typography variant="body2">
                                    OP: {ordem.op || "N/A"}
                                  </Typography>
                                </CardContent>
                                <CardActions>
                                  <IconButton
                                    onClick={() => handleDeleteOrdem(ordem.id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </CardActions>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Paper>
                    )}
                  </Droppable>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </DragDropContext>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Adicionar Nova Ordem</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Código"
            fullWidth
            value={novaOrdem.codigo}
            onChange={(e) =>
              setNovaOrdem({ ...novaOrdem, codigo: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Quantidade"
            type="number"
            fullWidth
            value={novaOrdem.quantidade}
            onChange={(e) =>
              setNovaOrdem({ ...novaOrdem, quantidade: e.target.value })
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Cabine</InputLabel>
            <Select
              value={novaOrdem.cabine}
              onChange={(e) =>
                setNovaOrdem({ ...novaOrdem, cabine: e.target.value })
              }
            >
              <MenuItem value="">
                <em>Nenhuma</em>
              </MenuItem>
              {cabines.map((cabine) => (
                <MenuItem key={cabine} value={cabine}>
                  {cabine}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleAddOrdem}>Adicionar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openOPDialog} onClose={handleCloseOPDialog}>
        <DialogTitle>Adicionar OP à Ordem</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="OP"
            fullWidth
            value={novaOP}
            onChange={(e) => setNovaOP(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOPDialog}>Cancelar</Button>
          <Button onClick={handleAddOP}>Adicionar OP</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
