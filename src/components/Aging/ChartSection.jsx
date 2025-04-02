import { Card } from 'flowbite-react';
import { ResponsiveContainer, PieChart, Pie, Legend, Cell, Tooltip } from 'recharts';
import { HiUsers, HiArchiveBox } from 'react-icons/hi2';
import { useResponsiveChart } from '../../hooks/useResponsiveChart';

export default function ChartSection({ chartData, darkMode, trendData, densityData }) {
  const { height: chartHeight } = useResponsiveChart(320);
  
  // Ensure chartData has all properties to prevent errors
  const statusData = Array.isArray(chartData?.statusDistribution) ? chartData.statusDistribution : [];
  const stockTypeData = Array.isArray(chartData?.stockTypeDistribution) ? chartData.stockTypeDistribution : [];
  
  // Calculate total from data rather than assuming it's pre-calculated
  const totalMaterials = statusData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  // Log the chart data for debugging
  console.log("ChartSection rendering with:", { 
    statusData, 
    stockTypeData,
    totalMaterials
  });

  if (!totalMaterials) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 dark:text-gray-400">Sem dados para exibir</p>
          </div>
        </Card>
        <Card>
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 dark:text-gray-400">Sem dados para exibir</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Status Distribution */}
      <Card className="col-span-1">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center me-3">
              <HiUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h5 className="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1">
                {totalMaterials}
              </h5>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                Total de materiais na área
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {statusData.map((status) => (
            <dl key={status.name} className="flex flex-col">
              <dt className="text-base font-normal text-gray-500 dark:text-gray-400 mb-1">{status.name}</dt>
              <dd className="flex items-end mb-2">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{status.value}</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({((status.value / totalMaterials) * 100).toFixed(1)}%)
                </span>
              </dd>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="h-1 rounded-full" 
                  style={{ 
                    width: `${(status.value / totalMaterials) * 100}%`,
                    backgroundColor: status.color
                  }}
                ></div>
              </div>
            </dl>
          ))}
        </div>

        <div className="h-[240px]">
          {statusData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} materiais (${((value / totalMaterials) * 100).toFixed(1)}%)`,
                    name
                  ]}
                />
                <Legend 
                  formatter={(value) => (
                    <span className="text-sm font-medium">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Stock Type Distribution */}
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center me-3">
              <HiArchiveBox className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h5 className="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1">
                {totalMaterials}
              </h5>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                Total de lotes
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {stockTypeData.map((stockType) => (
            <dl key={stockType.name} className="flex flex-col">
              <dt className="text-base font-normal text-gray-500 dark:text-gray-400 mb-1">
                {stockType.name}
              </dt>
              <dd className="flex items-end mb-2">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {stockType.value}
                </span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({((stockType.value / totalMaterials) * 100).toFixed(1)}%)
                </span>
              </dd>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="h-1 rounded-full" 
                  style={{ 
                    width: `${(stockType.value / totalMaterials) * 100}%`,
                    backgroundColor: stockType.color
                  }}
                ></div>
              </div>
            </dl>
          ))}
        </div>

        <div className="h-[240px]">
          {stockTypeData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {stockTypeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} lotes (${((value/totalMaterials) * 100).toFixed(1)}%)`,
                    name
                  ]}
                />
                <Legend 
                  formatter={(value) => (
                    <span className="text-sm font-medium">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}
