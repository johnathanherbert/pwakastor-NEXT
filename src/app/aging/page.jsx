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
    ageDistribution: []
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

      // Calcula estatísticas e prepara dados para os gráficos
      const newStats = { critical: 0, warning: 0, attention: 0, normal: 0, totalItems: 0 };
      const ageRanges = { '0-10': 0, '11-15': 0, '16-20': 0, '20+': 0 };

      processedData.forEach(item => {
        newStats[item.status]++;
        newStats.totalItems++;

        if (item.daysInArea <= 10) ageRanges['0-10']++;
        else if (item.daysInArea <= 15) ageRanges['11-15']++;
        else if (item.daysInArea <= 20) ageRanges['16-20']++;
        else ageRanges['20+']++;
      });

      setStats(newStats);
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
        }))
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

  // Add search and filter function
  const filteredMaterials = materials
    .filter(material => 
      (material.codigo_materia_prima?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       material.descricao?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === 'all' || material.status === filterStatus)
    );

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

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Topbar
        user={null}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        title="Dashboard de Aging de Materiais"
      />

      <main className="pt-20 px-6">
        {/* Add Refresh Button and Last Update Time */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard de Aging
          </h1>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg
                       hover:bg-blue-600 transition-all duration-200 ${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Stats Cards with Hover Effects */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { title: 'Crítico', value: stats.critical, type: 'critical' },
            { title: 'Alerta', value: stats.warning, type: 'warning' },
            { title: 'Atenção', value: stats.attention, type: 'attention' },
            { title: 'Normal', value: stats.normal, type: 'normal' }
          ].map(({ title, value, type }) => (
            <div
              key={type}
              className={`p-6 rounded-lg transform hover:scale-105 transition-all duration-200 
                         cursor-pointer hover:shadow-lg ${
                type === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
                type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                type === 'attention' ? 'bg-orange-100 dark:bg-orange-900/30' :
                'bg-green-100 dark:bg-green-900/30'
              }`}
            >
              <h3 className={`font-bold mb-2 ${
                type === 'critical' ? 'text-red-800 dark:text-red-200' :
                type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                type === 'attention' ? 'text-orange-800 dark:text-orange-200' :
                'text-green-800 dark:text-green-200'
              }`}>
                {title}
              </h3>
              <p className={`text-3xl font-bold ${
                type === 'critical' ? 'text-red-600 dark:text-red-300' :
                type === 'warning' ? 'text-yellow-600 dark:text-yellow-300' :
                type === 'attention' ? 'text-orange-600 dark:text-orange-300' :
                'text-green-600 dark:text-green-300'
              }`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código ou descrição..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2
                       focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos os Status</option>
              <option value="critical">Crítico</option>
              <option value="warning">Alerta</option>
              <option value="attention">Atenção</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>

        {/* Charts Section with Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
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
        </div>

        {/* Enhanced Table with Lot Groups */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Materiais {filterStatus !== 'all' ? `(${filterStatus})` : ''}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredMaterials.length} items encontrados
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="w-2/4 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.values(filteredMaterials.reduce((acc, material) => {
                    const key = material.codigo_materia_prima;
                    if (!acc[key]) {
                      acc[key] = {
                        codigo: material.codigo_materia_prima,
                        descricao: material.descricao,
                        lotes: [],
                        status: 'normal'
                      };
                    }
                    acc[key].lotes.push({
                      lote: material.lote,
                      dias: material.daysInArea,
                      status: material.status,
                      quantidade: material.qtd_materia_prima,
                      unidade: material.unidade_medida
                    });
                    // Update group status based on worst lot status
                    const statusPriority = { critical: 3, warning: 2, attention: 1, normal: 0 };
                    if (statusPriority[material.status] > statusPriority[acc[key].status]) {
                      acc[key].status = material.status;
                    }
                    return acc;
                  }, {}))
                  .slice(0, 5)
                  .map((group) => (
                    <>
                      <tr 
                        key={group.codigo} 
                        onClick={() => toggleRow(group.codigo)}
                        className="border-t dark:border-gray-700 hover:bg-gray-50 
                                   dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`mr-2 transition-transform duration-200 ${
                              expandedRows.has(group.codigo) ? 'rotate-90' : ''
                            }`}>
                              ▶
                            </span>
                            {group.codigo}
                          </div>
                        </td>
                        <td className="px-6 py-4">{group.descricao}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            group.status === 'critical' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                              : group.status === 'warning'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                              : group.status === 'attention'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          }`}>
                            {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                      {expandedRows.has(group.codigo) && (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                            <div className="grid gap-2">
                              {group.lotes.map((lote) => (
                                <div 
                                  key={lote.lote}
                                  className={`p-3 rounded-lg flex justify-between items-center ${
                                    lote.status === 'critical' 
                                      ? 'bg-red-50 dark:bg-red-900/20' 
                                      : lote.status === 'warning'
                                      ? 'bg-yellow-50 dark:bg-yellow-900/20'
                                      : lote.status === 'attention'
                                      ? 'bg-orange-50 dark:bg-orange-900/20'
                                      : 'bg-green-50 dark:bg-green-900/20'
                                  }`}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">
                                      Lote: {lote.lote}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {lote.dias} dias na área
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium text-sm">
                                      {lote.quantidade} {lote.unidade}
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      lote.status === 'critical' 
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                        : lote.status === 'warning'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                        : lote.status === 'attention'
                                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                    }`}>
                                      {lote.status.charAt(0).toUpperCase() + lote.status.slice(1)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}