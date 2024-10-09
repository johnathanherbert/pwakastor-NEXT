import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import {
  StyledTableContainer,
  StyledTableHead,
  StyledTableRow,
  StyledMaterialInput,
  ContentCard,
} from "../styles/styledComponents";
import { supabase } from "../supabaseClient";

export default function Sap({ open, onClose, theme, user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [materialData, setMaterialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setMaterialData(null);

    try {
      const { data, error } = await supabase
        .from("materials_database")
        .select("*")
        .eq("codigo_materia_prima", searchTerm);

      if (error) throw error;

      if (data && data.length > 0) {
        const groupedData = data.reduce((acc, item) => {
          if (!acc.codigo_materia_prima) {
            acc.codigo_materia_prima = item.codigo_materia_prima;
            acc.descricao = item.descricao;
            acc.unidade_medida = item.unidade_medida;
            acc.saldo_total = 0;
            acc.lotes = [];
          }
          acc.saldo_total += parseFloat(item.qtd_materia_prima) || 0;
          acc.lotes.push({
            lote: item.lote,
            quantidade: item.qtd_materia_prima,
          });
          return acc;
        }, {});

        setMaterialData(groupedData);
      } else {
        setError("Nenhum material encontrado com o código fornecido.");
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      setError("Ocorreu um erro durante a busca. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Consulta de Material</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, mb: 2 }}>
          <StyledMaterialInput
            variant="filled"
            label="Código do Material"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            size="small"
            sx={{ mr: 2, width: "200px" }}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
          >
            Buscar
          </Button>
        </Box>

        {loading && <Typography align="center">Carregando...</Typography>}
        {error && (
          <Typography color="error" align="center">
            {error}
          </Typography>
        )}

        {materialData && (
          <ContentCard elevation={3}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ textAlign: "center", fontWeight: "bold" }}
            >
              Detalhes do Material
            </Typography>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography>
                <strong>Código:</strong> {materialData.codigo_materia_prima}
              </Typography>
              <Typography>
                <strong>Descrição:</strong> {materialData.descricao}
              </Typography>
            </Box>
            <Typography align="center" sx={{ mb: 2 }}>
              <strong>Saldo Total:</strong>{" "}
              {materialData.saldo_total.toFixed(3)}{" "}
              {materialData.unidade_medida}
            </Typography>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ textAlign: "center", fontWeight: "bold" }}
            >
              Lotes Disponíveis
            </Typography>
            <StyledTableContainer>
              <Table size="small">
                <StyledTableHead>
                  <TableRow>
                    <TableCell>Lote</TableCell>
                    <TableCell align="right">Quantidade</TableCell>
                  </TableRow>
                </StyledTableHead>
                <TableBody>
                  {materialData.lotes.map((lote, index) => (
                    <StyledTableRow key={index}>
                      <TableCell>{lote.lote}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${parseFloat(lote.quantidade).toFixed(3)} ${
                            materialData.unidade_medida
                          }`}
                          sx={{
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.1
                            ),
                            color: theme.palette.primary.main,
                            fontWeight: "bold",
                          }}
                        />
                      </TableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </StyledTableContainer>
          </ContentCard>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
