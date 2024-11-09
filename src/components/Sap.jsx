import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function Sap({ open, onClose, user }) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div
          className="relative w-full max-w-lg md:max-w-xl lg:max-w-2xl bg-white dark:bg-gray-800 
                        rounded-xl shadow-xl transform transition-all p-6"
        >
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o código do material..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white" />
              ) : (
                <MagnifyingGlassIcon className="h-5 w-5" />
              )}
              <span>Buscar</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {materialData && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Informações do Material</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Código</p>
                    <p className="font-medium">{materialData.codigo_materia_prima}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Descrição</p>
                    <p className="font-medium">{materialData.descricao}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unidade de Medida</p>
                    <p className="font-medium">{materialData.unidade_medida}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Saldo Total</p>
                    <p className="font-medium">{materialData.saldo_total?.toFixed(3)} {materialData.unidade_medida}</p>
                  </div>
                </div>
              </div>

              {materialData.lotes && materialData.lotes.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lote
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {materialData.lotes.map((lote, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lote.lote}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {parseFloat(lote.quantidade).toFixed(3)} {materialData.unidade_medida}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
