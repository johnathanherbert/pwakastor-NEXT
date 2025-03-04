import { useState, useEffect } from 'react';

export function useChartAnimation(data, duration = 1000) {
  const [animatedData, setAnimatedData] = useState(
    data.map(item => ({ ...item, value: 0 }))
  );

  useEffect(() => {
    const stepSize = data.map(item => item.value / (duration / 16));
    let currentData = data.map(item => ({ ...item, value: 0 }));
    let frame = 0;

    const animate = () => {
      frame++;
      currentData = currentData.map((item, i) => ({
        ...item,
        value: Math.min(item.value + stepSize[i], data[i].value)
      }));

      setAnimatedData(currentData);

      if (frame < duration / 16) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [data, duration]);

  return animatedData;
}