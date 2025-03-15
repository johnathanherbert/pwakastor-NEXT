import React from 'react';
import { SolicitacaoStatus } from './SolicitacaoStatus';
import Modal from '../../Modal';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export const SolicitacaoModal = ({ 
  show, 
  selectedExcipient,
  materialRequests,
  onClose,
  onUpdateStatus,
  onDeleteRequest
}) => {
  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      title={`Gerenciar Status - ${selectedExcipient || ''}`}
      size="md"
      variant="purple"
      customIcon={<ArrowPathIcon className="h-5 w-5 text-white" />}
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                     transition-colors duration-200 font-medium"
          >
            Fechar
          </button>
        </div>
      }
      bodyClass="p-4"
    >
      <SolicitacaoStatus
        materialRequests={materialRequests}
        selectedExcipient={selectedExcipient}
        onUpdateStatus={onUpdateStatus}
        onDeleteRequest={onDeleteRequest}
      />
    </Modal>
  );
};

export default SolicitacaoModal;
