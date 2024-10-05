import React, { useState } from "react";
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
}) => {
  const [ordensDialogOpen, setOrdensDialogOpen] = useState(false);
  const [selectedExcipient, setSelectedExcipient] = useState(null);

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

  return (
    <StyledTableContainer>
      <Table size="small" sx={{ minWidth: 650 }}>
        <StyledTableHead>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: "bold",
                fontSize: "0.75rem",
                padding: "8px",
                color: theme.palette.primary.main,
              }}
            >
              Código
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                fontSize: "0.75rem",
                padding: "8px",
                color: theme.palette.primary.main,
              }}
            >
              Excipiente
            </TableCell>
            <TableCell
              align="right"
              sx={{
                fontWeight: "bold",
                fontSize: "0.75rem",
                padding: "8px",
                color: theme.palette.primary.main,
              }}
            >
              Total
            </TableCell>
            <TableCell
              align="right"
              sx={{
                fontWeight: "bold",
                fontSize: "0.75rem",
                padding: "8px",
                color: theme.palette.primary.main,
              }}
            >
              Na Área
            </TableCell>
            <TableCell
              align="right"
              sx={{
                fontWeight: "bold",
                fontSize: "0.75rem",
                padding: "8px",
                color: theme.palette.primary.main,
              }}
            >
              Falta solicitar
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: "bold",
                fontSize: "0.75rem",
                padding: "8px",
                color: theme.palette.primary.main,
              }}
            >
              Status
            </TableCell>
          </TableRow>
        </StyledTableHead>
        <TableBody>
          {Object.entries(filteredExcipientes).map(
            ([excipient, { total, ordens, codigo }]) => {
              const naArea = materiaisNaArea[excipient] || 0;
              // Calcular totalNaoPesado considerando apenas as ordens não pesadas
              const totalNaoPesado = ordens.reduce((sum, ordem) => {
                return sum + (ordem.pesado ? 0 : ordem.quantidade);
              }, 0);
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
                    <TableCell
                      sx={{
                        padding: "8px",
                        fontSize: "0.75rem",
                        fontWeight: "medium",
                      }}
                    >
                      {codigo}
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: "8px",
                        fontSize: "0.75rem",
                        fontWeight: "medium",
                      }}
                    >
                      {excipient}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ padding: "8px", fontSize: "0.75rem" }}
                    >
                      {totalNaoPesado.toFixed(3) + " kg"}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ padding: "8px", fontSize: "0.75rem" }}
                    >
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
                            <InputAdornment position="end">Kg</InputAdornment>
                          ),
                        }}
                        sx={{
                          width: "100px", // Aumentado de 80px para 100px
                          "& .MuiInputBase-input": {
                            padding: "8px 12px", // Ajustado o padding interno
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        padding: "6px", // Reduzido o padding para melhor disposição
                        fontSize: "0.7rem", // Fonte ligeiramente reduzida
                        fontWeight: "bold",
                      }}
                    >
                      {(() => {
                        const faltaSolicitarValue = totalNaoPesado - naArea;
                        if (faltaSolicitarValue > 0 || naArea === 0) {
                          // Se falta solicitar ou está zerado, exibe em vermelho
                          return (
                            <Typography
                              sx={{
                                color: theme.palette.error.main,
                                fontWeight: "bold",
                                fontSize: "0.7rem", // Fonte ligeiramente reduzida
                              }}
                            >
                              {faltaSolicitarValue.toFixed(3)} Kg
                            </Typography>
                          );
                        } else {
                          // Se há material suficiente ou excedente, exibe em verde
                          return (
                            <Typography
                              sx={{
                                color: theme.palette.success.main,
                                fontWeight: "bold",
                                fontSize: "0.7rem", // Fonte ligeiramente reduzida
                              }}
                            >
                              {naArea.toFixed(3)} Kg
                            </Typography>
                          );
                        }
                      })()}
                    </TableCell>
                    <TableCell align="center" sx={{ padding: "8px" }}>
                      <Chip
                        label={getStatusLabel(status)}
                        sx={{
                          backgroundColor: getStatusColor(status),
                          color: theme.palette.text.primary,
                          fontWeight: "medium",
                          fontSize: "0.75rem",
                          height: "24px",
                        }}
                        icon={
                          status === "pesado" ? (
                            <CheckIcon fontSize="small" />
                          ) : status.startsWith("atende") ? (
                            <RemoveIcon fontSize="small" />
                          ) : null
                        }
                        onClick={(e) => {
                          e.stopPropagation(); // Impede que o clique se propague para a linha
                          handleStatusClick(excipient);
                        }}
                      />
                    </TableCell>
                  </StyledTableRow>
                  <StyledExpandedRow>
                    <TableCell
                      style={{ paddingBottom: 0, paddingTop: 0 }}
                      colSpan={6} // Ajustado para 6 para acomodar a nova coluna
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
                            padding: 2,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            component="div"
                            sx={{
                              fontWeight: "bold",
                              color: theme.palette.primary.main,
                              marginBottom: "12px",
                            }}
                          >
                            Detalhes do Excipiente: {codigo} - {excipient}
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
                                <TableCell
                                  sx={{
                                    fontWeight: "bold",
                                    fontSize: "0.75rem",
                                    color: theme.palette.primary.main,
                                  }}
                                >
                                  Código
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontWeight: "bold",
                                    fontSize: "0.75rem",
                                    color: theme.palette.primary.main,
                                  }}
                                >
                                  Ordem
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontWeight: "bold",
                                    fontSize: "0.75rem",
                                    color: theme.palette.primary.main,
                                  }}
                                >
                                  Qtd
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{
                                    fontWeight: "bold",
                                    fontSize: "0.75rem",
                                    color: theme.palette.primary.main,
                                  }}
                                >
                                  Status
                                </TableCell>
                                <TableCell
                                  align="center"
                                  sx={{
                                    fontWeight: "bold",
                                    fontSize: "0.75rem",
                                    color: theme.palette.primary.main,
                                  }}
                                >
                                  Pesado
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {ordens.map((ordem, index) => (
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
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    {ordem.codigo}{" "}
                                    {/* Alterado para exibir o código da receita */}
                                  </TableCell>
                                  <TableCell
                                    component="th"
                                    scope="row"
                                    sx={{
                                      fontSize: "0.75rem",
                                      borderLeft: `4px solid ${
                                        ordem.pesado
                                          ? theme.palette.success.main
                                          : theme.palette.warning.main
                                      }`,
                                    }}
                                  >
                                    {ordem.op ? (
                                      <>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontWeight: "bold",
                                            color: theme.palette.primary.main,
                                            backgroundColor: alpha(
                                              theme.palette.primary.main,
                                              0.1
                                            ),
                                            padding: "1px 3px",
                                            borderRadius: "2px",
                                            display: "inline-block",
                                            marginRight: "4px",
                                            fontSize: "0.65rem",
                                          }}
                                        >
                                          OP: {ordem.op}
                                        </Typography>
                                        {ordem.nome}
                                      </>
                                    ) : (
                                      ordem.nome
                                    )}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: "0.75rem" }}>
                                    {ordem.quantidade.toFixed(3) + " Kg"}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    sx={{ fontSize: "0.75rem" }}
                                  >
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
                                        fontSize: "0.65rem",
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
                                  <TableCell align="center">
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
              colSpan={6}
              sx={{
                borderTop: `2px solid ${theme.palette.primary.main}`,
                padding: "8px",
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              }}
            >
              <Typography variant="body2" fontWeight="bold" color="primary">
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
