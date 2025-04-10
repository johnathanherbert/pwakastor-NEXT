'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import Sidebar from '../../../components/Sidebar';
import HeaderClock from '../../../components/Clock/HeaderClock'; // Adicione esta importação
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  PencilIcon,
  ChevronDownIcon,
  ChartBarIcon // Add this import
} from '@heroicons/react/24/outline';
import AddNTModal from '../../../components/NTManager/AddNTModal';
import EditNTModal from '../../../components/NTManager/EditNTModal';
import NTsList from '../../../components/NTManager/NTsList';
import DeleteConfirmationModal from '../../../components/NTManager/DeleteConfirmationModal';
import RobotAlertBanner from '../../../components/RobotStatus/RobotAlertBanner';
import RobotStatusModal from '../../../components/RobotStatus/RobotStatusModal';
import AnalyticsModal from '../../../components/Analytics/AnalyticsModal'; // Add this import
import { 
  calculatePaymentDeadline, 
  getCurrentShift, 
  getShiftNumber, 
  parseBrazilianDateTime,
  formatShiftName
} from '../../../utils/ntHelpers';
import { setupRealtimeSubscription, removeSubscription, setupMultipleSubscriptions, removeMultipleSubscriptions } from '../../../utils/supabaseRealtime';
import ToastContainer from '../../../components/Toast/ToastContainer';
import { showToast } from '../../../components/Toast/ToastContainer';
import { useTheme } from '@/contexts/ThemeContext';

export default function NTsPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nts, setNTs] = useState([]);
  const [filteredNTs, setFilteredNTs] = useState([]);
  const [ntItems, setNTItems] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentNT, setCurrentNT] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'nt' or 'item'
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showRobotStatusModal, setShowRobotStatusModal] = useState(false);
  const [robotAlerts, setRobotAlerts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(0); // 0 = all shifts, 1-3 for specific shifts
  const [shiftMenuOpen, setShiftMenuOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false); // Add this state

  useEffect(() => {
    // Remover manipulação direta do localStorage aqui
    // Agora vamos apenas checar o usuário e carregar os dados necessários

    const checkUser = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchNTs();
        setupRealtimeListeners();
        fetchRobotAlerts();
      }
      setIsLoading(false);
    };
    
    checkUser();
    
    return () => {
      removeMultipleSubscriptions(subscriptions);
    };
  }, []);

  const setupRealtimeListeners = () => {
    console.log("Setting up realtime listeners for NT updates");
    
    const newSubscriptions = setupMultipleSubscriptions([
      {
        table: 'nts',
        callback: handleNTChange,
        options: { event: '*' }
      },
      {
        table: 'nt_items',
        callback: handleNTItemChange,
        options: { event: '*' }
      }
    ]);
    
    setSubscriptions(newSubscriptions);
  };

  const handleNTChange = async (payload) => {
    console.log("NT changed:", payload);
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT') {
      const { data: newNT } = await supabase
        .from('nts')
        .select('*')
        .eq('id', newRecord.id)
        .single();
      
      const { data: newItems } = await supabase
        .from('nt_items')
        .select('*')
        .eq('nt_id', newRecord.id);
      
      if (newNT) {
        // Verificar se a NT já existe no estado antes de adicioná-la
        setNTs(prev => {
          // Se já existe uma NT com este ID, não adicione novamente
          if (prev.some(nt => nt.id === newNT.id)) {
            return prev;
          }
          
          // Check if this is a new NT with items (created from AddNTModal)
          const newNTWithItems = localStorage.getItem('new_nt_with_items') === newNT.id;
          
          // Only show toast if this isn't from a batch creation in AddNTModal
          if (!newNTWithItems) {
            showToast(`NT ${newNT.nt_number} criada com sucesso!`, 'success');
          } else {
            // Clear the flag after using it
            localStorage.removeItem('new_nt_with_items');
          }
          
          return [newNT, ...prev];
        });
        
        setFilteredNTs(prev => {
          // Se já existe uma NT com este ID, não adicione novamente
          if (prev.some(nt => nt.id === newNT.id)) {
            return prev;
          }
          return [newNT, ...prev];
        });
        
        if (newItems && newItems.length > 0) {
          setNTItems(prev => ({
            ...prev,
            [newRecord.id]: newItems
          }));
        }
      }
    }
    else if (eventType === 'UPDATE') {
      setNTs(prev => 
        prev.map(nt => nt.id === newRecord.id ? { ...nt, ...newRecord } : nt)
      );
      setFilteredNTs(prev => 
        prev.map(nt => nt.id === newRecord.id ? { ...nt, ...newRecord } : nt)
      );
      
      showToast(`NT ${newRecord.nt_number || 'atualizada'} alterada`, 'info');
    }
    else if (eventType === 'DELETE') {
      setNTs(prev => prev.filter(nt => nt.id !== oldRecord.id));
      setFilteredNTs(prev => prev.filter(nt => nt.id !== oldRecord.id));
      
      setNTItems(prev => {
        const newState = { ...prev };
        delete newState[oldRecord.id];
        return newState;
      });
    }
  };

  const handleNTItemChange = async (payload) => {
    console.log("NT item changed:", payload);
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT') {
      setNTItems(prev => {
        const ntId = newRecord.nt_id;
        const currentItems = prev[ntId] || [];
        
        // Check if this item is part of a new NT with items
        const newNTWithItems = localStorage.getItem('new_nt_with_items') === ntId;
        
        // Find NT number for the toast - only show toast for items added to existing NTs
        if (!newNTWithItems) {
          const ntNumber = nts.find(nt => nt.id === ntId)?.nt_number;
          // Only show toast if we have a valid NT number
          if (ntNumber) {
            showToast(`Item ${newRecord.code} adicionado à NT ${ntNumber}`, 'success');
          }
        }
        
        return {
          ...prev,
          [ntId]: [...currentItems, newRecord]
        };
      });
    }
    else if (eventType === 'UPDATE') {
      setNTItems(prev => {
        const ntId = newRecord.nt_id;
        const currentItems = prev[ntId] || [];
        const updatedItems = currentItems.map(item => 
          item.id === newRecord.id ? { ...item, ...newRecord } : item
        );
        
        // Show different toast messages based on status changes,
        // but only if the update wasn't triggered by the local updateItemStatus function
        // to avoid duplicate toasts
        if (oldRecord && oldRecord.status !== newRecord.status) {
          const ntNumber = nts.find(nt => nt.id === ntId)?.nt_number || 'desconhecida';
          const itemDesc = newRecord.description || '';
          
          // Only show toasts for changes that came from other sessions,
          // since updateItemStatus already shows toasts for local changes
          const isLocalChange = localStorage.getItem(`status_update_${newRecord.id}`);
          if (!isLocalChange) {
            if (newRecord.status === 'Pago') {
              showToast(`${itemDesc} (${newRecord.code}) foi marcado como pago`, 'success');
            } else if (newRecord.status === 'Pago Parcial') {
              showToast(`${itemDesc} (${newRecord.code}) foi marcado como parcialmente pago`, 'info');
            } else {
              showToast(`Status de ${itemDesc} (${newRecord.code}) alterado`, 'info');
            }
          } else {
            // Clear the flag after using it
            localStorage.removeItem(`status_update_${newRecord.id}`);
          }
        }
        
        return {
          ...prev,
          [ntId]: updatedItems
        };
      });
    }
    else if (eventType === 'DELETE') {
      setNTItems(prev => {
        const ntId = oldRecord.nt_id;
        const currentItems = prev[ntId] || [];
        const filteredItems = currentItems.filter(item => item.id !== oldRecord.id);
        
        // Find NT number for the toast, only show toast if we can find both the NT and item code
        const ntNumber = nts.find(nt => nt.id === ntId)?.nt_number;
        const itemCode = oldRecord?.code;
        
        if (ntNumber && itemCode) {
          showToast(`Item ${itemCode} removido da NT ${ntNumber}`, 'warning');
        }
        
        return {
          ...prev,
          [ntId]: filteredItems
        };
      });
    }
    
    // No manual call to filterNTs() here - it will be triggered by the useEffect
  };

  // Make sure we're watching for ntItems changes in the useEffect
  useEffect(() => {
    filterNTs();
  }, [searchTerm, filterStatus, itemSearchTerm, showOverdueOnly, selectedShift, nts, ntItems]);

  const fetchNTs = async () => {
    try {
      setIsLoading(true);
      
      const { data: ntsData, error: ntsError } = await supabase
        .from('nts')
        .select('*')
        .order('created_at', { ascending: false });

      if (ntsError) throw ntsError;
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('nt_items')
        .select('*')
        .order('item_number', { ascending: true });
        
      if (itemsError) throw itemsError;

      const itemsByNT = itemsData.reduce((acc, item) => {
        if (!acc[item.nt_id]) {
          acc[item.nt_id] = [];
        }
        acc[item.nt_id].push(item);
        return acc;
      }, {});

      setNTs(ntsData);
      setFilteredNTs(ntsData);
      setNTItems(itemsByNT);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching NTs:', error);
      setIsLoading(false);
    }
  };

  const fetchRobotAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('robot_alerts')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRobotAlerts(data || []);
    } catch (error) {
      console.error('Error fetching robot alerts:', error);
    }
  };

  const resolveRobotAlert = async (alertId) => {
    try {
      const { error } = await supabase
        .from('robot_alerts')
        .update({ active: false, resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
      fetchRobotAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  useEffect(() => {
    filterNTs();
  }, [searchTerm, filterStatus, itemSearchTerm, showOverdueOnly, selectedShift, nts]);

  const getShiftFilteredItems = (shiftNum = selectedShift) => {
    if (shiftNum === 0) return Object.values(ntItems).flat();
    
    return Object.values(ntItems).flat().filter(item => {
      try {
        const itemDate = parseBrazilianDateTime(item.created_date, item.created_time);
        return getShiftNumber(itemDate) === shiftNum;
      } catch (error) {
        return false;
      }
    });
  };

  const pendingItems = Object.values(ntItems).flat().filter(item => item.status === 'Ag. Pagamento');
  
  const pendingItemsByShift = selectedShift === 0 
    ? pendingItems 
    : pendingItems.filter(item => {
        try {
          const itemDate = parseBrazilianDateTime(item.created_date, item.created_time);
          return getShiftNumber(itemDate) === selectedShift;
        } catch (error) {
          return false;
        }
      });
  
  const paidTodayItems = Object.values(ntItems).flat().filter(item => {
    if (item.status !== 'Pago') return false;
    const today = new Date().toLocaleDateString('pt-BR');
    const isToday = item.created_date === today;
    
    if (selectedShift === 0) return isToday;
    
    try {
      const itemDate = parseBrazilianDateTime(item.created_date, item.created_time);
      return isToday && getShiftNumber(itemDate) === selectedShift;
    } catch (error) {
      return false;
    }
  });
  
  const overdueItems = Object.values(ntItems).flat().filter(item => {
    if (item.status !== 'Ag. Pagamento') return false;
    const deadline = calculatePaymentDeadline(item.created_date, item.created_time);
    const isOverdue = new Date() > deadline;
    
    if (selectedShift === 0) return isOverdue;
    
    try {
      const itemDate = parseBrazilianDateTime(item.created_date, item.created_time);
      return isOverdue && getShiftNumber(itemDate) === selectedShift;
    } catch (error) {
      return false;
    }
  });

  const filterNTs = () => {
    let filtered = [...nts];
    
    if (searchTerm) {
      filtered = filtered.filter(nt => 
        nt.nt_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (itemSearchTerm) {
      filtered = filtered.filter(nt => {
        const ntItemsList = ntItems[nt.id] || [];
        return ntItemsList.some(item => 
          item.description.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
          item.code.toLowerCase().includes(itemSearchTerm.toLowerCase())
        );
      });
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(nt => {
        const ntItemsList = ntItems[nt.id] || [];
        
        if (filterStatus === 'pending') {
          return ntItemsList.some(item => item.status === 'Ag. Pagamento');
        } else if (filterStatus === 'paid') {
          return ntItemsList.length > 0 && ntItemsList.every(item => item.status === 'Pago');
        } else if (filterStatus === 'partial') {
          const hasPaid = ntItemsList.some(item => item.status === 'Pago' || item.status === 'Pago Parcial');
          const hasPending = ntItemsList.some(item => item.status === 'Ag. Pagamento');
          return hasPaid && hasPending;
        }
        return true;
      });
    }

    if (showOverdueOnly) {
      filtered = filtered.filter(nt => {
        const ntItemsList = ntItems[nt.id] || [];
        return ntItemsList.some(item => {
          const deadline = calculatePaymentDeadline(item.created_date, item.created_time);
          return item.status === 'Ag. Pagamento' && new Date() > deadline;
        });
      });
    }

    if (selectedShift !== 0) {
      filtered = filtered.filter(nt => {
        const ntItemsList = ntItems[nt.id] || [];
        return ntItemsList.some(item => {
          try {
            const itemDate = parseBrazilianDateTime(item.created_date, item.created_time);
            return getShiftNumber(itemDate) === selectedShift;
          } catch (error) {
            return false;
          }
        });
      });
    }
    
    setFilteredNTs(filtered);
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
    fetchNTs();
    fetchRobotAlerts();
  };

  const handleNTAdded = () => {
    setShowAddModal(false);
    // Não precisamos chamar refreshData aqui, pois o listener em tempo real
    // já vai detectar a nova NT e atualizar a UI
  };

  const updateItemStatus = async (itemId, newStatus, ntId) => {
    try {
      const now = new Date();
      const paymentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const updates = { status: newStatus };
      
      if (newStatus === 'Pago' || newStatus === 'Pago Parcial') {
        updates.payment_time = paymentTime;
      } else if (newStatus === 'Ag. Pagamento') {
        // Clear payment time when status is changed back to "Awaiting Payment"
        updates.payment_time = null;
      }

      // Get the item before update to reference in toast
      const itemToUpdate = ntItems[ntId]?.find(item => item.id === itemId);
      if (!itemToUpdate) throw new Error('Item não encontrado');
      
      const itemCode = itemToUpdate?.code || '';
      const itemDesc = itemToUpdate?.description || '';
      const ntNumber = nts.find(nt => nt.id === ntId)?.nt_number || '';

      const { error } = await supabase
        .from('nt_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;
      
      // Flag this as a local status update to prevent duplicate toasts
      localStorage.setItem(`status_update_${itemId}`, 'true');
      setTimeout(() => localStorage.removeItem(`status_update_${itemId}`), 5000);
      
      // Show toast with item description and status
      let statusText = '';
      let toastType = 'info';
      
      switch (newStatus) {
        case 'Pago':
          statusText = 'pago';
          toastType = 'success';
          break;
        case 'Pago Parcial':
          statusText = 'parcialmente pago';
          toastType = 'info';
          break;
        default:
          statusText = 'aguardando pagamento';
          toastType = 'warning';
      }
      
      showToast(`${itemDesc} (${itemCode}) foi marcado como ${statusText}`, toastType);
      
    } catch (error) {
      console.error('Error updating item status:', error);
      showToast(`Erro ao atualizar status: ${error.message}`, 'error');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setItemSearchTerm('');
    setFilterStatus('all');
    setShowOverdueOnly(false);
    setShowFilters(false);
    setSelectedShift(0);
  };

  const handleEditNT = (nt) => {
    console.log("Main page: Editing NT:", nt);
    setCurrentNT(nt);
    setShowEditModal(true);
  };

  const handleNTEdited = () => {
    console.log("NT edit complete, refreshing data");
    setShowEditModal(false);
    setCurrentNT(null);
    refreshData();
  };

  const handleDeleteNT = (nt) => {
    console.log("Main page: Deleting NT:", nt);
    setCurrentNT(nt);
    setDeleteType('nt');
    setShowDeleteConfirmation(true);
  };

  const handleDeleteItem = (item, ntId) => {
    console.log("Main page: Deleting item:", item, "from NT:", ntId);
    setCurrentNT({ id: ntId });
    setItemToDelete(item);
    setDeleteType('item');
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === 'nt') {
        const { error: itemsError } = await supabase
          .from('nt_items')
          .delete()
          .eq('nt_id', currentNT.id);
        
        if (itemsError) throw itemsError;
        
        const { error: ntError } = await supabase
          .from('nts')
          .delete()
          .eq('id', currentNT.id);
        
        if (ntError) throw ntError;

        console.log("Successfully deleted NT and its items");
      } else if (deleteType === 'item') {
        const { error } = await supabase
          .from('nt_items')
          .delete()
          .eq('id', itemToDelete.id);
        
        if (error) throw error;
        console.log("Successfully deleted item");
      }
      
      setShowDeleteConfirmation(false);
      setCurrentNT(null);
      setItemToDelete(null);
      setDeleteType(null);
      refreshData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert(`Error deleting: ${error.message}`);
    }
  };

  const addItemToNT = async (ntId, newItem) => {
    try {
      console.log("Adding item to NT:", ntId, newItem);
      
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const ntItemsList = ntItems[ntId] || [];
      const highestItemNumber = ntItemsList.length > 0 
        ? Math.max(...ntItemsList.map(item => item.item_number))
        : 0;
      
      const itemToInsert = {
        nt_id: ntId,
        item_number: highestItemNumber + 1,
        code: newItem.codigo,
        description: newItem.descricao || '-',
        quantity: newItem.quantidade,
        created_date: formattedDate,
        created_time: formattedTime,
        status: 'Ag. Pagamento'
      };
      
      // Find the NT number to display in the toast
      const ntNumber = nts.find(nt => nt.id === ntId)?.nt_number || 'desconhecida';
      
      console.log("Inserting item:", itemToInsert);
      
      const { data, error } = await supabase
        .from('nt_items')
        .insert([itemToInsert])
        .select();
      
      if (error) throw error;
      
      showToast(`Item ${newItem.codigo} adicionado à NT ${ntNumber}`, 'success');
      console.log("Item added successfully:", data);
      // O listener em tempo real cuidará da atualização
    } catch (error) {
      console.error('Error adding item to NT:', error);
      showToast(`Erro ao adicionar item: ${error.message}`, 'error');
    }
  };

  const editItem = async (itemId, updates, ntId) => {
    try {
      console.log("Editing item:", itemId, "with updates:", updates);
      
      const { error } = await supabase
        .from('nt_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;
      
      console.log("Item updated successfully");
      
      // Show toast with updated item description
      const itemToUpdate = ntItems[ntId]?.find(item => item.id === itemId);
      if (itemToUpdate) {
        const newDesc = updates.description || itemToUpdate.description;
        const itemCode = updates.code || itemToUpdate.code;
        showToast(`Item ${newDesc} (${itemCode}) atualizado com sucesso`, 'success');
      }
      
      setNTItems(prev => {
        const updatedItems = [...prev[ntId]];
        const itemIndex = updatedItems.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
          updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...updates };
        }
        return { ...prev, [ntId]: updatedItems };
      });
      
      refreshData();
    } catch (error) {
      console.error('Error updating item:', error);
      showToast(`Erro ao atualizar item: ${error.message}`, 'error');
    }
  };

  if (isLoading && nts.length === 0) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex justify-center items-center h-screen w-screen bg-white dark:bg-gray-900">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      {/* Add ToastContainer to the top level */}
      <ToastContainer />
      
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Gerenciamento de NTs</h1>
            </div>
            
            <div className="flex items-center">
              {/* Add clock component here, before the dark mode button */}
              <HeaderClock />
              
              <button
                onClick={() => {
                  toggleDarkMode();
                  localStorage.setItem('darkMode', JSON.stringify(!darkMode));
                }}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              >
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <RobotAlertBanner />
          
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar NT..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                       rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400
                       focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              /> 
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors
                  ${showFilters 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                title="Filtros"
              >
                <FunnelIcon className="h-5 w-5" />
              </button>

              {/* Add Analytics Button */}
              <button
                onClick={() => setShowAnalyticsModal(true)}
                className="p-2 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
                title="Análise de Desempenho"
              >
                <ChartBarIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setShowRobotStatusModal(true)}
                className="p-2 bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-500 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors relative"
                title="Status dos Robôs"
              >
                <ExclamationTriangleIcon className="h-5 w-5" />
                {robotAlerts.length > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {robotAlerts.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={refreshData}
                className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Atualizar dados"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Adicionar NT</span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShiftMenuOpen(!shiftMenuOpen)}
                  className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                  title="Filtrar por turno"
                >
                  <span className="hidden sm:inline text-xs font-medium">
                    {selectedShift === 0 ? "Todos turnos" : `${selectedShift}º turno`}
                  </span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                {shiftMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700 py-1">
                    <button
                      className={`w-full text-left px-4 py-2 text-sm ${selectedShift === 0 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                      onClick={() => {
                        setSelectedShift(0);
                        setShiftMenuOpen(false);
                      }}
                    >
                      Todos os turnos
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm ${selectedShift === 1 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                      onClick={() => {
                        setSelectedShift(1);
                        setShiftMenuOpen(false);
                      }}
                    >
                      1º Turno (07:30-15:50)
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm ${selectedShift === 2 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                      onClick={() => {
                        setSelectedShift(2);
                        setShiftMenuOpen(false);
                      }}
                    >
                      2º Turno (15:50-23:20)
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm ${selectedShift === 3 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                      onClick={() => {
                        setSelectedShift(3);
                        setShiftMenuOpen(false);
                      }}
                    >
                      3º Turno (23:20-07:30)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 animate-fadeIn">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros avançados</h3>
                <button onClick={clearFilters} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Limpar filtros
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Status dos itens
                  </label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                           rounded-md text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="all">Todos os status</option>
                    <option value="pending">Aguardando pagamento</option>
                    <option value="partial">Pagamento parcial</option>
                    <option value="paid">Totalmente pago</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Buscar por item (código/descrição)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={itemSearchTerm}
                      onChange={(e) => setItemSearchTerm(e.target.value)}
                      placeholder="Ex: 010228 ou DIOXIDO TITANIO"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                             rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                             focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={showOverdueOnly}
                      onChange={(e) => setShowOverdueOnly(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span>Mostrar apenas itens com pagamento em atraso</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total de NTs
                    {selectedShift !== 0 && <span className="block text-xs text-gray-400 dark:text-gray-500">{formatShiftName(selectedShift)}</span>}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {selectedShift === 0 ? nts.length : filteredNTs.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">NT</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Itens aguardando
                    {selectedShift !== 0 && <span className="block text-xs text-gray-400 dark:text-gray-500">{formatShiftName(selectedShift)}</span>}
                  </p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                    {pendingItemsByShift.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">!</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Itens pagos hoje
                    {selectedShift !== 0 && <span className="block text-xs text-gray-400 dark:text-gray-500">{formatShiftName(selectedShift)}</span>}
                  </p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    {paidTodayItems.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">✓</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Itens em atraso
                    {selectedShift !== 0 && <span className="block text-xs text-gray-400 dark:text-gray-500">{formatShiftName(selectedShift)}</span>}
                  </p>
                  <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
                    {overdueItems.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-400">⏱</span>
                </div>
              </div>
            </div>
          </div>

          {filteredNTs.length === 0 && !isLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || itemSearchTerm || filterStatus !== 'all' || showOverdueOnly || selectedShift !== 0
                  ? 'Nenhuma NT encontrada com os filtros aplicados.'
                  : 'Nenhuma NT encontrada. Clique em "Adicionar NT" para começar.'}
              </p>
              {(searchTerm || itemSearchTerm || filterStatus !== 'all' || showOverdueOnly || selectedShift !== 0) && (
                <button 
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/30"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {(searchTerm || itemSearchTerm || filterStatus !== 'all' || showOverdueOnly || selectedShift !== 0) && filteredNTs.length > 0 && (
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exibindo {filteredNTs.length} {filteredNTs.length === 1 ? 'resultado' : 'resultados'}
              </p>
              <button 
                onClick={clearFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <XMarkIcon className="h-3 w-3" /> Limpar filtros
              </button>
            </div>
          )}

          <div className={isLoading && filteredNTs.length > 0 ? "opacity-60 pointer-events-none" : ""}>
            <NTsList 
              nts={filteredNTs} 
              ntItems={ntItems} 
              updateItemStatus={updateItemStatus}
              onEditNT={handleEditNT}
              onDeleteNT={handleDeleteNT}
              onDeleteItem={handleDeleteItem}
              onEditItem={editItem}
              onAddItem={addItemToNT}
              isLoading={isLoading}
              showOverdueWarnings={true}
            />
          </div>
        </div>
      </main>

      <AddNTModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onNTAdded={handleNTAdded}
      />

      {showEditModal && currentNT && (
        <EditNTModal 
          isOpen={showEditModal} 
          onClose={() => {
            console.log("Closing edit modal");
            setShowEditModal(false);
            setCurrentNT(null);
          }} 
          onNTEdited={handleNTEdited}
          nt={currentNT}
          ntItems={currentNT ? ntItems[currentNT.id] || [] : []}
        />
      )}

      <DeleteConfirmationModal 
        isOpen={showDeleteConfirmation} 
        onClose={() => {
          setShowDeleteConfirmation(false);
          setCurrentNT(null);
          setItemToDelete(null);
          setDeleteType(null);
        }} 
        onConfirm={confirmDelete} 
        type={deleteType}
        nt={currentNT}
        item={itemToDelete}
      />

      <RobotStatusModal 
        isOpen={showRobotStatusModal} 
        onClose={() => setShowRobotStatusModal(false)} 
        alerts={robotAlerts}
        selectedAlert={null}
        onResolve={resolveRobotAlert}
        onRefresh={fetchRobotAlerts}
      />

      {/* Add Analytics Modal */}
      <AnalyticsModal 
        isOpen={showAnalyticsModal} 
        onClose={() => setShowAnalyticsModal(false)}
      />
    </div>
  );
}
