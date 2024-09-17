"use client";
import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Paper, Typography, Grid, Button, TextField } from "@mui/material";
import { supabase } from "@/supabaseClient";

const Sequenciamento = () => {
  const [ordens, setOrdens] = useState([]);
  const [cabines, setCabines] = useState(Array(18).fill([])); // 6 cabins per shift, 3 shifts
  const [codigoReceita, setCodigoReceita] = useState("");

  const onDragEnd = (result) => {
    const { source, destination } = result;

    // Verifica se o destino é válido
    if (!destination) return;

    // Se for movido para o mesmo lugar, retorna
    if (source.droppableId === destination.droppableId) return;

    // Atualiza as listas de ordens e cabines
    const newOrdens = Array.from(ordens);
    const ordemMovida = newOrdens[source.index]; // Ordem arrastada

    if (destination.droppableId === "ordens") {
      // Se a ordem for solta na lista de ordens
      newOrdens.splice(source.index, 1); // Remove da origem
      setOrdens([...newOrdens, ordemMovida]);
    } else {
      const newCabines = [...cabines];
      const destinoCabine = newCabines[Number(destination.droppableId)];

      // Limita a 5 ordens por cabine
      if (destinoCabine.length >= 5) {
        alert("Cada cabine pode conter no máximo 5 ordens.");
        return;
      }

      // Remove da lista de origem e adiciona na cabine de destino
      if (source.droppableId === "ordens") {
        newOrdens.splice(source.index, 1); // Remove da lista de ordens
        setOrdens(newOrdens);
      } else {
        newCabines[Number(source.droppableId)].splice(source.index, 1); // Remove da cabine de origem
      }

      newCabines[Number(destination.droppableId)] = [
        ...destinoCabine,
        ordemMovida,
      ];

      setCabines(newCabines);
    }
  };

  const handleAddOrdem = async () => {
    const { data, error } = await supabase
      .from("DataBase_ems")
      .select("*")
      .eq("Codigo_Receita", codigoReceita);

    if (error) {
      alert(error.message);
    } else if (data.length > 0) {
      const newOrdens = [
        ...ordens,
        { codigo: codigoReceita, nome: data[0].Ativo },
      ];
      setOrdens(newOrdens);
      setCodigoReceita("");
    } else {
      alert("Receita não encontrada");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Typography variant="h4" className="font-bold text-center mb-6">
        Sequenciamento de Ordens de Produção
      </Typography>
      <Grid container spacing={4}>
        {/* Coluna de Ordens */}
        <Grid item xs={3}>
          <Typography variant="h5" className="font-semibold mb-2">
            Ordens de Produção
          </Typography>
          <TextField
            fullWidth
            type="text"
            label="Código Receita"
            value={codigoReceita}
            onChange={(e) => setCodigoReceita(e.target.value)}
            margin="normal"
            variant="outlined"
            className="border border-gray-300 rounded-md shadow-sm"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddOrdem}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700"
          >
            Adicionar Ordem
          </Button>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="ordens">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="mt-4 p-2 bg-white rounded-lg shadow-md h-[400px] overflow-y-auto"
                >
                  {ordens.map((ordem, index) => (
                    <Draggable
                      key={ordem.codigo}
                      draggableId={ordem.codigo}
                      index={index}
                    >
                      {(provided) => (
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="m-2 p-4 bg-blue-100 rounded-lg shadow"
                        >
                          <Typography className="text-center font-semibold">
                            {ordem.nome}
                          </Typography>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Grid>

        {/* Cabines de Pesagem */}
        <Grid item xs={9}>
          <Typography variant="h5" className="font-semibold mb-2">
            Cabines de Pesagem
          </Typography>
          <DragDropContext onDragEnd={onDragEnd}>
            <Grid container spacing={2}>
              {["Manhã", "Tarde", "Noite"].map((turno, shiftIndex) => (
                <Grid item xs={12} key={shiftIndex}>
                  <Typography
                    variant="h6"
                    className="font-bold text-center mb-4"
                  >
                    Turno {turno}
                  </Typography>
                  <Grid container spacing={2}>
                    {Array.from({ length: 6 }).map((_, index) => {
                      const cabinIndex = shiftIndex * 6 + index; // Calcula o índice correto da cabine
                      return (
                        <Grid item xs={2} key={cabinIndex}>
                          <Droppable droppableId={cabinIndex.toString()}>
                            {(provided) => (
                              <Paper
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="p-4 min-h-[150px] bg-gray-200 rounded-lg shadow-md"
                              >
                                <Typography
                                  variant="h6"
                                  className="font-bold text-center"
                                >
                                  Cabine {index + 1}
                                </Typography>
                                {cabines[cabinIndex].map((ordem, idx) => (
                                  <Draggable
                                    key={ordem.codigo}
                                    draggableId={`${ordem.codigo}-${cabinIndex}-${idx}`} // Garantindo IDs únicos
                                    index={idx}
                                  >
                                    {(provided) => (
                                      <Paper
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="my-2 p-2 bg-white rounded-lg shadow"
                                      >
                                        <Typography className="text-center">
                                          {ordem.nome}
                                        </Typography>
                                      </Paper>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </Paper>
                            )}
                          </Droppable>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </DragDropContext>
        </Grid>
      </Grid>
    </div>
  );
};

export default Sequenciamento;
