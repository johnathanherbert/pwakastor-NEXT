import { Card } from 'flowbite-react';
import { ResponsiveContainer, LineChart, ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis, Tooltip, Line, Scatter } from 'recharts';

export default function AnalyticsSection({ trendData, densityData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Trend Analysis */}
      <Card className="p-6">
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
      </Card>

      {/* Distribution Analysis */}
      <Card className="p-6">
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
      </Card>
    </div>
  );
}
