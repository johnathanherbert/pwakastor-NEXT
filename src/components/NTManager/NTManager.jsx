import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useRouter } from 'next/navigation';
import NTsList from './NTsList';
import Clock from '../Clock/Clock';
import { 
  ArrowPathIcon, 
  PlusCircleIcon, 
  BellIcon, 
  AdjustmentsHorizontalIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import AddNTModal from './AddNTModal';
import EditNTModal from './EditNTModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { showToast } from '../Toast/ToastContainer';
import { motion } from 'framer-motion';
import Loading from '../ui/Loading';

export default function NTManager() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [nts, setNTs] = useState([]);
  const [ntItems, setNTItems] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showOverdueWarnings, setShowOverdueWarnings] = useState(true);
  const [showAddNTModal, setShowAddNTModal] = useState(false);
  const [showEditNTModal, setShowEditNTModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentNT, setCurrentNT] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [statsVisible, setStatsVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    itemCount: 0
  });
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState(null);
  const efficientRefreshIntervalRef = useRef(null);

  // Verificar autenticação do usuário
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);
        setAuthChecked(true);
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Separate function for fetching data
  const fetchData = useCallback(async (showLoadingEffect = false) => {
    if (showLoadingEffect) {
      setIsLoading(true);
    }
    
    try {
      // Fetch NTs
      const { data: ntsData, error: ntsError } = await supabase
        .from('nts')
        .select('*')
        .order('created_date', { ascending: false })
        .order('created_time', { ascending: false });
      
      if (ntsError) throw ntsError;
      
      // Fetch all NT items
      const { data: itemsData, error: itemsError } = await supabase
        .from('nt_items')
        .select('*')
        .order('item_number', { ascending: true });
      
      if (itemsError) throw itemsError;
      
      // Organize items by NT
      const itemsByNT = {};
      itemsData.forEach(item => {
        if (!itemsByNT[item.nt_id]) {
          itemsByNT[item.nt_id] = [];
        }
        itemsByNT[item.nt_id].push(item);
      });
      
      // Update state with fetched data
      setNTs(ntsData);
      setNTItems(itemsByNT);

      // Calculate statistics
      calculateStatistics(ntsData, itemsByNT);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showLoadingEffect) {
        // Small delay to ensure the loading indicator is visible at least briefly
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    }
  }, []);
  
  // Função para buscar apenas os dados mais recentes
  const fetchRecentData = useCallback(async () => {
    if (!authChecked) return;
    
    try {
      // Get the timestamp from the last update as a reference point
      const latestTimestamp = lastRefreshTimestamp || new Date().toISOString();
      
      // Fetch only NTs created or updated after the last refresh
      const { data: recentNtsData, error: ntsError } = await supabase
        .from('nts')
        .select('*')
        .gt('updated_at', latestTimestamp)
        .order('created_date', { ascending: false })
        .order('created_time', { ascending: false });

      if (ntsError) throw ntsError;
      
      if (recentNtsData && recentNtsData.length > 0) {
        console.log(`Encontradas ${recentNtsData.length} NTs atualizadas/novas`);
        
        // Get IDs of updated NTs to fetch related items
        const ntIds = recentNtsData.map(nt => nt.id);
        
        // Fetch only items for these NTs
        const { data: recentItemsData, error: itemsError } = await supabase
          .from('nt_items')
          .select('*')
          .in('nt_id', ntIds)
          .order('item_number', { ascending: true });
        
        if (itemsError) throw itemsError;
        
        // Organize items by NT
        const recentItemsByNT = {};
        if (recentItemsData) {
          recentItemsData.forEach(item => {
            if (!recentItemsByNT[item.nt_id]) {
              recentItemsByNT[item.nt_id] = [];
            }
            recentItemsByNT[item.nt_id].push(item);
          });
        }
        
        // Update state with new data
        setNTs(prevNTs => {
          const updatedNTs = [...prevNTs];
          recentNtsData.forEach(newNT => {
            const existingIndex = updatedNTs.findIndex(nt => nt.id === newNT.id);
            if (existingIndex !== -1) {
              updatedNTs[existingIndex] = newNT;
            } else {
              updatedNTs.unshift(newNT); // Add new NT to beginning
            }
          });
          return updatedNTs;
        });