import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  colors,
} from "@mui/material";
import {
  StyledTableContainer,
  StyledTableHead,
  StyledDetailTableRow,
  StatusCell,
} from "../styles/styledComponents";
import { blue } from "@mui/material/colors";

const DetalhamentoMateriais = ({
  getFilteredAtivos,
  getAtivoStatus,
  handleDetailClick,
  theme,
  ordens,
  filteredExcipientes,
  materiaisNaArea,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAtivo, setSelectedAtivo] = useState(null);

  const handleOpenDialog = (ativo) => {
    setSelectedAtivo(ativo);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAtivo(null);
  };

  // Adicione esta função getStatusColor
  const getStatusColor = (status) => {
    switch (status) {
      case "completo":
        return alpha(theme.palette.success.main, 0.1);
      case "parcial":
        return alpha(theme.palette.warning.main, 0.1);
      case "indisponivel":
        return alpha(theme.palette.error.main, 0.1);
      default:
        return alpha(theme.palette.grey[300], 0.1);
    }
  };

  // Função para obter a lista de OPs para um ativo específico
  const getOPList = (ordens, ativo) => {
    if (!Array.isArray(ordens) || ordens.length === 0) {
      return "Nenhuma OP";
    }

    const opsDoAtivo = ordens
      .filter((ordem) => {
        // Verifica se a ordem tem as propriedades necessárias
        return (
          ordem &&
          typeof ordem === "object" &&
          ordem.nome === ativo &&
          ordem.op !== undefined &&
          ordem.op !== null
        );
      })
      .map((ordem) => ordem.op)
      .filter((op) => op !== undefined && op !== null);

    return opsDoAtivo.length > 0 ? opsDoAtivo.join(", ") : "Nenhuma OP";
  };

  // Estilos comuns para células
  const cellStyle = {
    padding: "8px",
    fontSize: "0.75rem",
  };

  const headerCellStyle = {
    ...cellStyle,
    fontWeight: "bold",
    fontSize: "0.8rem",
  };

  const renderDialogContent = () => {
    if (!selectedAtivo || !filteredExcipientes) return null;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{
              color: theme.palette.primary.main,
              fontWeight: "bold",
              fontSize: "0.9rem",
            }}
          >
            Excipientes Disponíveis para Pesar
          </Typography>
          <StyledTableContainer>
            <Table size="small">
              <StyledTableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Excipiente</TableCell>
                  <TableCell align="right" sx={headerCellStyle}>
                    Qtd. Necessária (kg)
                  </TableCell>
                  <TableCell align="right" sx={headerCellStyle}>
                    Qtd. na Área (kg)
                  </TableCell>
                  <TableCell align="center" sx={headerCellStyle}>
                    Status
                  </TableCell>
                </TableRow>
              </StyledTableHead>
              <TableBody>
                {Object.entries(filteredExcipientes || {})
                  .filter(
                    ([_, data]) =>
                      data.ordens &&
                      Array.isArray(data.ordens) &&
                      data.ordens.some(
                        (ordem) => ordem && ordem.nome === selectedAtivo
                      )
                  )
                  .map(([excipient, data]) => {
                    const quantidadeNecessaria = data.ordens
                      .filter((ordem) => ordem && ordem.nome === selectedAtivo)
                      .reduce(
                        (sum, ordem) =>
                          sum + (ordem.pesado ? 0 : ordem.quantidade),
                        0
                      );
                    const quantidadeNaArea = materiaisNaArea[excipient] || 0;
                    const status =
                      quantidadeNaArea >= quantidadeNecessaria
                        ? "completo"
                        : quantidadeNaArea > 0
                        ? "parcial"
                        : "indisponivel";
                    return (
                      <StyledDetailTableRow key={excipient}>
                        <TableCell sx={cellStyle}>{excipient}</TableCell>
                        <TableCell align="right" sx={cellStyle}>
                          {quantidadeNecessaria.toFixed(3)} Kg
                        </TableCell>
                        <TableCell align="right" sx={cellStyle}>
                          {quantidadeNaArea.toFixed(3)} Kg
                        </TableCell>
                        <StatusCell
                          align="center"
                          status={status}
                          sx={cellStyle}
                        >
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
            </Table>
          </StyledTableContainer>
        </Box>

        <Box>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{
              color: theme.palette.error.main,
              fontWeight: "bold",
              fontSize: "0.9rem",
            }}
          >
            Excipientes Faltando Solicitar
          </Typography>
          <StyledTableContainer>
            <Table size="small">
              <StyledTableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Excipiente</TableCell>
                  <TableCell align="right" sx={headerCellStyle}>
                    Qtd. Faltante (kg)
                  </TableCell>
                </TableRow>
              </StyledTableHead>
              <TableBody>
                {Object.entries(filteredExcipientes || {})
                  .filter(
                    ([_, data]) =>
                      data.ordens &&
                      Array.isArray(data.ordens) &&
                      data.ordens.some(
                        (ordem) => ordem && ordem.nome === selectedAtivo
                      )
                  )
                  .map(([excipient, data]) => {
                    const quantidadeNecessaria = data.ordens
                      .filter((ordem) => ordem && ordem.nome === selectedAtivo)
                      .reduce(
                        (sum, ordem) =>
                          sum + (ordem.pesado ? 0 : ordem.quantidade),
                        0
                      );
                    const quantidadeNaArea = materiaisNaArea[excipient] || 0;
                    const quantidadeFaltante = Math.max(
                      quantidadeNecessaria - quantidadeNaArea,
                      0
                    );
                    if (quantidadeFaltante > 0) {
                      return (
                        <StyledDetailTableRow key={excipient}>
                          <TableCell sx={cellStyle}>{excipient}</TableCell>
                          <TableCell align="right" sx={cellStyle}>
                            {quantidadeFaltante.toFixed(3)} Kg
                          </TableCell>
                        </StyledDetailTableRow>
                      );
                    }
                    return null;
                  })
                  .filter(Boolean)}
              </TableBody>
            </Table>
          </StyledTableContainer>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <StyledTableContainer>
        <Table size="small" sx={{ minWidth: 250 }}>
          <StyledTableHead>
            <TableRow>
              <TableCell sx={headerCellStyle}>Ativo</TableCell>
              <TableCell align="center" sx={headerCellStyle}>
                Status
              </TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {getFilteredAtivos().map((ativo) => {
              const status = getAtivoStatus(ativo);
              return (
                <StyledDetailTableRow
                  key={ativo}
                  hover
                  onClick={() => handleOpenDialog(ativo)}
                  sx={{
                    cursor: "pointer",
                    transition: "background-color 0.3s",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      ...cellStyle,
                      fontWeight: "medium",
                    }}
                  >
                    {ativo}
                  </TableCell>
                  <StatusCell
                    align="center"
                    status={status}
                    sx={{
                      ...cellStyle,
                      fontWeight: "medium",
                      borderRadius: "4px",
                      padding: "2px 4px",
                      backgroundColor: getStatusColor(status),
                      color: theme.palette.text.primary,
                    }}
                  >
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
        </Table>
      </StyledTableContainer>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24,
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            fontWeight: "bold",
            fontSize: "1rem",
            py: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: "bold" }}
            >
              Detalhes do Ativo: {selectedAtivo}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: "bold",
                color: theme.palette.primary.contrastText,
                backgroundColor: alpha(theme.palette.primary.contrastText, 0.2),
                padding: "1px 4px",
                borderRadius: "4px",
                display: "inline-block",
                fontSize: "0.7rem",
              }}
            >
              OPs:{" "}
              {selectedAtivo ? getOPList(ordens, selectedAtivo) : "Nenhuma OP"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>{renderDialogContent()}</DialogContent>
        <DialogActions
          sx={{
            p: 1,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            color="primary"
            sx={{ fontWeight: "bold", fontSize: "0.8rem" }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DetalhamentoMateriais;
