import React, { useState } from 'react';
import { useRequests } from '../contexts/RequestsContext';
import Modal from './Modal';
import { CodeBracketIcon } from '@heroicons/react/24/outline';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { materialRequests } = useRequests();
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg"
        title="Debug Panel"
      >
        <CodeBracketIcon className="h-5 w-5" />
      </button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Debug Panel - Material Requests"
        size="lg"
        variant="default"
        bodyClass="p-4"
      >
        <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-[500px]">
          <pre>{JSON.stringify(materialRequests, null, 2)}</pre>
        </div>
      </Modal>
    </>
  );
}
