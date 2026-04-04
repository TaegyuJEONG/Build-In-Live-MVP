"use client";

import { X, User, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Marker } from "@/liveblocks.config";

interface SnapshotOverlayProps {
  marker: Marker;
  onClose: () => void;
}

export function SnapshotOverlay({ marker, onClose }: SnapshotOverlayProps) {
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (!marker.screenshotUrl) return null;

  const handleCopySelector = () => {
    if (marker.selector) {
      navigator.clipboard.writeText(marker.selector);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-start md:justify-center p-6 md:p-8 animate-in fade-in duration-300 pointer-events-auto overflow-y-auto overflow-x-hidden">
      {/* Close Button Top Right */}
      <div className="absolute top-6 right-8 z-20">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#1A1A1A]/80 hover:bg-white/10 flex items-center justify-center text-white transition-all border-2 border-white/30 shadow-xl"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Unified Content Wrapper */}
      <div className="flex flex-col items-center gap-8 max-w-full h-fit md:max-h-full mt-12 md:mt-0">
        {/* Snapshot Image with Marker Wrapper */}
        <div className="relative flex-none">
        <div className="relative shadow-2xl rounded-lg overflow-hidden border border-white/10 bg-black/40">
        <img 
          src={marker.screenshotUrl} 
          alt="Snapshot"
          className="max-w-[95vw] max-h-[82vh] object-contain block shadow-2xl"
        />
        
        {/* The Exact Marker on the Snapshot - Matches Dashboard Style */}
        <div 
          className="absolute w-10 h-10 rounded-full border-4 border-white shadow-[0_0_20px_rgba(0,0,0,0.5)] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center overflow-hidden z-20"
          style={{ 
            left: `${marker.xPercent}%`, 
            top: `${marker.yPercent}%`,
            backgroundColor: marker.authorColor || '#F95A56'
          }}
        >
          {marker.author === "Anonymous" ? (
            <User className="w-6 h-6 text-white/90" />
          ) : (
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(marker.author)}&background=random`} 
              alt={marker.author}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div 
          className="absolute w-20 h-20 rounded-full border-2 border-white/20 transform -translate-x-1/2 -translate-y-1/2 animate-ping duration-1000 opacity-20 pointer-events-none"
          style={{ 
            left: `${marker.xPercent}%`, 
            top: `${marker.yPercent}%`
          }}
        />
        </div> 
      </div>

      {/* Footer Info - Responsive Grid */}
      <div className="flex-none flex flex-col items-center gap-2 mt-auto md:mt-0 pb-6 md:pb-0">
        <div className="bg-[#1F1F1F] p-4 md:px-5 md:py-3 rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-8 max-w-[95vw]">
          {/* Path Section */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[#F95A56] text-[10px] uppercase tracking-widest font-bold">Path</span>
            <span className="text-white text-xs font-medium">{marker.pathname || '/'}</span>
          </div>

          <div className="hidden md:block w-px h-4 bg-white/10 shrink-0" />
          <div className="md:hidden w-full h-[1px] bg-white/5" />

          {/* Selector Section */}
          <div className="flex items-center gap-3 min-w-0 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[#F95A56] text-[10px] uppercase tracking-widest font-bold shrink-0">Selector</span>
              <span className="text-white/60 text-[11px] font-mono whitespace-nowrap overflow-x-auto scrollbar-hide max-w-[150px] md:max-w-[400px]">
                {marker.selector || 'N/A'}
              </span>
            </div>
            <button 
              onClick={handleCopySelector}
              className="flex-none p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-[#F95A56] transition-all"
              title="Copy Selector"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="hidden md:block w-px h-4 bg-white/10 shrink-0" />
          <div className="md:hidden w-full h-[1px] bg-white/5" />

          {/* Position Section */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[#F95A56] text-[10px] uppercase tracking-widest font-bold">Position</span>
            <div className="flex items-center gap-1.5">
              <span className="text-white text-xs font-medium">{Math.round(marker.xPercent || 0)}%</span>
              <span className="text-white/20 text-[10px]">X</span>
              <span className="text-white/40 mx-1">/</span>
              <span className="text-white text-xs font-medium">{Math.round(marker.yPercent || 0)}%</span>
              <span className="text-white/20 text-[10px]">Y</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
