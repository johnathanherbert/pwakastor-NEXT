import { Tabs } from 'flowbite-react';
import { HiOutlineChartPie, HiOutlineTable, HiOutlineCurrencyDollar } from 'react-icons/hi2';
import ChartSection from './ChartSection';
import MaterialsTable from './MaterialsTable';
import AnalyticsSection from './AnalyticsSection';
import OldestLots from './OldestLots';

export default function TabSection({
  activeTab,
  setActiveTab,
  chartData,
  filteredMaterials,
  filterStatus,
  ajusteData,       // New prop for ajuste data
  isLoadingAjuste,  // New prop for loading state
  oldestLots,
  darkMode,
  trendData,        // Make sure to pass these props
  densityData       // Make sure to pass these props
}) {
  // Debug to check data
  console.log("TabSection receiving ajusteData:", {
    ajusteDataLength: Array.isArray(ajusteData) ? ajusteData.length : 0,
    isLoadingAjuste
  });

  // Ensure chartData has all required properties to prevent errors
  const safeChartData = {
    statusDistribution: Array.isArray(chartData?.statusDistribution) ? chartData.statusDistribution : [],
    ageDistribution: Array.isArray(chartData?.ageDistribution) ? chartData.ageDistribution : [],
    stockTypeDistribution: Array.isArray(chartData?.stockTypeDistribution) ? chartData.stockTypeDistribution : []
  };

  // Ensure oldestLots is valid to prevent errors
  const safeOldestLots = oldestLots || {
    adjustment: [],
    regular: [],
    totalAdjustment: 0,
    totalRegular: 0
  };

  // Ensure ajusteData is valid to prevent errors
  const safeAjusteData = Array.isArray(ajusteData) ? ajusteData : [];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <Tabs.Item 
        title="Visão Geral" 
        icon={HiOutlineChartPie}
        active={activeTab === 'overview'}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <ChartSection 
            chartData={safeChartData} 
            darkMode={darkMode} 
            trendData={trendData} 
            densityData={densityData} 
          />
          <OldestLots oldestLots={safeOldestLots} />
        </div>
      </Tabs.Item>

      <Tabs.Item 
        title="Aging de Materiais" 
        icon={HiOutlineTable}
        active={activeTab === 'materials'}
      >
        <div className="mt-4">
          <MaterialsTable 
            materials={filteredMaterials || []} 
            filterStatus={filterStatus}
          />
        </div>
      </Tabs.Item>

      <Tabs.Item 
        title="Análise Financeira" 
        icon={HiOutlineCurrencyDollar}
        active={activeTab === 'analytics'}
      >
        <AnalyticsSection 
          ajusteData={safeAjusteData}
          isLoading={isLoadingAjuste}
        />
      </Tabs.Item>
    </Tabs>
  );
}
