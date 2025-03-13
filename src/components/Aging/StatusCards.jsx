import { Card, Badge } from 'flowbite-react';
import { 
  HiExclamationCircle,
  HiExclamationTriangle,
  HiEye,
  HiCheckCircle,
  HiWrenchScrewdriver
} from 'react-icons/hi2';

export default function StatusCards({ stats, totalItems, adjustmentStats, handleStatusClick }) {
  const statusCards = [
    { 
      title: 'Crítico',
      subtitle: 'Materiais com prioridade alta',
      value: stats.critical, 
      percentage: ((stats.critical / totalItems) * 100).toFixed(1),
      type: 'critical', 
      icon: HiExclamationCircle,
      info: 'Materiais com mais de 20 dias em aging',
      color: 'failure',
      iconClass: 'text-red-500'
    },
    { 
      title: 'Alerta',
      subtitle: 'Materiais em observação',
      value: stats.warning, 
      percentage: ((stats.warning / totalItems) * 100).toFixed(1),
      type: 'warning', 
      icon: HiExclamationTriangle,
      info: 'Materiais entre 15-20 dias em aging',
      color: 'warning',
      iconClass: 'text-yellow-500'
    },
    { 
      title: 'Atenção',
      subtitle: 'Monitoramento necessário',
      value: stats.attention, 
      percentage: ((stats.attention / totalItems) * 100).toFixed(1),
      type: 'attention', 
      icon: HiEye,
      info: 'Materiais entre 10-15 dias em aging',
      color: 'warning',
      iconClass: 'text-orange-500'
    },
    { 
      title: 'Normal',
      subtitle: 'Dentro do prazo',
      value: stats.normal, 
      percentage: ((stats.normal / totalItems) * 100).toFixed(1),
      type: 'normal', 
      icon: HiCheckCircle,
      info: 'Materiais com menos de 10 dias em aging',
      color: 'success',
      iconClass: 'text-green-500'
    },
    { 
      title: 'Em Ajuste',
      subtitle: 'Necessitam revisão',
      value: adjustmentStats.total,
      percentage: adjustmentStats.percentage,
      type: 'adjustment', 
      icon: HiWrenchScrewdriver,
      info: 'Materiais em processo de ajuste',
      color: 'info',
      iconClass: 'text-blue-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {statusCards.map(card => (
        <Card
          key={card.type}
          className="hover:scale-105 transition-transform cursor-pointer"
          onClick={() => handleStatusClick(card.type)}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start">
              <div>
                <card.icon className={`w-8 h-8 mb-2 ${card.iconClass}`} />
                <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {card.title}
                </h5>
                <p className="font-normal text-gray-700 dark:text-gray-400 text-sm">
                  {card.subtitle}
                </p>
              </div>
              <Badge color={card.color} className="ml-2">
                {card.percentage}%
              </Badge>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </span>
              <span className={`text-sm ${
                card.trendUp ? 'text-green-600' : 'text-red-600'
              }`}>
                
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
