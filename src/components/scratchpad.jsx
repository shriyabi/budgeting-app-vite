import React, { useState, useEffect, useRef } from 'react';

const ScratchpadWidget = ({ isOpen, onClose, value, onChange, isCalcOpen }) => {
  const [offset, setOffset] = useState({ right: 20, bottom: 20 });
  const [size, setSize] = useState({ width: 300, height: 250 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0, initialRight: 0, initialBottom: 0 });
  const resizeStart = useRef({ x: 0, y: 0, initialWidth: 0, initialHeight: 0 });

  // bump scratchpad up if calculator is open
  useEffect(() => {
    if (isCalcOpen) {
      const timer = setTimeout(() => {
        setOffset(prev => prev.bottom < 400 ? { ...prev, bottom: 420 } : prev);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isCalcOpen]);

  const handleStart = (e, type) => {
    if (e.type === 'touchstart') {
      //allow touch 
    } else {
      e.preventDefault();
    }

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    if (type === 'drag') {
      setIsDragging(true);
      dragStart.current = {
        x: clientX,
        y: clientY,
        initialRight: offset.right,
        initialBottom: offset.bottom
      };
    } else if (type === 'resize') {
      setIsResizing(true);
      resizeStart.current = {
        x: clientX,
        y: clientY,
        initialWidth: size.width,
        initialHeight: size.height
      };
    }
  };

  // --- GLOBAL MOVE LISTENER ---
  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging && !isResizing) return;

      // Prevent scrolling on mobile while dragging
      if (e.type === 'touchmove') {
        e.preventDefault();
      }

      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        // Inverted delta because we are moving 'right' and 'bottom' values
        const dx = dragStart.current.x - clientX; 
        const dy = dragStart.current.y - clientY;
        
        setOffset({
          right: Math.max(0, dragStart.current.initialRight + dx),
          bottom: Math.max(0, dragStart.current.initialBottom + dy)
        });
      }

      if (isResizing) {
        const dx = resizeStart.current.x - clientX; 
        const dy = resizeStart.current.y - clientY;

        setSize({
          width: Math.max(200, resizeStart.current.initialWidth + dx),
          height: Math.max(150, resizeStart.current.initialHeight + dy)
        });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isResizing]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[200] flex flex-col" 
      style={{ 
        right: `${offset.right}px`, 
        bottom: `${offset.bottom}px`, 
        width: `${size.width}px`, 
        height: `${size.height}px`,
        touchAction: 'none', 
        transition: isDragging || isResizing ? 'none' : 'bottom 0.3s ease-in-out' 
      }}
    >
      <div 
        onMouseDown={(e) => handleStart(e, 'drag')}
        onTouchStart={(e) => handleStart(e, 'drag')}
        className="bg-gray-100 dark:bg-gray-900 px-3 py-3.5 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider pl-2 pointer-events-none">
          Scratchpad
        </span>
        <button 
          onClick={onClose} 
          onMouseDown={(e) => e.stopPropagation()} 
          onTouchStart={(e) => e.stopPropagation()}
          className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 cursor-pointer text-lg leading-none"
        >
          ✕
        </button>
      </div>

      <textarea 
        className="flex-1 w-full p-4 bg-white dark:bg-gray-800 border-none resize-none font-mono focus:ring-0 text-gray-700 dark:text-gray-200 text-sm font-medium focus:outline-none select-text mb-6" // Added mb-6 for space above resize handle
        placeholder="Type quick notes here..." 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        style={{ touchAction: 'auto' }}
      />

      <div 
        onMouseDown={(e) => handleStart(e, 'resize')}
        onTouchStart={(e) => handleStart(e, 'resize')}
        className="absolute bottom-0 left-0 w-8 h-8 cursor-nesw-resize flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-emerald-500 hover:scale-110 transition-all z-50 bg-white dark:bg-gray-800 rounded-tr-xl touch-none"
        title="Resize"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 transform scale-x-[-1] pointer-events-none">
          <path d="M22 22H2V20H22V22ZM22 18H6V16H22V18ZM22 14H10V12H22V14Z" />
        </svg>
      </div>
    </div>
  );
};

export default ScratchpadWidget;