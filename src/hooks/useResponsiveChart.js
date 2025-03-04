import { useState, useEffect } from 'react';

export function useResponsiveChart(defaultHeight = 300) {
  const [dimensions, setDimensions] = useState({ width: 0, height: defaultHeight });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = width < 768 ? defaultHeight * 0.8 : defaultHeight;
      setDimensions({ width, height });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [defaultHeight]);

  return dimensions;
}