import React, { useState, useEffect } from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
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

const ExcelUploader = ({
  onDataUpdated,
  openUploadDialog,
  handleCloseUploadDialog,
}) => {
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
      alert(`Erro ao processar dados: ${error.message || "Erro desconhecido"}`);
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
        .neq("id", 0); // Isso deletará todas as linhas, pois 'id' nunca será 0

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
      {openUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Atualizar Dados de Materiais
              </h2>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Cole o conteúdo da sua planilha Excel aqui:
              </p>

              <textarea
                rows={10}
                className="w-full px-3 py-2 
                  bg-white dark:bg-slate-700
                  border border-gray-200 dark:border-slate-600 
                  rounded-lg text-gray-900 dark:text-slate-100
                  placeholder-gray-400 dark:placeholder-slate-400
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={pastedData}
                onChange={handlePaste}
                placeholder="Cole os dados da planilha aqui..."
              />

              {/* Update History */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Últimas atualizações:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {updateHistory.map((update, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
                        bg-blue-100 dark:bg-blue-900/40 
                        text-blue-800 dark:text-blue-300"
                    >
                      {new Date(update.updated_at).toLocaleString()} -{" "}
                      {update.records_updated} registros
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg flex justify-end gap-2">
              <button
                onClick={handleCloseUploadDialog}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={processData}
                disabled={uploading || !pastedData.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-5 w-5" />
                    <span>Processar Dados</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExcelUploader;
