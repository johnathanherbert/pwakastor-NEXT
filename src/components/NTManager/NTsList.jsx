import { useState, useEffect } from 'react';
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
  EllipsisHorizontalIcon,
  CalendarIcon
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
import Loading from '../ui/Loading';

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
  const [showTodayOnly, setShowTodayOnly] = useState(false);

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

  const isCreatedToday = (nt) => {
    if (!nt.created_date) return false;
    
    try {
      const today = new Date();
      const [ntDay, ntMonth, ntYear] = nt.created_date.split('/');
      const todayDay = today.getDate();
      const todayMonth = today.getMonth() + 1;
      const todayFullYear = today.getFullYear();
      const todayYear = todayFullYear % 100;
      const ntDayNum = parseInt(ntDay, 10);
      const ntMonthNum = parseInt(ntMonth, 10);
      let ntYearNum = parseInt(ntYear, 10);
      
      if (ntYear.length === 4) {
        return ntYearNum === todayFullYear && 
               ntMonthNum === todayMonth && 
               ntDayNum === todayDay;
      } else {
        return ntYearNum === todayYear && 
               ntMonthNum === todayMonth && 
               ntDayNum === todayDay;
      }
    } catch (error) {
      console.error("Error comparing dates:", error, "for NT date:", nt.created_date);
      return false;
    }
  };

  useEffect(() => {
    if (nts.length > 0) {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const shortYear = year % 100;
      
      console.log("Today Date Debug:");
      console.log(`- Full JS Date: ${today}`);
      console.log(`- Locale pt-BR: ${today.toLocaleDateString('pt-BR')}`);
      console.log(`- Manual DD/MM/YY: ${day}/${month}/${String(shortYear).padStart(2, '0')}`);
      console.log(`- Manual DD/MM/YYYY: ${day}/${month}/${year}`);
      
      console.log("NT Dates Sample:");
      nts.slice(0, 5).forEach(nt => {
        console.log(`- NT ${nt.nt_number}: ${nt.created_date}`);
        try {
          const [ntDay, ntMonth, ntYear] = nt.created_date.split('/');
          console.log(`  Parsed: day=${ntDay}, month=${ntMonth}, year=${ntYear} (length: ${ntYear.length})`);
          console.log(`  Is Today: ${isCreatedToday(nt)}`);
        } catch (error) {
          console.error(`  Error parsing date: ${error}`);
        }
      });
    }
  }, [nts]);

  useEffect(() => {
    if (showTodayOnly && nts.length > 0) {
      console.log("Today's date:", new Date().toLocaleDateString('pt-BR'));
      console.log("NTs dates:", nts.map(nt => ({ 
        id: nt.id, 
        number: nt.nt_number, 
        date: nt.created_date, 
        isToday: isCreatedToday(nt) 
      })));
    }
  }, [showTodayOnly, nts]);

  const filteredNTs = showTodayOnly 
    ? nts.filter(isCreatedToday)
    : nts;

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

  const handlePriorityToggle = (item, ntId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("Alterando prioridade para o item:", item.item_number, "da NT:", ntId);
    onEditItem(item.id, { priority: !item.priority }, ntId);
  };

  const renderStatusButton = (item, ntId) => {
    const statusOptions = [
      { 
        value: 'Ag. Pagamento', 
        label: 'Aguardando', 
        color: 'red',
        icon: <ClockIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      },
      { 
        value: 'Pago', 
        label: 'Pago', 
        color: 'green',
        icon: <CheckCircleIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      },
      { 
        value: 'Pago Parcial', 
        label: 'Parcial', 
        color: 'yellow',
        icon: <ExclamationCircleIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      }
    ];
    
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center p-0.5 bg-gray-100 dark:bg-gray-700/70 rounded-full">
          {statusOptions.map(option => {
            const isActive = item.status === option.value;
            return (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  updateItemStatus(item.id, option.value, ntId);
                }}
                className={`relative flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-medium transition-all duration-200 
                  ${isActive 
                    ? `bg-${option.color}-500 text-white dark:bg-${option.color}-600 shadow-md scale-105` 
                    : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-600/80'
                  }
                  focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-${option.color}-400 dark:focus:ring-offset-gray-800`}
                title={option.value}
              >
                {option.icon}
                <span>{option.label}</span>
                {isActive && (
                  <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 w-2 h-2 bg-white rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
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
      if (item.payment_time && item.created_time) {
        try {
          const [day, month, year] = item.created_date.split('/').map(Number);
          const [createdHours, createdMinutes] = item.created_time.split(':').map(Number);
          const [paymentHours, paymentMinutes] = item.payment_time.split(':').map(Number);
          
          const createdDate = new Date(2000 + year, month - 1, day, createdHours, createdMinutes);
          const paymentDate = new Date(2000 + year, month - 1, day, paymentHours, paymentMinutes);
          
          if (paymentHours < createdHours || (paymentHours === createdHours && paymentMinutes < createdMinutes)) {
            paymentDate.setDate(paymentDate.getDate() + 1);
          }
          
          const diffMinutes = Math.floor((paymentDate - createdDate) / (1000 * 60));
          const deadlineMinutes = 120;
          
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
    const deadlineMinutes = 120;
    
    if (elapsedMinutes > deadlineMinutes) {
      return (
        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-medium text-orange-600 dark:text-orange-400">
          <ClockIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">Atraso de {formatElapsedTime(elapsedMinutes - deadlineMinutes)}</span>
        </span>
      );
    } else if (elapsedMinutes >= 90) {
      return (
        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-medium text-red-600 dark:text-red-400">
          <ClockIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">Criado há {formatElapsedTime(elapsedMinutes)}</span>
        </span>
      );
    } else if (elapsedMinutes >= 60) {
      return (
        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-medium text-yellow-600 dark:text-yellow-400">
          <ClockIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">Criado há {formatElapsedTime(elapsedMinutes)}</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs text-gray-600 dark:text-gray-400">
          <ClockIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">Criado há {formatElapsedTime(elapsedMinutes)}</span>
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select 
                className="appearance-none pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 
                        rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 
                        focus:ring-blue-500/40 text-sm shadow-sm"
                defaultValue="all"
              >
                <option value="all">Todas as NTs</option>
                <option value="pending">Pendentes</option>
                <option value="completed">Concluídas</option>
                <option value="priority">Prioritárias</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <select 
                className="appearance-none pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 
                        rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 
                        focus:ring-blue-500/40 text-sm shadow-sm"
                defaultValue="desc"
              >
                <option value="desc">Mais recentes</option>
                <option value="asc">Mais antigas</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Buscar NT ou código..." 
                className="pl-9 pr-3 py-2 w-full sm:w-48 md:w-64 bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 
                        rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 
                        focus:ring-blue-500/40 text-sm shadow-sm"
              />
              <div className="absolute left-0 pl-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowTodayOnly(!showTodayOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm
              ${showTodayOnly 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50' 
                : 'bg-gray-50 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600/60'}`}
          >
            <CalendarIcon className="h-4 w-4" />
            {showTodayOnly ? 'Mostrar todas' : 'Apenas hoje'}
          </button>
        </div>
      </div>

      {filteredNTs.length === 0 && isLoading ? (
        <Loading
          size="default"
          message="Carregando notas técnicas..."
          logoVisible={true}
          className="py-16"
        />
      ) : filteredNTs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4 shadow-sm">
            <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Nenhuma NT encontrada</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
            {showTodayOnly 
              ? 'Não existem notas técnicas registradas para hoje. Ajuste os filtros ou adicione uma nova NT.' 
              : 'Não foram encontradas notas técnicas com os filtros atuais. Tente ajustar os critérios de busca.'}
          </p>
          <button 
            onClick={() => setShowTodayOnly(false)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm
              ${showTodayOnly 
                ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            {showTodayOnly ? (
              <>
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                Ver todas as NTs
              </>
            ) : (
              <>
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Adicionar nova NT
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNTs.map(nt => {
            const ntItemsList = ntItems[nt.id] || [];
            const progress = calculateNTProgress(ntItemsList);
            const statusColor = getNTStatusColor(ntItemsList);
            const isExpanded = expandedNTs[nt.id];
            const hasOverdueItems = showOverdueWarnings && ntItemsList.some(isItemOverdue);
            const hasPriorityItems = ntItemsList.some(item => item.priority && item.status !== 'Pago');
            
            return (
              <div 
                key={nt.id} 
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border 
                  ${hasOverdueItems ? 'border-amber-200 dark:border-amber-700/50' : 'border-gray-200 dark:border-gray-700'}
                  ${hasPriorityItems ? 'ring-1 ring-amber-300 dark:ring-amber-700/70' : ''}
                  overflow-hidden transition-shadow duration-200 hover:shadow-md
                  ${statusColor === 'green' ? 'border-l-4 border-l-green-500 dark:border-l-green-600' : 
                    statusColor === 'yellow' ? 'border-l-4 border-l-yellow-500 dark:border-l-yellow-600' : 
                    statusColor === 'orange' ? 'border-l-4 border-l-orange-500 dark:border-l-orange-600' :
                    'border-l-4 border-l-red-500 dark:border-l-red-600'}`}
              >
                <div 
                  className={`px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-colors cursor-pointer
                    ${hasPriorityItems ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}
                  onClick={(e) => toggleNTExpansion(nt.id, e)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => toggleNTExpansion(nt.id, e)}
                        className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700/70 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label={isExpanded ? "Recolher NT" : "Expandir NT"}
                        data-expand-button="true"
                      >
                        {isExpanded ? 
                          <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" /> : 
                          <ChevronRightIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        }
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            NT {nt.nt_number}
                          </h3>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(nt.nt_number);
                              showToast("Número da NT copiado!", "info");
                            }}
                            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Copiar número da NT"
                          >
                            <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                          </button>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                              <ClockIcon className="h-3 w-3" />
                              {nt.created_time || "00:00"}
                            </span>
                            
                            {hasOverdueItems && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 animate-pulse-subtle">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Em atraso
                              </span>
                            )}
                            
                            {hasPriorityItems && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                                  <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                </svg>
                                Prioritária
                              </span>
                            )}
                            
                            {isCreatedToday(nt) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                <CalendarIcon className="h-3 w-3" />
                                Hoje
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            {nt.created_date}
                          </span>
                          
                          <span className="inline-flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {ntItemsList.length} {ntItemsList.length === 1 ? 'item' : 'itens'}
                          </span>
                          
                          {ntItemsList.some(item => item.status === 'Pago') && (
                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              {ntItemsList.filter(item => item.status === 'Pago').length} pagos
                            </span>
                          )}
                          
                          {ntItemsList.some(item => item.status === 'Ag. Pagamento') && (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {ntItemsList.filter(item => item.status === 'Ag. Pagamento').length} aguardando
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {progress}% concluído
                          </div>
                          
                          <div className="h-2 w-2 rounded-full" style={{
                            backgroundColor: statusColor === 'green' ? '#10b981' : 
                                          statusColor === 'yellow' ? '#f59e0b' : 
                                          statusColor === 'orange' ? '#f97316' :
                                          '#ef4444'
                          }}></div>
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
                      
                      <div className="md:hidden">
                        <div className="relative inline-flex">
                          <svg className="w-10 h-10">
                            <circle className="text-gray-300 dark:text-gray-700" strokeWidth="3" stroke="currentColor" fill="transparent" r="15" cx="20" cy="20"/>
                            <circle className={`${
                              statusColor === 'green' ? 'text-green-600 dark:text-green-500' : 
                              statusColor === 'yellow' ? 'text-yellow-600 dark:text-yellow-500' : 
                              statusColor === 'orange' ? 'text-orange-600 dark:text-orange-500' :
                              'text-red-600 dark:text-red-500'
                            }`} 
                              strokeWidth="3" 
                              strokeDasharray={30 * 3.14 * 2}
                              strokeDashoffset={30 * 3.14 * 2 * (1 - progress / 100)}
                              strokeLinecap="round"
                              stroke="currentColor" 
                              fill="transparent" 
                              r="15" 
                              cx="20" 
                              cy="20"
                              transform="rotate(-90 20 20)"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                            {progress}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEditNT(nt);
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 transition-colors hover-lift focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          title="Editar NT"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteNT(nt);
                          }}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50 transition-colors hover-lift focus:outline-none focus:ring-2 focus:ring-red-500/40"
                          title="Excluir NT"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddItem(nt, e);
                          }}
                          className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/50 transition-colors hover-lift focus:outline-none focus:ring-2 focus:ring-green-500/40"
                          title="Adicionar item"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div 
                    className="border-t border-gray-200 dark:border-gray-700 animate-fadeIn overflow-hidden" 
                    style={{animationDuration: '150ms'}}
                  >
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10 backdrop-blur-sm">
                          <tr>
                            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Item
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Código
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Descrição
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Qtd
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Lote
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                              Data
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Hora
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Pag.
                            </th>
                            <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            {showOverdueWarnings && (
                              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                                Tempo
                              </th>
                            )}
                            <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-800">
                          {ntItemsList.map((item, idx) => {
                            const elapsedMinutes = getElapsedMinutes(item);
                            const isOverdue = elapsedMinutes > 120;
                            
                            const timeStatusClass = 
                              item.status !== 'Ag. Pagamento' ? '' :
                              isOverdue ? 'bg-orange-50/50 dark:bg-orange-900/10' :
                              elapsedMinutes >= 90 ? 'bg-red-50/50 dark:bg-red-900/10' :
                              elapsedMinutes >= 60 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' :
                              '';
                            
                            return (
                              <tr 
                                key={item.id} 
                                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 
                                  ${item.status === 'Pago' ? 'bg-green-50/50 dark:bg-green-900/10' :
                                  item.status === 'Pago Parcial' ? 'bg-yellow-50/50 dark:bg-yellow-900/10' :
                                  timeStatusClass
                                } ${item.priority && item.status !== 'Pago' ? 'border-l-4 border-l-amber-500 dark:border-l-amber-600' : ''}
                                animate-fade-in-up`}
                                style={{ animationDelay: `${idx * 30}ms` }}
                              >
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {item.item_number}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {item.code}
                                </td>
                                <td className="px-3 py-2 max-w-[120px] sm:max-w-[250px] truncate text-sm text-gray-700 dark:text-gray-300">
                                  <div className="flex items-center gap-1">
                                    <span title={item.description} className={`truncate ${item.priority && item.status !== 'Pago' ? 'font-medium' : ''}`}>
                                      {item.description}
                                    </span>
                                    {item.priority && item.status !== 'Pago' && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 mr-0.5" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                                          <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                        </svg>
                                        Prioritário
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                  {item.quantity}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  {item.batch ? (
                                    <span className="font-medium text-purple-600 dark:text-purple-400">{item.batch}</span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                  {item.created_date}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {item.created_time}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.payment_time && (item.status === 'Pago' || item.status === 'Pago Parcial') ? (
                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                      {item.payment_time}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {renderStatusButton(item, nt.id)}
                                </td>
                                
                                {showOverdueWarnings && (
                                  <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">
                                    {renderTimeStatus(item)}
                                  </td>
                                )}
                                
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1">
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handlePriorityToggle(item, nt.id, e);
                                      }}
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        item.priority ? 
                                        'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50' : 
                                        'bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-gray-800/30 dark:text-gray-500 dark:hover:bg-gray-700/50'
                                      }`}
                                      title={item.priority ? "Remover prioridade" : "Marcar como prioridade"}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={item.priority ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleEditItem(item, nt, e);
                                      }}
                                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors hover-lift"
                                      title="Editar item"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDeleteItem(item, nt.id);
                                      }}
                                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors hover-lift"
                                      title="Excluir item"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {ntItemsList.length} {ntItemsList.length === 1 ? 'item' : 'itens'} 
                        {ntItemsList.some(item => item.priority && item.status !== 'Pago') && (
                          <span className="ml-1.5 inline-flex items-center text-amber-600 dark:text-amber-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                              <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                            </svg>
                            {ntItemsList.filter(item => item.priority && item.status !== 'Pago').length} prioritário(s)
                          </span>
                        )}
                      </span>
                      
                      <button
                        onClick={(e) => handleAddItem(nt, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 
                                bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40
                                border border-green-200 dark:border-green-700/30 rounded-lg transition-colors hover:shadow-sm hover-lift"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Adicionar Item
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {isLoading && nts.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full shadow-lg px-4 py-2.5 flex items-center gap-3 border border-gray-200/70 dark:border-gray-700/50 z-50 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 p-1 h-6 w-6">
            <Loading 
              size="small" 
              message="" 
              logoVisible={false} 
              className="min-h-0 bg-transparent"
            />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Atualizando dados...</span>
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
