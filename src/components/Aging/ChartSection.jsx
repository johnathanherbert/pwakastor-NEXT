import { Card } from 'flowbite-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Legend, Cell 
} from 'recharts';
import { useChartAnimation } from '../../hooks/useChartAnimation';
import { useResponsiveChart } from '../../hooks/useResponsiveChart';

export default function ChartSection({ chartData, darkMode }) {
  const { height: chartHeight } = useResponsiveChart(320);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Status Distribution */}
      <Card>
        <h3 className="text-lg font-bold mb-4">Status</h3>
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData.statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Age Distribution */}
      <Card>
        <h3 className="text-lg font-bold mb-4">Aging</h3>
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer>
            <AreaChart data={chartData.ageDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366F1"
                fill="#6366F1"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stock Type Distribution */}
      <Card>
        <h3 className="text-lg font-bold mb-4">Tipos</h3>
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData.stockTypeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.stockTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
