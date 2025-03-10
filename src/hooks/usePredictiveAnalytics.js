import { useState, useEffect } from 'react';
import { differenceInDays } from 'date-fns';

export const usePredictiveAnalytics = (materials) => {
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    if (!materials.length) return;

    // Simple prediction based on current aging trends
    const predictNextDays = () => {
      const avgAgingRate = materials.reduce((acc, curr) => 
        acc + curr.daysInArea, 0) / materials.length;

      return Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        predicted: Math.round(avgAgingRate * (1 + (i * 0.1))),
        confidence: Math.round((1 - (i * 0.1)) * 100)
      }));
    };

    setPredictions(predictNextDays());
  }, [materials]);

  return predictions;
};
