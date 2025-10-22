import React, { useState, useRef, useCallback } from 'react';

interface ImageSliderProps {
  beforeSrc: string;
  afterSrc: string;
  onSave?: () => void;
  onDownload?: () => void;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ beforeSrc, afterSrc, onSave, onDownload }) => {
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
    <div className="relative group">
      <h3 className="text-lg font-medium text-gray-300 mb-2 text-center">Compare Original vs. Edited</h3>
      <div 
        ref={containerRef}
        className="relative w-full aspect-square rounded-lg overflow-hidden select-none cursor-ew-resize"
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
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onSave && (
          <button
            onClick={onSave}
            className="bg-amber-500 text-white p-2 rounded-full shadow-lg hover:bg-amber-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label="Save to library"
            title="Save to library"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        )}
        {onDownload && (
          <button
            onClick={onDownload}
            className="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label="Download edited image"
            title="Download edited image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageSlider;
