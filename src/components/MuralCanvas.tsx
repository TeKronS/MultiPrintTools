"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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

const PAPER_RATIOS: Record<string, number> = {
  'A4': 210 / 297,
  'A3': 297 / 420,
  'Letter': 215.9 / 279.4,
  'Legal': 215.9 / 355.6
};

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

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom(prev => Math.min(Math.max(0.1, prev - e.deltaY * 0.001), 3));
      }
    };
    const current = containerRef.current;
    current?.addEventListener("wheel", handleWheel, { passive: false });
    return () => current?.removeEventListener("wheel", handleWheel);
  }, []);

  if (!imageUrl) return null;

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 bg-[#f8f9fa] overflow-hidden flex items-center justify-center p-8"
    >
      <div 
        className="relative transition-transform duration-300 ease-out flex items-center justify-center"
        style={{ transform: `scale(${zoom})` }}
      >
        {/* Simulación del área total del mural sobre la pared */}
        <div className="relative shadow-2xl bg-white border border-border">
          <img 
            src={imageUrl} 
            alt="Mural asset" 
            className="max-h-[70vh] w-auto block select-none" 
          />
          
          {/* Grid Overlay Dinámico */}
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
                    "relative border-primary/20",
                    showGuides ? "border" : "border-0"
                  )}
                >
                  {showGuides && (
                    <>
                      {/* Identificador de panel */}
                      <span className="absolute top-2 left-2 text-[10px] font-bold font-mono text-primary bg-white/90 px-2 py-0.5 rounded shadow-sm z-20 border border-primary/10">
                        {rowIdx + 1}-{colIdx + 1}
                      </span>
                      
                      {/* Visualización de Márgenes (Simulado en los bordes externos de cada panel) */}
                      <div 
                        className="absolute inset-0 border-white/60 pointer-events-none"
                        style={{ borderWidth: `${margins * 4}px` }}
                      />

                      {/* Visualización de Solapamiento (Overlap) */}
                      {/* Derecha */}
                      {colIdx < cols - 1 && (
                        <div 
                          className="absolute right-0 top-0 bottom-0 bg-accent/20 border-r border-dashed border-accent/40 z-10"
                          style={{ width: `${overlap * 10}px`, maxWidth: '25%' }}
                        >
                          <div className="h-full w-full flex items-center justify-center">
                             <div className="rotate-90 text-[8px] font-bold text-accent/60 whitespace-nowrap">SOLAPE</div>
                          </div>
                        </div>
                      )}
                      {/* Abajo */}
                      {rowIdx < rows - 1 && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-accent/20 border-b border-dashed border-accent/40 z-10"
                          style={{ height: `${overlap * 10}px`, maxHeight: '25%' }}
                        >
                           <div className="h-full w-full flex items-center justify-center">
                             <div className="text-[8px] font-bold text-accent/60">SOLAPE</div>
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

      {/* Floating UI Hints */}
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border shadow-sm flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Papel</span>
            <span className="text-xs font-black text-primary">{paperSize}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Márgenes</span>
            <span className="text-xs font-black text-primary">{margins}cm</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border shadow-sm text-[10px] font-black font-mono text-muted-foreground">
        ZOOM: {Math.round(zoom * 100)}% (Ctrl + Scroll)
      </div>
    </div>
  );
}
