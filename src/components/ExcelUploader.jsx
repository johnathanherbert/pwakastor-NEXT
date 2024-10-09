import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  TextField,
  Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { supabase } from "../supabaseClient";

export const fetchUpdateHistory = async () => {
  try {
    const { data, error } = await supabase
      .from("update_history")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar histórico de atualizações:", error);
    return [];
  }
};

const ExcelUploader = ({ onDataUpdated, openUploadDialog, handleCloseUploadDialog }) => {
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [pastedData, setPastedData] = useState("");
  const [updateHistory, setUpdateHistory] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    fetchUpdateHistory().then(setUpdateHistory);
  }, []);

  const handlePaste = (e) => {
    setPastedData(e.target.value);
  };

  const processData = async () => {
    if (!user) {
      alert("Por favor, faça login para atualizar os dados.");
      return;
    }

    setUploading(true);
    try {
      const rows = pastedData.split("\n").map((row) => row.split("\t"));
      const headers = rows[0];
      const data = rows.slice(1);

      console.log("Headers:", headers);
      console.log("Primeiras 5 linhas de dados:", data.slice(0, 5));

      await uploadToSupabase(headers, data);

      if (onDataUpdated) {
        await onDataUpdated();
      }

      const newHistory = await fetchUpdateHistory();
      setUpdateHistory(newHistory);

      alert("Dados atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao processar dados:", error);
      alert(`Erro ao processar dados: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setUploading(false);
      handleCloseUploadDialog();
    }
  };

  const uploadToSupabase = async (headers, rows) => {
    try {
      // Limpa a tabela antes de inserir novos dados
      const { error: deleteError } = await supabase
        .from("materials_database")
        .delete()
        .neq('id', 0);  // Isso deletará todas as linhas, pois 'id' nunca será 0

      if (deleteError) {
        console.error("Erro ao deletar dados existentes:", deleteError);
        throw deleteError;
      }

      const columnMapping = {
        Material: "codigo_materia_prima",
        "Texto breve material": "descricao",
        Lote: "lote",
        "Estoque disponível": "qtd_materia_prima",
        "Unid.medida básica": "unidade_medida",
        Centro: "centro",
        Depósito: "deposito",
      };

      const formattedData = rows.map((row) => {
        const formattedRow = {};
        headers.forEach((header, index) => {
          const mappedColumn = columnMapping[header];
          if (mappedColumn) {
            let value = row[index];
            if (mappedColumn === "qtd_materia_prima") {
              value = parseFloat(value?.replace(",", ".")) || 0;
            } else if (typeof value === "string") {
              value = value.trim();
            }
            formattedRow[mappedColumn] = value === "" ? null : value;
          }
        });
        return formattedRow;
      });

      const validData = formattedData.filter((row) =>
        Object.values(row).some((value) => value !== null && value !== "")
      );

      // Insere os novos dados
      const { data, error: insertError } = await supabase
        .from("materials_database")
        .insert(validData)
        .select();

      if (insertError) throw insertError;

      // Registra a atualização
      await supabase
        .from("update_history")
        .insert({ user_id: user.id, records_updated: data.length });

      console.log("Dados inseridos com sucesso:", data);
      alert(
        `Dados atualizados com sucesso! ${data.length} registros inseridos.`
      );
    } catch (error) {
      console.error("Erro detalhado ao atualizar dados:", error);
      throw error;
    }
  };

  if (!user) return null;

  return (
    <>
      <Dialog
        open={openUploadDialog}
        onClose={handleCloseUploadDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Atualizar Dados de Materiais</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Cole o conteúdo da sua planilha Excel aqui:
          </Typography>
          <TextField
            multiline
            rows={10}
            fullWidth
            variant="outlined"
            value={pastedData}
            onChange={handlePaste}
            placeholder="Cole os dados da planilha aqui..."
          />
          <Box mt={2}>
            <Typography variant="subtitle1">Últimas atualizações:</Typography>
            {updateHistory.map((update, index) => (
              <Chip
                key={index}
                label={`${new Date(update.updated_at).toLocaleString()} - ${
                  update.records_updated
                } registros`}
                style={{ margin: "5px" }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancelar</Button>
          <Button
            onClick={processData}
            disabled={uploading || !pastedData.trim()}
          >
            {uploading ? <CircularProgress size={24} /> : "Processar Dados"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExcelUploader;
