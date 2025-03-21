import React, { useState, useEffect, useCallback } from "react";
import { 
  PencilSquareIcon, 
  PlusCircleIcon, 
  ChevronDownIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  ArchiveBoxIcon,
  TruckIcon,
  ClipboardDocumentIcon
} from "@heroicons/react/24/outline";
import { useRequests } from '../contexts/RequestsContext';
import { STATUS } from "../components/AlmoxarifadoManager/constants";

// Helper function to format elapsed time
const formatElapsedTime = (timestamp) => {
  if (!timestamp) return "N/A";
  
  const created = new Date(timestamp);
  const now = new Date();
  const diffMs = now - created;
  
  // Convert to appropriate units
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  } else if (diffMins > 0) {
    return `${diffMins}m`;
  } else {
    return "Agora";
  }
};

const MaterialRequestManager = ({ 
  selectedExcipient, 
  pendingQuantity,
  currentAmount,
  filteredExcipientes // Adicionando esta prop
}) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [elapsedTimeUpdater, setElapsedTimeUpdater] = useState(0);
  const [selectedExcipientData, setSelectedExcipientData] = useState(null);
  
  const { 
    materialRequests, 
    handleAddRequest, 
    handleDeleteRequest, 
    handleUpdateRequestStatus,
    getExcipientData 
  } = useRequests();

  // Update elapsed time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTimeUpdater(prev => prev + 1);
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  // Adicionar função para copiar o código para a área de transferência
  const handleCopyCode = (codigo) => {
    if (!codigo) return;
    
    navigator.clipboard.writeText(codigo)
      .then(() => {
        // Feedback visual temporário
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

  // Adicionar log para debug
  useEffect(() => {
    if (selectedExcipient) {
      console.log("MaterialRequestManager: materialRequests para", selectedExcipient, materialRequests[selectedExcipient]);
    }
  }, [materialRequests, selectedExcipient]);

  // Buscar dados do excipiente selecionado
  useEffect(() => {
    if (selectedExcipient) {
      // Verificar se temos filteredExcipientes disponível
      if (filteredExcipientes && filteredExcipientes[selectedExcipient]) {
        // Obter dados do excipiente incluindo o código
        setSelectedExcipientData(filteredExcipientes[selectedExcipient]);
      } else {
        // Usar o contexto como fallback se disponível
        const excipientData = getExcipientData ? getExcipientData(selectedExcipient) : null;
        setSelectedExcipientData(excipientData);
      }
    }
  }, [selectedExcipient, filteredExcipientes, getExcipientData]);

  // Calculate total requested amount
  const totalRequested = materialRequests[selectedExcipient]?.reduce(
    (sum, req) => sum + parseFloat(req.amount || 0), 0
  ) || 0;

  // Get current request being edited, if any
  const currentRequest = selectedRequest !== null 
    ? materialRequests[selectedExcipient]?.[selectedRequest] 
    : null;

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const amount = formData.get('amount');
    const status = formData.get('status');
    const notes = formData.get('notes');
    
    if (!amount || isNaN(parseFloat(amount))) {
      alert('Por favor, insira uma quantidade válida');
      return;
    }
    
    // Create new request object with precise timestamp
    const newRequest = {
      date: new Date().toISOString(), // Store full ISO timestamp
      amount: parseFloat(amount),
      status: status || 'pendente',
      notes: notes || '',
      id: currentRequest?.id || Date.now()
    };
    
    // Add or update request
    handleAddRequest(selectedExcipient, newRequest, selectedRequest !== null ? selectedRequest : null);
    
    // Reset form
    e.target.reset();
    setSelectedRequest(null);
  };

  // Handle selecting a request to edit
  const handleSelectRequestForEdit = (index) => {
    setSelectedRequest(index);
  };

  // Handle canceling the edit operation
  const handleCancelEdit = () => {
    setSelectedRequest(null);
  };

  // Handle deleting a request - renamed to deleteRequest to avoid naming conflict
  const deleteRequest = (excipient, index) => {
    if (window.confirm('Tem certeza que deseja excluir esta solicitação?')) {
      handleDeleteRequest(excipient, index);
      if (selectedRequest === index) {
        setSelectedRequest(null);
      }
    }
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 
                        ring-1 ring-orange-600/20">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pendente
          </span>
        );
      case 'solicitado':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 
                        ring-1 ring-yellow-600/20">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Solicitado
          </span>
        );
      case 'pago':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 
                        ring-1 ring-green-600/20">
            <BanknotesIcon className="w-3 h-3 mr-1" />
            Pago
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        bg-gray-100 dark:bg-gray-900/40 text-gray-800 dark:text-gray-300 
                        ring-1 ring-gray-600/20">
            {status}
          </span>
        );
    }
  };

  // Adicionando opções rápidas para alterar o status
  const renderStatusOptions = (index, currentStatus) => {
    // Map of possible status transitions - simplified to only 3 statuses
    const statusTransitions = {
      'pendente': ['solicitado', 'pago'],
      'solicitado': ['pendente', 'pago'],
      'pago': ['pendente', 'solicitado']
    };

    // Get appropriate icon for each status
    const getStatusIcon = (status) => {
      switch (status) {
        case 'pendente': return <ClockIcon className="h-3 w-3" />;
        case 'solicitado': return <CheckCircleIcon className="h-3 w-3" />;
        case 'pago': return <BanknotesIcon className="h-3 w-3" />;
        default: return null;
      }
    };
    
    // Get CSS class for button based on status
    const getStatusButtonClass = (status) => {
      switch (status) {
        case 'pendente':
          return "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20";
        case 'solicitado':
          return "text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20";
        case 'pago':
          return "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20";
        default: 
          return "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50";
      }
    };

    return (
      <div className="flex space-x-1">
        {statusTransitions[currentStatus]?.map(newStatus => (
          <button
            key={newStatus}
            onClick={() => handleChangeStatus(index, newStatus)}
            className={`p-1 ${getStatusButtonClass(newStatus)} rounded-md transition-colors duration-200 text-xs`}
            title={`Marcar como ${newStatus}`}
          >
            {getStatusIcon(newStatus)}
          </button>
        ))}
      </div>
    );
  };

  // Handle changing request status
  const handleChangeStatus = (index, newStatus) => {
    handleUpdateRequestStatus(selectedExcipient, index, newStatus);
  };

  // Format time for display (date and time)
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Resumo do material em card destacado */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800/60 dark:to-blue-900/30 
                    border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden shadow-sm">
        <div className="grid md:grid-cols-2 gap-4 p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              {selectedExcipient}
            </h3>
            {selectedExcipientData && (
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="text-xs text-gray-600/80 dark:text-gray-400/80 font-medium">
                  Código: {selectedExcipientData.codigo || 'N/A'}
                </span>
                {selectedExcipientData.codigo && (
                  <button
                    onClick={() => handleCopyCode(selectedExcipientData.codigo)}
                    className="opacity-50 hover:opacity-100 transition-opacity duration-150 
                             hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                    title="Copiar código"
                  >
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-gray-600/80 dark:text-gray-400/80 uppercase font-medium tracking-wide mt-2">
              Material em produção
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-white/70 dark:bg-gray-800/50 p-3 border border-blue-100 dark:border-blue-800/30">
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
                Quantidade na Área
              </p>
              <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                {currentAmount.toFixed(3)} kg
              </p>
            </div>
            
            <div className="rounded-lg bg-white/70 dark:bg-gray-800/50 p-3 border border-yellow-100 dark:border-yellow-800/30">
              <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 font-medium">
                Quantidade Pendente
              </p>
              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                {Math.max(0, pendingQuantity).toFixed(3)} kg
              </p>
            </div>
            
            <div className="rounded-lg bg-white/70 dark:bg-gray-800/50 p-3 border border-green-100 dark:border-green-800/30">
              <p className="text-xs text-green-600/80 dark:text-green-400/80 font-medium">
                Total Solicitado
              </p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {materialRequests[selectedExcipient]?.length > 0 ? `${totalRequested.toFixed(3)} kg` : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de nova solicitação em card interativo */}
      <div className="bg-white dark:bg-gray-800/80 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700/50">
        <div className="p-5">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
            <span className="bg-blue-100 dark:bg-blue-900/50 p-1 rounded-md mr-2">
              <PlusCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </span>
            {selectedRequest !== null ? "Editar Solicitação" : "Nova Solicitação"}
          </h3>
          
          <form 
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400">
                  Quantidade (kg)
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    name="amount"
                    step="0.001"
                    defaultValue={currentRequest ? 
                      currentRequest.amount : 
                      Math.max(0, pendingQuantity).toFixed(3)}
                    className="w-full pl-3 pr-9 py-2 text-sm
                             bg-white dark:bg-gray-700/50 
                             border border-gray-300 dark:border-gray-600
                             rounded-md text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                             focus:border-transparent
                             shadow-sm"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    kg
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400">
                  Status
                </label>
                <div className="relative">
                  <select 
                    name="status"
                    defaultValue={currentRequest ? 
                      currentRequest.status : 
                      'pendente'}
                    className="w-full px-3 py-2 
                             bg-white dark:bg-gray-700/50 
                             border border-gray-300 dark:border-gray-600
                             rounded-md text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                             focus:border-transparent appearance-none
                             shadow-sm text-sm"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="solicitado">Solicitado</option>
                    <option value="pago">Pago</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400">
                Observações
              </label>
              <textarea 
                name="notes"
                defaultValue={currentRequest ? 
                  currentRequest.notes : 
                  ""}
                className="w-full px-3 py-2 text-sm
                         bg-white dark:bg-gray-700/50 
                         border border-gray-300 dark:border-gray-600
                         rounded-md text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                         focus:border-blue-500 dark:focus:border-blue-400
                         shadow-sm transition-all duration-200
                         resize-none"
                rows="2"
                placeholder="Adicione observações sobre esta solicitação..."
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              {selectedRequest !== null && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 
                           bg-white dark:bg-gray-700 
                           border border-gray-300 dark:border-gray-600
                           rounded-md hover:bg-gray-50 dark:hover:bg-gray-600
                           transition-colors duration-200
                           shadow-sm"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-sm text-white
                         bg-gradient-to-r from-blue-600 to-blue-700 
                         hover:from-blue-700 hover:to-blue-800
                         dark:from-blue-700 dark:to-blue-600
                         dark:hover:from-blue-600 dark:hover:to-blue-500
                         rounded-md transition-all duration-200
                         shadow-sm hover:shadow
                         flex items-center space-x-2"
              >
                {selectedRequest !== null ? (
                  <>
                    <PencilSquareIcon className="h-4 w-4" />
                    <span>Atualizar</span>
                  </>
                ) : (
                  <>
                    <PlusCircleIcon className="h-4 w-4" />
                    <span>Adicionar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lista de solicitações */}
      {materialRequests[selectedExcipient] && materialRequests[selectedExcipient].length > 0 && (
        <div className="bg-white dark:bg-gray-800/80 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700/50 overflow-hidden">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <span className="bg-blue-100 dark:bg-blue-900/50 p-1 rounded-md mr-2">
                  <CheckCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </span>
                Solicitações Realizadas
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total: <span className="font-semibold">{totalRequested.toFixed(3)} kg</span>
              </div>
            </h3>
            
            <div className="overflow-x-auto -mx-4">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/90">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Observações
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tempo
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700/50">
                  {materialRequests[selectedExcipient].map((request, index) => (
                    <tr key={request.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {formatDateTime(request.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {parseFloat(request.amount).toFixed(3)} kg
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          {renderStatusBadge(request.status)}
                          {renderStatusOptions(index, request.status)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {request.notes || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                            ${request.status === 'pago' ? 
                              'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 
                              'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'} 
                            ring-1 ring-gray-600/20`}>
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {request.status === 'pago' ? 
                              "Concluído" : 
                              formatElapsedTime(request.date)
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleSelectRequestForEdit(index)}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 
                                     rounded-md transition-colors duration-200"
                            title="Editar solicitação"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteRequest(selectedExcipient, index)}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 
                                     rounded-md transition-colors duration-200"
                            title="Excluir solicitação"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialRequestManager;