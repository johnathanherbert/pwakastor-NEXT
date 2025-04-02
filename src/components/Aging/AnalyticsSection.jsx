import { 
  HiOutlineDocumentText, 
  HiOutlineCurrencyDollar, 
  HiOutlineCube, 
  HiOutlineExclamationCircle, 
  HiOutlineScale,
  HiOutlineChartBar, 
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlineInformationCircle
} from 'react-icons/hi2';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, LineChart, Line } from 'recharts';

export default function AnalyticsSection({ ajusteData = [], isLoading }) {
  // Debug to check incoming data
  console.log("AnalyticsSection receiving data:", { 
    ajusteDataLength: Array.isArray(ajusteData) ? ajusteData.length : 0,
    isLoading,
    sampleItem: Array.isArray(ajusteData) && ajusteData.length > 0 ? ajusteData[0] : null
  });
  
  // Ensure ajusteData is always an array, even if null or undefined
  const safeAjusteData = Array.isArray(ajusteData) ? ajusteData : [];
  
  // Get current date
  const today = new Date();
  const currentMonth = getMonth(today);
  const currentYear = getYear(today);
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  
  // Get current month name
  const currentMonthName = format(today, 'MMMM', { locale: ptBR });
  
  // Get previous month date and name
  const prevMonthDate = new Date(today);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonthStart = startOfMonth(prevMonthDate);
  const prevMonthEnd = endOfMonth(prevMonthDate);
  const prevMonthName = format(prevMonthDate, 'MMMM', { locale: ptBR });

  // Filter data for current month - add error handling for date parsing
  const currentMonthData = safeAjusteData.filter(item => {
    if (!item.data_ajuste) return false;
    try {
      const ajusteDate = parseISO(item.data_ajuste);
      return isWithinInterval(ajusteDate, { 
        start: currentMonthStart, 
        end: currentMonthEnd 
      });
    } catch (e) {
      console.error("Error parsing date:", e, item.data_ajuste);
      return false;
    }
  });
  
  // Filter data for previous month
  const prevMonthData = safeAjusteData.filter(item => {
    if (!item.data_ajuste) return false;
    try {
      const ajusteDate = parseISO(item.data_ajuste);
      return isWithinInterval(ajusteDate, { 
        start: prevMonthStart, 
        end: prevMonthEnd 
      });
    } catch (e) {
      console.error("Error parsing date:", e, item.data_ajuste);
      return false;
    }
  });

  // Calculate monthly breakdowns with error handling
  const monthlyData = safeAjusteData.reduce((acc, item) => {
    if (!item.data_ajuste) return acc;
    
    try {
      const ajusteDate = parseISO(item.data_ajuste);
      const monthKey = format(ajusteDate, 'yyyy-MM');
      const monthName = format(ajusteDate, 'MMM yyyy', { locale: ptBR });
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          monthKey, // Add the key for easier reference
          monthName,
          month: format(ajusteDate, 'MMM', { locale: ptBR }),
          year: format(ajusteDate, 'yyyy'),
          count: 0,
          totalCost: 0,
          totalQuantity: 0,
          items: []
        };
      }
      
      acc[monthKey].count += 1;
      acc[monthKey].totalCost += (Number(item.custo_total) || 0);
      acc[monthKey].totalQuantity += (Number(item.quantidade) || 0);
      acc[monthKey].items.push(item);
    } catch (e) {
      console.error("Error processing month data:", e, item.data_ajuste);
    }
    
    return acc;
  }, {});
  
  // Sort months by date descending
  const sortedMonths = Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0])) // Sort chronologically for the chart
    .map(([key, data]) => ({
      monthKey: key,
      ...data
    }));
    
  // Format data for the bar chart with additional details
  const chartData = sortedMonths.map(month => ({
    name: month.month,
    value: Number(month.totalCost.toFixed(2)),
    count: month.count,
    quantity: month.totalQuantity,
    month: month.monthName,
    items: month.items.map(item => ({
      codigo: item.codigo || 'N/D',
      descricao: item.descricao || 'N/D',
      lote: item.lote || 'N/D',
      tipo_estoque: item.tipo_estoque || 'N/D',
      controlado: item.controlado ? 'Sim' : 'Não',
      peso: item.peso || 'N/D',
      deposito: item.deposito || 'N/D',
      quantidade: item.quantidade || 0,
      custo_unitario: item.custo_unitario || 0,
      custo_total: item.custo_total || 0
    })),
    // Top 3 items by value for quick reference
    topItems: month.items
      .sort((a, b) => (Number(b.custo_total) || 0) - (Number(a.custo_total) || 0))
      .slice(0, 3)
      .map(item => ({
        codigo: item.codigo,
        descricao: item.descricao,
        lote: item.lote,
        custo_total: item.custo_total
      }))
  }));

  // Now reverse for the table display - most recent first
  const monthsForTable = [...sortedMonths].reverse();
  
  // Calculate financial metrics
  const financialMetrics = {
    totalCost: safeAjusteData.reduce((sum, item) => sum + (Number(item.custo_total) || 0), 0).toFixed(2),
    avgUnitCost: safeAjusteData.length ? 
      (safeAjusteData.reduce((sum, item) => sum + (Number(item.custo_unitario) || 0), 0) / safeAjusteData.length).toFixed(2) : 
      '0.00',
    totalQuantity: safeAjusteData.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0),
    maxItemCost: safeAjusteData.length ? 
      Math.max(...safeAjusteData.map(item => Number(item.custo_total) || 0)).toFixed(2) :
      '0.00',
    currentMonthCost: currentMonthData.reduce((sum, item) => sum + (Number(item.custo_total) || 0), 0).toFixed(2),
    currentMonthCount: currentMonthData.length,
    prevMonthCost: prevMonthData.reduce((sum, item) => sum + (Number(item.custo_total) || 0), 0).toFixed(2),
    prevMonthCount: prevMonthData.length
  };

  // Get top expensive items with more details
  const topExpensiveItems = [...safeAjusteData]
    .sort((a, b) => (Number(b.custo_total) || 0) - (Number(a.custo_total) || 0))
    .slice(0, 5);

  // Get top expensive items for current month
  const topCurrentMonthItems = [...currentMonthData]
    .sort((a, b) => (Number(b.custo_total) || 0) - (Number(a.custo_total) || 0))
    .slice(0, 5);
    
  // Get top expensive items for previous month
  const topPrevMonthItems = [...prevMonthData]
    .sort((a, b) => (Number(b.custo_total) || 0) - (Number(a.custo_total) || 0))
    .slice(0, 5);

  // Get items with most financial impact (cost per unit * quantity)
  const impactItems = [...safeAjusteData]
    .map(item => ({
      ...item,
      financialImpact: (Number(item.custo_unitario) || 0) * (Number(item.quantidade) || 0)
    }))
    .sort((a, b) => b.financialImpact - a.financialImpact)
    .slice(0, 5);

  // Calculate deposito distribution
  const depositoCount = safeAjusteData.reduce((acc, item) => {
    if (!item.deposito) return acc;
    
    const deposito = item.deposito.toString().trim();
    acc[deposito] = (acc[deposito] || 0) + 1;
    return acc;
  }, {});

  const depositoStats = Object.entries(depositoCount)
    .map(([deposito, count]) => ({
      deposito,
      count,
      percentage: ((count / safeAjusteData.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <p className="ml-3 text-gray-500 dark:text-gray-400">Carregando dados financeiros...</p>
      </div>
    );
  }

  if (safeAjusteData.length === 0) {
    return (
      <div className="text-center py-12">
        <HiOutlineDocumentText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Sem dados disponíveis</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Nenhum dado de ajuste encontrado. Faça upload da planilha "AJUSTE - SAIDA" para visualizar informações aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Financial summary cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <div className="flex justify-between items-start">
            <div>
              <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white pb-1">
                R$ {financialMetrics.totalCost.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              </h5>
              <p className="text-base font-normal text-gray-500 dark:text-gray-400">
                Custo total dos ajustes
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <HiOutlineCurrencyDollar className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <div className="flex justify-between items-start">
            <div>
              <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white pb-1">
                {financialMetrics.totalQuantity.toLocaleString('pt-BR')}
              </h5>
              <p className="text-base font-normal text-gray-500 dark:text-gray-400">
                Total de itens ajustados
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <HiOutlineCube className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <div className="flex justify-between items-start">
            <div>
              <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white pb-1">
                R$ {financialMetrics.currentMonthCost.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              </h5>
              <p className="text-base font-normal text-gray-500 dark:text-gray-400">
                Custos em {currentMonthName}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <HiOutlineCalendar className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <div className="flex justify-between items-start">
            <div>
              <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white pb-1">
                {financialMetrics.currentMonthCount}
              </h5>
              <p className="text-base font-normal text-gray-500 dark:text-gray-400">
                Ajustes em {currentMonthName}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <HiOutlineDocumentText className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly breakdown with chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <HiOutlineCalendar className="w-6 h-6 text-blue-500 mr-2" />
              <h5 className="text-lg font-bold text-gray-900 dark:text-white">
                Distribuição Mensal de Custos
              </h5>
              <p className="text-center text-yellow-800 dark:text-yellow-400 font-bold">
                ⚠️ Em Desenvolvimento - Valores atuais podem não representar a realidade
              </p>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
              Análise Temporal
            </span>
          </div>
          
          {chartData.length > 0 ? (
            <div className="h-[220px] w-full mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 0, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={50}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    width={45}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => [`R$ ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`, 'Custo Total']}
                    labelFormatter={(label) => {
                      const item = chartData.find(d => d.name === label);
                      return item ? item.month : label;
                    }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      padding: '8px'
                    }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg max-w-xs">
                            <p className="font-bold text-gray-900 dark:text-white">{data.month}</p>
                            <div className="mt-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Custo Total:</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  R$ {data.value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Qtd. Ajustes:</span>
                                <span className="font-semibold">{data.count}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Vol. Materiais:</span>
                                <span className="font-semibold">{data.quantity.toLocaleString('pt-BR')}</span>
                              </div>
                            </div>
                            
                            {data.topItems && data.topItems.length > 0 && (
                              <div className="mt-2">
                                <p className="font-semibold text-gray-700 dark:text-gray-300">Top Itens:</p>
                                {data.topItems.map((item, i) => (
                                  <div key={i} className="mt-1 text-xs">
                                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.codigo}: {item.descricao}</p>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Lote: {item.lote}</span>
                                      <span className="text-blue-600 dark:text-blue-400">
                                        R$ {Number(item.custo_total).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone"
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fill="url(#colorCost)" 
                    name="Custo Total"
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-6 mb-2">
              <HiOutlineInformationCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                Não há dados suficientes para exibir o gráfico.
              </p>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">Mês</th>
                <th scope="col" className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">Qtd. Ajustes</th>
                <th scope="col" className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">Vol. Materiais</th>
                <th scope="col" className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">Valor Total</th>
                <th scope="col" className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">Média/Ajuste</th>
                <th scope="col" className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {monthsForTable.length > 0 ? (
                monthsForTable.map((month, index) => {
                  const isCurrentMonth = month.monthKey === format(today, 'yyyy-MM');
                  // Find the top item by value for this month
                  const topItem = month.items
                    .sort((a, b) => (Number(b.custo_total) || 0) - (Number(a.custo_total) || 0))
                    .slice(0, 1)[0] || {};
                  
                  // Count items with controlado = true
                  const controlledItems = month.items.filter(item => item.controlado).length;
                  const controlledPercentage = month.items.length 
                    ? ((controlledItems / month.items.length) * 100).toFixed(0) 
                    : 0;
                  
                  return (
                    <tr 
                      key={month.monthKey} 
                      className={`${isCurrentMonth ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}`}
                    >
                      <td className="px-4 py-2 font-medium whitespace-nowrap">
                        {isCurrentMonth ? (
                          <div className="flex items-center">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">{month.monthName}</span>
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                              Atual
                            </span>
                          </div>
                        ) : (
                          month.monthName
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {month.count}
                      </td>
                      <td className="px-4 py-2">
                        {month.totalQuantity.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-2">
                        <span className={isCurrentMonth ? "font-medium text-blue-600 dark:text-blue-400" : ""}>
                          R$ {month.totalCost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        R$ {(month.totalCost / month.count).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs space-y-1">
                          <div className="flex gap-1 items-center">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Top:</span>
                            <span className="truncate max-w-[150px]" title={topItem.descricao || 'N/D'}>
                              {topItem.codigo || 'N/D'}
                            </span>
                          </div>
                          <div className="flex gap-1 items-center">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Controlados:</span>
                            <span className="text-gray-600 dark:text-gray-400">{controlledItems} ({controlledPercentage}%)</span>
                          </div>
                          <div className="flex gap-1 items-center">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Lotes:</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {new Set(month.items.map(item => item.lote)).size}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-3">
                    <div className="flex flex-col items-center">
                      <HiOutlineInformationCircle className="w-6 h-6 text-gray-400 mb-1" />
                      <p className="text-gray-500 dark:text-gray-400">Nenhum dado encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current month focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Previous month top items - Changed from current to previous */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <HiOutlineCalendar className="w-6 h-6 text-purple-500 mr-2" />
                <h5 className="text-lg font-bold text-gray-900 dark:text-white">
                  Top Ajustes de {prevMonthName}
                </h5>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300">
                Mês Anterior
              </span>
            </div>

            {topPrevMonthItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">Código</th>
                      <th scope="col" className="px-6 py-3">Descrição</th>
                      <th scope="col" className="px-6 py-3">Lote</th>
                      <th scope="col" className="px-6 py-3">Custo Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPrevMonthItems.map((item, index) => (
                      <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          {item.codigo}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate">
                          {item.descricao || 'N/D'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                            {item.lote || 'N/D'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-purple-600 dark:text-purple-400">
                            R$ {(item.custo_total || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center">
                <HiOutlineInformationCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  Não há dados de ajustes para {prevMonthName}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Items with highest impact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <HiOutlineScale className="w-6 h-6 text-red-500 mr-2" />
                <h5 className="text-lg font-bold text-gray-900 dark:text-white">
                  Itens de Maior Impacto Financeiro
                </h5>
              </div>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                Alta Prioridade
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Código</th>
                    <th scope="col" className="px-6 py-3">Descrição</th>
                    <th scope="col" className="px-6 py-3">Lote</th>
                    <th scope="col" className="px-6 py-3">Impacto</th>
                  </tr>
                </thead>
                <tbody>
                  {impactItems.map((item, index) => (
                    <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {item.codigo}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate">
                        {item.descricao || 'N/D'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                          {item.lote || 'N/D'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-red-600 dark:text-red-400">
                          R$ {item.financialImpact.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top detailed items by value */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <HiOutlineCurrencyDollar className="w-6 h-6 text-green-500 mr-2" />
                <h5 className="text-lg font-bold text-gray-900 dark:text-white">
                  Itens de Maior Valor (Detalhado)
                </h5>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                Valor Financeiro
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Descrição</th>
                    <th scope="col" className="px-6 py-3">Lote</th>
                    <th scope="col" className="px-6 py-3">Qtd</th>
                    <th scope="col" className="px-6 py-3">Valor Un.</th>
                    <th scope="col" className="px-6 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topExpensiveItems.map((item, index) => (
                    <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="px-6 py-4 max-w-xs">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{item.codigo}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.descricao || 'N/D'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                          {item.lote || 'N/D'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.quantidade || 0}
                      </td>
                      <td className="px-6 py-4">
                        R$ {(item.custo_unitario || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          R$ {(item.custo_total || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Depósito distribution with financial values */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <HiOutlineChartBar className="w-7 h-7 text-purple-500 mr-3" />
            <h5 className="text-lg font-bold text-gray-900 dark:text-white">
              Impacto Financeiro por Depósito
            </h5>
          </div>
          <div className="space-y-5">
            {Object.entries(
              safeAjusteData.reduce((acc, item) => {
                if (!item.deposito) return acc;
                const deposito = item.deposito.toString().trim();
                
                if (!acc[deposito]) {
                  acc[deposito] = {
                    count: 0,
                    totalValue: 0
                  };
                }
                
                acc[deposito].count += 1;
                acc[deposito].totalValue += (item.custo_total || 0);
                
                return acc;
              }, {})
            )
              .map(([deposito, data]) => ({
                deposito,
                count: data.count,
                totalValue: data.totalValue,
                percentage: (data.totalValue / parseFloat(financialMetrics.totalCost) * 100).toFixed(1)
              }))
              .sort((a, b) => b.totalValue - a.totalValue)
              .slice(0, 5)
              .map((dep) => (
                <div key={dep.deposito}>
                  <div className="flex justify-between mb-1">
                    <div>
                      <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                        Depósito {dep.deposito}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({dep.count} ajustes)
                      </span>
                    </div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      R$ {dep.totalValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ({dep.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full dark:bg-green-500" 
                      style={{ width: `${dep.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Distribuição do valor financeiro total por depósito
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
