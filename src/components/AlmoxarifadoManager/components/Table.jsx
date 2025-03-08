import { PlusCircleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { STATUS } from '../constants';

export const Table = ({ 
  materiaisFaltantes, 
  solicitacoes, 
  onAddSolicitacao, 
  onContextMenu, 
  onCellContextMenu 
}) => (
  <div className="overflow-x-auto rounded-xl ring-1 ring-gray-900/5 dark:ring-white/5">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-700/50">
          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Material</th>
          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Falta</th>
          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitações</th>
          <th scope="col" className="px-4 py-3 w-10"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {/* Table rows implementation here */}
      </tbody>
    </table>
  </div>
);
