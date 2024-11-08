"use client";
import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Collapse,
  Box,
  Chip,
  alpha,
  InputAdornment,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ScaleIcon from "@mui/icons-material/Scale";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { styled } from "@mui/material/styles";
import RemoveIcon from "@mui/icons-material/Remove";
import UpdateIcon from "@mui/icons-material/Update";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

import {
  StyledTableContainer,
  StyledTableHead,
  StyledTableRow,
  StyledExpandedRow,
  StyledDetailTableRow,
} from "../styles/styledComponents";

const removeArrows = {
  "& input[type=number]": {
    MozAppearance: "textfield",
    "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
      WebkitAppearance: "none",
      margin: 0,
    },
  },
};

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
  ...removeArrows, // Adicione esta linha
}));

const TabelaPrincipal = ({
  filteredExcipientes,
  materiaisNaArea,
  faltaSolicitar,
  inputValues,
  handleMateriaisNaAreaChange,
  handleDetailClick,
  handleToggleExpandExcipient,
  expandedExcipient,
  allExpanded,
  togglePesado,
  theme,
  calcularMovimentacaoTotal,
  getOrdensAtendidas,
  handleUpdateSAPValues, // Nova prop para atualizar valores do SAP
  handleUpdateAllSAPValues, // Nova prop para atualizar todos os valores do SAP
}) => {
  const [ordensDialogOpen, setOrdensDialogOpen] = useState(false);
  const [selectedExcipient, setSelectedExcipient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [faltaSolicitarSort, setFaltaSolicitarSort] = useState("desc");

  const handleOpenOrdensDialog = (excipient) => {
    setSelectedExcipient(excipient);
    setOrdensDialogOpen(true);
  };

  const handleCloseOrdensDialog = () => {
    setOrdensDialogOpen(false);
    setSelectedExcipient(null);
  };

  const getExcipientStatus = (naArea, totalNaoPesado, ordens) => {
    if (ordens.every((ordem) => ordem.pesado)) return "pesado";
    if (naArea >= totalNaoPesado) return "ok";
    if (naArea > 0) {
      let quantidadeRestante = naArea;
      const ordensAtendidas = ordens.reduce((count, ordem) => {
        if (!ordem.pesado && quantidadeRestante >= ordem.quantidade) {
          quantidadeRestante -= ordem.quantidade;
          return count + 1;
        }
        return count;
      }, 0);
      if (ordensAtendidas > 0) {
        return `atende ${ordensAtendidas} ${
          ordensAtendidas === 1 ? "ordem" : "ordens"
        }`;
      }
      return "warning";
    }
    if (ordens.some((ordem) => !ordem.pesado)) return "warning";
    return "error";
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

  const getContrastText = (color) => {
    // Função simples para determinar se o texto deve ser claro ou escuro
    const rgb = color
      .replace(/^#/, "")
      .match(/.{2}/g)
      .map((x) => parseInt(x, 16));
    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
    return brightness > 128 ? "#000000" : "#FFFFFF";
  };

  const getStatusLabel = (status) => {
    if (status === "pesado") return "Pesado";
    if (status === "ok") return "OK";
    if (status.startsWith("atende")) {
      const [, numOrdens, tipo] = status.match(/atende (\d+) (ordem|ordens)/);
      return `Atende ${numOrdens} ${tipo}`;
    }
    if (status === "warning") return "Atenção";
    if (status === "error") return "Erro";
    return "Desconhecido";
  };

  const renderOrdensAtendidas = () => {
    if (!selectedExcipient) return null;

    const { ordensAtendidas, ordensNaoAtendidas } =
      getOrdensAtendidas(selectedExcipient);

    const greenBgColor = alpha(theme.palette.success.main, 0.1);
    const redBgColor = alpha(theme.palette.error.main, 0.1);

    // Calcular a quantidade pendente
    const quantidadePendente = ordensNaoAtendidas.reduce(
      (total, ordem) => total + ordem.quantidade,
      0
    );

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography
          variant="h6"
          sx={{ color: theme.palette.primary.main, fontWeight: "bold" }}
        >
          Detalhes das Ordens
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            padding: 2,
            borderRadius: 1,
          }}
        >
          <Box>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Material
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: theme.palette.primary.main }}
            >
              {selectedExcipient}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Quantidade na Área
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: theme.palette.primary.main }}
            >
              {(materiaisNaArea[selectedExcipient] || 0).toFixed(3)} Kg
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, mt: 1 }}
            >
              Quantidade Pendente
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: theme.palette.error.main }}
            >
              {quantidadePendente.toFixed(3)} Kg
            </Typography>
          </Box>
        </Box>
        <StyledTableContainer>
          <Table size="small">
            <StyledTableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                  OP
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                  Nome
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: "bold", fontSize: "0.85rem" }}
                >
                  Quantidade
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", fontSize: "0.85rem" }}
                >
                  Status
                </TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {[...ordensAtendidas, ...ordensNaoAtendidas].map((ordem) => {
                const isAtendida = ordensAtendidas.includes(ordem);
                const bgColor = isAtendida ? greenBgColor : redBgColor;
                return (
                  <StyledDetailTableRow key={ordem.id}>
                    <TableCell sx={{ backgroundColor: bgColor }}>
                      {ordem.op || "N/A"}
                    </TableCell>
                    <TableCell sx={{ backgroundColor: bgColor }}>
                      {ordem.nome}
                    </TableCell>
                    <TableCell align="right" sx={{ backgroundColor: bgColor }}>
                      {ordem.quantidade.toFixed(3)} Kg
                    </TableCell>
                    <TableCell align="center" sx={{ backgroundColor: bgColor }}>
                      {isAtendida ? "Atende" : "Não Atende"}
                    </TableCell>
                  </StyledDetailTableRow>
                );
              })}
            </TableBody>
          </Table>
        </StyledTableContainer>
      </Box>
    );
  };

  const handleStatusClick = (excipient) => {
    handleOpenOrdensDialog(excipient);
  };

  // Adicione esta função para calcular o total considerando os filtros
  const calcularTotalConsiderandoFiltros = () => {
    return Object.values(filteredExcipientes).reduce((total, { ordens }) => {
      const totalOrdens = ordens.reduce((sum, ordem) => {
        // Só adiciona ao total se não estiver pesado
        if (!ordem.pesado) {
          return sum + ordem.quantidade;
        }
        return sum;
      }, 0);
      return total + totalOrdens;
    }, 0);
  };

  // Estilos comuns para células
  const cellStyle = {
    padding: { xs: "2px 4px", sm: "4px 6px" },
    fontSize: { xs: "0.6rem", sm: "0.7rem" },
  };

  const headerCellStyle = {
    ...cellStyle,
    fontWeight: "bold",
    color: theme.palette.primary.main,
  };

  // Função para lidar com a pesquisa
  const handleSearchExcipient = (value) => {
    setSearchTerm(value);
  };

  // Filtrar excipientes com base no termo de pesquisa
  const filteredExcipientsList = useMemo(() => {
    return Object.entries(filteredExcipientes).filter(([excipient]) =>
      excipient.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredExcipientes, searchTerm]);

  const toggleFaltaSolicitarSort = () => {
    setFaltaSolicitarSort(prev => prev === "asc" ? "desc" : "asc");
  };

  const sortedRows = useMemo(() => {
    return [...filteredExcipientsList].sort((a, b) => {
      const [excipientA, { ordens: ordensA }] = a;
      const [excipientB, { ordens: ordensB }] = b;
      const naAreaA = materiaisNaArea[excipientA] || 0;
      const naAreaB = materiaisNaArea[excipientB] || 0;
      const totalNaoPesadoA = ordensA.reduce(
        (sum, ordem) => sum + (ordem.pesado ? 0 : ordem.quantidade),
        0
      );
      const totalNaoPesadoB = ordensB.reduce(
        (sum, ordem) => sum + (ordem.pesado ? 0 : ordem.quantidade),
        0
      );
      const faltaSolicitarA = totalNaoPesadoA - naAreaA;
      const faltaSolicitarB = totalNaoPesadoB - naAreaB;
      if (faltaSolicitarSort === "asc") {
        return faltaSolicitarA - faltaSolicitarB;
      } else {
        return faltaSolicitarB - faltaSolicitarA;
      }
    });
  }, [filteredExcipientsList, materiaisNaArea, faltaSolicitarSort]);

  return (
    <StyledTableContainer>
      <Table size="small" sx={{ minWidth: { xs: 450, sm: 650 } }}>
        <StyledTableHead>
          <TableRow>
            <TableCell sx={headerCellStyle}>Código</TableCell>
            <TableCell sx={headerCellStyle}>
              <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                Excipiente
                <TextField
                  size="small"
                  variant="outlined"
                  placeholder="Pesquisar..."
                  onChange={(e) => handleSearchExcipient(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: "0.7rem",
                      height: "24px",
                      ml: { xs: 0, sm: 1 },
                      mt: { xs: 1, sm: 0 },
                      width: { xs: '100%', sm: 'auto' },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "transparent",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(0, 0, 0, 0.23)",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                />
              </Box>
            </TableCell>
            <TableCell align="right" sx={headerCellStyle}>
              Total
            </TableCell>
            <TableCell align="right" sx={headerCellStyle}>
              Na Área
            </TableCell>
            <TableCell align="right" sx={headerCellStyle}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Typography sx={{ color: 'white', mr: 1, display: { xs: 'none', sm: 'block' } }}>Falta solicitar</Typography>
                <IconButton 
                  size="small" 
                  onClick={toggleFaltaSolicitarSort}
                  sx={{ 
                    color: 'white',
                    '&:hover': {
                      backgroundColor: alpha('#ffffff', 0.2),
                    },
                  }}
                >
                  {faltaSolicitarSort === "asc" ? 
                    <ArrowUpwardIcon fontSize="small" /> : 
                    <ArrowDownwardIcon fontSize="small" />
                  }
                </IconButton>
              </Box>
            </TableCell>
            <TableCell align="center" sx={headerCellStyle}>
              Status
            </TableCell>
            <TableCell align="center" sx={headerCellStyle}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handleUpdateAllSAPValues}
                size="small"
                sx={{ 
                  fontSize: "0.65rem", 
                  padding: "2px 6px",
                  whiteSpace: 'nowrap',
                  minWidth: 'auto',
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Atualizar Todos</Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Atualizar</Box>
              </Button>
            </TableCell>
          </TableRow>
        </StyledTableHead>
        <TableBody>
          {sortedRows.map(
            ([excipient, { total, ordens, codigo }]) => {
              const naArea = materiaisNaArea[excipient] || 0;
              const totalNaoPesado = ordens.reduce(
                (sum, ordem) => sum + (ordem.pesado ? 0 : ordem.quantidade),
                0
              );
              const status = getExcipientStatus(naArea, totalNaoPesado, ordens);
              return (
                <React.Fragment key={excipient}>
                  <StyledTableRow
                    hover
                    onClick={() => handleToggleExpandExcipient(excipient)}
                    sx={{
                      cursor: "pointer",
                      transition: "background-color 0.3s",
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.08
                        ),
                      },
                      backgroundColor: alpha(getStatusColor(status), 0.1),
                    }}
                  >
                    <TableCell sx={cellStyle}>{codigo}</TableCell>
                    <TableCell sx={cellStyle}>
                      {excipient.length > 20 ? `${excipient.slice(0, 20)}...` : excipient}
                    </TableCell>
                    <TableCell align="right" sx={cellStyle}>
                      {totalNaoPesado.toFixed(2)} kg
                    </TableCell>
                    <TableCell align="right" sx={cellStyle}>
                      <StyledMaterialInput
                        type="number"
                        value={inputValues[excipient] || ""}
                        onChange={(e) =>
                          handleMateriaisNaAreaChange(excipient, e.target.value)
                        }
                        variant="filled"
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption">Kg</Typography>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          width: { xs: "60px", sm: "70px" },
                          "& .MuiInputBase-input": {
                            padding: { xs: "2px 4px", sm: "4px 6px" },
                            fontSize: { xs: "0.6rem", sm: "0.7rem" },
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={cellStyle}>
                      {(() => {
                        const faltaSolicitarValue = totalNaoPesado - naArea;
                        const color =
                          faltaSolicitarValue > 0 || naArea === 0
                            ? theme.palette.error.main
                            : theme.palette.success.main;
                        const value =
                          faltaSolicitarValue > 0 || naArea === 0
                            ? faltaSolicitarValue
                            : naArea;

                        return (
                          <Typography
                            component="span"
                            sx={{
                              color: color,
                              fontWeight: "bold",
                              fontSize: { xs: "0.6rem", sm: "0.7rem" },
                            }}
                          >
                            {value.toFixed(2)} kg
                          </Typography>
                        );
                      })()}
                    </TableCell>
                    <TableCell align="center" sx={cellStyle}>
                      <Chip
                        label={getStatusLabel(status)}
                        sx={{
                          backgroundColor: getStatusColor(status),
                          color: theme.palette.text.primary,
                          fontWeight: "medium",
                          fontSize: { xs: "0.55rem", sm: "0.65rem" },
                          height: { xs: "16px", sm: "18px" },
                        }}
                        icon={
                          status === "pesado" ? (
                            <CheckIcon fontSize="small" />
                          ) : status.startsWith("atende") ? (
                            <RemoveIcon fontSize="small" />
                          ) : null
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusClick(excipient);
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={cellStyle}>
                      <IconButton
                        onClick={() => handleUpdateSAPValues(excipient, codigo)}
                        size="small"
                        color="primary"
                      >
                        <UpdateIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </StyledTableRow>
                  <StyledExpandedRow>
                    <TableCell
                      style={{ paddingBottom: 0, paddingTop: 0 }}
                      colSpan={7}
                    >
                      <Collapse
                        in={expandedExcipient === excipient || allExpanded}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box
                          sx={{
                            margin: 1,
                            backgroundColor: alpha(
                              theme.palette.background.paper,
                              0.5
                            ),
                            borderRadius: 1,
                            padding: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            component="div"
                            sx={{
                              fontWeight: "bold",
                              color: theme.palette.primary.main,
                              marginBottom: "6px",
                              fontSize: { xs: "0.65rem", sm: "0.75rem" },
                            }}
                          >
                            Detalhes: {codigo} - {excipient}
                          </Typography>
                          <Table
                            size="small"
                            aria-label="purchases"
                            sx={{
                              backgroundColor: theme.palette.background.paper,
                            }}
                          >
                            <TableHead>
                              <TableRow
                                sx={{
                                  backgroundColor: alpha(
                                    theme.palette.primary.main,
                                    0.1
                                  ),
                                }}
                              >
                                <TableCell sx={headerCellStyle}>Cód.</TableCell>
                                <TableCell sx={headerCellStyle}>Ordem</TableCell>
                                <TableCell sx={headerCellStyle}>Qtd</TableCell>
                                <TableCell align="right" sx={headerCellStyle}>
                                  Status
                                </TableCell>
                                <TableCell align="center" sx={headerCellStyle}>
                                  Pesado
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {ordens.map((ordem) => (
                                <TableRow
                                  key={ordem.id}
                                  hover
                                  sx={{
                                    "&:nth-of-type(odd)": {
                                      backgroundColor: alpha(
                                        theme.palette.action.hover,
                                        0.05
                                      ),
                                    },
                                    "&:hover": {
                                      backgroundColor: alpha(
                                        theme.palette.action.hover,
                                        0.1
                                      ),
                                    },
                                  }}
                                >
                                  <TableCell sx={cellStyle}>
                                    {ordem.codigo}
                                  </TableCell>
                                  <TableCell
                                    component="th"
                                    scope="row"
                                    sx={{
                                      ...cellStyle,
                                      borderLeft: `3px solid ${
                                        ordem.pesado
                                          ? theme.palette.success.main
                                          : theme.palette.warning.main
                                      }`,
                                    }}
                                  >
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
                                          padding: "1px 2px",
                                          borderRadius: "2px",
                                          display: "inline-block",
                                          marginRight: "3px",
                                          fontSize: { xs: "0.5rem", sm: "0.6rem" },
                                        }}
                                      >
                                        OP: {ordem.op}
                                      </Typography>
                                    )}
                                    {ordem.nome.length > 15 ? `${ordem.nome.slice(0, 15)}...` : ordem.nome}
                                  </TableCell>
                                  <TableCell sx={cellStyle}>
                                    {ordem.quantidade.toFixed(2)} kg
                                  </TableCell>
                                  <TableCell align="right" sx={cellStyle}>
                                    <Chip
                                      icon={
                                        ordem.pesado ? (
                                          <CheckCircleIcon fontSize="small" />
                                        ) : (
                                          <ScaleIcon fontSize="small" />
                                        )
                                      }
                                      label={
                                        ordem.pesado ? "Pesado" : "Não Pesado"
                                      }
                                      color={
                                        ordem.pesado ? "success" : "warning"
                                      }
                                      size="small"
                                      sx={{
                                        fontWeight: "bold",
                                        fontSize: { xs: "0.5rem", sm: "0.6rem" },
                                        height: { xs: "14px", sm: "16px" },
                                        backgroundColor: ordem.pesado
                                          ? alpha(
                                              theme.palette.success.main,
                                              0.1
                                            )
                                          : alpha(
                                              theme.palette.warning.main,
                                              0.1
                                            ),
                                        color: ordem.pesado
                                          ? theme.palette.success.main
                                          : theme.palette.warning.main,
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="center" sx={cellStyle}>
                                    <Checkbox
                                      checked={ordem.pesado}
                                      onChange={() =>
                                        togglePesado(excipient, ordem.id)
                                      }
                                      size="small"
                                      color="primary"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </StyledExpandedRow>
                </React.Fragment>
              );
            }
          )}
          <TableRow>
            <TableCell
              colSpan={7}
              sx={{
                borderTop: `2px solid ${theme.palette.primary.main}`,
                padding: "4px 6px",
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              }}
            >
              <Typography
                variant="body2"
                fontWeight="bold"
                color="primary"
                sx={{ fontSize: "0.75rem" }}
              >
                Movimentação total:{" "}
                {calcularTotalConsiderandoFiltros().toFixed(3)} kg
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Dialog
        open={ordensDialogOpen}
        onClose={handleCloseOrdensDialog}
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
            fontSize: "1.2rem",
            py: 2,
          }}
        >
          Detalhes das Ordens - {selectedExcipient}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedExcipient && renderOrdensAtendidas()}
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Button
            onClick={handleCloseOrdensDialog}
            variant="contained"
            color="primary"
            sx={{ fontWeight: "bold" }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </StyledTableContainer>
  );
};

export default TabelaPrincipal;
