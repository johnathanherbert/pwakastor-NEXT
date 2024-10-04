import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Box,
} from "@mui/material";

const ExcipientDetailDialog = ({
  open,
  onClose,
  excipient,
  materiaisNaArea,
  ordens,
}) => {
  const naArea = materiaisNaArea[excipient] || 0;
  let quantidadeRestante = naArea;
  const ordensAtendidas = [];
  const ordensNaoAtendidas = [];

  const compareOPs = (a, b) => {
    if (a.op && b.op) {
      return a.op.toString().localeCompare(b.op.toString());
    }
    if (a.op) return -1;
    if (b.op) return 1;
    return 0;
  };

  const ordensOrdenadas = [...ordens].sort(compareOPs);

  ordensOrdenadas.forEach((ordem) => {
    if (quantidadeRestante >= ordem.quantidade) {
      ordensAtendidas.push(ordem);
      quantidadeRestante -= ordem.quantidade;
    } else {
      ordensNaoAtendidas.push(ordem);
    }
  });

  const renderOrdensList = (ordens, title) => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>OP</TableCell>
              <TableCell>Ativo</TableCell>
              <TableCell align="right">Quantidade (kg)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ordens.map((ordem) => (
              <TableRow key={ordem.id}>
                <TableCell>{ordem.op || "N/A"}</TableCell>
                <TableCell>{ordem.nome}</TableCell>
                <TableCell align="right">
                  {ordem.quantidade.toFixed(3)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalhes do Excipiente: {excipient}</DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          Quantidade na Área: {naArea.toFixed(3)} kg
        </Typography>
        {renderOrdensList(ordensAtendidas, "Ordens Atendidas")}
        {renderOrdensList(ordensNaoAtendidas, "Ordens Não Atendidas")}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExcipientDetailDialog;
