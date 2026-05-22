"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MuralCanvasProps {
  imageUrl: string | null;
  rows: number;
  cols: number;
  overlap: number; // cm
  margins: number; // cm
  paperSize: string;
  showGuides: boolean;
}

export function MuralCanvas({ 
  imageUrl, 
  rows, 
  cols, 
  overlap, 
  margins, 
  paperSize, 
  showGuides 
}: MuralCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.8);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom(prev => Math.min(Math.max(0.1, prev - e.deltaY * 0.001), 5));
      }
    };
    const current = containerRef.current;
    current?.addEventListener("wheel", handleWheel, { passive: false });
    return () => current?.removeEventListener("wheel", handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!imageUrl) return null;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative flex-1 bg-[#f0f2f5] overflow-hidden flex items-center justify-center p-8 select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="relative flex items-center justify-center will-change-transform"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {/* Main Canvas Container */}
        <div className="relative shadow-2xl bg-white border-2 border-white rounded-sm overflow-hidden">
          <img 
            src={imageUrl} 
            alt="Mural asset" 
            className="max-h-[75vh] w-auto block pointer-events-none" 
            draggable={false}
          />
          
          {/* Real-time Grid Overlay */}
          <div className="absolute inset-0 grid pointer-events-none" 
               style={{ 
                 gridTemplateRows: `repeat(${rows}, 1fr)`,
                 gridTemplateColumns: `repeat(${cols}, 1fr)` 
               }}>
            {Array.from({ length: rows * cols }).map((_, i) => {
              const rowIdx = Math.floor(i / cols);
              const colIdx = i % cols;
              
              return (
                <div 
                  key={i} 
                  className={cn(
                    "relative",
                    showGuides ? "border-[2px] border-primary/80" : "border-0"
                  )}
                >
                  {showGuides && (
                    <>
                      {/* Panel ID Tag */}
                      <div className="absolute top-3 left-3 z-30">
                        <span className="text-xs font-black font-mono text-primary bg-white px-2 py-1 rounded shadow-md border border-primary/20">
                          {rowIdx + 1}-{colIdx + 1}
                        </span>
                      </div>
                      
                      {/* Visual representation of margins */}
                      <div 
                        className="absolute inset-0 border-black/5 opacity-10 pointer-events-none z-10"
                        style={{ borderWidth: `${margins * 4}px` }}
                      />

                      {/* Overlap Visualization (Right) */}
                      {colIdx < cols - 1 && (
                        <div 
                          className="absolute right-0 top-0 bottom-0 bg-accent/20 border-r-2 border-dashed border-accent/40 z-20"
                          style={{ width: `${overlap * 10}px`, maxWidth: '30%' }}
                        >
                          <div className="h-full w-full flex items-center justify-center">
                             <div className="rotate-90 text-[7px] font-black text-accent tracking-[0.2em] uppercase opacity-70">Solape</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Overlap Visualization (Bottom) */}
                      {rowIdx < rows - 1 && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-accent/20 border-b-2 border-dashed border-accent/40 z-20"
                          style={{ height: `${overlap * 10}px`, maxHeight: '30%' }}
                        >
                           <div className="h-full w-full flex items-center justify-center">
                             <div className="text-[7px] font-black text-accent tracking-[0.2em] uppercase opacity-70">Solape</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Info */}
      <div className="absolute top-6 left-6 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-border shadow-2xl flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Formato</span>
            <span className="text-sm font-black text-primary">{paperSize}</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Configuración</span>
            <span className="text-sm font-black text-primary">{rows}x{cols}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-border shadow-lg text-[10px] font-black font-mono text-primary/80">
        Control + Scroll: Zoom ({Math.round(zoom * 100)}%) | Arrastrar para mover
      </div>
    </div>
  );
}