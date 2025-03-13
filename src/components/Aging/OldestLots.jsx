import { format } from 'date-fns';
import { Badge, Card, Table } from 'flowbite-react';
import { HiOutlineTag as TagIcon, HiOutlineCalendar as CalendarIcon, HiOutlineClock as ClockIcon, HiOutlineWrenchScrewdriver as WrenchIcon } from 'react-icons/hi2';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function OldestLots({ oldestLots }) {
  // Prepare data for the aging chart
  const chartData = oldestLots.adjustment.map(lot => ({
    codigo: lot.codigo_materia_prima,
    dias: lot.daysInArea,
    descricao: lot.descricao
  }));

  // Calculate average days in aging for adjustment lots
  const averageDays = Math.round(
    oldestLots.adjustment.reduce((acc, lot) => acc + lot.daysInArea, 0) / oldestLots.adjustment.length
  );

  // Find the highest days in aging
  const maxDays = Math.max(...oldestLots.adjustment.map(lot => lot.daysInArea));

  // Adicionar cálculos para lotes regulares
  const regularChartData = oldestLots.regular.map(lot => ({
    codigo: lot.codigo_materia_prima,
    dias: lot.daysInArea,
    descricao: lot.descricao
  }));

  const regularAverageDays = Math.round(
    oldestLots.regular.reduce((acc, lot) => acc + lot.daysInArea, 0) / oldestLots.regular.length
  );

  const regularMaxDays = Math.max(...oldestLots.regular.map(lot => lot.daysInArea));

  return (
    <div className="space-y-6">
      {/* Header com Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600">
          <div className="text-white">
            <p className="text-sm font-medium opacity-80">Total em Ajuste</p>
            <h3 className="text-2xl font-bold">{oldestLots.totalAdjustment}</h3>
            <p className="text-xs opacity-70 mt-1">Materiais em processo de ajuste</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600">
          <div className="text-white">
            <p className="text-sm font-medium opacity-80">Lotes Regulares</p>
            <h3 className="text-2xl font-bold">{oldestLots.totalRegular}</h3>
            <p className="text-xs opacity-70 mt-1">Em monitoramento</p>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Aging Chart Card */}
        <Card>
          <div className="flex justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center me-3">
                <WrenchIcon className="w-6 h-6 text-purple-500 dark:text-purple-400" />
              </div>
              <div>
                <h5 className="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1">
                  {averageDays}d
                </h5>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  Média de dias em aging
                </p>
              </div>
            </div>
            <div>
              <Badge 
                color={maxDays >= 20 ? "failure" : maxDays >= 15 ? "warning" : "success"}
                size="sm"
                className="flex items-center gap-1"
              >
                <ClockIcon className="w-3 h-3" />
                Máx: {maxDays}d
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 mb-4">
            <dl className="flex items-center">
              <dt className="text-gray-500 dark:text-gray-400 text-sm font-normal me-1">
                Total em ajuste:
              </dt>
              <dd className="text-gray-900 text-sm dark:text-white font-semibold">
                {oldestLots.totalAdjustment}
              </dd>
            </dl>
            <dl className="flex items-center justify-end">
              <dt className="text-gray-500 dark:text-gray-400 text-sm font-normal me-1">
                Críticos:
              </dt>
              <dd className="text-gray-900 text-sm dark:text-white font-semibold">
                {oldestLots.adjustment.filter(lot => lot.daysInArea >= 20).length}
              </dd>
            </dl>
          </div>

          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="agingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="codigo" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  label={{ 
                    value: 'Dias', 
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#6B7280' }
                  }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  labelStyle={{ color: '#F3F4F6', fontSize: '12px' }}
                  formatter={(value) => [`${value} dias`, '']}
                />
                <Bar 
                  dataKey="dias" 
                  fill="url(#agingGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                  minPointSize={5}
                  name="Dias em Aging"
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationBegin={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Exibindo top 5 mais críticos
              </span>
              <Badge color="purple" size="sm">
                Últimas 24h
              </Badge>
            </div>
          </div>
        </Card>

        {/* Lotes Regulares Card */}
        <Card>
          <div className="flex justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center me-3">
                <ClockIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h5 className="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1">
                  {regularAverageDays}d
                </h5>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  Média de dias em aging
                </p>
              </div>
            </div>
            <div>
              <Badge 
                color={regularMaxDays >= 20 ? "failure" : regularMaxDays >= 15 ? "warning" : "success"}
                size="sm"
                className="flex items-center gap-1"
              >
                <ClockIcon className="w-3 h-3" />
                Máx: {regularMaxDays}d
              </Badge>
            </div>
          </div>

          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regularChartData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="regularGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="codigo" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  label={{ 
                    value: 'Dias', 
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#6B7280' }
                  }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  labelStyle={{ color: '#F3F4F6', fontSize: '12px' }}
                  formatter={(value) => [`${value} dias`, '']}
                />
                <Bar 
                  dataKey="dias" 
                  fill="url(#regularGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                  minPointSize={5}
                  name="Dias em Aging"
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationBegin={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Exibindo top 5 mais críticos
              </span>
              <Badge color="blue" size="sm">
                Últimas 24h
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
