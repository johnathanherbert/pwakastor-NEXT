import React, { useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ArrowPathIcon,
  ChartBarIcon,
  TableCellsIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from "@heroicons/react/24/outline";

export default function Sap({ open, onClose, user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [materialData, setMaterialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'
  const [copied, setCopied] = useState(false);

  const handleSearch = async () => {
    if (!user || !searchTerm.trim()) return;
    setLoading(true);
    setError(null);
    setMaterialData(null);

    try {
      const { data, error } = await supabase
        .from("materials_database")
        .select("*")
        .eq("codigo_materia_prima", searchTerm.trim())
        .order('data_validade', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const groupedData = data.reduce((acc, item) => {
          if (!acc.codigo_materia_prima) {
            acc.codigo_materia_prima = item.codigo_materia_prima;
            acc.descricao = item.descricao;
            acc.unidade_medida = item.unidade_medida;
            acc.saldo_total = 0;
            acc.lotes = [];
            acc.tipo_estoque = item.tipo_estoque;
            acc.estatisticas = {
              media_por_lote: 0,
              menor_lote: Infinity,
              maior_lote: -Infinity,
              total_lotes: 0
            };
          }

          const quantidade = parseFloat(item.qtd_materia_prima) || 0;
          acc.saldo_total += quantidade;
          acc.estatisticas.total_lotes++;
          acc.estatisticas.menor_lote = Math.min(acc.estatisticas.menor_lote, quantidade);
          acc.estatisticas.maior_lote = Math.max(acc.estatisticas.maior_lote, quantidade);

          acc.lotes.push({
            lote: item.lote,
            quantidade: quantidade,
            tipo_estoque: item.tipo_estoque,
            data_validade: item.data_validade
          });

          return acc;
        }, {});

        // Calcular média após processar todos os lotes
        groupedData.estatisticas.media_por_lote = 
          groupedData.saldo_total / groupedData.estatisticas.total_lotes;

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const copyToClipboard = useCallback(async () => {
    if (!materialData) return;

    const formatData = () => {
      const header = `${materialData.codigo_materia_prima} - ${materialData.descricao}\n`;
      const summary = `Saldo Total: ${materialData.saldo_total.toFixed(3)} ${materialData.unidade_medida}\n`;
      const lotes = materialData.lotes
        .map(lote => 
          `${lote.lote}\t${lote.quantidade.toFixed(3)}\t${lote.tipo_estoque || '-'}\t${new Date(lote.data_validade).toLocaleDateString()}`
        )
        .join('\n');
      
      return `${header}${summary}\nLote\tQuantidade\tTipo\tValidade\n${lotes}`;
    };

    try {
      await navigator.clipboard.writeText(formatData());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  }, [materialData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-lg md:max-w-xl lg:max-w-2xl bg-white dark:bg-gray-800 
                       rounded-xl shadow-xl transform transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Consulta SAP
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Search Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite o código do material..."
                  className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                           placeholder-gray-500 dark:placeholder-gray-400"
                />
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                         transition-colors duration-200"
              >
                {loading ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="h-5 w-5" />
                )}
                <span>Buscar</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            {materialData && (
              <div className="space-y-4">
                {/* Material Info Card */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      Informações do Material
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                                 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 
                                 dark:hover:bg-gray-600/50 transition-colors duration-200"
                      >
                        {viewMode === 'table' ? (
                          <ChartBarIcon className="h-5 w-5" />
                        ) : (
                          <TableCellsIcon className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                                 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 
                                 dark:hover:bg-gray-600/50 transition-colors duration-200
                                 flex items-center gap-1"
                      >
                        {copied ? (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <DocumentDuplicateIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Código</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {materialData.codigo_materia_prima}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Descrição</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {materialData.descricao}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Unidade de Medida</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {materialData.unidade_medida}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Total</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {materialData.saldo_total.toFixed(3)} {materialData.unidade_medida}
                      </p>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total de Lotes</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {materialData.estatisticas.total_lotes}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Média por Lote</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {materialData.estatisticas.media_por_lote.toFixed(3)} {materialData.unidade_medida}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Menor Lote</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {materialData.estatisticas.menor_lote.toFixed(3)} {materialData.unidade_medida}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Maior Lote</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {materialData.estatisticas.maior_lote.toFixed(3)} {materialData.unidade_medida}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lots Table */}
                {materialData.lotes && materialData.lotes.length > 0 && viewMode === 'table' && (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Lote
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Quantidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Validade
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                        {materialData.lotes.map((lote, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                              {lote.lote}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                           bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                                {lote.quantidade.toFixed(3)} {materialData.unidade_medida}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {lote.tipo_estoque || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {new Date(lote.data_validade).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Chart View - Placeholder for future implementation */}
                {viewMode === 'chart' && (
                  <div className="h-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      Visualização em gráfico em desenvolvimento
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
