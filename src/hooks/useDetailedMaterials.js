import { useMemo } from 'react';

export const useDetailedMaterials = (materials) => {
  return useMemo(() => {
    const adjustmentLots = materials
      .filter(m => m.tipo_estoque === 'S')
      .sort((a, b) => b.daysInArea - a.daysInArea);

    const regularLots = materials
      .filter(m => m.tipo_estoque !== 'S')
      .sort((a, b) => b.daysInArea - a.daysInArea);

    const byStatus = {
      critical: materials.filter(m => m.status === 'critical'),
      warning: materials.filter(m => m.status === 'warning'),
      attention: materials.filter(m => m.status === 'attention'),
      normal: materials.filter(m => m.status === 'normal')
    };

    return {
      adjustmentLots,
      regularLots,
      byStatus,
      oldestAdjustment: adjustmentLots[0],
      oldestRegular: regularLots[0]
    };
  }, [materials]);
};
