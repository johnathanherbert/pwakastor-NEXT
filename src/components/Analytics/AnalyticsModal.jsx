import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { XMarkIcon, ChartBarIcon, ClockIcon, CurrencyDollarIcon, ExclamationTriangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register the required chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsModal({ isOpen, onClose }) {
  const [period, setPeriod] = useState('month'); // day, month, year
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, payments, service, robots
  const [ntData, setNtData] = useState([]);
  const [ntItemsData, setNtItemsData] = useState([]);
  const [robotData, setRobotData] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [stats, setStats] = useState({
    totalNTs: 0,
    totalItems: 0,
    paidItems: 0,
    pendingItems: 0,
    partialItems: 0,
    avgPaymentTime: 0,
    avgItemsPerNT: 0,
    totalRobotStops: 0,
    totalActiveAlerts: 0,
    overdueItems: 0
  });

  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
    }
  }, [isOpen, period, dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch NTs data
      const { data: nts, error: ntsError } = await supabase
        .from('nts')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (ntsError) throw ntsError;
      setNtData(nts || []);

      // Fetch NTs items data
      const { data: items, error: itemsError } = await supabase
        .from('nt_items')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (itemsError) throw itemsError;
      setNtItemsData(items || []);

      // Fetch robot alerts data
      const { data: robots, error: robotsError } = await supabase
        .from('robot_alerts')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (robotsError) throw robotsError;
      setRobotData(robots || []);

      // Calculate stats
      calculateStats(nts || [], items || [], robots || []);

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (nts, items, robots) => {
    // Basic counts
    const totalNTs = nts.length;
    const totalItems = items.length;
    const paidItems = items.filter(item => item.status === 'Pago').length;
    const partialItems = items.filter(item => item.status === 'Pago Parcial').length;
    const pendingItems = items.filter(item => item.status === 'Ag. Pagamento').length;
    const avgItemsPerNT = totalNTs > 0 ? (totalItems / totalNTs).toFixed(1) : 0;
    const totalRobotStops = robots.length;
    const activeAlerts = robots.filter(alert => alert.active).length;

    // Calculate average payment time
    let totalPaymentMinutes = 0;
    let paidItemsWithTime = 0;

    items.forEach(item => {
      if ((item.status === 'Pago' || item.status === 'Pago Parcial') && item.payment_time && item.created_time) {
        try {
          const paymentTimeMinutes = calculateTimeDifferenceInMinutes(
            item.created_date, 
            item.created_time, 
            item.created_date, // Assuming payment happens on the same day
            item.payment_time
          );
          
          if (!isNaN(paymentTimeMinutes) && paymentTimeMinutes >= 0) {
            totalPaymentMinutes += paymentTimeMinutes;
            paidItemsWithTime++;
          }
        } catch (e) {
          console.error("Error calculating payment time:", e);
        }
      }
    });

    const avgPaymentTime = paidItemsWithTime > 0 ? Math.round(totalPaymentMinutes / paidItemsWithTime) : 0;

    // Calculate overdue items (over 120 minutes since creation without payment)
    let overdueItems = 0;
    const now = new Date();

    items.forEach(item => {
      if (item.status === 'Ag. Pagamento') {
        try {
          const creationTimeMinutes = calculateTimeDifferenceInMinutes(
            item.created_date,
            item.created_time,
            formatDate(now),
            formatTime(now)
          );
          
          if (!isNaN(creationTimeMinutes) && creationTimeMinutes > 120) { // 2 hours threshold
            overdueItems++;
          }
        } catch (e) {
          console.error("Error calculating overdue:", e);
        }
      }
    });

    setStats({
      totalNTs,
      totalItems,
      paidItems,
      pendingItems,
      partialItems,
      avgPaymentTime,
      avgItemsPerNT,
      totalRobotStops,
      totalActiveAlerts: activeAlerts,
      overdueItems
    });
  };

  function calculateTimeDifferenceInMinutes(date1, time1, date2, time2) {
    // Assuming date format is DD/MM/YY and time format is HH:MM
    try {
      const [day1, month1, year1] = date1.split("/").map(Number);
      const [hour1, minute1] = time1.split(":").map(Number);
      
      const [day2, month2, year2] = date2.split("/").map(Number);
      const [hour2, minute2] = time2.split(":").map(Number);
      
      // Create Date objects - assume 2000+ years
      const d1 = new Date(2000 + year1, month1 - 1, day1, hour1, minute1);
      let d2 = new Date(2000 + year2, month2 - 1, day2, hour2, minute2);
      
      // Handle crossing midnight
      if (d1 > d2) {
        d2.setDate(d2.getDate() + 1);
      }
      
      // Calculate difference in minutes
      return Math.round((d2 - d1) / (1000 * 60));
    } catch (error) {
      console.error("Error parsing dates:", error);
      return 0;
    }
  }

  function formatDate(date) {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${(date.getFullYear() % 100).toString().padStart(2, '0')}`;
  }

  function formatTime(date) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  function groupDataByPeriod(data) {
    const groups = {};
    
    data.forEach(item => {
      let key;
      const date = new Date(item.created_at);
      
      if (period === 'day') {
        key = formatDate(date);
      } else if (period === 'month') {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        key = `${month.toString().padStart(2, '0')}/${year}`;
      } else { // year
        key = date.getFullYear().toString();
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      
      groups[key].push(item);
    });
    
    // Sort keys
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (period === 'day') {
        // Convert DD/MM/YY to Date objects for comparison
        const [aDay, aMonth, aYear] = a.split('/').map(Number);
        const [bDay, bMonth, bYear] = b.split('/').map(Number);
        return new Date(2000 + aYear, aMonth - 1, aDay) - new Date(2000 + bYear, bMonth - 1, bDay);
      } else if (period === 'month') {
        // Convert MM/YYYY to Date objects for comparison
        const [aMonth, aYear] = a.split('/').map(Number);
        const [bMonth, bYear] = b.split('/').map(Number);
        return new Date(aYear, aMonth - 1) - new Date(bYear, bMonth - 1);
      } else {
        // Simple numeric comparison for years
        return parseInt(a) - parseInt(b);
      }
    });
    
    return { groups, sortedKeys };
  }

  const periodName = () => {
    switch (period) {
      case 'day': return 'dia';
      case 'month': return 'mês';
      case 'year': return 'ano';
      default: return 'período';
    }
  };

  // Função para gerar relatório em Excel
  const generateExcelReport = async () => {
    try {
      setGeneratingReport(true);
      
      // Criar novo workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'PWA Kastor';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Adicionar metadados
      workbook.properties.date1904 = true;
      workbook.properties.title = 'Relatório de Análise de Desempenho';
      workbook.properties.subject = 'Dados de Desempenho Operacional';
      workbook.properties.keywords = 'relatório, desempenho, robôs, pagamentos';
      workbook.properties.company = 'PWA Kastor';
      
      // Definir as cores da planilha
      const headerFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      
      const subHeaderFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '8EA9DB' }
      };
      
      const headerFont = {
        name: 'Calibri',
        size: 12,
        bold: true,
        color: { argb: 'FFFFFF' }
      };
      
      const titleFont = {
        name: 'Calibri',
        size: 16,
        bold: true,
        color: { argb: '000000' }
      };
      
      const subtitleFont = {
        name: 'Calibri',
        size: 12,
        italic: true,
        color: { argb: '404040' }
      };
      
      const versionInfo = {
        softwareName: 'PWA Kastor',
        version: 'v1.2.5',
        authorGithub: 'github.com/johnathanherbert',
        generatedDate: new Date().toLocaleString('pt-BR')
      };
      
      // Função auxiliar para adicionar cabeçalho master nas planilhas
      const addMasterHeader = (sheet, title) => {
        // Configurações de estilo aprimoradas
        const borderStyle = {
          top: { style: 'thin', color: { argb: 'D0D0D0' } },
          left: { style: 'thin', color: { argb: 'D0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
          right: { style: 'thin', color: { argb: 'D0D0D0' } }
        };
        
        const headerBorderStyle = {
          top: { style: 'medium', color: { argb: '4472C4' } },
          left: { style: 'medium', color: { argb: '4472C4' } },
          bottom: { style: 'medium', color: { argb: '4472C4' } },
          right: { style: 'medium', color: { argb: '4472C4' } }
        };
        
        // Configurar cabeçalho elegante
        sheet.getRow(1).height = 30; // Altura da linha de título
        sheet.mergeCells('A1:F1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = title;
        titleCell.font = titleFont;
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' }
        };
        titleCell.border = headerBorderStyle;
        
        // Data do relatório com formatação elegante
        sheet.getRow(2).height = 20;
        sheet.mergeCells('A2:F2');
        const periodCell = sheet.getCell('A2');
        periodCell.value = `Período: ${new Date(dateRange.start).toLocaleDateString('pt-BR')} a ${new Date(dateRange.end).toLocaleDateString('pt-BR')}`;
        periodCell.font = subtitleFont;
        periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
        periodCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8F8F8' }
        };
        periodCell.border = {
          bottom: { style: 'thin', color: { argb: '4472C4' } }
        };
        
        // Informações do software - linha de créditos discreta e elegante
        sheet.mergeCells('A3:F3');
        const infoCell = sheet.getCell('A3');
        infoCell.value = {
          richText: [
            { text: `${versionInfo.softwareName} `, font: { name: 'Calibri', size: 8, bold: true, color: { argb: '595959' } } },
            { text: versionInfo.version, font: { name: 'Calibri', size: 8, color: { argb: '595959' } } },
            { text: ' | ', font: { name: 'Calibri', size: 8, color: { argb: '595959' } } },
            { text: 'Gerado em: ', font: { name: 'Calibri', size: 8, color: { argb: '595959' } } },
            { text: versionInfo.generatedDate, font: { name: 'Calibri', size: 8, italic: true, color: { argb: '595959' } } },
            { text: ' | ', font: { name: 'Calibri', size: 8, color: { argb: '595959' } } },
            { text: versionInfo.authorGithub, font: { name: 'Calibri', size: 8, underline: true, color: { argb: '0563C1' } } }
          ]
        };
        infoCell.alignment = { horizontal: 'right', vertical: 'middle' };
        infoCell.border = {
          bottom: { style: 'dotted', color: { argb: 'D0D0D0' } }
        };
        sheet.getRow(3).height = 18;
        
        // Adicionar linha de espaçamento
        sheet.addRow([]);
        
        // Adicionar logotipo "PWA Kastor" como texto estilizado
        sheet.mergeCells('A5:C5');
        const logoCell = sheet.getCell('A5');
        logoCell.value = {
          richText: [
            { text: 'PWA ', font: { name: 'Arial', size: 12, bold: true, color: { argb: '4472C4' } } },
            { text: 'KASTOR', font: { name: 'Arial', size: 12, bold: true, color: { argb: '333333' } } }
          ]
        };
        logoCell.alignment = { vertical: 'middle' };
        
        // Adicionar data de geração na mesma linha
        sheet.mergeCells('D5:F5');
        const dateCell = sheet.getCell('D5');
        const hoje = new Date().toLocaleDateString('pt-BR', {
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric'
        });
        dateCell.value = `${hoje.charAt(0).toUpperCase() + hoje.slice(1)}`;
        dateCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: '595959' } };
        dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
        
        // Adicionar linha separadora mais elegante
        sheet.addRow([]);
        sheet.mergeCells('A6:F6');
        const separatorCell = sheet.getCell('A6');
        separatorCell.border = {
          top: { style: 'thin', color: { argb: 'E0E0E0' } }
        };
        
        // Adicionar mais espaço antes do conteúdo
        sheet.addRow([]);
      };
      
      // Aba de Visão Geral
      const overviewSheet = workbook.addWorksheet('Visão Geral');
      addMasterHeader(overviewSheet, 'Relatório de Análise de Desempenho');
      
      // Adicionar estatísticas principais
      overviewSheet.addRow(['Indicadores Principais', 'Valor']);
      const headerRow = overviewSheet.getRow(8);
      headerRow.font = headerFont;
      headerRow.getCell(1).fill = headerFill;
      headerRow.getCell(2).fill = headerFill;
      
      // Adicionar dados
      overviewSheet.addRow(['Total de NTs', stats.totalNTs]);
      overviewSheet.addRow(['Total de Itens', stats.totalItems]);
      overviewSheet.addRow(['Itens Pagos', stats.paidItems]);
      overviewSheet.addRow(['Itens Pendentes', stats.pendingItems]);
      overviewSheet.addRow(['Itens com Pagamento Parcial', stats.partialItems]);
      overviewSheet.addRow(['Média de Itens por NT', stats.avgItemsPerNT]);
      overviewSheet.addRow(['Tempo Médio de Pagamento (min)', stats.avgPaymentTime]);
      overviewSheet.addRow(['Total de Paradas de Robôs', stats.totalRobotStops]);
      overviewSheet.addRow(['Paradas de Robôs Ativas', stats.totalActiveAlerts]);
      overviewSheet.addRow(['Itens em Atraso', stats.overdueItems]);
      
      // Ajustar largura das colunas
      overviewSheet.getColumn(1).width = 30;
      overviewSheet.getColumn(2).width = 15;
      
      // Adicionar gráfico de status dos itens
      overviewSheet.addRow([]);
      overviewSheet.addRow(['Status dos Itens', 'Quantidade']);
      const chartHeaderRow = overviewSheet.getRow(15);
      chartHeaderRow.font = headerFont;
      chartHeaderRow.getCell(1).fill = headerFill;
      chartHeaderRow.getCell(2).fill = headerFill;
      
      overviewSheet.addRow(['Pagos', stats.paidItems]);
      overviewSheet.addRow(['Pendentes', stats.pendingItems]);
      overviewSheet.addRow(['Pagamento Parcial', stats.partialItems]);
      
      // Aba de Pagamentos
      const paymentsSheet = workbook.addWorksheet('Análise de Pagamentos');
      addMasterHeader(paymentsSheet, 'Análise de Pagamentos');
      
      // Estatísticas de pagamento
      paymentsSheet.addRow([]);
      paymentsSheet.addRow(['Indicador', 'Valor']);
      const paymentsHeaderRow = paymentsSheet.getRow(3);
      paymentsHeaderRow.font = headerFont;
      paymentsHeaderRow.getCell(1).fill = headerFill;
      paymentsHeaderRow.getCell(2).fill = headerFill;
      
      const totalPaid = stats.paidItems + stats.partialItems;
      const onTimePaid = ntItemsData.filter(item => {
        if ((item.status !== 'Pago' && item.status !== 'Pago Parcial') || !item.payment_time) return false;
        try {
          const paymentTime = calculateTimeDifferenceInMinutes(
            item.created_date, item.created_time, item.created_date, item.payment_time
          );
          return paymentTime <= 120; // 2 hours deadline
        } catch (e) {
          return false;
        }
      }).length;
      
      const overduePayments = totalPaid - onTimePaid;
      const onTimeRate = totalPaid > 0 ? Math.round((onTimePaid / totalPaid) * 100) : 100;
      
      paymentsSheet.addRow(['Total de Itens Pagos', totalPaid]);
      paymentsSheet.addRow(['Pagos no Prazo', onTimePaid]);
      paymentsSheet.addRow(['Pagos com Atraso', overduePayments]);
      paymentsSheet.addRow(['Taxa de Pagamento no Prazo (%)', onTimeRate]);
      paymentsSheet.addRow(['Tempo Médio de Pagamento (min)', stats.avgPaymentTime]);
      
      // Ajustar largura das colunas
      paymentsSheet.getColumn(1).width = 30;
      paymentsSheet.getColumn(2).width = 15;
      
      // Adicionar dados por período
      const { groups: itemGroups, sortedKeys: itemKeys } = groupDataByPeriod(ntItemsData);
      
      paymentsSheet.addRow([]);
      paymentsSheet.addRow(['Pagamentos por Período']);
      const periodHeaderCell = paymentsSheet.getCell('A10');
      periodHeaderCell.font = { name: 'Calibri', size: 14, bold: true };
      
      // Adicionar cabeçalho de tabela
      paymentsSheet.addRow(['Período', 'Total de Itens', 'Pagos', 'Pendentes', 'Parciais', 'Tempo Médio (min)']);
      const tableHeaderRow = paymentsSheet.getRow(11);
      tableHeaderRow.font = headerFont;
      for (let i = 1; i <= 6; i++) {
        tableHeaderRow.getCell(i).fill = headerFill;
      }
      
      // Preencher dados por período
      itemKeys.forEach(key => {
        const periodItems = itemGroups[key];
        const paidItems = periodItems.filter(item => item.status === 'Pago').length;
        const pendingItems = periodItems.filter(item => item.status === 'Ag. Pagamento').length;
        const partialItems = periodItems.filter(item => item.status === 'Pago Parcial').length;
        
        // Calcular tempo médio
        let totalMinutes = 0;
        let validItems = 0;
        
        periodItems.forEach(item => {
          if ((item.status === 'Pago' || item.status === 'Pago Parcial') && item.payment_time) {
            try {
              const minutes = calculateTimeDifferenceInMinutes(
                item.created_date, item.created_time, item.created_date, item.payment_time
              );
              
              if (!isNaN(minutes) && minutes >= 0) {
                totalMinutes += minutes;
                validItems++;
              }
            } catch (e) {
              console.error("Error calculating time difference for Excel:", e);
            }
          }
        });
        
        const avgTime = validItems > 0 ? Math.round(totalMinutes / validItems) : 0;
        
        paymentsSheet.addRow([key, periodItems.length, paidItems, pendingItems, partialItems, avgTime]);
      });
      
      // Ajustar largura para a tabela
      for (let i = 1; i <= 6; i++) {
        if (i === 1) paymentsSheet.getColumn(i).width = 15;
        else paymentsSheet.getColumn(i).width = 18;
      }
      
      // Aba de Paradas de Robôs
      const robotsSheet = workbook.addWorksheet('Paradas de Robôs');
      addMasterHeader(robotsSheet, 'Análise de Paradas de Robôs');
      
      // Estatísticas de robôs
      robotsSheet.addRow([]);
      robotsSheet.addRow(['Indicador', 'Valor']);
      const robotsHeaderRow = robotsSheet.getRow(3);
      robotsHeaderRow.font = headerFont;
      robotsHeaderRow.getCell(1).fill = headerFill;
      robotsHeaderRow.getCell(2).fill = headerFill;
      
      robotsSheet.addRow(['Total de Paradas', stats.totalRobotStops]);
      robotsSheet.addRow(['Alertas Ativos', stats.totalActiveAlerts]);
      
      // Adicionar paradas por robô
      robotsSheet.addRow([]);
      robotsSheet.addRow(['Paradas por Robô']);
      const robotsSubtitleCell = robotsSheet.getCell('A6');
      robotsSubtitleCell.font = { name: 'Calibri', size: 14, bold: true };
      
      // Cabeçalho tabela
      robotsSheet.addRow(['Robô', 'Número de Paradas', 'Duração Média (min)']);
      const robotsTableHeaderRow = robotsSheet.getRow(7);
      robotsTableHeaderRow.font = headerFont;
      for (let i = 1; i <= 3; i++) {
        robotsTableHeaderRow.getCell(i).fill = headerFill;
      }
      
      // Dados por robô
      const robotNumbers = [...new Set(robotData.map(alert => alert.robot_number))];
      
      robotNumbers.forEach(robotNumber => {
        const robotAlerts = robotData.filter(alert => alert.robot_number === robotNumber);
        
        let totalMinutes = 0;
        let validAlerts = 0;
        
        robotAlerts.forEach(alert => {
          if (alert.resolved_at) {
            const startTime = new Date(alert.created_at);
            const endTime = new Date(alert.resolved_at);
            const minutes = Math.round((endTime - startTime) / (1000 * 60));
            
            if (!isNaN(minutes) && minutes >= 0) {
              totalMinutes += minutes;
              validAlerts++;
            }
          }
        });
        
        const avgDowntime = validAlerts > 0 ? Math.round(totalMinutes / validAlerts) : 0;
        
        robotsSheet.addRow([`Robô ${robotNumber}`, robotAlerts.length, avgDowntime]);
      });
      
      // Ajustar largura para as colunas
      robotsSheet.getColumn(1).width = 15;
      robotsSheet.getColumn(2).width = 20;
      robotsSheet.getColumn(3).width = 25;
      
      // Impacto das paradas
      robotsSheet.addRow([]);
      robotsSheet.addRow(['Impacto das Paradas de Robôs']);
      const impactSubtitleCell = robotsSheet.getCell(`A${10 + robotNumbers.length}`);
      impactSubtitleCell.font = { name: 'Calibri', size: 14, bold: true };
      
      // Adicionar dados de impacto
      const robodAffectedCount = ntItemsData.filter(item => {
        if ((item.status !== 'Pago' && item.status !== 'Pago Parcial') || !item.payment_time) return false;
        
        try {
          const itemCreationTime = new Date(item.created_at);
          const twoHoursBefore = new Date(itemCreationTime.getTime() - 2 * 60 * 60 * 1000);
          
          return robotData.some(alert => {
            const alertTime = new Date(alert.created_at);
            return alertTime >= twoHoursBefore && alertTime <= itemCreationTime;
          });
        } catch (e) {
          return false;
        }
      }).length;
      
      const robotsNotAffectedCount = (stats.paidItems + stats.partialItems) - robodAffectedCount;
      
      // Cabeçalho tabela impacto
      robotsSheet.addRow(['Tipo de Impacto', 'Quantidade de Itens']);
      const impactHeaderRow = robotsSheet.getRow(11 + robotNumbers.length);
      impactHeaderRow.font = headerFont;
      impactHeaderRow.getCell(1).fill = headerFill;
      impactHeaderRow.getCell(2).fill = headerFill;
      
      robotsSheet.addRow(['Itens impactados por paradas', robodAffectedCount]);
      robotsSheet.addRow(['Itens sem impacto', robotsNotAffectedCount]);
      
      // Gerar o arquivo e fazer o download
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Criar blob a partir do buffer
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Nome do arquivo
      const startDate = new Date(dateRange.start).toLocaleDateString('pt-BR').replaceAll('/', '-');
      const endDate = new Date(dateRange.end).toLocaleDateString('pt-BR').replaceAll('/', '-');
      const fileName = `Relatorio_Desempenho_${startDate}_a_${endDate}.xlsx`;
      
      // Executar o download
      saveAs(blob, fileName);
      
      setGeneratingReport(false);
      
    } catch (error) {
      console.error("Erro ao gerar relatório Excel:", error);
      setGeneratingReport(false);
      alert("Ocorreu um erro ao gerar o relatório. Por favor, tente novamente.");
    }
  };

  const renderOverviewTab = () => {
    // Group data by selected period
    const { groups: ntGroups, sortedKeys: ntKeys } = groupDataByPeriod(ntData);
    const { groups: itemGroups, sortedKeys: itemKeys } = groupDataByPeriod(ntItemsData);
    
    // Prepare chart data
    const ntsChartData = ntKeys.map(key => ntGroups[key].length);
    const itemsChartData = itemKeys.map(key => itemGroups[key].length);
    const itemsPerNTData = ntKeys.map(key => {
      const ntsCount = ntGroups[key].length;
      const ntIds = ntGroups[key].map(nt => nt.id);
      const itemsForTheseNTs = ntItemsData.filter(item => ntIds.includes(item.nt_id));
      return ntsCount > 0 ? (itemsForTheseNTs.length / ntsCount).toFixed(1) : 0;
    });

    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Visão Geral</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NTs por período */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">NTs por {periodName()}</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: ntKeys,
                  datasets: [
                    {
                      label: 'Total de NTs',
                      data: ntsChartData,
                      backgroundColor: 'rgba(59, 130, 246, 0.6)',
                      borderColor: 'rgb(59, 130, 246)',
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Itens por período */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Itens por {periodName()}</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: itemKeys,
                  datasets: [
                    {
                      label: 'Total de Itens',
                      data: itemsChartData,
                      backgroundColor: 'rgba(16, 185, 129, 0.6)',
                      borderColor: 'rgb(16, 185, 129)',
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Status dos itens */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Status dos itens</h3>
            <div className="h-64">
              <Pie
                data={{
                  labels: ['Pagos', 'Aguardando', 'Pagamento Parcial'],
                  datasets: [
                    {
                      data: [stats.paidItems, stats.pendingItems, stats.partialItems],
                      backgroundColor: [
                        'rgba(16, 185, 129, 0.6)', // green
                        'rgba(239, 68, 68, 0.6)',  // red
                        'rgba(245, 158, 11, 0.6)', // yellow
                      ]
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Média de itens por NT */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Itens por NT</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: ntKeys,
                  datasets: [
                    {
                      label: 'Média de itens por NT',
                      data: itemsPerNTData,
                      backgroundColor: 'rgba(124, 58, 237, 0.6)',
                      borderColor: 'rgb(124, 58, 237)',
                      tension: 0.1,
                      fill: false
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard 
            title="Total de NTs" 
            value={stats.totalNTs} 
            icon={<ChartBarIcon className="h-6 w-6 text-blue-500" />}
          />
          <StatCard 
            title="Total de Itens" 
            value={stats.totalItems} 
            icon={<DocumentIcon className="h-6 w-6 text-green-500" />}
          />
          <StatCard 
            title="Itens Pagos" 
            value={stats.paidItems} 
            icon={<CurrencyDollarIcon className="h-6 w-6 text-green-500" />}
          />
          <StatCard 
            title="Itens Pendentes" 
            value={stats.pendingItems} 
            icon={<ClockIcon className="h-6 w-6 text-red-500" />}
          />
        </div>
      </div>
    );
  };

  const renderPaymentsTab = () => {
    const { groups: itemGroups, sortedKeys: itemKeys } = groupDataByPeriod(ntItemsData);
    
    // Prepare data for charts
    const paidItemsData = itemKeys.map(key => itemGroups[key].filter(item => item.status === 'Pago').length);
    const pendingItemsData = itemKeys.map(key => itemGroups[key].filter(item => item.status === 'Ag. Pagamento').length);
    const partialItemsData = itemKeys.map(key => itemGroups[key].filter(item => item.status === 'Pago Parcial').length);
    
    // Calculate average payment time per period
    const avgPaymentTimeData = itemKeys.map(key => {
      const periodItems = itemGroups[key];
      const paidItems = periodItems.filter(item => 
        (item.status === 'Pago' || item.status === 'Pago Parcial') && item.payment_time
      );
      
      let totalMinutes = 0;
      let validItems = 0;
      
      paidItems.forEach(item => {
        try {
          const minutes = calculateTimeDifferenceInMinutes(
            item.created_date, 
            item.created_time, 
            item.created_date, // assuming payment on same day
            item.payment_time
          );
          
          if (!isNaN(minutes) && minutes >= 0) {
            totalMinutes += minutes;
            validItems++;
          }
        } catch (e) {
          console.error("Error calculating time difference:", e);
        }
      });
      
      return validItems > 0 ? Math.round(totalMinutes / validItems) : 0;
    });
    
    // Calculate payment rate within deadline
    const totalPaid = stats.paidItems + stats.partialItems;
    const onTimePaid = ntItemsData.filter(item => {
      if ((item.status !== 'Pago' && item.status !== 'Pago Parcial') || !item.payment_time) return false;
      
      try {
        const paymentTime = calculateTimeDifferenceInMinutes(
          item.created_date, 
          item.created_time, 
          item.created_date, 
          item.payment_time
        );
        return paymentTime <= 120; // 2 hours deadline
      } catch (e) {
        return false;
      }
    }).length;
    
    const overduePayments = totalPaid - onTimePaid;
    const onTimeRate = totalPaid > 0 ? Math.round((onTimePaid / totalPaid) * 100) : 100;
    const overdueRate = totalPaid > 0 ? Math.round((overduePayments / totalPaid) * 100) : 0;

    // Calculate payment time by shift
    const itemsByShift = {
      1: [], // 7:30-15:50
      2: [], // 15:50-23:20
      3: []  // 23:20-7:30
    };

    ntItemsData.forEach(item => {
      if ((item.status === 'Pago' || item.status === 'Pago Parcial') && item.payment_time) {
        try {
          const [hours, minutes] = item.created_time.split(':').map(Number);
          let shift;
          
          if ((hours >= 7 && hours < 16) || (hours === 16 && minutes <= 50)) {
            shift = 1;
          } else if ((hours >= 16 && hours < 24) || (hours === 15 && minutes >= 50)) {
            shift = 2;
          } else {
            shift = 3;
          }
          
          itemsByShift[shift].push(item);
        } catch (e) {
          console.error("Error calculating shift:", e);
        }
      }
    });
    
    const avgTimeByShift = Object.keys(itemsByShift).map(shift => {
      const shiftItems = itemsByShift[shift];
      let totalMinutes = 0;
      let validItems = 0;
      
      shiftItems.forEach(item => {
        try {
          const minutes = calculateTimeDifferenceInMinutes(
            item.created_date, 
            item.created_time, 
            item.created_date, 
            item.payment_time
          );
          
          if (!isNaN(minutes) && minutes >= 0) {
            totalMinutes += minutes;
            validItems++;
          }
        } catch (e) {
          console.error("Error calculating shift time:", e);
        }
      });
      
      return validItems > 0 ? Math.round(totalMinutes / validItems) : 0;
    });

    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Análise de Pagamentos</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Itens pagos vs. pendentes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Pagamentos por {periodName()}</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: itemKeys,
                  datasets: [
                    {
                      label: 'Pagos',
                      data: paidItemsData,
                      backgroundColor: 'rgba(16, 185, 129, 0.6)',
                      borderColor: 'rgb(16, 185, 129)',
                      borderWidth: 1
                    },
                    {
                      label: 'Aguardando',
                      data: pendingItemsData,
                      backgroundColor: 'rgba(239, 68, 68, 0.6)',
                      borderColor: 'rgb(239, 68, 68)',
                      borderWidth: 1
                    },
                    {
                      label: 'Parcial',
                      data: partialItemsData,
                      backgroundColor: 'rgba(245, 158, 11, 0.6)',
                      borderColor: 'rgb(245, 158, 11)',
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { stacked: true },
                    y: { stacked: true }
                  },
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Tempo médio de pagamento */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tempo médio de pagamento (minutos)</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: itemKeys,
                  datasets: [
                    {
                      label: 'Tempo médio (min)',
                      data: avgPaymentTimeData,
                      backgroundColor: 'rgba(59, 130, 246, 0.6)',
                      borderColor: 'rgb(59, 130, 246)',
                      tension: 0.1,
                      fill: false
                    },
                    {
                      label: 'Limite (120 min)',
                      data: Array(itemKeys.length).fill(120),
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      borderColor: 'rgb(239, 68, 68)',
                      borderDash: [5, 5],
                      tension: 0,
                      fill: false
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Taxa de pagamento a tempo */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Taxa de pagamento a tempo</h3>
            <div className="h-64">
              <Doughnut
                data={{
                  labels: ['No prazo', 'Em atraso'],
                  datasets: [
                    {
                      data: [onTimeRate, overdueRate],
                      backgroundColor: [
                        'rgba(16, 185, 129, 0.6)', // green
                        'rgba(239, 68, 68, 0.6)'   // red
                      ],
                      borderColor: [
                        'rgb(16, 185, 129)',
                        'rgb(239, 68, 68)'
                      ],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.label}: ${context.parsed}%`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Tempo médio por turno */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tempo médio por turno (minutos)</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: ['1º Turno (7:30-15:50)', '2º Turno (15:50-23:20)', '3º Turno (23:20-7:30)'],
                  datasets: [
                    {
                      label: 'Tempo médio (min)',
                      data: avgTimeByShift,
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.6)',
                        'rgba(124, 58, 237, 0.6)',
                        'rgba(16, 185, 129, 0.6)'
                      ],
                      borderColor: [
                        'rgb(59, 130, 246)',
                        'rgb(124, 58, 237)',
                        'rgb(16, 185, 129)'
                      ],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderServiceTimesTab = () => {
    const { groups: itemGroups, sortedKeys: itemKeys } = groupDataByPeriod(ntItemsData);
    
    // Calculate service times
    const avgServiceTimeData = itemKeys.map(key => {
      const items = itemGroups[key];
      let totalMinutes = 0;
      let validItems = 0;
      
      items.forEach(item => {
        if (item.status === 'Pago' || item.status === 'Pago Parcial') {
          try {
            const minutes = calculateTimeDifferenceInMinutes(
              item.created_date, 
              item.created_time, 
              item.created_date, 
              item.payment_time
            );
            
            if (!isNaN(minutes) && minutes >= 0) {
              totalMinutes += minutes;
              validItems++;
            }
          } catch (e) {
            console.error("Error calculating service time:", e);
          }
        }
      });
      
      return validItems > 0 ? Math.round(totalMinutes / validItems) : 0;
    });
    
    // Overdue vs on time items
    const overdueItemsData = itemKeys.map(key => {
      return itemGroups[key].filter(item => {
        if (item.status === 'Pago' || item.status === 'Pago Parcial') {
          try {
            const minutes = calculateTimeDifferenceInMinutes(
              item.created_date, 
              item.created_time, 
              item.created_date, 
              item.payment_time
            );
            return minutes > 120;
          } catch (e) {
            return false;
          }
        }
        return false;
      }).length;
    });
    
    const onTimeItemsData = itemKeys.map(key => {
      return itemGroups[key].filter(item => {
        if (item.status === 'Pago' || item.status === 'Pago Parcial') {
          try {
            const minutes = calculateTimeDifferenceInMinutes(
              item.created_date, 
              item.created_time, 
              item.created_date, 
              item.payment_time
            );
            return minutes <= 120;
          } catch (e) {
            return false;
          }
        }
        return false;
      }).length;
    });
    
    // Service time by shift
    const paidItemsByShift = {
      1: [], // 7:30-15:50
      2: [], // 15:50-23:20
      3: []  // 23:20-7:30
    };

    ntItemsData.forEach(item => {
      if ((item.status === 'Pago' || item.status === 'Pago Parcial') && item.payment_time) {
        try {
          const [hours, minutes] = item.created_time.split(':').map(Number);
          let shift;
          
          if ((hours >= 7 && hours < 16) || (hours === 16 && minutes <= 50)) {
            shift = 1;
          } else if ((hours >= 16 && hours < 24) || (hours === 15 && minutes >= 50)) {
            shift = 2;
          } else {
            shift = 3;
          }
          
          paidItemsByShift[shift].push(item);
        } catch (e) {
          console.error("Error calculating service shift:", e);
        }
      }
    });
    
    const serviceTimeByShift = Object.keys(paidItemsByShift).map(shift => {
      const items = paidItemsByShift[shift];
      let totalMinutes = 0;
      let validItems = 0;
      
      items.forEach(item => {
        try {
          const minutes = calculateTimeDifferenceInMinutes(
            item.created_date, 
            item.created_time, 
            item.created_date, 
            item.payment_time
          );
          
          if (!isNaN(minutes) && minutes >= 0) {
            totalMinutes += minutes;
            validItems++;
          }
        } catch (e) {
          console.error("Error calculating service shift time:", e);
        }
      });
      
      return validItems > 0 ? Math.round(totalMinutes / validItems) : 0;
    });

    // Overall service time compliance
    const totalPaid = stats.paidItems + stats.partialItems;
    const onTimePaid = ntItemsData.filter(item => {
      if ((item.status !== 'Pago' && item.status !== 'Pago Parcial') || !item.payment_time) return false;
      
      try {
        const paymentTime = calculateTimeDifferenceInMinutes(
          item.created_date, 
          item.created_time, 
          item.created_date, 
          item.payment_time
        );
        return paymentTime <= 120; // 2 hours deadline
      } catch (e) {
        return false;
      }
    }).length;
    
    const overdueService = totalPaid - onTimePaid;

    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Tempos de Atendimento</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tempo médio de resolução */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tempo médio de atendimento (minutos)</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: itemKeys,
                  datasets: [
                    {
                      label: 'Tempo médio (min)',
                      data: avgServiceTimeData,
                      backgroundColor: 'rgba(59, 130, 246, 0.6)',
                      borderColor: 'rgb(59, 130, 246)',
                      tension: 0.1,
                      fill: false
                    },
                    {
                      label: 'Limite (120 min)',
                      data: Array(itemKeys.length).fill(120),
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      borderColor: 'rgb(239, 68, 68)',
                      borderDash: [5, 5],
                      tension: 0,
                      fill: false
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Itens em atraso vs no prazo */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Itens no prazo vs. em atraso</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: itemKeys,
                  datasets: [
                    {
                      label: 'No prazo',
                      data: onTimeItemsData,
                      backgroundColor: 'rgba(16, 185, 129, 0.6)',
                      borderColor: 'rgb(16, 185, 129)',
                      borderWidth: 1
                    },
                    {
                      label: 'Em atraso',
                      data: overdueItemsData,
                      backgroundColor: 'rgba(239, 68, 68, 0.6)',
                      borderColor: 'rgb(239, 68, 68)',
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Média de atendimento por turno */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tempo médio por turno (minutos)</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: ['1º Turno (7:30-15:50)', '2º Turno (15:50-23:20)', '3º Turno (23:20-7:30)'],
                  datasets: [
                    {
                      label: 'Tempo médio (min)',
                      data: serviceTimeByShift,
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.6)',
                        'rgba(124, 58, 237, 0.6)',
                        'rgba(16, 185, 129, 0.6)'
                      ],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Percentual de atendimento no prazo */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Taxa de atendimento no prazo</h3>
            <div className="h-64">
              <Doughnut
                data={{
                  labels: ['No prazo', 'Em atraso'],
                  datasets: [
                    {
                      data: [
                        onTimePaid,
                        overdueService
                      ],
                      backgroundColor: [
                        'rgba(16, 185, 129, 0.6)', // green
                        'rgba(239, 68, 68, 0.6)'   // red
                      ],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRobotsTab = () => {
    const { groups: robotGroups, sortedKeys: robotKeys } = groupDataByPeriod(robotData);
    
    // Calculate robot stops by period
    const robotStopsData = robotKeys.map(key => robotGroups[key].length);
    
    // Calculate average downtime
    // This is an approximation as we don't have actual resolution times in all cases
    const avgDowntimeData = robotKeys.map(key => {
      const periodRobots = robotGroups[key];
      let totalMinutes = 0;
      let validAlerts = 0;
      
      periodRobots.forEach(alert => {
        if (alert.resolved_at) {
          const startTime = new Date(alert.created_at);
          const endTime = new Date(alert.resolved_at);
          const minutes = Math.round((endTime - startTime) / (1000 * 60));
          
          if (!isNaN(minutes) && minutes >= 0) {
            totalMinutes += minutes;
            validAlerts++;
          }
        } else if (alert.estimated_resolution) {
          // Use estimated resolution time if actual resolution not available
          const startTime = new Date(alert.created_at);
          const endTime = new Date(alert.estimated_resolution);
          const minutes = Math.round((endTime - startTime) / (1000 * 60));
          
          if (!isNaN(minutes) && minutes >= 0) {
            totalMinutes += minutes;
            validAlerts++;
          }
        }
      });
      
      return validAlerts > 0 ? Math.round(totalMinutes / validAlerts) : 0;
    });
    
    // Robot stops by robot number
    const robotNumbers = [...new Set(robotData.map(alert => alert.robot_number))];
    const stopsByRobot = robotNumbers.map(robotNumber => {
      return robotData.filter(alert => alert.robot_number === robotNumber).length;
    });
    
    // Downtime by robot
    const downtimeByRobot = robotNumbers.map(robotNumber => {
      const robotAlerts = robotData.filter(alert => alert.robot_number === robotNumber);
      let totalMinutes = 0;
      let validAlerts = 0;
      
      robotAlerts.forEach(alert => {
        if (alert.resolved_at) {
          const startTime = new Date(alert.created_at);
          const endTime = new Date(alert.resolved_at);
          const minutes = Math.round((endTime - startTime) / (1000 * 60));
          
          if (!isNaN(minutes) && minutes >= 0) {
            totalMinutes += minutes;
            validAlerts++;
          }
        } else if (alert.estimated_resolution) {
          const startTime = new Date(alert.created_at);
          const endTime = new Date(alert.estimated_resolution);
          const minutes = Math.round((endTime - startTime) / (1000 * 60));
          
          if (!isNaN(minutes) && minutes >= 0) {
            totalMinutes += minutes;
            validAlerts++;
          }
        }
      });
      
      return validAlerts > 0 ? Math.round(totalMinutes / validAlerts) : 0;
    });

    // Impact on service time
    let serviceTimeWithRobotStops = 0;
    let serviceTimeWithoutRobotStops = 0;
    
    // For each paid item, check if there was a robot alert in the previous X time
    ntItemsData.forEach(item => {
      if ((item.status === 'Pago' || item.status === 'Pago Parcial') && item.payment_time) {
        try {
          const paymentTime = calculateTimeDifferenceInMinutes(
            item.created_date, 
            item.created_time, 
            item.created_date, 
            item.payment_time
          );
          
          if (!isNaN(paymentTime) && paymentTime >= 0) {
            // Check if there was a robot alert before this item's creation
            const itemCreationTime = new Date(item.created_at);
            // Look for robot alerts in the 2 hours before item creation
            const twoHoursBefore = new Date(itemCreationTime.getTime() - 2 * 60 * 60 * 1000);
            
            const hadRobotIssue = robotData.some(alert => {
              const alertTime = new Date(alert.created_at);
              return alertTime >= twoHoursBefore && alertTime <= itemCreationTime;
            });
            
            if (hadRobotIssue) {
              serviceTimeWithRobotStops += paymentTime;
            } else {
              serviceTimeWithoutRobotStops += paymentTime;
            }
          }
        } catch (e) {
          console.error("Error calculating robot impact:", e);
        }
      }
    });
    
    const robodAffectedCount = ntItemsData.filter(item => {
      if ((item.status !== 'Pago' && item.status !== 'Pago Parcial') || !item.payment_time) return false;
      
      try {
        const itemCreationTime = new Date(item.created_at);
        const twoHoursBefore = new Date(itemCreationTime.getTime() - 2 * 60 * 60 * 1000);
        
        return robotData.some(alert => {
          const alertTime = new Date(alert.created_at);
          return alertTime >= twoHoursBefore && alertTime <= itemCreationTime;
        });
      } catch (e) {
        return false;
      }
    }).length;
    
    const robotsNotAffectedCount = (stats.paidItems + stats.partialItems) - robodAffectedCount;

    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Paradas de Robôs</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Número de paradas por período */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Paradas por {periodName()}</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: robotKeys,
                  datasets: [
                    {
                      label: 'Número de paradas',
                      data: robotStopsData,
                      backgroundColor: 'rgba(239, 68, 68, 0.6)',
                      borderColor: 'rgb(239, 68, 68)',
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Tempo médio de parada */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tempo médio de parada (minutos)</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: robotKeys,
                  datasets: [
                    {
                      label: 'Tempo médio (min)',
                      data: avgDowntimeData,
                      backgroundColor: 'rgba(245, 158, 11, 0.6)',
                      borderColor: 'rgb(245, 158, 11)',
                      tension: 0.1,
                      fill: false
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Paradas por robô */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Paradas por robô</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: robotNumbers.map(num => `Robô ${num}`),
                  datasets: [
                    {
                      label: 'Número de paradas',
                      data: stopsByRobot,
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.6)',
                        'rgba(124, 58, 237, 0.6)'
                      ],
                      borderColor: [
                        'rgb(59, 130, 246)',
                        'rgb(124, 58, 237)'
                      ],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          </div>

          {/* Impacto no atendimento */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Impacto no atendimento</h3>
            <div className="h-64">
              <Pie
                data={{
                  labels: ['Itens impactados por paradas', 'Itens sem impacto'],
                  datasets: [
                    {
                      data: [robodAffectedCount, robotsNotAffectedCount],
                      backgroundColor: [
                        'rgba(239, 68, 68, 0.6)',
                        'rgba(16, 185, 129, 0.6)'
                      ],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DocumentIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );

  const StatCard = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-0">
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        
        {/* Nearly full screen modal */}
        <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg shadow-xl w-full sm:w-11/12 lg:w-5/6 max-w-7xl mx-auto h-screen sm:h-5/6 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Análise de Desempenho</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Controls */}
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Período
                  </label>
                  <select
                    id="period-select"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  >
                    <option value="day">Diário</option>
                    <option value="month">Mensal</option>
                    <option value="year">Anual</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="date-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    De
                  </label>
                  <input
                    type="date"
                    id="date-start"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="date-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Até
                  </label>
                  <input
                    type="date"
                    id="date-end"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
              </div>
              
              <button
                onClick={loadAnalyticsData}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Atualizar Dados
              </button>

              <button
                onClick={generateExcelReport}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                disabled={generatingReport}
              >
                {generatingReport ? 'Gerando...' : 'Gerar Relatório Excel'}
              </button>
            </div>

            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-md mt-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 text-sm py-2 rounded ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`flex-1 text-sm py-2 rounded ${
                  activeTab === 'payments'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Pagamentos
              </button>
              <button
                onClick={() => setActiveTab('service')}
                className={`flex-1 text-sm py-2 rounded ${
                  activeTab === 'service'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Tempos de Atendimento
              </button>
              <button
                onClick={() => setActiveTab('robots')}
                className={`flex-1 text-sm py-2 rounded ${
                  activeTab === 'robots'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Paradas de Robôs
              </button>
            </div>
          </div>
          
          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando dados...</p>
                </div>
              </div>
            ) : (
              <div>
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'payments' && renderPaymentsTab()}
                {activeTab === 'service' && renderServiceTimesTab()}
                {activeTab === 'robots' && renderRobotsTab()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
