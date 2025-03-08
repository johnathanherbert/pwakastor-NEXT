import { PlusCircleIcon } from '@heroicons/react/24/outline';

export const Header = () => (
  <div className="p-4 flex items-center gap-3">
    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center">
      <PlusCircleIcon className="h-5 w-5 text-white" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
        Gerenciamento de Solicitações
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Almoxarifado
      </p>
    </div>
  </div>
);
