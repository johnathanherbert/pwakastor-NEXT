import { useState } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  ChevronDownIcon, 
  ChevronRightIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EllipsisHorizontalIcon 
} from '@heroicons/react/24/outline';
import AddItemToNTModal from './AddItemToNTModal';
import EditItemModal from './EditItemModal';
import { 
  isItemOverdue, 
  getOverdueMinutes, 
  formatOverdueTime, 
  getElapsedMinutes,
  formatElapsedTime
} from '../../utils/ntHelpers';

export default function NTsList({ 
  nts, 
  ntItems, 
  updateItemStatus, 
  onEditNT, 
  onDeleteNT,
  onDeleteItem,
  onEditItem,
  onAddItem,
  isLoading,
  showOverdueWarnings = false
}) {
  const [expandedNTs, setExpandedNTs] = useState({});
  const [showItemActions, setShowItemActions] = useState({});
  const [showNTActions, setShowNTActions] = useState(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [currentNT, setCurrentNT] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);

  const toggleNTExpansion = (ntId, e) => {
    if (e && (e.target.closest('button') || e.target.tagName === 'BUTTON')) {
      if (e.target.closest('button').getAttribute('data-expand-button') === 'true') {
        setExpandedNTs(prev => ({
          ...prev,
          [ntId]: !prev[ntId]
        }));
      }
      return;
    }
    setExpandedNTs(prev => ({
      ...prev,
      [ntId]: !prev[ntId]
    }));
  };

  const getStatusBadge = (status, paymentTime) => {
    switch(status) {
      case 'Pago':
        return (
          <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700/50">
            <CheckCircleIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
            <span className="truncate max-w-[60px] sm:max-w-none">Pago {paymentTime && `às ${paymentTime}`}</span>
          </span>
        );
      case 'Pago Parcial':
        return (
          <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700/50">
            <ExclamationCircleIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
            <span className="truncate max-w-[60px] sm:max-w-none">Pago Parcial {paymentTime && `às ${paymentTime}`}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700/50">
            <ClockIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
            <span className="truncate max-w-[60px] sm:max-w-none">Ag. Pagamento</span>
          </span>
        );
    }
  };

  const toggleItemActions = (itemId) => {
    setShowItemActions(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const toggleNTActions = (ntId) => {
    setShowNTActions(showNTActions === ntId ? null : ntId);
  };

  const handleAddItem = (nt, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Adding item to NT:", nt.nt_number);
    setCurrentNT(nt);
    setShowAddItemModal(true);
  };

  const handleEditItem = (item, nt, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Editing item:", item.item_number, "of NT:", nt.nt_number);
    setCurrentItem(item);
    setCurrentNT(nt);
    setShowEditItemModal(true);
  };

  const renderStatusButton = (item, ntId) => {
    const statusOptions = [
      { value: 'Ag. Pagamento', label: 'Ag. Pagamento', color: 'red' },
      { value: 'Pago', label: 'Pago', color: 'green' },
      { value: 'Pago Parcial', label: 'Pago Parcial', color: 'yellow' }
    ];
    
    return (
      <div className="flex flex-wrap gap-0.5 sm:gap-1">
        {statusOptions.map(option => (
          <button
            key={option.value}
            onClick={() => updateItemStatus(item.id, option.value, ntId)}
            className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded text-[9px] sm:text-xs font-medium transition-all transform hover:scale-105 focus:scale-100
              ${item.status === option.value 
                ? `bg-${option.color}-100 dark:bg-${option.color}-900/50 text-${option.color}-700 dark:text-${option.color}-300 border border-${option.color}-200 dark:border-${option.color}-700/50 shadow-sm` 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  };

  const calculateNTProgress = (items) => {
    if (!items || items.length === 0) return 0;
    const completedItems = items.filter(item => item.status === 'Pago').length;
    const partialItems = items.filter(item => item.status === 'Pago Parcial').length;
    
    const progress = (completedItems + (partialItems * 0.5)) / items.length;
    return Math.round(progress * 100);
  };
  
  const getNTStatusColor = (items) => {
    if (!items || items.length === 0) return 'gray';
    
    const allPaid = items.every(item => item.status === 'Pago');
    const anyPaid = items.some(item => item.status === 'Pago' || item.status === 'Pago Parcial');
    const anyOverdue = showOverdueWarnings && items.some(isItemOverdue);
    
    if (allPaid) return 'green';
    if (anyOverdue) return 'orange';
    if (anyPaid) return 'yellow';
    return 'red';
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const renderTimeStatus = (item) => {
    if (item.status === 'Pago' || item.status === 'Pago Parcial') {
      // Calculate time between creation and payment
      if (item.payment_time && item.created_time) {
        try {
          // Parse dates for comparison
          const [day, month, year] = item.created_date.split('/').map(Number);
          const [createdHours, createdMinutes] = item.created_time.split(':').map(Number);
          const [paymentHours, paymentMinutes] = item.payment_time.split(':').map(Number);
          
          // Calculate minutes between creation and payment
          const createdDate = new Date(2000 + year, month - 1, day, createdHours, createdMinutes);
          const paymentDate = new Date(2000 + year, month - 1, day, paymentHours, paymentMinutes);
          
          // If payment was on next day, adjust
          if (paymentHours < createdHours || (paymentHours === createdHours && paymentMinutes < createdMinutes)) {
            paymentDate.setDate(paymentDate.getDate() + 1);
          }
          
          const diffMinutes = Math.floor((paymentDate - createdDate) / (1000 * 60));
          const deadlineMinutes = 120; // 2 hours in minutes
          
          if (diffMinutes <= deadlineMinutes) {
            return (
              <span className="text-[9px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
                Pago a tempo ({formatElapsedTime(diffMinutes)})
              </span>
            );
          } else {
            return (
              <span className="text-[9px] sm:text-xs text-orange-600 dark:text-orange-400 font-medium">
                Pago com atraso de {formatElapsedTime(diffMinutes - deadlineMinutes)}
              </span>
            );
          }
        } catch (error) {
          console.error('Error calculating payment time:', error);
          return (
            <span className="text-[9px] sm:text-xs text-gray-600 dark:text-gray-400">
              {item.status}
            </span>
          );
        }
      }
      
      return (
        <span className="text-[9px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
          Pago a tempo
        </span>
      );
    }
    
    const elapsedMinutes = getElapsedMinutes(item);
    const deadlineMinutes = 120; // 2 hours in minutes
    
    if (elapsedMinutes > deadlineMinutes) {
      // More than 2 hours have passed - item is overdue
      return (
        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-medium text-orange-600 dark:text-orange-400">
          <ClockIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">Atraso de {formatElapsedTime(elapsedMinutes - deadlineMinutes)}</span>
        </span>
      );
    } else if (elapsedMinutes >= 90) {
      // Between 1.5 and 2 hours - approaching deadline
      return (
        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-medium text-red-600 dark:text-red-400">
          <ClockIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">Criado há {formatElapsedTime(elapsedMinutes)}</span>
        </span>
      );
    } else if (elapsedMinutes >= 60) {
      // Between 1 and 1.5 hours - warning
      return (
        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-medium text-yellow-600 dark:text-yellow-400">
          <ClockIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">Criado há {formatElapsedTime(elapsedMinutes)}</span>
        </span>
      );
    } else {
      // Less than 1 hour - normal
      return (
        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs text-gray-600 dark:text-gray-400">
          <ClockIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">Criado há {formatElapsedTime(elapsedMinutes)}</span>
        </span>
      );
    }
  };

  if (nts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {nts.map(nt => {
        const ntItemsList = ntItems[nt.id] || [];
        const progress = calculateNTProgress(ntItemsList);
        const statusColor = getNTStatusColor(ntItemsList);
        const isExpanded = expandedNTs[nt.id];
        const hasOverdueItems = showOverdueWarnings && ntItemsList.some(isItemOverdue);
        
        return (
          <div key={nt.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all">
            <div 
              className={`p-2 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors border-l-4 cursor-pointer
                ${statusColor === 'green' ? 'border-l-green-500 dark:border-l-green-600' : 
                  statusColor === 'yellow' ? 'border-l-yellow-500 dark:border-l-yellow-600' : 
                  statusColor === 'orange' ? 'border-l-orange-500 dark:border-l-orange-600' :
                  'border-l-red-500 dark:border-l-red-600'}
              `}
              onClick={(e) => toggleNTExpansion(nt.id, e)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-1.5 sm:gap-3">
                  <button 
                    onClick={(e) => toggleNTExpansion(nt.id, e)}
                    className="mt-0.5 sm:mt-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center"
                    aria-label={isExpanded ? "Collapse NT" : "Expand NT"}
                    data-expand-button="true"
                  >
                    {isExpanded ? 
                      <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" /> : 
                      <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    }
                  </button>
                  <div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                        NT {nt.nt_number}
                      </h2>
                      <button 
                        onClick={() => copyToClipboard(nt.nt_number)}
                        className="p-0.5 sm:p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        title="Copiar número da NT"
                      >
                        <DocumentDuplicateIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </button>
                      
                      {hasOverdueItems && (
                        <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50">
                          <ClockIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                          Em atraso
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-sm text-gray-600 dark:text-gray-400">
                      <span className="whitespace-nowrap">
                        {nt.created_date}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="whitespace-nowrap">
                        {ntItemsList.length} {ntItemsList.length === 1 ? 'item' : 'itens'}
                      </span>
                      {ntItemsList.some(item => item.status === 'Pago') && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                            {ntItemsList.filter(item => item.status === 'Pago').length} pagos
                          </span>
                        </>
                      )}
                      {ntItemsList.some(item => item.status === 'Ag. Pagamento') && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                            {ntItemsList.filter(item => item.status === 'Ag. Pagamento').length} aguardando
                          </span>
                        </>
                      )}
                      {hasOverdueItems && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-orange-600 dark:text-orange-400 font-medium whitespace-nowrap">
                            {ntItemsList.filter(isItemOverdue).length} em atraso
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {progress}% completo
                    </div>
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: statusColor === 'green' ? '#10b981' : 
                                          statusColor === 'yellow' ? '#f59e0b' : 
                                          statusColor === 'orange' ? '#f97316' :
                                          '#ef4444'
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Mobile progress indicator */}
                  <div className="flex sm:hidden items-center gap-1">
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                      style={{
                        borderColor: statusColor === 'green' ? '#10b981' : 
                                    statusColor === 'yellow' ? '#f59e0b' : 
                                    statusColor === 'orange' ? '#f97316' :
                                    '#ef4444',
                        color: statusColor === 'green' ? '#10b981' : 
                              statusColor === 'yellow' ? '#f59e0b' : 
                              statusColor === 'orange' ? '#f97316' :
                              '#ef4444'
                      }}
                    >
                      {progress}%
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEditNT(nt);
                      }}
                      className="p-1 sm:p-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 transition-colors"
                      title="Editar NT"
                    >
                      <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDeleteNT(nt);
                      }}
                      className="p-1 sm:p-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50 transition-colors"
                      title="Excluir NT"
                    >
                      <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddItem(nt, e);
                      }}
                      className="p-1 sm:p-2 rounded-md bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/50 transition-colors"
                      title="Adicionar item"
                    >
                      <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {isExpanded && (
              <div 
                className="border-t border-gray-200 dark:border-gray-700 animate-fadeIn" 
                style={{animationDuration: '150ms'}}
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                      <tr>
                        <th className="px-1.5 sm:px-3 py-1 sm:py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-1.5 sm:px-3 py-1 sm:py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-1.5 sm:px-3 py-1 sm:py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-1.5 sm:px-3 py-1 sm:py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Qtd
                        </th>
                        <th className="px-1.5 sm:px-3 py-1 sm:py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                          Data
                        </th>
                        <th className="px-1.5 sm:px-3 py-1 sm:py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Hora
                        </th>
                        <th className="px-1.5 sm:px-3 py-1 sm:py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Pag.
                        </th>
                        <th className="px-1.5 sm:px-3 py-1 sm:py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        {showOverdueWarnings && (
                          <th className="px-1.5 sm:px-3 py-1 sm:py-2 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                            Tempo
                          </th>
                        )}
                        <th className="px-1.5 sm:px-3 py-1 sm:py-2 text-center text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                      {ntItemsList.map((item) => {
                        const elapsedMinutes = getElapsedMinutes(item);
                        const isOverdue = elapsedMinutes > 120; // 2 hours
                        
                        const timeStatusClass = 
                          item.status !== 'Ag. Pagamento' ? '' :
                          isOverdue ? 'bg-orange-50/50 dark:bg-orange-900/10' :
                          elapsedMinutes >= 90 ? 'bg-red-50/50 dark:bg-red-900/10' :
                          elapsedMinutes >= 60 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' :
                          '';
                        
                        return (
                          <tr 
                            key={item.id} 
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                              item.status === 'Pago' ? 'bg-green-50/50 dark:bg-green-900/10' :
                              item.status === 'Pago Parcial' ? 'bg-yellow-50/50 dark:bg-yellow-900/10' :
                              timeStatusClass
                            }`}
                          >
                            <td className="px-1.5 sm:px-3 py-1 sm:py-2 whitespace-nowrap text-[11px] sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                              {item.item_number}
                            </td>
                            <td className="px-1.5 sm:px-3 py-1 sm:py-2 whitespace-nowrap text-[11px] sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                              {item.code}
                            </td>
                            <td className="px-1.5 sm:px-3 py-1 sm:py-2 max-w-[120px] sm:max-w-[250px] truncate text-[11px] sm:text-sm text-gray-700 dark:text-gray-300">
                              <span title={item.description}>{item.description}</span>
                            </td>
                            <td className="px-1.5 sm:px-3 py-1 sm:py-2 whitespace-nowrap text-[11px] sm:text-sm text-gray-700 dark:text-gray-300">
                              {item.quantity}
                            </td>
                            <td className="px-1.5 sm:px-3 py-1 sm:py-2 whitespace-nowrap text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                              {item.created_date}
                            </td>
                            <td className="px-1.5 sm:px-3 py-1 sm:py-2 whitespace-nowrap text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
                              {item.created_time}
                            </td>
                            <td className="px-1.5 sm:px-3 py-1 sm:py-2 whitespace-nowrap">
                              {item.payment_time && (item.status === 'Pago' || item.status === 'Pago Parcial') ? (
                                <span className="text-[11px] sm:text-sm text-green-600 dark:text-green-400 font-medium">
                                  {item.payment_time}
                                </span>
                              ) : (
                                <span className="text-[11px] sm:text-sm text-gray-400 dark:text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-1.5 sm:px-3 py-1 sm:py-2 whitespace-nowrap">
                              {renderStatusButton(item, nt.id)}
                            </td>
                            
                            {showOverdueWarnings && (
                              <td className="px-1.5 sm:px-3 py-1 sm:py-2 whitespace-nowrap hidden sm:table-cell">
                                {renderTimeStatus(item)}
                              </td>
                            )}
                            
                            <td className="px-1.5 sm:px-3 py-1 sm:py-2 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1 sm:gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleEditItem(item, nt, e);
                                  }}
                                  className="p-1 sm:p-2 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                                  title="Editar item"
                                >
                                  <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDeleteItem(item, nt.id);
                                  }}
                                  className="p-1 sm:p-2 rounded bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                                  title="Excluir item"
                                >
                                  <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 p-2 sm:p-3 flex justify-between items-center">
                  <span className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {ntItemsList.length} {ntItemsList.length === 1 ? 'item' : 'itens'}
                  </span>
                  
                  <button
                    onClick={(e) => handleAddItem(nt, e)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <PlusIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                    Adicionar Item
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {isLoading && nts.length > 0 && (
        <div className="fixed bottom-3 sm:bottom-6 right-3 sm:right-6 bg-white dark:bg-gray-800 rounded-full shadow-lg py-1.5 sm:py-2 px-3 sm:px-4 flex items-center gap-1 sm:gap-2 border border-gray-200 dark:border-gray-700 z-50 animate-pulse">
          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-300">Atualizando dados...</span>
        </div>
      )}
      
      {showAddItemModal && currentNT && (
        <AddItemToNTModal
          isOpen={showAddItemModal}
          onClose={() => {
            setShowAddItemModal(false);
            setCurrentNT(null);
          }}
          onAddItem={(newItem) => {
            onAddItem(currentNT.id, newItem);
            setShowAddItemModal(false);
            setCurrentNT(null);
          }}
          nt={currentNT}
        />
      )}
      
      {showEditItemModal && currentItem && currentNT && (
        <EditItemModal
          isOpen={showEditItemModal}
          onClose={() => {
            setShowEditItemModal(false);
            setCurrentItem(null);
            setCurrentNT(null);
          }}
          onItemUpdated={(updates) => {
            onEditItem(currentItem.id, updates, currentNT.id);
            setShowEditItemModal(false);
            setCurrentItem(null);
            setCurrentNT(null);
          }}
          item={currentItem}
          nt={currentNT}
        />
      )}
    </div>
  );
}
