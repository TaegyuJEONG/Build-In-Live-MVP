"use client";

import React from "react";
import { Project } from "@/app/desk/[uid]/page";
import { cn } from "@/lib/utils";

interface SecondaryScreenProps {
  project: Project;
  viewMode?: string;
  mainTab?: string;
}

const SecondaryScreen: React.FC<SecondaryScreenProps> = ({ project, viewMode, mainTab = "PROJECTS" }) => {
  const isLive = viewMode === "live" && project?.feedbackId && mainTab === "PROJECTS";

  if (mainTab === "PROFILE") {
    return (
      <div className="relative w-full group flex flex-col items-center bg-transparent translate-y-2">
         <div className="w-full h-[460px] bg-[#fcfcfc] rounded-[2rem] border-[6px] border-[#f0f0f0] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col p-1.5 backdrop-blur-sm">
            <div className="flex-1 w-full bg-[#0a0a0a] rounded-[1.5rem] overflow-hidden flex flex-col p-8 border border-white/5 animate-in fade-in duration-700">
               <div className="mb-10">
                  <h3 className="text-white/20 text-[8px] font-black uppercase tracking-[0.4em] mb-4">Identity_Core</h3>
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none">TAEGYU<br/>JEONG</h2>
                  <div className="mt-4 h-[1px] w-12 bg-[#F95A56]"></div>
               </div>

               <div className="space-y-8">
                  <section>
                     <h3 className="text-white/20 text-[8px] font-black uppercase tracking-[0.4em] mb-3">Professional_Focus</h3>
                     <p className="text-white/60 text-[11px] font-medium leading-relaxed uppercase tracking-widest">
                        Full-Stack Engineer<br/>
                        UI/UX Architect<br/>
                        Creative Technologist
                     </p>
                  </section>

                  <section>
                      <h3 className="text-white/20 text-[8px] font-black uppercase tracking-[0.4em] mb-3">Current_Status</h3>
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">Available_For_Scale</span>
                      </div>
                  </section>

                  <section className="pt-4">
                      <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                         <div className="text-[7px] text-white/20 font-black uppercase tracking-[0.3em] mb-2">System_Note</div>
                         <p className="text-[9px] text-white/40 leading-relaxed uppercase font-mono tracking-tighter">
                            Building immersive digital experiences that bridge the gap between human intuition and machine precision.
                         </p>
                      </div>
                  </section>
               </div>
            </div>
         </div>
         <div className="relative flex flex-col items-center -mt-px z-0">
          <div className="w-8 h-10 bg-gradient-to-b from-[#f0f0f0] to-[#e5e5e5] shadow-inner border-x border-black/[0.02]"></div>
          <div className="w-32 h-1.5 bg-[#f5f5f5] rounded-sm shadow-[0_4px_10px_rgba(0,0,0,0.15)] border-b border-black/5"></div>
          <div className="w-40 h-2 bg-black/20 blur-md rounded-full mt-0.5 opacity-25"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="relative w-full group flex flex-col items-center bg-transparent translate-y-2">
        <div className="w-full h-[460px] bg-[#fcfcfc] rounded-[2rem] border-[6px] border-[#f0f0f0] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col p-1.5 backdrop-blur-sm">
           <div className="flex-1 w-full bg-[#0a0a0a] rounded-[1.5rem] overflow-hidden flex flex-col items-center justify-center border border-white/5 p-8 text-center">
              <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center mb-6 animate-pulse">
                 <div className="w-2 h-2 rounded-full bg-white/20"></div>
              </div>
              <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Diagnostics_System</h3>
              <div className="space-y-3 w-full">
                 <div className="h-[1px] w-full bg-white/5"></div>
                 <div className="flex justify-between text-[8px] font-mono text-white/10 tracking-widest uppercase">
                    <span>Signal</span>
                    <span>No_Data</span>
                 </div>
                 <div className="flex justify-between text-[8px] font-mono text-white/10 tracking-widest uppercase">
                    <span>Power</span>
                    <span>Stable</span>
                 </div>
                 <div className="h-[1px] w-full bg-white/5"></div>
              </div>
           </div>
        </div>
        <div className="relative flex flex-col items-center -mt-px z-0">
          <div className="w-8 h-10 bg-gradient-to-b from-[#f0f0f0] to-[#e5e5e5] shadow-inner border-x border-black/[0.02]"></div>
          <div className="w-32 h-1.5 bg-[#f5f5f5] rounded-sm shadow-[0_4px_10px_rgba(0,0,0,0.15)] border-b border-black/5"></div>
          <div className="w-40 h-2 bg-black/20 blur-md rounded-full mt-0.5 opacity-25"></div>
        </div>
      </div>
    );
  }

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
                      src={`/feedback/${project?.feedbackId}?view=comments`}
                      className="absolute inset-0 border-none pointer-events-auto"
                      style={{ 
                        width: '200%', 
                        height: '200%', 
                        transform: 'scale(0.5)', 
                        transformOrigin: 'top left' 
                      }}
                      title="Secondary monitor comments"
                   />
                </div>
             ) : (
                <div className="flex-1 flex flex-col pt-6 px-6 pb-6 pointer-events-auto overflow-hidden">
                    <div className="flex-1 w-full overflow-y-auto no-scrollbar pr-1 scroll-smooth">
                       <div className="space-y-7">
                          {/* Common Section Render Style */}
                          
                          {/* About Section */}
                          <section>
                             <h3 className="text-white/20 text-[8px] font-black uppercase tracking-[0.4em] mb-2.5 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#F95A56]"></span>
                                ABOUT_PROJECT
                             </h3>
                             <p className="text-white/70 font-medium text-[12px] leading-relaxed tracking-tight">
                                {(project as any).about || project.description}
                             </p>
                          </section>

                          {/* Unified Metadata Sections */}
                          {[
                            { label: "CATEGORIES", data: project.categories, type: 'tag' },
                            { label: "USE_CASES", data: (project as any).useCases, type: 'list' },
                            { label: "TARGET_AUDIENCE", data: (project as any).targetAudience, type: 'tag', prefix: '@' },
                            { label: "PLATFORMS", data: (project as any).platforms, type: 'tag' },
                            { label: "TECH_STACKS", data: project.techStacks, type: 'highlight' },
                          ].map((section, sIdx) => (
                            section.data && section.data.length > 0 && (
                              <section key={sIdx}>
                                 <h3 className="text-white/20 text-[8px] font-black uppercase tracking-[0.4em] mb-2.5">
                                    {section.label}
                                 </h3>
                                 <div className={cn(
                                   "flex flex-wrap gap-2",
                                   section.type === 'list' && "flex-col gap-3"
                                 )}>
                                    {section.data.map((item: string, iIdx: number) => (
                                      section.type === 'list' ? (
                                        <div key={iIdx} className="flex items-start gap-3 group">
                                           <div className="w-1 h-[1px] bg-[#F95A56]/60 mt-[7px] transition-all group-hover:w-3" />
                                           <span className="text-white/50 text-[11px] font-medium tracking-tight group-hover:text-white/80 transition-colors">{item}</span>
                                        </div>
                                      ) : (
                                        <span 
                                          key={iIdx} 
                                          className={cn(
                                            "px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all",
                                            section.type === 'highlight' 
                                              ? "bg-[#F95A56]/5 border-[#F95A56]/20 text-[#F95A56] hover:bg-[#F95A56]/10" 
                                              : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/80 hover:border-white/20"
                                          )}
                                        >
                                          {section.prefix}{item}
                                        </span>
                                      )
                                    ))}
                                 </div>
                              </section>
                            )
                          ))}
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
