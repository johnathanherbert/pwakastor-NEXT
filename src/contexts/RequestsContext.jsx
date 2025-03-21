import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const RequestsContext = createContext();

export function RequestsProvider({ children, initialRequests = {} }) {
  const [materialRequests, setMaterialRequests] = useState(() => {
    // Inicializar do localStorage se disponível
    try {
      const savedRequests = localStorage.getItem('materialRequests');
      return savedRequests ? JSON.parse(savedRequests) : initialRequests;
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      return initialRequests;
    }
  });

  const handleAddRequest = useCallback((excipient, request, index = null) => {
    console.log("Adding request", excipient, request, index);
    
    setMaterialRequests(prev => {
      const updatedRequests = { ...prev };
      
      if (!updatedRequests[excipient]) {
        updatedRequests[excipient] = [];
      }
      
      // Se temos um index, estamos editando
      if (index !== null) {
        // Preserve original date if not provided in the updated request
        if (!request.date && updatedRequests[excipient][index]?.date) {
          request.date = updatedRequests[excipient][index].date;
        }
        updatedRequests[excipient][index] = request;
      } else {
        // Caso contrário, adicionamos um novo
        // Ensure we have a full timestamp
        if (!request.date) {
          request.date = new Date().toISOString();
        }
        updatedRequests[excipient].push(request);
      }
      
      return updatedRequests;
    });
  }, []);

  const handleDeleteRequest = useCallback((excipient, index) => {
    console.log("Deleting request", excipient, index);
    
    setMaterialRequests(prev => {
      const updatedRequests = { ...prev };
      
      if (!updatedRequests[excipient] || !updatedRequests[excipient][index]) {
        return prev;
      }
      
      updatedRequests[excipient] = [
        ...updatedRequests[excipient].slice(0, index),
        ...updatedRequests[excipient].slice(index + 1)
      ];
      
      // Se não houver mais solicitações, remover a chave do objeto
      if (updatedRequests[excipient].length === 0) {
        const { [excipient]: _, ...rest } = updatedRequests;
        return rest;
      }
      
      return updatedRequests;
    });
  }, []);

  const handleUpdateRequestStatus = useCallback((excipient, index, newStatus) => {
    console.log("Updating request status", excipient, index, newStatus);
    
    setMaterialRequests(prev => {
      if (!prev[excipient] || !prev[excipient][index]) {
        return prev;
      }
      
      const updatedRequests = {
        ...prev,
        [excipient]: prev[excipient].map((req, i) => 
          i === index ? { ...req, status: newStatus } : req
        )
      };
      
      return updatedRequests;
    });
  }, []);

  // Função para obter dados do excipiente selecionado
  const getExcipientData = (excipientName) => {
    // Buscar os dados do excipiente, incluindo o código
    // Esta função deve estar integrada com sua lógica de materiais
    const excipientData = materialsData?.find(material => material.name === excipientName) || null;
    return excipientData;
  };

  // Salvar solicitações quando houver alterações
  useEffect(() => {
    console.log("Saving material requests to localStorage", materialRequests);
    localStorage.setItem('materialRequests', JSON.stringify(materialRequests));
  }, [materialRequests]);

  const value = {
    materialRequests,
    setMaterialRequests,
    handleAddRequest,
    handleDeleteRequest,
    handleUpdateRequestStatus,
    getExcipientData
  };

  return (
    <RequestsContext.Provider value={value}>
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  const context = useContext(RequestsContext);
  if (context === undefined) {
    throw new Error('useRequests must be used within a RequestsProvider');
  }
  return context;
}
