"use client";
import React, { useState, useMemo } from "react";
import {
  CheckIcon,
  ScaleIcon,
  WarningIcon,
  ExclamationCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  MinusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PencilIcon,
  ChevronRightIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { EXCIPIENTES_ESPECIAIS } from "../app/constants";

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
  calcularMovimentacaoTotal,
  getOrdensAtendidas,
  handleUpdateSAPValues,
  handleUpdateAllSAPValues,
  handleEditOrdem,
}) => {
  const [ordensDialogOpen, setOrdensDialogOpen] = useState(false);
  const [selectedExcipient, setSelectedExcipient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [faltaSolicitarSort, setFaltaSolicitarSort] = useState("desc");
  const [showAutomaticOnly, setShowAutomaticOnly] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrdem, setEditingOrdem] = useState(null);

  const handleOpenOrdensDialog = (excipient) => {
    setSelectedExcipient(excipient);
    setOrdensDialogOpen(true);
  };

  const handleCloseOrdensDialog = () => {
    setOrdensDialogOpen(false);
    setSelectedExcipient(null);
  };

  const handleOpenEditModal = (ordem) => {
    setEditingOrdem(ordem);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingOrdem(null);
    setEditModalOpen(false);
  };

  const handleSaveEdit = (ordem) => {
    handleEditOrdem(ordem);
    handleCloseEditModal();
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

    // Calcular a quantidade pendente
    const quantidadePendente = ordensNaoAtendidas.reduce(
      (total, ordem) => total + ordem.quantidade,
      0
    );

    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gray-800">{selectedExcipient}</h2>
        <div className="flex justify-between items-start bg-gray-100 p-4 rounded-md">
          <div>
            <p className="text-sm text-gray-500">Material</p>
            <h3 className="font-bold text-gray-800">{selectedExcipient}</h3>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Quantidade na Área</p>
            <h3 className="font-bold text-gray-800">
              {(materiaisNaArea[selectedExcipient] || 0).toFixed(3)} Kg
            </h3>
            <p className="text-sm text-gray-500 mt-1">Quantidade Pendente</p>
            <h3 className="font-bold text-red-500">
              {quantidadePendente.toFixed(3)} Kg
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody>
              {[...ordensAtendidas, ...ordensNaoAtendidas].map((ordem) => {
                const isAtendida = ordensAtendidas.includes(ordem);
                const bgColorClass = isAtendida ? "bg-green-50" : "bg-red-50";
                return (
                  <tr key={ordem.id} className={bgColorClass}>
                    <td className="px-4 py-2">{ordem.op || "N/A"}</td>
                    <td className="px-4 py-2">{ordem.nome}</td>
                    <td className="px-4 py-2 text-right">
                      {ordem.quantidade.toFixed(3)} Kg
                    </td>
                    <td className="px-4 py-2 text-center">
                      {isAtendida ? "Atende" : "Não Atende"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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

  // Filtrar excipientes com base no termo de pesquisa
  const filteredExcipientsList = useMemo(() => {
    return Object.entries(filteredExcipientes).filter(([excipient]) =>
      excipient.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredExcipientes, searchTerm]);

  const toggleFaltaSolicitarSort = () => {
    setFaltaSolicitarSort((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const sortedRows = useMemo(() => {
    let filtered = [...filteredExcipientsList];

    if (showAutomaticOnly) {
      filtered = filtered.filter(([excipient]) =>
        EXCIPIENTES_ESPECIAIS.includes(excipient)
      );
    }

    return filtered.sort((a, b) => {
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
  }, [
    filteredExcipientsList,
    materiaisNaArea,
    faltaSolicitarSort,
    showAutomaticOnly,
  ]);

  // Primeiro, vamos melhorar a função getStatusColor para ter mais variações visuais
  const getStatusColor = (status) => {
    switch (status) {
      case "pesado":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 ring-1 ring-green-600/20";
      case "ok":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 ring-1 ring-green-600/20";
      case status.startsWith("atende") ? status : "":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 ring-1 ring-yellow-600/20";
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 ring-1 ring-yellow-600/20";
      case "error":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 ring-1 ring-red-600/20";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 ring-1 ring-gray-600/20";
    }
  };

  // Adicione esta função
  const handleSearchExcipient = (value) => {
    setSearchTerm(value);
  };

  const renderTableRow = ([excipient, { total, ordens, codigo }]) => {
    const naArea = materiaisNaArea[excipient] || 0;
    const totalNaoPesado = ordens.reduce((acc, ordem) => {
      return acc + (ordem.pesado ? 0 : ordem.quantidade);
    }, 0);
    const status = getExcipientStatus(naArea, totalNaoPesado, ordens);

    return (
      <React.Fragment key={excipient}>
        <tr
          onClick={() => handleToggleExpandExcipient(excipient)}
          className="hover:bg-gray-50 dark:hover:bg-gray-800/70 cursor-pointer transition-all duration-200 ease-in-out border-b border-gray-200 dark:border-gray-700/50"
        >
          {/* Excipiente */}
          <td className="px-2 py-1.5">
            <div className="flex items-center gap-1">
              <ChevronRightIcon
                className={`h-3.5 w-3.5 text-gray-400 dark:text-gray-500 transform transition-transform duration-200 ease-in-out
                ${expandedExcipient === excipient ? "rotate-90" : ""}`}
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {excipient}
              </span>
            </div>
          </td>

          {/* Total */}
          <td className="px-2 py-1.5 text-right">
            <span className="text-[11px] text-gray-700 dark:text-gray-300">
              {totalNaoPesado.toFixed(2)} kg
            </span>
          </td>

          {/* Na Área */}
          <td className="px-2 py-1.5 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <input
                type="number"
                value={inputValues[excipient] || ""}
                onChange={(e) =>
                  handleMateriaisNaAreaChange(excipient, e.target.value)
                }
                className="w-16 px-1.5 py-0.5 text-right text-[11px] border rounded 
                          bg-white dark:bg-gray-800/90 
                          text-gray-900 dark:text-gray-100
                          border-gray-300 dark:border-gray-600
                          focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                          focus:border-transparent
                          [&::-webkit-inner-spin-button]:appearance-none
                          [&::-webkit-outer-spin-button]:appearance-none
                          dark:placeholder-gray-500"
                placeholder="0.00"
              />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                kg
              </span>
            </div>
          </td>

          {/* Falta */}
          <td className="px-2 py-1.5 text-right">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
              ${
                totalNaoPesado - naArea > 0
                  ? "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/40 ring-1 ring-red-600/20 dark:ring-red-400/30"
                  : "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/40 ring-1 ring-green-600/20 dark:ring-green-400/30"
              }`}
            >
              {Math.abs(totalNaoPesado - naArea).toFixed(2)} kg
            </span>
          </td>

          {/* Status */}
          <td className="px-2 py-1.5 text-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusClick(excipient);
              }}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
                ${getStatusColor(
                  status
                )} hover:opacity-80 transition-opacity duration-200`}
            >
              {status === "pesado" && <CheckIcon className="w-2.5 h-2.5 mr-1" />}
              {getStatusLabel(status)}
            </button>
          </td>

          {/* SAP */}
          <td className="px-2 py-1.5 text-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateSAPValues(excipient, codigo);
              }}
              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg
                       transition-all duration-200 ease-in-out active:scale-95"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
            </button>
          </td>
        </tr>

        {/* Linha Expandida */}
        <tr>
          <td colSpan={6} className="p-0">
            {expandedExcipient === excipient && (
              <div className="p-2 m-2 bg-gray-50 dark:bg-gray-800/70 rounded-md border border-gray-200 dark:border-gray-700/50 shadow-sm dark:shadow-gray-900/30">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700/50">
                  <thead className="bg-gray-50 dark:bg-gray-800/90">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Quantidade
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pesado
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700/50">
                    {ordens.map((ordem) => (
                      <tr
                        key={ordem.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors duration-200"
                      >
                        <td className="px-3 py-2 text-[11px] text-gray-900 dark:text-gray-100">
                          {codigo || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center space-x-2">
                            {ordem.op && (
                              <span
                                className="inline-flex items-center px-2 py-0.5 
                                                         rounded text-[11px] font-medium bg-blue-100 dark:bg-blue-900/50
                                                         text-blue-800 dark:text-blue-300"
                              >
                                OP: {ordem.op}
                              </span>
                            )}
                            <span className="text-[11px] text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                              {ordem.nome}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[11px] text-gray-900 dark:text-gray-100">
                          {ordem.quantidade.toFixed(2)} kg
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs 
                            font-medium ${
                              ordem.pesado
                                ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 ring-1 ring-green-600/20 dark:ring-green-400/30"
                                : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 ring-1 ring-yellow-600/20 dark:ring-yellow-400/30"
                            }
                          `}
                          >
                            {ordem.pesado ? (
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                            ) : (
                              <ScaleIcon className="w-3 h-3 mr-1" />
                            )}
                            {ordem.pesado ? "Pesado" : "Não Pesado"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={ordem.pesado}
                            onChange={() => togglePesado(excipient, ordem.id)}
                            className="w-4 h-4 
                                       text-blue-600 dark:text-blue-500
                                       border-gray-300 dark:border-gray-600 
                                       bg-white dark:bg-gray-700
                                       rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                                       focus:ring-offset-2 dark:focus:ring-offset-gray-900
                                       transition-colors duration-200
                                       cursor-pointer
                                       checked:bg-blue-500 dark:checked:bg-blue-600
                                       checked:hover:bg-blue-600 dark:checked:hover:bg-blue-700
                                       checked:focus:bg-blue-500 dark:checked:focus:bg-blue-600"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(ordem);
                            }}
                            className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg
                                     transition-all duration-200 ease-in-out"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      </React.Fragment>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Card Principal */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          {/* Header mais compacto e consistente */}
          <div className="p-2.5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Materiais em Produção
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {Object.keys(filteredExcipientes).length} materiais listados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar material..."
                      value={searchTerm}
                      onChange={(e) => handleSearchExcipient(e.target.value)}
                      className="w-48 px-2 py-1 pl-7 text-xs
                       bg-white dark:bg-gray-700/50 
                       border border-gray-200 dark:border-gray-600
                       rounded-lg text-gray-900 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <MagnifyingGlassIcon className="h-3.5 w-3.5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  <button
                    onClick={handleUpdateAllSAPValues}
                    className="flex items-center gap-1 px-2 py-1 text-xs
                     text-gray-700 dark:text-gray-300 
                     bg-white dark:bg-gray-700/50 
                     border border-gray-200 dark:border-gray-600
                     rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600/50 
                     transition-all duration-200 font-medium"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5" />
                    <span>Atualizar SAP</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela com design mais compacto */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th scope="col" className="px-2 py-2 text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Material
                      </span>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-2 text-right">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Total
                    </span>
                  </th>
                  <th scope="col" className="px-2 py-2 text-right">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Na Área
                    </span>
                  </th>
                  <th scope="col" className="px-2 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Falta
                      </span>
                      <button onClick={toggleFaltaSolicitarSort}>
                        {faltaSolicitarSort === "asc" ? (
                          <ArrowUpIcon className="h-3 w-3 text-gray-400" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-2 text-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </span>
                  </th>
                  <th scope="col" className="px-2 py-2 text-center w-10">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      SAP
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                {sortedRows.map(renderTableRow)}
              </tbody>
            </table>
          </div>

          {/* Footer mais compacto */}
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ScaleIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  Mostrar Automáticos
                </span>
                <button
                  onClick={() => setShowAutomaticOnly(!showAutomaticOnly)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
            ${
              showAutomaticOnly
                ? "bg-blue-600 dark:bg-blue-500"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm 
              transition-transform duration-200 ease-in-out
              ${showAutomaticOnly ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {ordensDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm 
                          transition-opacity"
              onClick={handleCloseOrdensDialog}
            />

            <div
              className="relative bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full shadow-xl 
                          transform transition-all"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 px-6 py-4 rounded-t-xl">
                <h2 className="text-xl font-bold text-white">
                  Detalhes das Ordens - {selectedExcipient}
                </h2>
              </div>

              <div className="p-6">
                {selectedExcipient && renderOrdensAtendidas()}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 rounded-b-xl flex justify-end">
                <button
                  onClick={handleCloseOrdensDialog}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           transition-colors duration-200 font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingOrdem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm 
                        transition-opacity"
              onClick={handleCloseEditModal}
            />

            <div
              className="relative bg-white dark:bg-gray-900 rounded-lg max-w-sm w-full shadow-xl 
                        transform transition-all"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 
                          px-4 py-3 rounded-t-lg">
                <h2 className="text-sm font-semibold text-white">Editar Ordem</h2>
              </div>

              <div className="p-4 space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    OP
                  </label>
                  <input
                    type="text"
                    value={editingOrdem.op || ""}
                    onChange={(e) =>
                      setEditingOrdem({ ...editingOrdem, op: e.target.value })
                    }
                    className="w-full px-2 py-1 text-xs
                             bg-white dark:bg-gray-800 
                             border border-gray-300 dark:border-gray-600
                             rounded-md text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                             placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={editingOrdem.nome || ""}
                    onChange={(e) =>
                      setEditingOrdem({ ...editingOrdem, nome: e.target.value })
                    }
                    className="w-full px-2 py-1 text-xs
                             bg-white dark:bg-gray-800 
                             border border-gray-300 dark:border-gray-600
                             rounded-md text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                             placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Quantidade (kg)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={editingOrdem.quantidade || ""}
                    onChange={(e) =>
                      setEditingOrdem({
                        ...editingOrdem,
                        quantidade: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 text-xs
                             bg-white dark:bg-gray-800 
                             border border-gray-300 dark:border-gray-600
                             rounded-md text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                             placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-b-lg flex justify-end space-x-2">
                <button
                  onClick={handleCloseEditModal}
                  className="px-3 py-1 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
                           border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 
                           dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSaveEdit(editingOrdem)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 
                           transition-colors duration-200 font-medium"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TabelaPrincipal;
