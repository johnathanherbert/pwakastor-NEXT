import { Tabs } from 'flowbite-react';
import { HiOutlineChartPie, HiOutlineTable, HiOutlineArrowTrendingUp } from 'react-icons/hi2';
import ChartSection from './ChartSection';
import MaterialsTable from './MaterialsTable';
import AnalyticsSection from './AnalyticsSection';
import OldestLots from './OldestLots';

export default function TabSection({
  activeTab,
  setActiveTab,
  chartData,
  filteredMaterials,
  filterStatus,  // Garantir que esta prop está sendo recebida
  trendData,
  densityData,
  oldestLots,
  darkMode
}) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <Tabs.Item 
        title="Visão Geral" 
        icon={HiOutlineChartPie}
        active={activeTab === 'overview'}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <ChartSection chartData={chartData} darkMode={darkMode} />
          {oldestLots && <OldestLots oldestLots={oldestLots} />}
        </div>
      </Tabs.Item>

      <Tabs.Item 
        title="Aging de Materiais" 
        icon={HiOutlineTable}
        active={activeTab === 'materials'}
      >
        <div className="mt-4">
          <MaterialsTable 
            materials={filteredMaterials} 
            filterStatus={filterStatus}  // Passar o filterStatus
          />
        </div>
      </Tabs.Item>

      <Tabs.Item 
        title="Análise" 
        icon={HiOutlineArrowTrendingUp}
        active={activeTab === 'analytics'}
      >
        <AnalyticsSection 
          trendData={trendData}
          densityData={densityData}
        />
      </Tabs.Item>
    </Tabs>
  );
}
