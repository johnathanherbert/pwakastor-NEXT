"use client";
import React, { useState, useMemo, useEffect } from "react";
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
  PlusCircleIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { EXCIPIENTES_ESPECIAIS } from "../app/constants";
import Modal from "./Modal";
import MaterialRequestManager from "./MaterialRequestManager";
import AlmoxarifadoManager from "./AlmoxarifadoManager";
import { useRequests } from '../contexts/RequestsContext';

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
  const [almoxarifadoOpen, setAlmoxarifadoOpen] = useState(false);
  const [showCompletedItems, setShowCompletedItems] = useState(false);

  // Usar o contexto de requests
  const { materialRequests } = useRequests();

  // Estado para gerenciar solicitações
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);

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
      <div className="flex flex-col gap-5">
        {/* Improved material summary card */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800/60 dark:to-blue-900/30 
                      border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden shadow-sm">
          <div className="grid md:grid-cols-2 gap-4 p-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                {selectedExcipient}
              </h3>
              <p className="text-xs text-gray-600/80 dark:text-gray-400/80 uppercase font-medium tracking-wide">
                Detalhes das Ordens
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/70 dark:bg-gray-800/50 p-3 border border-blue-100 dark:border-blue-800/30">
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
                  Quantidade na Área
                </p>
                <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                  {(materiaisNaArea[selectedExcipient] || 0).toFixed(3)} Kg
                </p>
              </div>
              
              <div className="rounded-lg bg-white/70 dark:bg-gray-800/50 p-3 border border-red-100 dark:border-red-800/30">
                <p className="text-xs text-red-600/80 dark:text-red-400/80 font-medium">
                  Quantidade Pendente
                </p>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">
                  {quantidadePendente.toFixed(3)} Kg
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Improved orders list */}
        <div className="bg-white dark:bg-gray-800/80 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700/50 overflow-hidden">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between">
              <span className="flex items-center">
                <span className="bg-blue-100 dark:bg-blue-900/50 p-1 rounded-md mr-2">
                  <ScaleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </span>
                Ordens de Produção
              </span>
              <div className="flex items-center space-x-2">
                <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 
                               text-xs font-medium px-2 py-0.5 rounded-full">
                  {ordensAtendidas.length} atendidas
                </span>
                <span className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 
                               text-xs font-medium px-2 py-0.5 rounded-full">
                  {ordensNaoAtendidas.length} pendentes
                </span>
              </div>
            </h3>
            
            <div className="overflow-x-auto -mx-4">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/90">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      OP
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700/50">
                  {[...ordensAtendidas, ...ordensNaoAtendidas].map((ordem) => {
                    const isAtendida = ordensAtendidas.includes(ordem);
                    return (
                      <tr key={ordem.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 
                                                     ${isAtendida ? "bg-green-50/50 dark:bg-green-900/10" : "bg-red-50/50 dark:bg-red-900/10"}`}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {ordem.op || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {ordem.nome}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
                          {ordem.quantidade.toFixed(3)} Kg
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                         ${isAtendida 
                                           ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200" 
                                           : "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"}`}>
                            {isAtendida ? (
                              <>
                                <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                                Atende
                              </>
                            ) : (
                              <>
                                <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1" />
                                Não Atende
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
    let filtered = Object.entries(filteredExcipientes).filter(([excipient]) =>
      excipient.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Se showCompletedItems é false, removemos excipientes totalmente pesados
    if (!showCompletedItems) {
      filtered = filtered.filter(([excipient, { ordens }]) => {
        // Verifica se ordens é um array e se ainda existem ordens não pesadas
        return Array.isArray(ordens) && ordens.some(ordem => !ordem.pesado);
      });
    }

    return filtered;
  }, [filteredExcipientes, searchTerm, showCompletedItems]);

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

  const handleOpenRequestsModal = (excipient) => {
    setSelectedExcipient(excipient);
    setRequestsModalOpen(true);
  };

  const handleCloseRequestsModal = () => {
    setRequestsModalOpen(false);
    setSelectedExcipient(null);
  };

  const handleToggleAlmoxarifado = () => {
    setAlmoxarifadoOpen(!almoxarifadoOpen);
  };

  const getRequestStatusLabel = (excipient) => {
    if (!materialRequests[excipient] || materialRequests[excipient].length === 0) {
      return { label: "Solicitar", total: 0 };
    }
    
    // Calculate total amount requested
    const totalRequested = materialRequests[excipient].reduce(
      (total, req) => total + parseFloat(req.amount || 0), 
      0
    ).toFixed(2);
    
    const requestCount = materialRequests[excipient].length;
    const hasPending = materialRequests[excipient].some(req => req.status === "pendente");
    const hasRequested = materialRequests[excipient].some(req => req.status === "solicitado");
    const hasPaid = materialRequests[excipient].some(req => req.status === "pago");
    
    let statusLabel;
    if ([hasPending, hasRequested, hasPaid].filter(Boolean).length > 1) {
      statusLabel = `${requestCount} solicitações`;
    } else if (hasPending) {
      statusLabel = `${requestCount} pendente${requestCount > 1 ? 's' : ''}`;
    } else if (hasRequested) {
      statusLabel = `${requestCount} solicitado${requestCount > 1 ? 's' : ''}`;
    } else if (hasPaid) {
      statusLabel = `${requestCount} pago${requestCount > 1 ? 's' : ''}`;
    } else {
      statusLabel = `${requestCount} solicitações`;
    }
    
    // Return both the status label and the total quantity
    return {
      label: statusLabel,
      total: totalRequested
    };
  };

  const getRequestStatusColor = (excipient) => {
    if (!materialRequests[excipient] || materialRequests[excipient].length === 0) {
      return "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 ring-1 ring-blue-600/20";
    }
    
    const hasPending = materialRequests[excipient].some(req => req.status === "pendente");
    const hasRequested = materialRequests[excipient].some(req => req.status === "solicitado");
    const hasPaid = materialRequests[excipient].some(req => req.status === "pago");
    
    if (hasPending) {
      return "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 ring-1 ring-orange-600/20";
    } else if (hasRequested) {
      return "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 ring-1 ring-yellow-600/20";
    } else if (hasPaid) {
      return "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 ring-1 ring-green-600/20";
    }
    
    return "bg-gray-100 dark:bg-gray-900/40 text-gray-800 dark:text-gray-300 ring-1 ring-gray-600/20";
  };

  // Renderização das solicitações no modal
  const renderRequestsList = () => {
    if (!selectedExcipient) return null;
    
    const naArea = materiaisNaArea[selectedExcipient] || 0;
    
    // Calcular a quantidade pendente para este excipiente
    const pendingQuantity = filteredExcipientes[selectedExcipient]?.ordens.reduce(
      (total, ordem) => !ordem.pesado ? total + ordem.quantidade : total, 
      0
    ) - naArea;
    
    return (
      <MaterialRequestManager 
        selectedExcipient={selectedExcipient}
        pendingQuantity={pendingQuantity}
        currentAmount={naArea}
        filteredExcipientes={filteredExcipientes} // Passando filteredExcipientes como prop
      />
    );
  };

  // Close all status dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if the click is not on a status button
      if (!event.target.closest('.relative.inline-block button[class*="inline-flex"]')) {
        document.querySelectorAll('.relative.inline-block div').forEach(el => {
          el.classList.add('hidden');
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Adicionar função para copiar o código para a área de transferência
  const handleCopyCode = (codigo) => {
    if (!codigo) return;
    
    navigator.clipboard.writeText(codigo)
      .then(() => {
        // Opcional: feedback visual temporário
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm';
        toast.textContent = 'Código copiado!';
        document.body.appendChild(toast);
        
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 2000);
      })
      .catch(err => {
        console.error('Erro ao copiar: ', err);
      });
  };

  const renderTableRow = ([excipient, { total, ordens, codigo }]) => {
    const naArea = materiaisNaArea[excipient] || 0;
    const totalNaoPesado = ordens.reduce((acc, ordem) => {
      return acc + (ordem.pesado ? 0 : ordem.quantidade);
    }, 0);
    const falta = totalNaoPesado - naArea;

    // Get request status and total
    const requestStatus = getRequestStatusLabel(excipient);

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
                falta > 0
                  ? "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/40 ring-1 ring-red-600/20"
                  : "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/40 ring-1 ring-green-600/20"
              }`}
            >
              {Math.abs(falta).toFixed(2)} kg
            </span>
          </td>

          {/* Solicitações - Nova coluna com valor total */}
          <td className="px-2 py-1.5 text-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenRequestsModal(excipient);
              }}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
                ${getRequestStatusColor(excipient)} hover:opacity-80 transition-opacity duration-200`}
            >
              {materialRequests[excipient] && materialRequests[excipient].length > 0 ? (
                <>
                  <PlusCircleIcon className="w-2.5 h-2.5 mr-1" />
                  <div className="flex flex-col items-start leading-tight">
                    <span>{requestStatus.label}</span>
                    <span className="text-[10px] font-bold">{requestStatus.total} kg</span>
                  </div>
                </>
              ) : (
                <>
                  <PlusCircleIcon className="w-2.5 h-2.5 mr-1" />
                  Solicitar
                </>
              )}
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
                     transition-all duration-200 ease-in-out flex items-center justify-center"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
              </button>
              </td>
            </tr>

            <tr>
              <td colSpan={6} className="p-0">
              {expandedExcipient === excipient && (
                <div className="p-3 mx-2 mb-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/70 dark:to-gray-800/50 
                      rounded-lg border border-gray-200 dark:border-gray-700/50 shadow-sm dark:shadow-gray-900/30">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700/50">
                  <thead className="bg-white/60 dark:bg-gray-800/80 rounded-t-lg">
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
                  <tbody className="bg-white/70 dark:bg-gray-800/30 divide-y divide-gray-200 dark:divide-gray-700/30 rounded-b-lg overflow-hidden">
                  {ordens.map((ordem) => (
                    <tr
                    key={ordem.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                    >
                    <td className="px-3 py-2 text-[11px] font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex items-center space-x-1.5">
                        <span>{codigo || '-'}</span>
                        {codigo && (
                          <button
                            onClick={() => handleCopyCode(codigo)}
                            className="opacity-30 hover:opacity-100 transition-opacity duration-150 
                                     hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                            title="Copiar código"
                          >
                            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-2">
                      {ordem.op && (
                        <span
                        className="inline-flex items-center px-2 py-0.5 
                             rounded-md text-[11px] font-medium bg-blue-100 dark:bg-blue-900/50
                             text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30"
                        >
                        OP: {ordem.op}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                        {ordem.nome}
                      </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[11px] font-medium text-gray-900 dark:text-gray-100">
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
                      <div className="flex justify-center">
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
                      </div>
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
                    onClick={() => setShowCompletedItems(prev => !prev)}
                    className="flex items-center gap-1 px-2 py-1 text-xs
                     text-gray-700 dark:text-gray-300 
                     bg-white dark:bg-gray-700/50 
                     border border-gray-200 dark:border-gray-600
                     rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600/50 
                     transition-all duration-200 font-medium"
                    title={showCompletedItems ? "Ocultar materiais pesados" : "Mostrar materiais pesados"}
                  >
                    {showCompletedItems ? (
                      <>
                        <EyeSlashIcon className="h-3.5 w-3.5" />
                        <span>Ocultar Pesados</span>
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-3.5 w-3.5" />
                        <span>Mostrar Pesados</span>
                      </>
                    )}
                  </button>
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
                      Solicitar
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
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {showCompletedItems 
                    ? "Exibindo todos materiais" 
                    : "Ocultando materiais completamente pesados"}
                </span>
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

      {/* Modal de Solicitações usando MaterialRequestManager */}
      <Modal 
        isOpen={requestsModalOpen} 
        onClose={handleCloseRequestsModal}
        title={`Solicitações ao Almoxarifado - ${selectedExcipient || ''}`}
        size="lg"
        variant="info"
        customIcon={<PlusCircleIcon className="h-5 w-5 text-white" />}
        footer={
          <div className="flex justify-end">
            <button
              onClick={handleCloseRequestsModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors duration-200 font-medium"
            >
              Fechar
            </button>
          </div>
        }
        bodyClass="px-4 py-4 space-y-4"
      >
        {selectedExcipient && renderRequestsList()}
      </Modal>

      {/* Modal de Detalhes */}
      <Modal
        isOpen={ordensDialogOpen}
        onClose={handleCloseOrdensDialog}
        title={`Detalhes das Ordens - ${selectedExcipient || ''}`}
        size="lg"
        variant="default"
        customIcon={<ScaleIcon className="h-5 w-5 text-white" />}
        footer={
          <div className="flex justify-end">
            <button
              onClick={handleCloseOrdensDialog}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors duration-200 font-medium"
            >
              Fechar
            </button>
          </div>
        }
        bodyClass="px-4 py-4"
      >
        {selectedExcipient && renderOrdensAtendidas()}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen && !!editingOrdem}
        onClose={handleCloseEditModal}
        title="Editar Ordem"
        size="sm"
        variant="default"
        customIcon={<PencilSquareIcon className="h-5 w-5 text-white" />}
        footer={
          <div className="flex justify-end space-x-2">
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
        }
        bodyClass="px-2 py-2"
      >
        {editingOrdem && (
          <div className="space-y-4 px-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                OP
              </label>
              <input
                type="text"
                value={editingOrdem.op || ""}
                onChange={(e) =>
                  setEditingOrdem({ ...editingOrdem, op: e.target.value })
                }
                className="w-full px-3 py-2 text-sm
                         bg-white dark:bg-gray-700/50 
                         border border-gray-300 dark:border-gray-600
                         rounded-lg text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                         focus:border-blue-500 dark:focus:border-blue-400
                         shadow-sm transition-all duration-200
                         placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Número da OP"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome
              </label>
              <input
                type="text"
                value={editingOrdem.nome || ""}
                onChange={(e) =>
                  setEditingOrdem({ ...editingOrdem, nome: e.target.value })
                }
                className="w-full px-3 py-2 text-sm
                         bg-white dark:bg-gray-700/50 
                         border border-gray-300 dark:border-gray-600
                         rounded-lg text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                         focus:border-blue-500 dark:focus:border-blue-400
                         shadow-sm transition-all duration-200
                         placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Nome da ordem"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantidade (kg)
              </label>
              <div className="relative">
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
                  className="w-full pl-3 pr-9 py-2 text-sm
                           bg-white dark:bg-gray-700/50 
                           border border-gray-300 dark:border-gray-600
                           rounded-lg text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                           focus:border-blue-500 dark:focus:border-blue-400
                           shadow-sm transition-all duration-200
                           placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="0.000"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 text-xs">
                  kg
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default TabelaPrincipal;
