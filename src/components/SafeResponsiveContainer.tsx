import React, { useState, useEffect, useRef } from "react";
import { ResponsiveContainer } from "recharts";

interface SafeResponsiveContainerProps {
  children: React.ReactElement;
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  minHeight?: number;
  debounce?: number;
  id?: string;
}

export default function SafeResponsiveContainer({
  children,
  width = "100%",
  height = "100%",
  minWidth = 0,
  minHeight = 300,
  debounce = 50,
  id,
}: SafeResponsiveContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Fast bounds resolution check for pre-mounted/cached nodes
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: rect.width, height: rect.height });
      setIsReady(true);
    }

    let timeoutId: NodeJS.Timeout;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: newWidth, height: newHeight } = entries[0].contentRect;
      
      // Debounce the resizing to avoid multiple super-fast visual layout updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (newWidth > 0 && newHeight > 0) {
          setDimensions({ width: newWidth, height: newHeight });
          setIsReady(true);
        } else {
          setIsReady(false);
        }
      }, debounce);
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [debounce]);

  return (
    <div
      ref={containerRef}
      id={id}
      className="w-full relative"
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        minWidth: typeof minWidth === "number" ? `${minWidth}px` : minWidth,
        minHeight: `${minHeight}px`,
      }}
    >
      {isReady && dimensions.width > 0 && dimensions.height > 0 ? (
        <ResponsiveContainer
          width={dimensions.width}
          height={dimensions.height}
        >
          {children}
        </ResponsiveContainer>
      ) : (
        // Visual luxury loading skeleton corresponding to a loading canvas
        <div 
          className="w-full h-full bg-slate-100/50 dark:bg-slate-800/10 rounded-2xl animate-pulse flex items-center justify-center border border-gray-100/10"
          style={{ minHeight: `${minHeight}px` }}
        >
          <span className="text-[10px] uppercase font-mono text-gray-400 dark:text-slate-500 tracking-wider">
            Resolving active canvas node...
          </span>
        </div>
      )}
    </div>
  );
}
