import React, { useRef, useEffect, useState, useCallback } from 'react';

interface MaskingCanvasProps {
  imageSrc: string;
  onSave: (maskDataUrl: string) => void;
  onCancel: () => void;
}

const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

interface Transform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const MaskingCanvas: React.FC<MaskingCanvasProps> = ({ imageSrc, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<{ stack: ImageData[], index: number }>({ stack: [], index: -1 });

  const [brushSize, setBrushSize] = useState(40);
  const [isErasing, setIsErasing] = useState(false);
  const [transform, setTransform] = useState<Transform>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [brushShape, setBrushShape] = useState<'circle' | 'square'>('circle');
  const [brushOpacity, setBrushOpacity] = useState(0.5);
  const [historyControls, setHistoryControls] = useState({ canUndo: false, canRedo: false });
  
  const updateHistoryControls = useCallback(() => {
    const { stack, index } = historyRef.current;
    setHistoryControls({
      canUndo: index > 0,
      canRedo: index < stack.length - 1,
    });
  }, []);

  const saveHistory = useCallback(() => {
    if (!canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    
    const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const { stack, index } = historyRef.current;
    
    // If we have undone, we need to remove the future states
    const newStack = stack.slice(0, index + 1);
    
    newStack.push(imageData);
    historyRef.current = {
      stack: newStack,
      index: newStack.length - 1,
    };
    updateHistoryControls();
  }, [updateHistoryControls]);

  const resetView = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;
    
    const { naturalWidth, naturalHeight } = imageRef.current;
    if (naturalWidth === 0 || naturalHeight === 0) return;

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();

    const scaleX = containerWidth / naturalWidth;
    const scaleY = containerHeight / naturalHeight;
    const initialScale = Math.min(scaleX, scaleY, 1); // Don't scale up initially
    
    setTransform({
        scale: initialScale,
        offsetX: (containerWidth - naturalWidth * initialScale) / 2,
        offsetY: (containerHeight - naturalHeight * initialScale) / 2,
    });
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = canvasRef.current;
      if (imageRef.current) {
          imageRef.current.src = image.src;
      }
      if (canvas) {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (context) {
          // Clear history and save the initial blank state
          const initialImageData = context.getImageData(0, 0, canvas.width, canvas.height);
          historyRef.current = { stack: [initialImageData], index: 0 };
          updateHistoryControls();
        }
      }
      resetView();
    };
    
    window.addEventListener('resize', resetView);
    return () => window.removeEventListener('resize', resetView);
  }, [imageSrc, resetView, updateHistoryControls]);
  
  const getTransformedPoint = useCallback((clientX: number, clientY: number): { x: number, y: number } | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = (clientX - rect.left - transform.offsetX) / transform.scale;
    const canvasY = (clientY - rect.top - transform.offsetY) / transform.scale;
    return { x: canvasX, y: canvasY };
  }, [transform]);

  const drawLine = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    
    context.save();
    context.lineJoin = brushShape === 'circle' ? 'round' : 'square';
    context.lineCap = brushShape === 'circle' ? 'round' : 'square';
    context.lineWidth = brushSize / transform.scale;
    
    context.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    
    // For eraser, we need full opacity to 'cut out' the mask.
    // For drawing, we use the user-defined opacity.
    context.strokeStyle = isErasing ? 'rgba(0,0,0,1)' : `rgba(236, 72, 153, ${brushOpacity})`;

    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
    context.restore();
  }, [brushSize, isErasing, transform.scale, brushShape, brushOpacity]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (isPanningRef.current) {
        lastPointRef.current = { x: e.clientX, y: e.clientY };
    } else {
        isDrawingRef.current = true;
        const point = getTransformedPoint(e.clientX, e.clientY);
        if(point) {
            lastPointRef.current = point;
            drawLine(point.x, point.y, point.x, point.y);
        }
    }
  }, [getTransformedPoint, drawLine]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (isPanningRef.current && lastPointRef.current) {
      const dx = e.clientX - lastPointRef.current.x;
      const dy = e.clientY - lastPointRef.current.y;
      setTransform(t => ({ ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }));
      lastPointRef.current = { x: e.clientX, y: e.clientY };
    } else if (isDrawingRef.current) {
      const currentPoint = getTransformedPoint(e.clientX, e.clientY);
      if (lastPointRef.current && currentPoint) {
        drawLine(lastPointRef.current.x, lastPointRef.current.y, currentPoint.x, currentPoint.y);
        lastPointRef.current = currentPoint;
      }
    }
  }, [getTransformedPoint, drawLine]);

  const handlePointerUp = useCallback(() => {
    if (isDrawingRef.current) {
      saveHistory();
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, [saveHistory]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const { clientX, clientY, deltaY } = e;
    const zoomFactor = 1.1;
    const newScale = deltaY < 0 ? transform.scale * zoomFactor : transform.scale / zoomFactor;

    if (newScale < MIN_SCALE || newScale > MAX_SCALE) return;

    const rect = containerRef.current!.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const newOffsetX = mouseX - (mouseX - transform.offsetX) * (newScale / transform.scale);
    const newOffsetY = mouseY - (mouseY - transform.offsetY) * (newScale / transform.scale);
    
    setTransform({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
  }, [transform]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isPanningRef.current) {
        e.preventDefault();
        isPanningRef.current = true;
        if(containerRef.current) containerRef.current.style.cursor = 'grab';
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        isPanningRef.current = false;
        lastPointRef.current = null;
        if(containerRef.current) containerRef.current.style.cursor = 'crosshair';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // handleUndo/Redo are stable due to useCallback wrapping them outside
  
  const handleZoom = (direction: 'in' | 'out') => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const fakeEvent = { clientX: width / 2, clientY: height / 2, deltaY: direction === 'in' ? -100 : 100, preventDefault: () => {} } as React.WheelEvent;
    handleWheel(fakeEvent);
  };

  const handleUndo = useCallback(() => {
    const { stack, index } = historyRef.current;
    if (index > 0) {
      const newIndex = index - 1;
      const context = canvasRef.current?.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        context.putImageData(stack[newIndex], 0, 0);
      }
      historyRef.current.index = newIndex;
      updateHistoryControls();
    }
  }, [updateHistoryControls]);

  const handleRedo = useCallback(() => {
    const { stack, index } = historyRef.current;
    if (index < stack.length - 1) {
      const newIndex = index + 1;
      const context = canvasRef.current?.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        context.putImageData(stack[newIndex], 0, 0);
      }
      historyRef.current.index = newIndex;
      updateHistoryControls();
    }
  }, [updateHistoryControls]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      saveHistory();
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative w-full aspect-square bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center overflow-hidden touch-none"
        style={{ cursor: isPanningRef.current ? 'grab' : 'crosshair' }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div style={{ transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`, transformOrigin: 'top left' }}>
            <img
                ref={imageRef}
                alt="Original for masking"
                className="pointer-events-none select-none max-w-none max-h-none"
                crossOrigin="anonymous"
            />
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0"
            />
        </div>
      </div>
       <div className="bg-gray-800 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => handleZoom('in')} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600" title="Zoom In">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </button>
                    <button onClick={() => handleZoom('out')} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600" title="Zoom Out">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                    </button>
                    <button onClick={resetView} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600" title="Reset View">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleUndo} disabled={!historyControls.canUndo} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50" title="Undo (Ctrl+Z)">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8a5 5 0 015 5v1" /></svg>
                  </button>
                  <button onClick={handleRedo} disabled={!historyControls.canRedo} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50" title="Redo (Ctrl+Y)">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 15l3-3m0 0l-3-3m3 3H5a5 5 0 00-5 5v1" /></svg>
                  </button>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs">
                 <div className="text-gray-300 font-mono bg-gray-900 px-2 py-1 rounded">
                    {Math.round(transform.scale * 100)}%
                </div>
                <div className="text-gray-400">
                    Hold <kbd className="font-mono text-gray-300 bg-gray-900 px-1.5 py-0.5 rounded">Space</kbd> to pan
                </div>
            </div>
            
            <div className="border-t border-gray-700 pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                  <button onClick={() => setIsErasing(false)} className={`py-2 rounded-md transition-colors ${!isErasing ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Draw</button>
                  <button onClick={() => setIsErasing(true)} className={`py-2 rounded-md transition-colors ${isErasing ? 'bg-pink-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Erase</button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-300 w-14 shrink-0">Shape:</span>
                <div className="flex-grow grid grid-cols-2 gap-1 rounded-md bg-gray-900 p-1">
                  <button onClick={() => setBrushShape('circle')} className={`px-2 py-1 rounded-md transition-colors text-xs ${brushShape === 'circle' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}>Circle</button>
                  <button onClick={() => setBrushShape('square')} className={`px-2 py-1 rounded-md transition-colors text-xs ${brushShape === 'square' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}>Square</button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                  <label htmlFor="brushSize" className="text-sm font-medium text-gray-300 w-12 shrink-0">Size:</label>
                  <input id="brushSize" type="range" min="5" max="150" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
              </div>

              <div className="flex items-center gap-3">
                  <label htmlFor="brushOpacity" className="text-sm font-medium text-gray-300 w-12 shrink-0">Opacity:</label>
                  <input id="brushOpacity" type="range" min="0.1" max="1" step="0.05" value={brushOpacity} onChange={(e) => setBrushOpacity(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" disabled={isErasing} />
              </div>
            </div>

             <div className="border-t border-gray-700 pt-3 grid grid-cols-3 gap-2">
                <button onClick={handleClear} className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600">Clear</button>
                <button onClick={onCancel} className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm rounded-md bg-green-600 hover:bg-green-700 text-white">Save Mask</button>
            </div>
       </div>
    </div>
  );
};

export default MaskingCanvas;
