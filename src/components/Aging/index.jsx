'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import Topbar from '../Topbar';
import StatusCards from './StatusCards';
import ChartSection from './ChartSection';
import OldestLots from './OldestLots';
import MaterialsTable from './MaterialsTable';
import AnalyticsSection from './AnalyticsSection';
import FilterSection from './FilterSection';
import TabSection from './TabSection';
import FileUploadModal from '../FileUploadModal';
import { differenceInDays, format } from 'date-fns';
import { user } from '../../app/aging/layout'
import { User } from 'lucide-react';
import { Toast } from 'flowbite-react';
import { HiCheck } from 'react-icons/hi';

export default function AgingDashboard() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Add additional state for upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    critical: 0,
    warning: 0,
    attention: 0,
    normal: 0,
    totalItems: 0
  });
  const [chartData, setChartData] = useState({
    statusDistribution: [],
    ageDistribution: [],
    stockTypeDistribution: []
  });
  const [trendData, setTrendData] = useState([]);
  const [densityData, setDensityData] = useState([]);
  const [oldestLots, setOldestLots] = useState({
    adjustment: [],
    regular: [],
    totalAdjustment: 0,
    totalRegular: 0
  });
  const [adjustmentStats, setAdjustmentStats] = useState({
    total: 0,
    percentage: 0
  });

  // Add state for ajuste data
  const [ajusteData, setAjusteData] = useState([]);
  const [isLoadingAjuste, setIsLoadingAjuste] = useState(true);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchData(), fetchAjusteData()]);
    setIsRefreshing(false);
  };

  const handleStatusClick = (status) => {
    if (filterStatus === status) return;
    setFilterStatus(status);
    setActiveTab('materials');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Add new handlers for upload modal
  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleUploadSuccess = (recordCount) => {
    setUploadSuccess({
      show: true,
      message: `${recordCount} registros importados com sucesso!`
    });
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setUploadSuccess(null);
    }, 5000);
    
    // Refresh the data to show the new uploaded records, including ajuste data
    handleRefresh();
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const matchesSearch = material.codigo_materia_prima?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Verificar tipo de estoque primeiro
      const isAdjustment = material.tipo_estoque === 'S';
      
      if (filterStatus === 'adjustment') {
        return isAdjustment && matchesSearch;
      }
      
      // Para todos os outros filtros, excluir os lotes em ajuste
      if (isAdjustment) {
        return false;
      }
      
      // Aplicar filtros normais apenas para lotes não-ajuste
      switch (filterStatus) {
        case 'critical':
          return material.status === 'critical' && matchesSearch;
        case 'warning':
          return material.status === 'warning' && matchesSearch;
        case 'attention':
          return material.status === 'attention' && matchesSearch;
        case 'normal':
          return material.status === 'normal' && matchesSearch;
        case 'all':
        default:
          return matchesSearch;
      }
    });
  }, [materials, filterStatus, searchTerm]);

  const calculateStatus = (daysInArea) => {
    if (daysInArea >= 20) return 'critical';
    if (daysInArea >= 15) return 'warning';
    if (daysInArea >= 10) return 'attention';
    return 'normal';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: materialsData, error } = await supabase
        .from('materials_database')
        .select('*')
        .order('data_validade', { ascending: false });

      if (error) throw error;

      // Processar dados e calcular estatísticas
      const processedData = materialsData.map(item => {
        const daysInArea = differenceInDays(new Date(), new Date(item.data_validade));
        const status = calculateStatus(daysInArea);
        return { ...item, daysInArea, status };
      });

      // Calcular estatísticas
      const newStats = { critical: 0, warning: 0, attention: 0, normal: 0, totalItems: 0 };
      const ageRanges = { '0-10': 0, '11-15': 0, '16-20': 0, '20+': 0 };
      const stockTypes = { adjustmentLots: 0, regularLots: 0 };

      processedData.forEach(item => {
        // Contagem por status
        newStats[item.status]++;
        newStats.totalItems++;

        // Contagem por faixa de idade
        if (item.daysInArea <= 10) ageRanges['0-10']++;
        else if (item.daysInArea <= 15) ageRanges['11-15']++;
        else if (item.daysInArea <= 20) ageRanges['16-20']++;
        else ageRanges['20+']++;

        // Contagem por tipo de estoque
        if (item.tipo_estoque === 'S') {
          stockTypes.adjustmentLots++;
        } else {
          stockTypes.regularLots++;
        }
      });

      // Calculate lots data
      const allAdjustmentLots = processedData.filter(item => item.tipo_estoque === 'S');
      const allRegularLots = processedData.filter(item => item.tipo_estoque !== 'S');
      
      const adjustmentLots = allAdjustmentLots
        .sort((a, b) => b.daysInArea - a.daysInArea)
        .slice(0, 5);

      const regularLots = allRegularLots
        .sort((a, b) => b.daysInArea - a.daysInArea)
        .slice(0, 5);

      setOldestLots({ 
        adjustment: adjustmentLots, 
        regular: regularLots,
        totalAdjustment: allAdjustmentLots.length,
        totalRegular: allRegularLots.length // Adicionando o totalRegular aqui
      });

      // Gerar dados para os gráficos
      const chartDataUpdate = {
        statusDistribution: [
          { name: 'Crítico', value: newStats.critical, color: '#EF4444' },
          { name: 'Alerta', value: newStats.warning, color: '#F59E0B' },
          { name: 'Atenção', value: newStats.attention, color: '#F97316' },
          { name: 'Normal', value: newStats.normal, color: '#10B981' }
        ],
        ageDistribution: Object.entries(ageRanges).map(([range, count]) => ({
          range,
          count
        })),
        stockTypeDistribution: [
          { name: 'Lotes em Ajuste', value: stockTypes.adjustmentLots, color: '#6366F1' },
          { name: 'Lotes Regulares', value: stockTypes.regularLots, color: '#8B5CF6' }
        ]
      };

      // Gerar dados de tendência (últimos 7 dias)
      const trendDataUpdate = Array.from({ length: 7 }, (_, i) => {
        const date = format(new Date().setDate(new Date().getDate() - i), 'dd/MM');
        return {
          date,
          critical: Math.floor(Math.random() * 10),
          warning: Math.floor(Math.random() * 15)
        };
      }).reverse();

      // Gerar dados de densidade
      const densityDataUpdate = processedData.map(item => ({
        x: item.daysInArea,
        y: item.qtd_materia_prima || 0,
        z: 1
      }));

      // Atualizar todos os estados
      setMaterials(processedData);
      setStats(newStats);
      setChartData(chartDataUpdate);
      setTrendData(trendDataUpdate);
      setDensityData(densityDataUpdate);
      setOldestLots({ 
        adjustment: adjustmentLots, 
        regular: regularLots,
        totalAdjustment: allAdjustmentLots.length,
        totalRegular: allRegularLots.length // Adicionando o totalRegular aqui
      });
      setAdjustmentStats({
        total: stockTypes.adjustmentLots,
        percentage: ((stockTypes.adjustmentLots / newStats.totalItems) * 100).toFixed(1)
      });
      setLoading(false);

    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  // Add function to fetch ajuste data
  const fetchAjusteData = async () => {
    try {
      setIsLoadingAjuste(true);
      const { data, error } = await supabase
        .from('ajusteAging')
        .select('*')
        .order('data_ajuste', { ascending: false });

      if (error) {
        console.error('Error fetching ajuste data:', error);
        throw error;
      }

      // Validate the data
      if (!data || !Array.isArray(data)) {
        console.warn('Received invalid ajuste data:', data);
        setAjusteData([]);
        return;
      }

      // Transform the data to ensure numeric values are properly formatted
      const transformedData = data.map(item => ({
        ...item,
        quantidade: Number(item.quantidade || 0),
        custo_unitario: Number(item.custo_unitario || 0),
        custo_total: Number(item.custo_total || 0),
        dias_corridos: Number(item.dias_corridos || 0)
      }));

      setAjusteData(transformedData);
      console.log("Fetched ajuste data:", transformedData.length, "records");
    } catch (error) {
      console.error('Error fetching ajuste data:', error);
      setAjusteData([]);
    } finally {
      setIsLoadingAjuste(false);
    }
  };

  useEffect(() => {
    console.log("Initial fetch of data");
    // Fetch both datasets on initial load
    Promise.all([fetchData(), fetchAjusteData()]);
    
    // Fetch current user data
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setCurrentUser(data.user);
      }
    };
    
    getCurrentUser();
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      
      <Topbar
        user={currentUser || user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        title="Dashboard de Aging de Materiais"
        onUploadClick={handleOpenUploadModal}
      />

      {/* Success toast notification */}
      {uploadSuccess && uploadSuccess.show && (
        <div className="fixed top-20 right-4 z-50">
          <Toast>
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200">
              <HiCheck className="h-5 w-5" />
            </div>
            <div className="ml-3 text-sm font-normal">
              {uploadSuccess.message}
            </div>
            <Toast.Toggle onDismiss={() => setUploadSuccess(null)} />
          </Toast>
        </div>
      )}

      <main className="pt-20 px-6 max-w-8xl mx-auto">
        <FilterSection 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          isRefreshing={isRefreshing}
          handleRefresh={handleRefresh}
        />

        <StatusCards 
          stats={stats}
          totalItems={stats.totalItems}
          adjustmentStats={adjustmentStats}
          handleStatusClick={handleStatusClick}
        />

        <TabSection
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          chartData={chartData}
          filteredMaterials={filteredMaterials}
          filterStatus={filterStatus}
          ajusteData={ajusteData}
          isLoadingAjuste={isLoadingAjuste}
          trendData={trendData}
          densityData={densityData}
          oldestLots={oldestLots}
          darkMode={darkMode}
        />
      </main>

      {/* File Upload Modal */}
      <FileUploadModal 
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
