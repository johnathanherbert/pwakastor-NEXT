'use client';
import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/supabaseClient';
import { showToast } from '@/components/Toast/ToastContainer';
import Modal from './Modal';

const EditNTAmostragemModal = ({ isOpen, onClose, onNTEdited, nt, ntItems }) => {
  // Referência para o primeiro input (usado para foco automático)
  const firstInputRef = useRef(null);

  // Estados para gerenciar o formulário
  const [ntNumber, setNtNumber] = useState('');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [removedItemIds, setRemovedItemIds] = useState([]);

  // Preencher o formulário com os dados da NT quando o modal é aberto
  useEffect(() => {
    if (isOpen && nt && ntItems) {
      setNtNumber(nt.nt_number);
      
      // Preparar os itens para o formulário
      const formattedItems = ntItems.map(item => ({
        id: item.id, // Usamos o ID do banco para facilitar a atualização
        code: item.code,
        description: item.description,
        quantity: item.quantity.toString(),
        batch: item.batch,
        exists: true // Flag para indicar que o item já existe no banco
      }));
      
      setItems(formattedItems);
      setRemovedItemIds([]);
    }
  }, [isOpen, nt, ntItems]);

  // Foco no primeiro input quando o modal é aberto
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Funções para gerenciar itens
  const handleAddItem = () => {
    // Para novos itens, usamos IDs negativos temporários para diferenciar de IDs existentes
    const newId = Math.min(-1, ...items.map(item => typeof item.id === 'number' && item.id < 0 ? item.id : 0)) - 1;
    setItems([...items, { id: newId, code: '', description: '', quantity: '', batch: '', exists: false }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      // Se o item existir no banco, adicionamos ao array de IDs para remoção
      const itemToRemove = items.find(item => item.id === id);
      if (itemToRemove && itemToRemove.exists) {
        setRemovedItemIds([...removedItemIds, id]);
      }
      
      // Removemos o item da lista local
      setItems(items.filter(item => item.id !== id));
    } else {
      showToast('A NT deve ter pelo menos um item', 'warning');
    }
  };

  const handleItemChange = (id, field, value) => {
    setItems(
      items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Validar formulário
  const validateForm = () => {
    setError('');

    if (!ntNumber.trim()) {
      setError('O número da NT é obrigatório');
      return false;
    }

    for (const item of items) {
      if (!item.code.trim()) {
        setError('Todos os itens devem ter um código');
        return false;
      }
      if (!item.description.trim()) {
        setError('Todos os itens devem ter uma descrição');
        return false;
      }
      if (!item.quantity.trim() || isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0) {
        setError('Todos os itens devem ter uma quantidade válida');
        return false;
      }
      if (!item.batch.trim()) {
        setError('Todos os itens devem ter um lote');
        return false;
      }
    }

    return true;
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Atualizar a NT principal
      const { error: ntError } = await supabase
        .from('nts_amostragem')
        .update({
          nt_number: ntNumber
        })
        .eq('id', nt.id);

      if (ntError) throw ntError;

      // 2. Processar itens existentes para atualização
      const itemsToUpdate = items.filter(item => item.exists);
      for (const item of itemsToUpdate) {
        const { error: updateError } = await supabase
          .from('nts_amostragem_items')
          .update({
            code: item.code,
            description: item.description,
            quantity: parseFloat(item.quantity),
            batch: item.batch
          })
          .eq('id', item.id);

        if (updateError) throw updateError;
      }

      // 3. Processar novos itens para inserção
      const itemsToInsert = items.filter(item => !item.exists).map((item, index) => ({
        nt_id: nt.id,
        item_number: Math.max(1, ...ntItems.map(item => item.item_number || 0)) + index + 1, // Gerando item_number incremental
        code: item.code,
        description: item.description,
        quantity: parseFloat(item.quantity),
        batch: item.batch,
        created_date: nt.created_date,
        created_time: nt.created_time,
        status: 'Ag. Amostragem'
      }));

      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('nts_amostragem_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      // 4. Remover itens que foram excluídos
      if (removedItemIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('nts_amostragem_items')
          .delete()
          .in('id', removedItemIds);

        if (deleteError) throw deleteError;
      }

      showToast('NT de amostragem atualizada com sucesso', 'success');
      
      if (onNTEdited) {
        onNTEdited();
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar NT:', error);
      setError('Ocorreu um erro ao atualizar a NT. Por favor, tente novamente.');
      showToast('Erro ao atualizar NT', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden max-w-md w-full">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Editar NT de Amostragem
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="mb-5">
            <label htmlFor="nt-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número da NT
            </label>
            <input
              type="text"
              id="nt-number"
              ref={firstInputRef}
              value={ntNumber}
              onChange={(e) => setNtNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 
                bg-white dark:bg-gray-700 
                border border-gray-300 dark:border-gray-600 
                rounded-lg shadow-sm text-gray-900 dark:text-gray-100 
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="Digite o número da NT"
            />
          </div>
          
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Itens da NT
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-xs hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Adicionar Item
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Item #{item.id > 0 ? item.id : 'Novo'}
                    </h5>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Código
                      </label>
                      <input
                        type="text"
                        value={item.code}
                        onChange={(e) => handleItemChange(item.id, 'code', e.target.value)}
                        className="w-full px-2.5 py-1.5 
                          bg-white dark:bg-gray-700 
                          border border-gray-300 dark:border-gray-600 
                          rounded-md shadow-sm text-sm text-gray-900 dark:text-gray-100 
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="Código do item"
                      />
                    </div>
                    
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Lote
                      </label>
                      <input
                        type="text"
                        value={item.batch}
                        onChange={(e) => handleItemChange(item.id, 'batch', e.target.value)}
                        className="w-full px-2.5 py-1.5 
                          bg-white dark:bg-gray-700 
                          border border-gray-300 dark:border-gray-600 
                          rounded-md shadow-sm text-sm text-gray-900 dark:text-gray-100 
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="Número do lote"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descrição
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 
                          bg-white dark:bg-gray-700 
                          border border-gray-300 dark:border-gray-600 
                          rounded-md shadow-sm text-sm text-gray-900 dark:text-gray-100 
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="Descrição do item"
                      />
                    </div>
                    
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        className="w-full px-2.5 py-1.5 
                          bg-white dark:bg-gray-700 
                          border border-gray-300 dark:border-gray-600 
                          rounded-md shadow-sm text-sm text-gray-900 dark:text-gray-100 
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="Quantidade"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                      bg-white dark:bg-gray-800 
                      border border-gray-300 dark:border-gray-600 
                      rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white 
                      bg-blue-600 dark:bg-blue-500 
                      rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800
                      disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditNTAmostragemModal;