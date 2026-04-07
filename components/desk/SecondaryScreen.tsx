"use client";

import React from "react";
import { Project } from "@/app/desk/page";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SecondaryScreenProps {
  project: Project;
  viewMode?: string;
}

const SecondaryScreen: React.FC<SecondaryScreenProps> = ({ project, viewMode }) => {
  const isLive = viewMode === "live" && project.feedbackId;

  return (
    <div className="relative w-full group flex flex-col items-center bg-transparent translate-y-2">
       {/* Screen Body - White Plastic */}
       <div className="w-full h-[460px] bg-[#fcfcfc] rounded-[2rem] border-[6px] border-[#f0f0f0] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col p-1.5 backdrop-blur-sm">
          {/* Anti-Glare Overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-white/25 via-transparent to-transparent"></div>
          
          {/* Internal Screen Frame - Dark Glass */}
          <div className="flex-1 w-full bg-[#0a0a0a] rounded-[1.5rem] overflow-hidden flex flex-col border border-white/5">
             {isLive ? (
                <div className="w-full h-full bg-black relative">
                   <iframe 
                      src={`/feedback/${project.feedbackId}?view=comments`}
                      className="absolute inset-0 border-none pointer-events-auto"
                      style={{ 
                        width: '200%', 
                        height: '200%', 
                        transform: 'scale(0.5)', 
                        transformOrigin: 'top left' 
                      }}
                   />
                </div>
             ) : (
                <div className="flex-1 flex flex-col pt-6 px-5 pb-6">
                   <ScrollArea className="flex-1 w-full custom-scrollbar pr-2">
                      <div className="space-y-6">
                         {/* About Section */}
                         <section>
                            <h3 className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] mb-3">About {project.name}</h3>
                            <p className="text-white/90 font-medium text-[13px] leading-relaxed">
                               {project.description}
                            </p>
                         </section>

                         {/* Categories Section */}
                         <section>
                            <h3 className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] mb-3">Categories</h3>
                            <div className="flex flex-wrap gap-1.5">
                               {project.categories.map((cat, idx) => (
                                  <span key={idx} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/60 uppercase">
                                     {cat}
                                  </span>
                               ))}
                            </div>
                         </section>

                         {/* Tech Stacks Section */}
                         <section>
                            <h3 className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] mb-3">Tech Stacks</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {project.techStacks.map((tech, idx) => (
                                  <span key={idx} className="px-2.5 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-[9px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(99,102,241,0.05)]">
                                     {tech}
                                  </span>
                               ))}
                            </div>
                         </section>
                      </div>
                   </ScrollArea>
                   
                   {/* Bottom Navigation / Status Indicator */}
                   <div className="mt-4 flex items-center justify-between">
                      <div className="flex gap-1.5">
                         <div className="w-1.2 h-1.2 rounded-full bg-white/20 animate-pulse"></div>
                         <div className="w-1.2 h-1.2 rounded-full bg-white/10"></div>
                      </div>
                      <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">
                         V2.4.0
                      </div>
                   </div>
                </div>
             )}
          </div>
       </div>

       {/* Stand - Simple Rectangular Design Mini */}
       <div className="relative flex flex-col items-center -mt-px z-0">
         {/* Stand Neck (Rectangle) */}
         <div className="w-8 h-10 bg-gradient-to-b from-[#f0f0f0] to-[#e5e5e5] shadow-inner border-x border-black/[0.02]"></div>
         {/* Stand Base (Rectangle) */}
         <div className="w-32 h-1.5 bg-[#f5f5f5] rounded-sm shadow-[0_4px_10px_rgba(0,0,0,0.15)] border-b border-black/5"></div>
         {/* Soft Ground Shadow */}
         <div className="w-40 h-2 bg-black/20 blur-md rounded-full mt-0.5 opacity-25"></div>
       </div>
    </div>
  );
};

export default SecondaryScreen;
