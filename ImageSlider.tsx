import React, { useState, useRef, useCallback } from 'react';

const ImageSlider: React.FC<{ beforeSrc: string; afterSrc: string }> = ({ beforeSrc, afterSrc }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, []);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };
  
  const handleTouchStart = () => {
      setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
      setIsDragging(false);
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-300 mb-2 text-center">Compare Original vs. Edited</h3>
      <div 
        ref={containerRef}
        className="relative w-full aspect-square rounded-lg overflow-hidden select-none cursor-ew-resize group"
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        <img
          src={beforeSrc}
          alt="Original"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
        <div
          className="absolute inset-0 w-full h-full object-contain overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={afterSrc}
            alt="Edited"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        </div>
        <div
          className="absolute inset-y-0 bg-white/50 w-1 cursor-ew-resize pointer-events-none transition-opacity opacity-50 group-hover:opacity-100"
          style={{ left: `${sliderPosition}%` }}
        >
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 pointer-events-auto cursor-ew-resize"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
           >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSlider;
