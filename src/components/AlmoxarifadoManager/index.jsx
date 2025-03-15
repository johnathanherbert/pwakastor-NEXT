import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Table } from './components/Table';
import { SolicitacaoModal } from './components/SolicitacaoModal';
import { STATUS } from './constants';
import { useRequests } from '../../contexts/RequestsContext';

export default function AlmoxarifadoManager() {
  const [showModal, setShowModal] = useState(false);
  const [selectedExcipient, setSelectedExcipient] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0); // State to force re-renders
  
  // Usar o contexto de solicitações
  const { materialRequests, handleUpdateRequestStatus, handleDeleteRequest } = useRequests();

  // Force a re-render whenever materialRequests changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
    console.log("AlmoxarifadoManager: materialRequests changed", materialRequests);
  }, [materialRequests]);

  const handleOpenSolicitacaoModal = (excipient) => {
    setSelectedExcipient(excipient);
    setShowModal(true);
  };

  const handleCloseSolicitacaoModal = () => {
    setShowModal(false);
    setSelectedExcipient(null);
  };

  // Memoize the summaries to prevent unnecessary re-calculations
  const memoizedGetSolicitacaoSummary = useMemo(() => {
    return (material) => {
      if (!materialRequests[material] || materialRequests[material].length === 0) {
        return {
          count: 0,
          total: 0,
          status: null
        };
      }
      
      const requests = materialRequests[material];
      const total = requests.reduce((sum, req) => sum + parseFloat(req.amount || 0), 0);
      
      // Get most active status
      const pendingExists = requests.some(req => req.status === STATUS.PENDENTE);
      const requestedExists = requests.some(req => req.status === STATUS.SOLICITADO);
      const separatedExists = requests.some(req => req.status === STATUS.SEPARADO);
      const deliveredExists = requests.some(req => req.status === STATUS.ENTREGUE);
      
      let status;
      if (pendingExists) status = STATUS.PENDENTE;
      else if (requestedExists) status = STATUS.SOLICITADO;
      else if (separatedExists) status = STATUS.SEPARADO;
      else if (deliveredExists) status = STATUS.ENTREGUE;
      
      return {
        count: requests.length,
        total,
        status
      };
    };
  }, [materialRequests, forceUpdate]); // Include forceUpdate in dependencies

  return (
    <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
      <Header materialRequests={materialRequests} />
      <Table 
        key={`table-${forceUpdate}`} // Force re-render with key
        materialRequests={materialRequests}
        getSolicitacaoSummary={memoizedGetSolicitacaoSummary}
        onOpenSolicitacaoModal={handleOpenSolicitacaoModal}
      />
      <SolicitacaoModal 
        show={showModal}
        selectedExcipient={selectedExcipient}
        materialRequests={materialRequests}
        onClose={handleCloseSolicitacaoModal}
        onUpdateStatus={handleUpdateRequestStatus}
        onDeleteRequest={handleDeleteRequest}
      />
    </div>
  );
}
