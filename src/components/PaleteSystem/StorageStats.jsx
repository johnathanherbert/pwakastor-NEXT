import React from 'react';
import { Card, Badge } from 'flowbite-react';
import { HiTrendingUp, HiClock, HiChevronDown } from 'react-icons/hi';

export const StorageStats = ({ roomStats, topMaterials, expiredPallets, onExpiredPalletClick, onTopMaterialClick }) => {
  // Limitando a 4 resultados para cada seção
  const limitedTopMaterials = topMaterials?.slice(0, 4) || [];
  const limitedExpiredPallets = expiredPallets?.slice(0, 4) || [];

  // Verificar se há mais itens além dos exibidos
  const hasMoreMaterials = topMaterials?.length > 4;
  const hasMoreExpiredPallets = expiredPallets?.length > 4;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Estatísticas de Ocupação */}
      <Card className="overflow-hidden">
        <h5 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Ocupação
        </h5>
        <div className="space-y-3">
          {roomStats && roomStats.length > 0 ? (
            roomStats.map((room) => (
              <div key={room.id} className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {room.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {room.occupied}/{room.total} ({Math.round(room.percentage)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      room.percentage > 80 ? 'bg-red-500 dark:bg-red-600' 
                      : room.percentage > 50 ? 'bg-yellow-400 dark:bg-yellow-500' 
                      : 'bg-green-500 dark:bg-green-600'
                    }`}
                    style={{ width: `${room.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sem salas.
            </p>
          )}
        </div>
      </Card>

      {/* Top Materiais */}
      <Card className="overflow-hidden flex flex-col">
        <h5 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center">
          <HiTrendingUp className="mr-2 h-5 w-5 text-blue-500 dark:text-blue-400" />
          Materiais Frequentes
          {hasMoreMaterials && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              (4 de {topMaterials.length})
            </span>
          )}
        </h5>
        
        <div className="flex-1 overflow-y-auto max-h-[250px] pr-1 space-y-2" id="materials-scroll-container">
          {topMaterials && topMaterials.length > 0 ? (
            topMaterials.map((material, index) => (
              <div 
                key={material.code || index} 
                className="flex justify-between items-center p-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border border-gray-100 dark:border-gray-700"
                onClick={() => onTopMaterialClick && onTopMaterialClick(material)}
                title="Filtrar por material"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {material.name || "Sem nome"}
                    </p>
                    {material.code && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Cód: {material.code}
                      </p>
                    )}
                  </div>
                </div>
                <Badge 
                  color="info" 
                  className="whitespace-nowrap ml-2 font-semibold"
                  size="sm"
                >
                  {material.count} {material.count === 1 ? 'palete' : 'paletes'}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sem paletes.
              </p>
            </div>
          )}
        </div>
        
        {hasMoreMaterials && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-center">
            <button 
              onClick={() => document.querySelector('#materials-scroll-container').scrollTo({ top: 9999, behavior: 'smooth' })}
              className="text-xs text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto py-1"
            >
              Ver mais <HiChevronDown className="ml-1 h-3 w-3" />
            </button>
          </div>
        )}
      </Card>

      {/* Expirados */}
      <Card className="overflow-hidden flex flex-col bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-gray-800/95">
        <h5 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center">
          <HiClock className="mr-2 h-5 w-5 text-red-500 dark:text-red-400" />
          Holding Time &gt;20d
          {hasMoreExpiredPallets && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              (4 de {expiredPallets.length})
            </span>
          )}
        </h5>
        
        <div className="flex-1 overflow-y-auto max-h-[250px] pr-1 space-y-2" id="expired-scroll-container">
          {expiredPallets && expiredPallets.length > 0 ? (
            expiredPallets.map((pallet) => (
              <div 
                key={pallet.id} 
                className="flex justify-between items-center p-2.5 rounded-lg hover:bg-red-100/80 dark:hover:bg-red-900/30 cursor-pointer transition-colors border border-red-100 dark:border-red-800/40 bg-white/80 dark:bg-gray-800/80 shadow-sm"
                onClick={() => onExpiredPalletClick && onExpiredPalletClick(pallet)}
                title="Localizar palete"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-red-400/20 dark:bg-red-500/30 rounded-full animate-ping opacity-75" style={{animationDuration: '3s'}}></div>
                    <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-bold text-sm border-2 border-red-200 dark:border-red-700/50">
                      {pallet.days}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                        <span className="font-medium">OP:</span> 
                        <span className="ml-1">{pallet.current_op || "N/A"}</span>
                      </p>
                      <Badge 
                        color="failure" 
                        size="xs"
                        className="whitespace-nowrap text-xs px-1.5 py-0.5 ml-1"
                      >
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5 font-medium">
                      {pallet.material_name || "S/ material"}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-0.5">
                      +{pallet.days - 20}d expirado
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-green-100 dark:border-green-900/30">
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
              <p className="text-sm font-medium">
                Nenhum palete expirado
              </p>
              <p className="text-xs mt-1 text-green-600 dark:text-green-400">
                Todos dentro do prazo
              </p>
            </div>
          )}
        </div>
        
        {hasMoreExpiredPallets && (
          <div className="mt-2 pt-2 border-t border-red-100 dark:border-red-800/30 text-center">
            <button 
              onClick={() => document.querySelector('#expired-scroll-container').scrollTo({ top: 9999, behavior: 'smooth' })}
              className="text-xs text-red-600 dark:text-red-400 flex items-center justify-center mx-auto py-1"
            >
              Ver mais <HiChevronDown className="ml-1 h-3 w-3" />
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};