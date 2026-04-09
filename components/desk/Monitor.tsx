"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Project } from "@/app/desk/[uid]/page";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Edit3, ExternalLink, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonitorProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  viewMode: "screenshots" | "live" | "demo";
  mainTab?: string;
  profileViewMode?: "polaroid" | "youtube" | "link";
  onEditProject?: (project: Project) => void;
}

const Monitor: React.FC<MonitorProps> = ({ 
  projects, 
  selectedProjectId, 
  onSelectProject,
  viewMode,
  mainTab = "PROJECTS",
  profileViewMode = "polaroid",
  onEditProject
}) => {
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const isEmpty = projects.length === 0;
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

  // Helper function to convert standard YouTube links to embeddable ones
  const formatYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    // If it's already an embed link, return as is
    if (url.includes('/embed/')) return url;
    
    let videoId = '';
    // Case 1: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    } 
    // Case 2: https://youtu.be/VIDEO_ID
    else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto group">
      {/* Project Tab List - Horizontal Scrollable */}
      <div className="flex gap-2 mb-3 items-center w-full overflow-x-auto no-scrollbar scroll-smooth pt-2 pb-2">
        <div className="flex gap-2 items-center flex-nowrap px-1">
          {projects.map((project) => (
            <div key={project.id} className="relative group/tab flex-shrink-0">
              <button
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
              {/* Edit Icon - Overlay on active tab */}
              {selectedProjectId === project.id && onEditProject && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProject(project);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#F95A56] text-white flex items-center justify-center transition-all shadow-[0_4px_10px_rgba(249,90,86,0.4)] hover:scale-110 active:scale-95 z-50 border border-black/10"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Monitor Body - White Plastic */}
      <div className="relative rounded-[1.5rem] border-[6px] border-[#f8f8f8] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_-2px_6px_rgba(0,0,0,0.05)] overflow-hidden aspect-[16/9.5] p-3">
        {/* Anti-Glare / Reflection Overlay */}
        <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-br from-white/15 via-transparent to-transparent"></div>
        
        {/* Screen Bezel / Inner Shadow */}
        <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_15px_rgba(0,0,0,0.3)] rounded-xl"></div>

        {/* Direct Link Icon for 'Shots' View (External Project URL) */}
        {viewMode === "screenshots" && selectedProject?.liveUrl && (
          <div className="absolute top-6 right-6 z-50">
            <a 
              href={selectedProject.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/60 hover:text-white hover:bg-white/20 transition-all group/link shadow-2xl active:scale-90"
              title="Open Project Site"
            >
              <ExternalLink className="w-5 h-5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        )}

        {/* Direct Link Icon for 'Live' View (Feedback Terminal) */}
        {viewMode === "live" && selectedProject?.feedbackId && (
          <div className="absolute top-6 right-6 z-50">
            <a 
              href={`/feedback/${selectedProject.feedbackId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/60 hover:text-white hover:bg-white/20 transition-all group/link shadow-2xl active:scale-90"
              title="Open Full Feedback Terminal"
            >
              <ExternalLink className="w-5 h-5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        )}

        {/* Content Area */}
        <div className={cn(
          "relative w-full h-full rounded-xl overflow-hidden bg-black/95 transition-all duration-700 text-white",
          (viewMode === "live" && !isEmpty && mainTab === "PROJECTS") ? "p-0.5 border-[4px] border-[#F95A56] shadow-[0_0_50px_rgba(249,90,86,0.5)] animate-pulse-glow" : "border border-black/10"
        )}>
          {mainTab === "PROFILE" ? (
             <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-8 text-center select-none animate-in fade-in duration-700">
                {profileViewMode === "polaroid" ? (
                  <div className="flex flex-col items-center">
                    <div className="w-48 h-60 bg-white p-3 shadow-2xl rotate-2 transform hover:rotate-0 transition-transform duration-500">
                       <div className="w-full h-44 bg-zinc-200 overflow-hidden">
                          <img 
                            src={projects[0]?.logo || "/images/desk/vibounder-logo.png"} 
                            className="w-full h-full object-cover grayscale"
                            alt="Profile"
                          />
                       </div>
                       <div className="mt-4 text-center">
                          <span className="font-serif italic text-black/40 text-sm">Artist_Profile.png</span>
                       </div>
                    </div>
                    <p className="mt-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Polaroid_Collection_Coming_Soon</p>
                  </div>
                ) : profileViewMode === "youtube" ? (
                   <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-[#FF0000]/10 flex items-center justify-center mb-6">
                         <ExternalLink className="w-8 h-8 text-[#FF0000]" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-[0.3em] mb-3">Vlog_Transmissions</h3>
                      <button className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 border border-white/10 px-4 py-2 hover:bg-white/5 transition-all">Launch_YouTube_Channel</button>
                   </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                         <ExternalLink className="w-8 h-8 text-white/40" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-[0.3em] mb-3">External_Hub</h3>
                      <button className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 border border-white/10 px-4 py-2 hover:bg-white/5 transition-all">Open_Portfolio_Website</button>
                   </div>
                )}
             </div>
          ) : isEmpty ? (
             <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-12 text-center select-none">
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-8 font-mono">System_Idle</div>
                <div className="relative group/add flex flex-col items-center">
                   <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center mb-6 transition-all duration-500 group-hover/add:border-[#F95A56]/50 group-hover/add:bg-[#F95A56]/5">
                      <span className="text-3xl font-thin text-white/20 group-hover/add:text-[#F95A56] group-hover/add:scale-110 transition-all">+</span>
                   </div>
                   <h2 className="text-xl font-black uppercase tracking-[0.3em] mb-3">Provision_Workspace</h2>
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.1em] max-w-sm leading-loose">
                      Your interactive desk is ready for deployment. <br/>
                      Tap the <span className="text-white">+ PROJECT</span> key on your keyboard to initialize your first showcase.
                   </p>
                </div>
              </div>
          ) : viewMode === "screenshots" ? (
            selectedProject?.screenshots.length > 0 ? (
              <div className="w-full h-full" ref={emblaRef}>
                <div className="flex w-full h-full">
                  {selectedProject?.screenshots.map((ss, idx) => (
                    <div key={idx} className="flex-[0_0_100%] min-w-0 h-full relative">
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 overflow-hidden">
                         <img 
                           src={ss} 
                           alt={`${selectedProject?.name} screenshot ${idx + 1}`}
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
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-950 select-none overflow-hidden">
                 {/* Ultra-subtle depth */}
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_80%)]"></div>
                 
                 <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-8 opacity-10 group/empty">
                       <ImageIcon className="w-16 h-16 text-white stroke-[0.5]" />
                    </div>

                    <div className="text-center">
                       <h3 className="text-[10px] font-medium uppercase tracking-[0.8em] text-white/40 mb-12">
                          EMPTY_REPOSITORY
                       </h3>
                       
                       <button 
                         onClick={() => onEditProject && onEditProject(selectedProject!)}
                         className="text-[9px] font-black uppercase tracking-[0.3em] text-[#F95A56] hover:text-white transition-all duration-300 border-b border-[#F95A56]/20 pb-1 hover:border-white"
                       >
                          Provision_Assets_Now
                       </button>
                    </div>
                 </div>
              </div>
            )
          ) : viewMode === "live" && selectedProject?.feedbackId ? (
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
          ) : viewMode === "demo" && selectedProject?.demoVideo ? (
            <div className="absolute inset-0 bg-black overflow-hidden rounded-lg z-10">
              <iframe 
                src={`${formatYoutubeEmbedUrl(selectedProject.demoVideo)}?autoplay=0&controls=1&rel=0`}
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
                {viewMode === 'live' ? 'NO LIVE TERMINAL LINKED' : viewMode === 'demo' ? 'NO DEMO VIDEO LINKED' : selectedProject?.tagline}
              </p>
            </div>
          )}

          {/* Navigation Arrows */}
          {!isEmpty && selectedProject?.screenshots.length > 1 && viewMode === "screenshots" && (
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
