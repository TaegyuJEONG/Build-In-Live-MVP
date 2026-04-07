"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Project } from "@/app/desk/page";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonitorProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  viewMode: "screenshots" | "live" | "demo";
}

const Monitor: React.FC<MonitorProps> = ({ 
  projects, 
  selectedProjectId, 
  onSelectProject,
  viewMode 
}) => {
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Update carousel when project changes
  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, selectedProjectId]);

  return (
    <div className="relative w-full max-w-3xl mx-auto group">
      {/* Project Logo Carousel (Minimalist Tabs) */}
      <div className="flex gap-2 mb-3">
        {projects.map((project) => (
            <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={cn(
              "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300",
              selectedProjectId === project.id 
                ? "bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.4)] -translate-y-0.5" 
                : "bg-white/10 text-white/40 hover:bg-white/20 hover:text-white"
            )}
          >
            {project.name}
          </button>
        ))}
      </div>

      {/* Main Monitor Body - White Plastic */}
      <div className="relative rounded-[1.5rem] border-[6px] border-[#f8f8f8] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_-2px_6px_rgba(0,0,0,0.05)] overflow-hidden aspect-[16/9.5] p-3">
        {/* Anti-Glare / Reflection Overlay */}
        <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-br from-white/15 via-transparent to-transparent"></div>
        
        {/* Screen Bezel / Inner Shadow */}
        <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_15px_rgba(0,0,0,0.3)] rounded-xl"></div>

        {/* Content Area */}
        <div className={cn(
          "relative w-full h-full rounded-xl overflow-hidden bg-black/95 transition-all duration-700 text-white",
          viewMode === "live" ? "p-0.5 border-[4px] border-[#F95A56] shadow-[0_0_50px_rgba(249,90,86,0.5)] animate-pulse-glow" : "border border-black/10"
        )}>
          {viewMode === "screenshots" ? (
            <div className="w-full h-full" ref={emblaRef}>
              <div className="flex w-full h-full">
                {selectedProject.screenshots.map((ss, idx) => (
                  <div key={idx} className="flex-[0_0_100%] min-w-0 h-full relative">
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 overflow-hidden">
                       <img 
                         src={ss} 
                         alt={`${selectedProject.name} screenshot ${idx + 1}`}
                         className="w-full h-full object-contain transition-opacity duration-500"
                         loading="lazy"
                       />
                       {/* Subtle overlay for realism */}
                       <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : viewMode === "live" && selectedProject.feedbackId ? (
            <div className="absolute inset-0 bg-black overflow-hidden rounded-lg z-10">
              {/* Feedback Terminal Iframe - Scaled to fit exactly in monitor with high-density 'retina' feel */}
              <iframe 
                src={`/feedback/${selectedProject.feedbackId}?view=main`}
                className="block border-none pointer-events-auto"
                style={{ 
                  width: '200%', 
                  height: '200%', 
                  transform: 'scale(0.5)', 
                  transformOrigin: 'top left' 
                }}
                title={`Feedback Terminal - ${selectedProject.name}`}
              />
            </div>
          ) : viewMode === "demo" && selectedProject.demoVideo ? (
            <div className="absolute inset-0 bg-black overflow-hidden rounded-lg z-10">
              <iframe 
                src={`${selectedProject.demoVideo}?autoplay=0&controls=1&rel=0`}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`Demo Video - ${selectedProject.name}`}
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                 <div className={cn(
                   "w-3 h-3 rounded-full animate-ping shadow-[0_0_15px_rgba(239,68,68,0.5)]", 
                   viewMode === 'live' ? 'bg-red-500' : viewMode === 'demo' ? 'bg-orange-500' : 'bg-blue-500'
                 )}></div>
              </div>
              <h2 className="text-xl font-black uppercase tracking-[0.3em] mb-2">{viewMode} VIEW</h2>
              <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.1em] max-w-xs leading-loose">
                {viewMode === 'live' ? 'NO LIVE TERMINAL LINKED' : viewMode === 'demo' ? 'NO DEMO VIDEO LINKED' : selectedProject.tagline}
              </p>
            </div>
          )}

          {/* Navigation Arrows */}
          {selectedProject.screenshots.length > 1 && viewMode === "screenshots" && (
            <>
              <button 
                onClick={scrollPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/40 hover:bg-white hover:text-black hover:scale-110 active:scale-95 transition-all shadow-xl"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={scrollNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/40 hover:bg-white hover:text-black hover:scale-110 active:scale-95 transition-all shadow-xl"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

        </div>
      </div>

      {/* Monitor Stand - Simple Rectangular Design */}
      <div className="relative flex flex-col items-center -mt-px z-0">
        {/* Stand Neck (Rectangle) */}
        <div className="w-10 h-12 bg-gradient-to-b from-[#f0f0f0] to-[#e5e5e5] shadow-inner border-x border-black/[0.03]"></div>
        {/* Stand Base (Rectangle) */}
        <div className="w-40 h-1.5 bg-[#f5f5f5] rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.15)] border-b border-black/5"></div>
        {/* Soft Ground Shadow */}
        <div className="w-48 h-2 bg-black/20 blur-md rounded-full mt-0.5 opacity-30"></div>
      </div>
    </div>
  );
};

export default Monitor;
