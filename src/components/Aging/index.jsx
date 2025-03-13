'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Topbar from '../Topbar';
import StatusCards from './StatusCards';
import ChartSection from './ChartSection';
import OldestLots from './OldestLots';
import MaterialsTable from './MaterialsTable';
import AnalyticsSection from './AnalyticsSection';
import FilterSection from './FilterSection';
import TabSection from './TabSection';
import { differenceInDays, format } from 'date-fns';
import { user } from '../../app/aging/layout'
import { User } from 'lucide-react';

export default function AgingDashboard() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Add missing states
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

  // Add missing handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleStatusClick = (status) => {
    // Resetar o filtro se clicar no mesmo status novamente
    if (filterStatus === status) {
      setFilterStatus('all');
    } else {
      setFilterStatus(status);
    }
    setActiveTab('materials');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Atualizar a lógica de filteredMaterials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.codigo_materia_prima?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'adjustment') {
      // Mostrar APENAS lotes em ajuste (tipo_estoque === 'S')
      return material.tipo_estoque === 'S' && matchesSearch;
    }
    
    // Para todos os outros filtros, excluir os lotes em ajuste
    if (material.tipo_estoque === 'S') {
      return false;
    }

    // Aplicar filtros normais apenas para lotes não-ajuste
    switch (filterStatus) {
      case 'critical':
      case 'warning':
      case 'attention':
        return material.status === filterStatus && matchesSearch;
      case 'normal':
        return material.tipo_estoque !== 'S' && matchesSearch;
      case 'all':
      default:
        return matchesSearch;
    }
  });

  // Função auxiliar para calcular o status baseado nos dias
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

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      
      <Topbar
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        title="Dashboard de Aging e Gestão de Materiais"
      />

      

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
          filterStatus={filterStatus} // Adicionar esta prop
          trendData={trendData}
          densityData={densityData}
          oldestLots={oldestLots}
          darkMode={darkMode}
        />
      </main>
    </div>
  );
}
