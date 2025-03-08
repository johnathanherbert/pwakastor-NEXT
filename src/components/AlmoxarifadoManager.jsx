import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  PlusCircleIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const STATUS = {
  PENDENTE: 'pendente',
  SOLICITADO: 'solicitado',
  RECEBIDO: 'recebido'
};

export default function AlmoxarifadoManager({ 
  excipientes = {}, 
  materiaisNaArea = {}, 
  faltaSolicitar = {},
  onUpdateSolicitacao 
}) {
  const [solicitacoes, setSolicitacoes] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);
  const [editingSolicitacao, setEditingSolicitacao] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Calculate what needs to be requested
  const calcularFaltaSolicitar = () => {
    const falta = {};
    Object.entries(excipientes).forEach(([nome, dados]) => {
      const quantidadeNecessaria = dados.total;
      const quantidadeNaArea = materiaisNaArea[nome] || 0;
      
      if (quantidadeNaArea < quantidadeNecessaria) {
        falta[nome] = {
          quantidade: quantidadeNecessaria - quantidadeNaArea,
          codigo: dados.codigo,
          ordens: dados.ordens
        };
      }
    });
    return falta;
  };

  const materiaisFaltantes = calcularFaltaSolicitar();

  useEffect(() => {
    const storedSolicitacoes = localStorage.getItem('almoxarifadoSolicitacoes');
    if (storedSolicitacoes) {
      setSolicitacoes(JSON.parse(storedSolicitacoes));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('almoxarifadoSolicitacoes', JSON.stringify(solicitacoes));
  }, [solicitacoes]);

  const handleAddSolicitacao = (excipiente) => {
    setModalData({
      excipiente,
      quantidadeFalta: faltaSolicitar[excipiente] || 0,
      quantidadeSolicitada: '',
      observacao: '',
      status: STATUS.PENDENTE,
      timestamp: new Date().toISOString(),
      showQuantityInput: false // Add this line
    });
    setShowModal(true);
  };

  const handleSaveSolicitacao = () => {
    if (!modalData || !modalData.quantidadeSolicitada || modalData.quantidadeSolicitada === '0') {
      setShowModal(false);
      setModalData(null);
      return;
    }

    setSolicitacoes(prev => ({
      ...prev,
      [modalData.excipiente]: [
        ...(prev[modalData.excipiente] || []),
        {
          ...modalData,
          id: Date.now()
        }
      ]
    }));

    setShowModal(false);
    setModalData(null);
    if (onUpdateSolicitacao) {
      onUpdateSolicitacao();
    }
  };

  const updateSolicitacaoStatus = useCallback((excipiente, solicitacaoId, newStatus) => {
    setSolicitacoes(prev => {
      const updatedSolicitacoes = {
        ...prev,
        [excipiente]: prev[excipiente].map(sol => 
          sol.id === solicitacaoId ? { ...sol, status: newStatus } : sol
        )
      };
      localStorage.setItem('almoxarifadoSolicitacoes', JSON.stringify(updatedSolicitacoes));
      return updatedSolicitacoes;
    });
    if (onUpdateSolicitacao) {
      onUpdateSolicitacao();
    }
  }, [onUpdateSolicitacao]);

  const deleteSolicitacao = useCallback((excipiente, solicitacaoId) => {
    setSolicitacoes(prev => {
      const updatedSolicitacoes = {
        ...prev,
        [excipiente]: prev[excipiente].filter(sol => sol.id !== solicitacaoId)
      };
      // Remove o excipiente se não houver mais solicitações
      if (updatedSolicitacoes[excipiente].length === 0) {
        delete updatedSolicitacoes[excipiente];
      }
      localStorage.setItem('almoxarifadoSolicitacoes', JSON.stringify(updatedSolicitacoes));
      return updatedSolicitacoes;
    });
    if (onUpdateSolicitacao) {
      onUpdateSolicitacao();
    }
  }, [onUpdateSolicitacao]);

  const handleUpdateObservacao = (excipiente, solicitacaoId, novaObservacao) => {
    setSolicitacoes(prev => {
      const updatedSolicitacoes = {
        ...prev,
        [excipiente]: prev[excipiente].map(sol => 
          sol.id === solicitacaoId ? { ...sol, observacao: novaObservacao } : sol
        )
      };
      localStorage.setItem('almoxarifadoSolicitacoes', JSON.stringify(updatedSolicitacoes));
      return updatedSolicitacoes;
    });
    setEditingSolicitacao(null);
    setEditingText('');
    if (onUpdateSolicitacao) {
      onUpdateSolicitacao();
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white/30 dark:bg-gray-800/30 backdrop-blur shadow-xl shadow-black/5 ring-2 ring-purple-500/10 dark:ring-purple-400/10">
      <div className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center">
          <PlusCircleIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Gerenciamento de Solicitações
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Almoxarifado - (em desenvolvimento)
          </p>
        </div>
      </div>

      <div className="px-4 pb-4">
        {Object.keys(materiaisFaltantes).length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-lg">Nenhum item para solicitar no momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-gray-900/5 dark:ring-white/5">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Material
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Falta
                  </th>
                  <th scope="col" className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(materiaisFaltantes).map(([nome, dados]) => (
                  <tr key={nome} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-2">
                        <span className="whitespace-nowrap text-xs font-medium text-gray-900 dark:text-gray-100">
                          {nome}
                        </span>
                        {solicitacoes[nome]?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {solicitacoes[nome].map(sol => (
                              <div key={sol.id} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium
                                  ${sol.status === STATUS.PENDENTE ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' : ''}
                                  ${sol.status === STATUS.SOLICITADO ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : ''}
                                  ${sol.status === STATUS.RECEBIDO ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : ''}`}
                                >
                                  {Number(sol.quantidadeSolicitada).toFixed(3)}kg • {sol.status}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500 text-[10px]">
                                  {new Date(sol.timestamp).toLocaleString()}
                                </span>
                                {sol.observacao && (
                                  <span className="text-gray-500 dark:text-gray-400 text-[10px] italic truncate max-w-xs">
                                    "{sol.observacao}"
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td 
                      className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300"
                    >
                      {dados.codigo}
                    </td>
                    <td 
                      className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300"
                    >
                      {dados.quantidade.toFixed(3)} kg
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleAddSolicitacao(nome)}
                        className="p-1 rounded-lg text-purple-600 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                        title="Adicionar solicitação"
                      >
                        <PlusCircleIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Keep existing modal code */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-gray-500/75 dark:bg-gray-900/90 backdrop-blur-sm transition-opacity"
            onClick={() => setShowModal(false)} 
          />

          <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-gray-900 shadow-xl dark:shadow-gray-900/50 border-l dark:border-gray-700">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-800 dark:to-purple-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span>Nova Solicitação</span>
                    <span className="text-sm bg-white/20 dark:bg-gray-700/30 px-2 py-0.5 rounded">
                      {modalData?.excipiente}
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white hover:text-gray-200 dark:hover:text-gray-300 
                             transition-colors duration-200"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {/* Informações do Material */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-3">
                      Informações do Material
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Código</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {materiaisFaltantes[modalData?.excipiente]?.codigo}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Quantidade Faltante</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {materiaisFaltantes[modalData?.excipiente]?.quantidade.toFixed(3)} kg
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes da Solicitação */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                      Detalhes da Solicitação
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Status Controls */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModalData({ ...modalData, status: STATUS.PENDENTE })}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                              modalData?.status === STATUS.PENDENTE
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <ClockIcon className="h-4 w-4" />
                            Pendente
                          </button>
                          <button
                            onClick={() => setModalData({ ...modalData, status: STATUS.SOLICITADO })}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                              modalData?.status === STATUS.SOLICITADO
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <ClockIcon className="h-4 w-4" />
                            Solicitado
                          </button>
                          <button
                            onClick={() => setModalData({ ...modalData, status: STATUS.RECEBIDO })}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                              modalData?.status === STATUS.RECEBIDO
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Recebido
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quantidade a Solicitar (kg)
                        </label>
                        <input
                          type="number"
                          value={modalData?.quantidadeSolicitada}
                          onChange={(e) => setModalData({
                            ...modalData,
                            quantidadeSolicitada: e.target.value
                          })}
                          className="w-full px-3 py-2 rounded-lg border dark:border-gray-600
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                   focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                                   focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Observações
                        </label>
                        <textarea
                          value={modalData?.observacao}
                          onChange={(e) => setModalData({
                            ...modalData,
                            observacao: e.target.value
                          })}
                          className="w-full px-3 py-2 rounded-lg border dark:border-gray-600
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                   focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                                   focus:border-transparent"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Histórico de Solicitações */}
                  {solicitacoes[modalData?.excipiente]?.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                        Histórico de Solicitações
                      </h4>
                      <div className="space-y-2">
                        {solicitacoes[modalData?.excipiente].map(sol => (
                          <div key={sol.id} 
                               className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                                  ${sol.status === STATUS.PENDENTE ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' : ''}
                                  ${sol.status === STATUS.SOLICITADO ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : ''}
                                  ${sol.status === STATUS.RECEBIDO ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : ''}`}
                                >
                                  {Number(sol.quantidadeSolicitada).toFixed(3)}kg
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => updateSolicitacaoStatus(modalData.excipiente, sol.id, STATUS.PENDENTE)}
                                    className={`p-1 rounded ${
                                      sol.status === STATUS.PENDENTE 
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' 
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                                    }`}
                                    title="Marcar como Pendente"
                                  >
                                    <ClockIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => updateSolicitacaoStatus(modalData.excipiente, sol.id, STATUS.SOLICITADO)}
                                    className={`p-1 rounded ${
                                      sol.status === STATUS.SOLICITADO 
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                                    }`}
                                    title="Marcar como Solicitado"
                                  >
                                    <ClockIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => updateSolicitacaoStatus(modalData.excipiente, sol.id, STATUS.RECEBIDO)}
                                    className={`p-1 rounded ${
                                      sol.status === STATUS.RECEBIDO 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' 
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                                    }`}
                                    title="Marcar como Recebido"
                                  >
                                    <CheckCircleIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (window.confirm('Tem certeza que deseja excluir esta solicitação?')) {
                                    deleteSolicitacao(modalData.excipiente, sol.id);
                                  }
                                }}
                                className="p-1 rounded hover:bg-red-100 text-red-600 dark:hover:bg-red-900/40 dark:text-red-400"
                                title="Excluir Solicitação"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(sol.timestamp).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 italic">
                              {sol.observacao ? `"${sol.observacao}"` : "Sem observações"}
                            </div>
                            {editingSolicitacao === sol.id ? (
                              <div className="flex gap-2 mt-2">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="flex-1 text-xs px-2 py-1 rounded border dark:border-gray-600
                                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUpdateObservacao(modalData.excipiente, sol.id, editingText);
                                    } else if (e.key === 'Escape') {
                                      setEditingSolicitacao(null);
                                      setEditingText('');
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleUpdateObservacao(modalData.excipiente, sol.id, editingText)}
                                  className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingSolicitacao(null);
                                    setEditingText('');
                                  }}
                                  className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingSolicitacao(sol.id);
                                  setEditingText(sol.observacao || '');
                                }}
                                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                              >
                                Editar Observação
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                             bg-white dark:bg-gray-700 border dark:border-gray-600
                             rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 
                             transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveSolicitacao}
                    className="px-4 py-2 text-sm font-medium text-white
                             bg-purple-600 dark:bg-purple-500
                             rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 
                             transition-colors"
                  >
                    Salvar Solicitação
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add PropTypes
AlmoxarifadoManager.propTypes = {
  excipientes: PropTypes.arrayOf(PropTypes.string),
  materiaisNaArea: PropTypes.object,
  faltaSolicitar: PropTypes.object,
  onUpdateSolicitacao: PropTypes.func
};

// Add defaultProps
AlmoxarifadoManager.defaultProps = {
  excipientes: [],
  materiaisNaArea: {},
  faltaSolicitar: {},
  onUpdateSolicitacao: () => {}
};