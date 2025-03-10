'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import Topbar from '../../components/Topbar';
import { differenceInDays } from 'date-fns';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartAnimation } from '../../hooks/useChartAnimation';
import { MagnifyingGlassIcon, ArrowPathIcon, FunnelIcon } from '@heroicons/react/24/outline';
import CustomTooltip from '../../components/ChartTooltip';
import { useResponsiveChart } from '../../hooks/useResponsiveChart';
import { motion } from 'framer-motion';
import { ChartBarIcon, DocumentDuplicateIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { 
  LineChart, Line, CartesianGrid, 
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  CalendarIcon, CubeIcon, TagIcon, ChartPieIcon, 
  TableCellsIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { 
  Tabs, Tab, Card, CardBody, CardFooter,
  Chip, Select, SelectItem, Input, Button, Spinner
} from '@nextui-org/react';

export default function AgingDashboard() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState({
    critical: 0,    // > 20 dias
    warning: 0,     // 15-20 dias
    attention: 0,   // 10-15 dias
    normal: 0,      // < 10 dias
    totalItems: 0
  });

  // Adicionar estado para dados dos gráficos
  const [chartData, setChartData] = useState({
    statusDistribution: [],
    ageDistribution: [],
    stockTypeDistribution: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const animatedStatusData = useChartAnimation(chartData.statusDistribution);
  const { height: chartHeight } = useResponsiveChart(320);

  // Função para calcular o status baseado nos dias
  const calculateStatus = (daysInArea) => {
    if (daysInArea >= 20) return 'critical';
    if (daysInArea >= 15) return 'warning';
    if (daysInArea >= 10) return 'attention';
    return 'normal';
  };

  // Add new state for stock type stats
  const [stockTypeStats, setStockTypeStats] = useState({
    adjustmentLots: 0, // Type 'S'
    regularLots: 0,    // Other types
  });

  // Add new states
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'daysInArea', direction: 'desc' });
  const [exportLoading, setExportLoading] = useState(false);
  const [predictiveData, setPredictiveData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [densityData, setDensityData] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState(0);

  // Add new state for oldest lots
  const [oldestLots, setOldestLots] = useState({
    adjustment: [],
    regular: []
  });

  // Add new states for view type
  const [viewType, setViewType] = useState('aging'); // 'aging' or 'adjustment'

  // Função para buscar e processar os dados
  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('materials_database')
        .select('*')
        .order('data_validade', { ascending: false });

      if (error) throw error;

      const processedData = data.map(item => {
        const daysInArea = differenceInDays(new Date(), new Date(item.data_validade));
        const status = calculateStatus(daysInArea);
        return { ...item, daysInArea, status };
      });

      // Calculate expiring soon items (next 7 days)
      const soonToExpire = processedData.filter(item => 
        item.daysInArea > -7 && item.daysInArea <= 0
      ).length;
      setExpiringSoon(soonToExpire);

      // Generate trend data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = format(new Date().setDate(new Date().getDate() - i), 'dd/MM');
        return {
          date,
          critical: Math.floor(Math.random() * 10),
          warning: Math.floor(Math.random() * 15)
        };
      }).reverse();
      setTrendData(last7Days);

      // Generate density data
      const density = processedData.map(item => ({
        x: item.daysInArea,
        y: item.qtd_materia_prima || 0,
        z: 1
      }));
      setDensityData(density);

      // Generate predictive data
      const predictions = Array.from({ length: 7 }, (_, i) => ({
        date: format(new Date().setDate(new Date().getDate() + i), 'dd/MM'),
        predicted: Math.floor(Math.random() * 20) + 10,
        actual: Math.floor(Math.random() * 20) + 10
      }));
      setPredictiveData(predictions);

      // Calcula estatísticas e prepara dados para os gráficos
      const newStats = { critical: 0, warning: 0, attention: 0, normal: 0, totalItems: 0 };
      const ageRanges = { '0-10': 0, '11-15': 0, '16-20': 0, '20+': 0 };
      const stockTypes = { adjustmentLots: 0, regularLots: 0 };

      processedData.forEach(item => {
        newStats[item.status]++;
        newStats.totalItems++;

        if (item.daysInArea <= 10) ageRanges['0-10']++;
        else if (item.daysInArea <= 15) ageRanges['11-15']++;
        else if (item.daysInArea <= 20) ageRanges['16-20']++;
        else ageRanges['20+']++;

        // Add stock type calculation
        if (item.tipo_estoque === 'S') {
          stockTypes.adjustmentLots++;
        } else {
          stockTypes.regularLots++;
        }
      });

      // Calculate oldest lots for each type
      const adjustmentLots = processedData
        .filter(item => item.tipo_estoque === 'S')
        .sort((a, b) => b.daysInArea - a.daysInArea)
        .slice(0, 5);

      const regularLots = processedData
        .filter(item => item.tipo_estoque !== 'S')
        .sort((a, b) => b.daysInArea - a.daysInArea)
        .slice(0, 5);

      setOldestLots({
        adjustment: adjustmentLots,
        regular: regularLots
      });

      setStats(newStats);
      setStockTypeStats(stockTypes);
      setMaterials(processedData);
      setChartData({
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

  // Add refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  // Modify the filter function to handle both views
  const filteredMaterials = materials
    .filter(material => {
      const matchesSearch = material.codigo_materia_prima?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          material.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || material.status === filterStatus;
      
      // Filter based on view type
      if (viewType === 'adjustment') {
        return matchesSearch && matchesStatus && material.tipo_estoque === 'S';
      } else {
        return matchesSearch && matchesStatus;
      }
    })
    .sort((a, b) => b.daysInArea - a.daysInArea);

  // Add new state for expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Add toggle function for rows
  const toggleRow = (codigo) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(codigo)) {
      newExpanded.delete(codigo);
    } else {
      newExpanded.add(codigo);
    }
    setExpandedRows(newExpanded);
  };

  // Add new states for interactions
  const [activeTab, setActiveTab] = useState('charts');
  const [showTooltip, setShowTooltip] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  // Add sort handler
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: 
        sortConfig.key === key && sortConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    });
  };

  // Add sparkline renderer
  const renderSparkline = (data) => (
    <div className="h-12 w-32">
      <ResponsiveContainer>
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3B82F6" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // Add handler for status card clicks
  const handleStatusClick = (status) => {
    setFilterStatus(status);
    setActiveTab('details');
  };

  // Add adjustment status card info
  const adjustmentStats = {
    total: materials.filter(m => m.tipo_estoque === 'S').length,
    percentage: ((materials.filter(m => m.tipo_estoque === 'S').length / stats.totalItems) * 100).toFixed(1)
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Topbar
        user={null}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        title="Dashboard de Aging de Materiais"
      />

      <main className="pt-20 px-6 max-w-8xl mx-auto">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <motion.h1 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                Dashboard de Aging
              </motion.h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {stats.totalItems} materiais monitorados
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Buscar material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
                className="w-64"
              />
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-40"
              >
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="critical">Críticos</SelectItem>
                <SelectItem value="warning">Alerta</SelectItem>
                <SelectItem value="attention">Atenção</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </Select>
              <Button
                onClick={handleRefresh}
                color="primary"
                startContent={<ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />}
              >
                Atualizar
              </Button>
            </div>
          </div>

          {/* Status Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { title: 'Crítico', value: stats.critical, type: 'critical', icon: '⚠️' },
              { title: 'Alerta', value: stats.warning, type: 'warning', icon: '⚡' },
              { title: 'Atenção', value: stats.attention, type: 'attention', icon: '👀' },
              { title: 'Normal', value: stats.normal, type: 'normal', icon: '✅' },
              { 
                title: 'Em Ajuste', 
                value: adjustmentStats.total, 
                type: 'adjustment', 
                icon: '🔧',
                onClick: () => {
                  setViewType('adjustment');
                  setActiveTab('details');
                }
              }
            ].map(({ title, value, type, icon, onClick }) => (
              <Card
                key={type}
                isPressable
                onPress={onClick || (() => handleStatusClick(type))}
                className={`border-none shadow-md hover:scale-102 transition-all duration-200`}
              >
                <CardBody className={`${
                  type === 'critical' ? 'bg-red-50 dark:bg-red-900/20' :
                  type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                  type === 'attention' ? 'bg-orange-50 dark:bg-orange-900/20' :
                  type === 'adjustment' ? 'bg-blue-50 dark:bg-blue-900/20' :
                  'bg-green-50 dark:bg-green-900/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl mb-2">{icon}</span>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {title}
                      </h3>
                      <p className="text-2xl font-bold mt-1">{value}</p>
                    </div>
                    {value > 0 && (
                      <div className={`flex flex-col items-end justify-center`}>
                        <div className={`text-xl font-bold px-4 py-2 rounded-xl ${
                          type === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-800/40 dark:text-red-300' :
                          type === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800/40 dark:text-yellow-300' :
                          type === 'attention' ? 'bg-orange-100 text-orange-700 dark:bg-orange-800/40 dark:text-orange-300' :
                          type === 'adjustment' ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/40 dark:text-blue-300' :
                          'bg-green-100 text-green-700 dark:bg-green-800/40 dark:text-green-300'
                        }`}>
                          {type === 'adjustment' ? adjustmentStats.percentage : ((value / stats.totalItems) * 100).toFixed(1)}%
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">do total</span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs 
            selectedKey={activeTab}
            onSelectionChange={setActiveTab}
            aria-label="Dashboard sections"
            className="mb-6"
          >
            <Tab
              key="overview"
              title={
                <div className="flex items-center gap-2">
                  <ChartPieIcon className="w-4 h-4" />
                  <span>Visão Geral</span>
                </div>
              }
            >
              {/* Overview Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Charts Section */}
                <Card className="p-6">
                  <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {/* Pie Chart */}
                      <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                          Distribuição por Status
                        </h3>
                        <div style={{ height: chartHeight }} className="relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={animatedStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={chartHeight * 0.25}
                                outerRadius={chartHeight * 0.4}
                                paddingAngle={8}
                                dataKey="value"
                                strokeWidth={2}
                                stroke={darkMode ? '#1F2937' : '#F3F4F6'}
                              >
                                {animatedStatusData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.color}
                                    className="transition-all duration-300 hover:opacity-80"
                                  />
                                ))}
                              </Pie>
                              <Tooltip 
                                content={<CustomTooltip />}
                                cursor={{ fill: 'transparent' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats.totalItems}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Total de Items
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bar Chart */}
                      <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                          Distribuição por Idade
                        </h3>
                        <div style={{ height: chartHeight }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.ageDistribution} barSize={chartHeight * 0.15}>
                              <XAxis 
                                dataKey="range" 
                                tick={{ fill: darkMode ? '#9CA3AF' : '#374151' }}
                                axisLine={{ stroke: darkMode ? '#374151' : '#E5E7EB' }}
                              />
                              <YAxis 
                                tick={{ fill: darkMode ? '#9CA3AF' : '#374151' }}
                                axisLine={{ stroke: darkMode ? '#374151' : '#E5E7EB' }}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar 
                                dataKey="count" 
                                radius={[6, 6, 0, 0]}
                              >
                                {chartData.ageDistribution.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`}
                                    fill={
                                      index === 3 ? '#EF4444' :  // 20+
                                      index === 2 ? '#F59E0B' :  // 16-20
                                      index === 1 ? '#F97316' :  // 11-15
                                      '#10B981'                  // 0-10
                                    }
                                    className="transition-all duration-300 hover:opacity-80"
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Stock Type Distribution Chart */}
                      <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                          Distribuição por Tipo de Estoque
                        </h3>
                        <div style={{ height: chartHeight }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData.stockTypeDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={chartHeight * 0.25}
                                outerRadius={chartHeight * 0.4}
                                paddingAngle={8}
                                dataKey="value"
                              >
                                {chartData.stockTypeDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Oldest Lots Section */}
                <div className="space-y-6">
                  {/* Oldest Adjustment Lots */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Lotes em Ajuste Mais Antigos
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Top 5 lotes que necessitam atenção
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() => {
                          setViewType('adjustment');
                          setActiveTab('details');
                        }}
                      >
                        Ver todos
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {oldestLots.adjustment.map((lot) => (
                        <div 
                          key={lot.lote}
                          className={`p-4 rounded-xl border-l-4 transition-all hover:scale-[1.02] ${
                            lot.status === 'critical' ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' :
                            lot.status === 'warning' ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' :
                            lot.status === 'attention' ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/10' :
                            'border-green-500 bg-green-50/50 dark:bg-green-900/10'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {lot.codigo_materia_prima}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  lot.status === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                  lot.status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                  lot.status === 'attention' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                }`}>
                                  {lot.daysInArea} dias
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                                {lot.descricao}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <TagIcon className="w-4 h-4" />
                                  Lote: {lot.lote}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <CalendarIcon className="w-4 h-4" />
                                  Validade: {format(new Date(lot.data_validade), 'dd/MM/yyyy')}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-row sm:flex-col items-end justify-end gap-2">
                              <div className="text-right">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  {lot.qtd_materia_prima}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                  {lot.unidade_medida}
                                </span>
                              </div>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={
                                  lot.status === 'critical' ? 'danger' :
                                  lot.status === 'warning' ? 'warning' :
                                  lot.status === 'attention' ? 'warning' :
                                  'success'
                                }
                              >
                                {lot.status.charAt(0).toUpperCase() + lot.status.slice(1)}
                              </Chip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Oldest Regular Lots */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Lotes Regulares Mais Antigos
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Top 5 lotes regulares com maior tempo
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() => {
                          setViewType('aging');
                          setActiveTab('details');
                        }}
                      >
                        Ver todos
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {oldestLots.regular.map((lot) => (
                        <div 
                          key={lot.lote}
                          className={`p-4 rounded-xl border-l-4 transition-all hover:scale-[1.02] ${
                            lot.status === 'critical' ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' :
                            lot.status === 'warning' ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' :
                            lot.status === 'attention' ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/10' :
                            'border-green-500 bg-green-50/50 dark:bg-green-900/10'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {lot.codigo_materia_prima}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  lot.status === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                  lot.status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                  lot.status === 'attention' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                }`}>
                                  {lot.daysInArea} dias
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                                {lot.descricao}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <TagIcon className="w-4 h-4" />
                                  Lote: {lot.lote}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <CalendarIcon className="w-4 h-4" />
                                  Validade: {format(new Date(lot.data_validade), 'dd/MM/yyyy')}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-row sm:flex-col items-end justify-end gap-2">
                              <div className="text-right">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  {lot.qtd_materia_prima}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                  {lot.unidade_medida}
                                </span>
                              </div>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={
                                  lot.status === 'critical' ? 'danger' :
                                  lot.status === 'warning' ? 'warning' :
                                  lot.status === 'attention' ? 'warning' :
                                  'success'
                                }
                              >
                                {lot.status.charAt(0).toUpperCase() + lot.status.slice(1)}
                              </Chip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Tab>

            <Tab
              key="details"
              title={
                <div className="flex items-center gap-2">
                  <TableCellsIcon className="w-4 h-4" />
                  <span>Aging de Materiais</span>
                </div>
              }
            >
              {/* Enhanced Table Section */}
              <Card className="mt-6">
                <CardBody>
                  <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <div className="p-4 bg-white dark:bg-gray-800">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                              {viewType === 'adjustment' ? 'Materiais em Ajuste' : 'Aging de Materiais'}
                            </h2>
                            <Select
                              value={viewType}
                              onChange={(e) => setViewType(e.target.value)}
                              className="w-48"
                            >
                              <SelectItem value="aging">Todos os Materiais</SelectItem>
                              <SelectItem value="adjustment">Materiais em Ajuste</SelectItem>
                            </Select>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {filteredMaterials.length} materiais encontrados
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={sortConfig.key}
                            onChange={(e) => handleSort(e.target.value)}
                            className="w-48"
                          >
                            <SelectItem value="daysInArea">Dias na Área</SelectItem>
                            <SelectItem value="codigo_materia_prima">Código</SelectItem>
                            <SelectItem value="qtd_materia_prima">Quantidade</SelectItem>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                      <thead className="text-xs text-gray-700 uppercase dark:text-gray-400">
                        <tr>
                          <th scope="col" className="px-6 py-3 bg-gray-50 dark:bg-gray-800">
                            Código
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Descrição
                          </th>
                          <th scope="col" className="px-6 py-3 bg-gray-50 dark:bg-gray-800">
                            Lote
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Data Entrada
                          </th>
                          <th scope="col" className="px-6 py-3 bg-gray-50 dark:bg-gray-800">
                            Data Validade
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Dias na Área
                          </th>
                          <th scope="col" className="px-6 py-3 bg-gray-50 dark:bg-gray-800">
                            Quantidade
                          </th>
                          {viewType === 'adjustment' && (
                            <th scope="col" className="px-6 py-3">
                              Tipo Estoque
                            </th>
                          )}
                          <th scope="col" className="px-6 py-3">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMaterials.length > 0 ? (
                          filteredMaterials.map((material, index) => (
                            <tr 
                              key={`${material.codigo_materia_prima}-${material.lote}`}
                              className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap bg-gray-50 dark:text-white dark:bg-gray-800">
                                {material.codigo_materia_prima}
                              </th>
                              <td className="px-6 py-4 max-w-xs truncate">
                                {material.descricao}
                              </td>
                              <td className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                                {material.lote}
                              </td>
                              <td className="px-6 py-4">
                                {format(new Date(material.data_entrada), 'dd/MM/yyyy')}
                              </td>
                              <td className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                                {format(new Date(material.data_validade), 'dd/MM/yyyy')}
                              </td>
                              <td className="px-6 py-4 font-medium">
                                {material.daysInArea}
                              </td>
                              <td className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                                {material.qtd_materia_prima} {material.unidade_medida}
                              </td>
                              {viewType === 'adjustment' && (
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                    Ajuste
                                  </span>
                                </td>
                              )}
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  material.status === 'critical' 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                    : material.status === 'warning'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                    : material.status === 'attention'
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                }`}>
                                  {material.status.charAt(0).toUpperCase() + material.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={viewType === 'adjustment' ? 9 : 8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                              {viewType === 'adjustment' 
                                ? 'Nenhum material em ajuste encontrado'
                                : 'Nenhum material encontrado'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </Tab>

            <Tab
              key="analytics"
              title={
                <div className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                  <span>Análise</span>
                </div>
              }
            >
              {/* Analytics Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Trend Analysis */}
                <Card className="p-6">
                  <CardBody>
                    <h3 className="text-lg font-bold mb-4">Tendência de Aging</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="critical" stroke="#EF4444" />
                        <Line type="monotone" dataKey="warning" stroke="#F59E0B" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                {/* Distribution Analysis */}
                <Card className="p-6">
                  <CardBody>
                    <h3 className="text-lg font-bold mb-4">Distribuição por Idade</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart>
                        <CartesianGrid />
                        <XAxis type="number" dataKey="x" name="dias" />
                        <YAxis type="number" dataKey="y" name="quantidade" />
                        <ZAxis type="number" range={[100, 500]} />
                        <Tooltip />
                        <Scatter data={densityData} fill="#8884d8" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </div>
      </main>
    </div>
  );
}